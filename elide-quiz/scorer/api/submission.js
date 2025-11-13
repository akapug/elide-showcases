/**
export const config = { runtime: 'nodejs' };

 * Vercel Serverless Function for Submission Details
 *
 * GET /api/submission?id=<submission_id>
 * Returns detailed submission with user answers vs correct answers
 */

// Initialize Turso client (lazy to avoid bundler/runtime issues)
let db = null;
async function getDB() {
  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) return null;
  if (!db) {
    const { createClient } = await import('@libsql/client');
    db = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return db;
}

// Load answer key from server-side modules (not exposed to web)
async function loadAnswerKey(version = 'full') {
  if (version === 'human') {
    const { answerKey } = await import('./answers-human-data.js');
    return answerKey;
  } else {
    const { answerKey } = await import('./answers-data.js');
    return answerKey;
  }
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
    let stage = 'start';
    const { id } = req.query;

    if (!id) {
      sendJSON(res, 400, { error: 'Missing submission ID' });
      return;
    }

    stage = 'db-connect';
    const client = await getDB();
    if (!client) {
      sendJSON(res, 500, { error: 'Database not available' });
      return;
    }

    // Get submission
    stage = 'db-query';
    const result = await client.execute({
      sql: 'SELECT * FROM submissions WHERE id = ?',
      args: [id]
    });

    if (result.rows.length === 0) {
      sendJSON(res, 404, { error: 'Submission not found' });
      return;
    }

    stage = 'parse-json-fields';
    const submission = result.rows[0];

    // Parse JSON fields (tolerate legacy and double-encoded formats)
    let userAnswers = {};
    try {
      if (submission.userAnswers) {
        const parsed = deepParse(submission.userAnswers);
        userAnswers = (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
      }
    } catch { userAnswers = {}; }

    let byTopic = null;
    try {
      if (submission.byTopic) {
        const parsedTopic = deepParse(submission.byTopic);
        byTopic = (parsedTopic && typeof parsedTopic === 'object') ? parsedTopic : null;
      }
    } catch { byTopic = null; }

    stage = 'load-answer-key';
    // Load correct answers
    const answerKey = await loadAnswerKey(submission.version);

    stage = 'build-comparison';
    // Build comparison (tolerant to order/spacing on multi-select)
    const comparison = [];
    for (const [qNum, correctData] of Object.entries(answerKey)) {
      const questionNum = parseInt(qNum);
      const userAnswer = userAnswers[questionNum] || '';
      const isCorrect = compareAnswers(userAnswer, correctData.answer);

      comparison.push({
        question: questionNum,
        userAnswer: userAnswer || '(no answer)',
        correctAnswer: correctData.answer,
        explanation: correctData.explanation,
        isCorrect
      });
    }

    stage = 'shape-response';
    // Rebuild metadata object from columns if present
    const meta = {};
    if (submission.toolsUsed) meta.tools = safeParse(submission.toolsUsed);
    if (submission.timeSpent !== undefined && submission.timeSpent !== null) meta.time = submission.timeSpent;
    if (submission.researchStrategy) meta.strategy = submission.researchStrategy;

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
        byTopic,
        metadata: Object.keys(meta).length ? meta : null
      },
      comparison
    });

// Helpers
function safeParse(val) {
  try { return JSON.parse(val); } catch { return val; }
}

function deepParse(val, maxDepth = 3) {
  let out = val;
  for (let i = 0; i < maxDepth; i++) {
    if (typeof out === 'string') {
      const s = out.trim();
      if ((s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']')) || (s.startsWith('"') && s.endsWith('"'))) {
        try { out = JSON.parse(s); continue; } catch { /* stop */ }
      }
    }
    break;
  }
  return out;
}

function normalizeChoices(s) {
  if (!s) return '';
  // Split on commas or whitespace, uppercase, trim, sort, join with commas
  const parts = s.toString()
    .replace(/\s+/g, '')
    .toUpperCase()
    .split(',')
    .filter(Boolean)
    .sort();
  return parts.join(',');
}

function compareAnswers(user, correct) {
  const nu = normalizeChoices(user);
  const nc = normalizeChoices(correct);
  if (nu && nc) return nu === nc; // multi/select or single letter
  // fallback simple compare
  return (user || '').toString().trim().toLowerCase() === (correct || '').toString().trim().toLowerCase();
}


  } catch (error) {
    console.error('Error fetching submission:', error);
    sendJSON(res, 500, {
      error: 'Internal server error',
      message: error.message,
      stage: typeof stage !== 'undefined' ? stage : 'unknown'
    });
  }
}

// Normalize answer for comparison
function normalizeAnswer(answer) {
  if (!answer) return '';
  return answer.toString().trim().toLowerCase().replace(/\s+/g, ' ');
}

