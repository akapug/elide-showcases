/**
 * Vercel Serverless Function for Submission Details
 * 
 * GET /api/submission?id=<submission_id>
 * Returns detailed submission with user answers vs correct answers
 */

import { createClient } from '@libsql/client';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

// Load answer key
function loadAnswerKey(version = 'full') {
  const filename = version === 'human' ? 'answers-human.md' : 'answers.md';

  // In Vercel, static files are served from /public but accessible via root URL
  // We need to read from the public directory
  const possiblePaths = [
    join(process.cwd(), 'public', filename),   // /var/task/public/answers.md (Vercel)
    join(__dirname, '..', 'public', filename), // scorer/public/answers.md (local dev from api/)
    join(__dirname, '..', filename),           // scorer/answers.md (local dev fallback)
  ];

  let filePath = null;
  for (const path of possiblePaths) {
    if (existsSync(path)) {
      filePath = path;
      break;
    }
  }

  if (!filePath) {
    throw new Error(`Could not find ${filename}. Tried: ${possiblePaths.join(', ')}`);
  }

  const content = readFileSync(filePath, 'utf-8');

  const answers = {};
  const lines = content.split('\n');

  for (const line of lines) {
    // Match pattern: "123. **ANSWER** - explanation"
    const match = line.match(/^(\d+)\.\s+\*\*(.+?)\*\*\s+-\s+(.+)$/);
    if (match) {
      const [, num, answer, explanation] = match;
      answers[parseInt(num)] = {
        answer: answer.trim(),
        explanation: explanation.trim()
      };
    }
  }

  return answers;
}

// Helper for response
function sendJSON(res, statusCode, data) {
  if (res.status) {
    res.status(statusCode).json(data);
  } else {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  }
}

// Main handler
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
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

  // Only accept GET
  if (req.method !== 'GET') {
    sendJSON(res, 405, { error: 'Method not allowed' });
    return;
  }

  try {
    const { id } = req.query;

    if (!id) {
      sendJSON(res, 400, { error: 'Missing submission ID' });
      return;
    }

    const client = getDB();
    if (!client) {
      sendJSON(res, 500, { error: 'Database not available' });
      return;
    }

    // Get submission
    const result = await client.execute({
      sql: 'SELECT * FROM submissions WHERE id = ?',
      args: [id]
    });

    if (result.rows.length === 0) {
      sendJSON(res, 404, { error: 'Submission not found' });
      return;
    }

    const submission = result.rows[0];
    
    // Parse JSON fields
    const userAnswers = submission.userAnswers ? JSON.parse(submission.userAnswers) : {};
    const byTopic = submission.byTopic ? JSON.parse(submission.byTopic) : null;
    
    // Load correct answers
    const answerKey = loadAnswerKey(submission.version);
    
    // Build comparison
    const comparison = [];
    for (const [qNum, correctData] of Object.entries(answerKey)) {
      const questionNum = parseInt(qNum);
      const userAnswer = userAnswers[questionNum] || '';
      const isCorrect = normalizeAnswer(userAnswer) === normalizeAnswer(correctData.answer);
      
      comparison.push({
        question: questionNum,
        userAnswer: userAnswer || '(no answer)',
        correctAnswer: correctData.answer,
        explanation: correctData.explanation,
        isCorrect
      });
    }

    sendJSON(res, 200, {
      success: true,
      submission: {
        id: submission.id,
        name: submission.name,
        percentage: submission.percentage,
        points: submission.points,
        totalPoints: submission.totalPoints,
        grade: submission.grade,
        version: submission.version,
        timestamp: submission.timestamp,
        correct: submission.correct,
        incorrect: submission.incorrect,
        missing: submission.missing,
        byTopic
      },
      comparison
    });

  } catch (error) {
    console.error('Error fetching submission:', error);
    sendJSON(res, 500, {
      error: 'Internal server error',
      message: error.message
    });
  }
}

// Normalize answer for comparison
function normalizeAnswer(answer) {
  if (!answer) return '';
  return answer.toString().trim().toLowerCase().replace(/\s+/g, ' ');
}

