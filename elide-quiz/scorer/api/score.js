/**
 * Vercel Serverless Function for Elide Quiz Scoring
 * 
 * POST /api/score
 * Body: { answers: { "1": "B", "2": "A,C", ... } }
 * 
 * Returns: { score, percentage, grade, byTopic, ... }
 */

import { scoreAnswers } from '../score.js';

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

export default function handler(req, res) {
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
    const { answers } = req.body;

    if (!answers || typeof answers !== 'object') {
      sendJSON(res, 400, { error: 'Invalid request body. Expected { answers: { "1": "B", ... } }' });
      return;
    }

    // Convert string keys to numbers
    const userAnswers = {};
    for (const [key, value] of Object.entries(answers)) {
      userAnswers[parseInt(key)] = value;
    }

    const results = scoreAnswers(userAnswers);

    sendJSON(res, 200, {
      success: true,
      results
    });

  } catch (error) {
    console.error('Scoring error:', error);
    sendJSON(res, 500, {
      error: 'Internal server error',
      message: error.message
    });
  }
}

