/**
 * Vercel Serverless Function for Leaderboard
 *
 * GET /api/leaderboard - Get all submissions
 * POST /api/leaderboard - Add new submission
 *
 * Storage: Turso (SQLite over HTTP)
 */

import { createClient } from '@libsql/client';

// Initialize Turso client
let db = null;
function getDB() {
  if (!db && process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
    db = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return db;
}

// Initialize database schema
async function initDB() {
  const client = getDB();
  if (!client) return false;

  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS submissions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        percentage REAL NOT NULL,
        points INTEGER NOT NULL,
        totalPoints INTEGER NOT NULL,
        grade TEXT NOT NULL,
        version TEXT DEFAULT 'full',
        timestamp TEXT NOT NULL,
        correct INTEGER DEFAULT 0,
        incorrect INTEGER DEFAULT 0,
        missing INTEGER DEFAULT 0,
        byTopic TEXT,
        timeSpent INTEGER,
        toolsUsed TEXT,
        primarySources TEXT,
        researchStrategy TEXT,
        userAnswers TEXT
      )
    `);
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
}

// Read submissions from Turso
async function readSubmissions() {
  const client = getDB();
  if (!client) {
    console.log('Turso not available, using in-memory storage');
    return { submissions: [] };
  }

  try {
    await initDB();
    const result = await client.execute('SELECT * FROM submissions ORDER BY percentage DESC LIMIT 100');

    // Parse JSON fields
    const submissions = result.rows.map(row => ({
      ...row,
      byTopic: row.byTopic ? JSON.parse(row.byTopic) : null,
      toolsUsed: row.toolsUsed ? JSON.parse(row.toolsUsed) : null,
      primarySources: row.primarySources ? JSON.parse(row.primarySources) : null,
      userAnswers: row.userAnswers ? JSON.parse(row.userAnswers) : null
    }));

    return { submissions };
  } catch (error) {
    console.error('Error reading submissions from Turso:', error);
    return { submissions: [] };
  }
}

// Write submission to Turso
async function writeSubmission(submission) {
  const client = getDB();
  if (!client) {
    console.log('Turso not available, skipping write');
    return false;
  }

  try {
    await initDB();
    await client.execute({
      sql: `INSERT INTO submissions (
        id, name, percentage, points, totalPoints, grade, version, timestamp,
        correct, incorrect, missing, byTopic, timeSpent, toolsUsed, primarySources, researchStrategy, userAnswers
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        submission.id,
        submission.name,
        submission.percentage,
        submission.points || 0,
        submission.totalPoints || 980,
        submission.grade || 'Fail',
        submission.version || 'full',
        submission.timestamp,
        submission.correct || 0,
        submission.incorrect || 0,
        submission.missing || 0,
        submission.byTopic ? JSON.stringify(submission.byTopic) : null,
        submission.timeSpent || null,
        submission.toolsUsed ? JSON.stringify(submission.toolsUsed) : null,
        submission.primarySources ? JSON.stringify(submission.primarySources) : null,
        submission.researchStrategy || null,
        submission.userAnswers ? JSON.stringify(submission.userAnswers) : null
      ]
    });
    console.log('Saved to Turso:', submission.id);
    return true;
  } catch (error) {
    console.error('Error writing submission to Turso:', error);
    return false;
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

// Main handler
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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

  // GET - Retrieve leaderboard
  if (req.method === 'GET') {
    const data = await readSubmissions();
    sendJSON(res, 200, {
      success: true,
      submissions: data.submissions
    });
    return;
  }

  // POST - Add submission
  if (req.method === 'POST') {
    try {
      const submission = req.body;

      // Validate submission
      if (!submission.name || typeof submission.percentage !== 'number') {
        sendJSON(res, 400, {
          success: false,
          error: 'Invalid submission. Required: name, percentage'
        });
        return;
      }

      // Create submission object
      const newSubmission = {
        ...submission,
        id: Date.now().toString(),
        timestamp: submission.timestamp || new Date().toISOString()
      };

      // Write to database
      const success = await writeSubmission(newSubmission);

      if (success) {
        sendJSON(res, 200, {
          success: true,
          message: 'Submission saved'
        });
      } else {
        sendJSON(res, 500, {
          success: false,
          error: 'Failed to save submission'
        });
      }

    } catch (error) {
      console.error('Error processing submission:', error);
      sendJSON(res, 500, {
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
    return;
  }

  // Method not allowed
  sendJSON(res, 405, {
    success: false,
    error: 'Method not allowed'
  });
}

