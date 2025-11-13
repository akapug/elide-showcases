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

import { parseSubmissionWithAI, scoreAnswers } from './single-call-parser.js';
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
      console.log('Parsing raw submission with AI...');
      const parsed = await parseSubmissionWithAI(answers, answerKey);
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

    // Save to database
    try {
      const db = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
      });

      await db.execute({
        sql: `INSERT INTO submissions (
          name, quiz_version, score, total_points, percentage, grade,
          correct_count, incorrect_count, missing_count,
          metadata, answers, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        args: [
          name,
          version,
          results.earnedPoints,
          results.totalPoints,
          parseFloat(results.percentage),
          results.grade,
          results.correct,
          results.incorrect,
          results.missing,
          JSON.stringify(extractedMetadata),
          JSON.stringify(parsedAnswers),
        ],
      });

      console.log('Saved to database');
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Don't fail the request if DB save fails
    }

    sendJSON(res, 200, {
      success: true,
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

