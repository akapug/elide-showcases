/**
 * Vercel Serverless Function for Elide Quiz Scoring
 *
 * POST /api/score
 * Body: {
 *   name: string,
 *   answers: { "1": "B", "2": "A,C", ... } OR raw text string,
 *   version: "full" | "human",
 *   metadata?: { model, thinkingTime, tools, etc. }
 * }
 *
 * Returns: { score, percentage, grade, byTopic, ... }
 *
 * Uses single AI call to parse submission and extract metadata
 */

import { parseSubmission, scoreAnswers } from './single-call-parser.js';
import { createClient } from '@libsql/client';

// Load answer key from server-side modules
async function loadAnswerKey(version = 'full') {
  if (version === 'human') {
    const { answerKey } = await import('./answers-human-data.js');
    return answerKey;
  } else {
    const { answerKey } = await import('./answers-data.js');
    return answerKey;
  }
}

// Helper for response (works with both Node.js and Vercel)
function sendJSON(res, statusCode, data) {
  if (res.status) {
    // Vercel
    res.status(statusCode).json(data);
  } else {
    // Node.js
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  }
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS for CORS preflight
  if (req.method === 'OPTIONS') {
    if (res.status) {
      res.status(200).end();
    } else {
      res.writeHead(200);
      res.end();
    }
    return;
  }

  // Only accept POST
  if (req.method !== 'POST') {
    sendJSON(res, 405, { error: 'Method not allowed' });
    return;
  }

  try {
    const { name, answers, version = 'full', metadata = {} } = req.body;

    if (!name || typeof name !== 'string') {
      sendJSON(res, 400, { error: 'Missing required field: name' });
      return;
    }

    if (!answers) {
      sendJSON(res, 400, { error: 'Missing required field: answers' });
      return;
    }

    // Load answer key
    const answerKey = await loadAnswerKey(version);

    let parsedAnswers;
    let extractedMetadata = metadata;

    // Check if answers is a string (raw submission) or object (pre-parsed)
    if (typeof answers === 'string') {
      console.log('Parsing raw submission (instant - no AI!)...');
      const parsed = parseSubmission(answers);
      parsedAnswers = parsed.answers;
      extractedMetadata = { ...metadata, ...parsed.metadata };
      console.log(`Extracted ${Object.keys(parsedAnswers).length} answers and metadata`);
    } else if (typeof answers === 'object') {
      // Already parsed - convert string keys to numbers
      parsedAnswers = {};
      for (const [key, value] of Object.entries(answers)) {
        parsedAnswers[key] = value;
      }
    } else {
      sendJSON(res, 400, { error: 'Invalid answers format. Expected object or string.' });
      return;
    }

    // Score answers
    console.log(`Scoring ${Object.keys(parsedAnswers).length} answers...`);
    const results = scoreAnswers(parsedAnswers, answerKey);
    console.log(`Scoring complete: ${results.correct} correct, ${results.incorrect} incorrect, ${results.missing} missing`);

    // Save to database (unified schema with /api/leaderboard)
    let savedId = null;
    try {
      const db = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
      });

      // Ensure table exists with expected columns
      await db.execute(`
        CREATE TABLE IF NOT EXISTS submissions (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          percentage REAL NOT NULL,
          points INTEGER NOT NULL,
          totalPoints INTEGER NOT NULL,
          grade TEXT NOT NULL,
          version TEXT DEFAULT 'full',
          timestamp TEXT NOT NULL
        )
      `);
      const addCols = [
        'ALTER TABLE submissions ADD COLUMN correct INTEGER DEFAULT 0',
        'ALTER TABLE submissions ADD COLUMN incorrect INTEGER DEFAULT 0',
        'ALTER TABLE submissions ADD COLUMN missing INTEGER DEFAULT 0',
        'ALTER TABLE submissions ADD COLUMN byTopic TEXT',
        'ALTER TABLE submissions ADD COLUMN timeSpent INTEGER',
        'ALTER TABLE submissions ADD COLUMN toolsUsed TEXT',
        'ALTER TABLE submissions ADD COLUMN primarySources TEXT',
        'ALTER TABLE submissions ADD COLUMN researchStrategy TEXT',
        'ALTER TABLE submissions ADD COLUMN userAnswers TEXT'
      ];
      for (const sql of addCols) {
        try { await db.execute(sql); } catch (e) { /* ignore duplicate column */ }
      }

      // Map metadata S1-S7 if provided
      const meta = extractedMetadata || {};
      const toolsUsed = meta.S1 || meta.tools || null;
      const timeSpent = meta.S2 ? parseInt(meta.S2) : (meta.time ? parseInt(meta.time) : null);
      const researchStrategy = meta.S3 || meta.strategy || null;
      const primarySources = meta.S5 ? `modelVersion=${meta.S5}` : null;

      savedId = Date.now().toString();
      await db.execute({
        sql: `INSERT INTO submissions (
          id, name, percentage, points, totalPoints, grade, version, timestamp,
          correct, incorrect, missing, byTopic, timeSpent, toolsUsed, primarySources, researchStrategy, userAnswers
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          savedId,
          name,
          parseFloat(results.percentage),
          results.earnedPoints,
          results.totalPoints,
          results.grade,
          version,
          new Date().toISOString(),
          results.correct,
          results.incorrect,
          results.missing,
          results.byTopic ? JSON.stringify(results.byTopic) : null,
          timeSpent || null,
          toolsUsed ? JSON.stringify(toolsUsed) : null,
          primarySources ? JSON.stringify(primarySources) : null,
          researchStrategy || null,
          JSON.stringify(parsedAnswers)
        ]
      });

      console.log('Saved to database, id=', savedId);
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Don't fail the request if DB save fails
    }


    sendJSON(res, 200, {
      success: true,
      id: savedId,
      results: {
        earnedPoints: results.earnedPoints,
        totalPoints: results.totalPoints,
        percentage: results.percentage,
        grade: results.grade,
        correct: results.correct,
        incorrect: results.incorrect,
        missing: results.missing,
        byTopic: results.byTopic,
        metadata: extractedMetadata
      }
    });

  } catch (error) {
    console.error('Scoring error:', error);
    sendJSON(res, 500, {
      error: 'Internal server error',
      message: error.message
    });
  }
}

