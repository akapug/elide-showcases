/**
 * Vercel Serverless Function for Elide Quiz Scoring
 *
 * POST /api/score
 * Body: { answers: { "1": "B", "2": "A,C", ... }, version: "full" | "human" }
 *
 * Returns: { score, percentage, grade, byTopic, ... }
 *
 * Uses AI-powered scoring via OpenRouter (Gemini 2.0 Flash or Grok-beta)
 */

import { batchScoreWithAI } from './ai-scorer.js';

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
    const { answers, version = 'full' } = req.body;

    if (!answers || typeof answers !== 'object') {
      sendJSON(res, 400, { error: 'Invalid request body. Expected { answers: { "1": "B", ... } }' });
      return;
    }

    // Convert string keys to numbers
    const userAnswers = {};
    for (const [key, value] of Object.entries(answers)) {
      userAnswers[parseInt(key)] = value;
    }

    // Load answer key
    const answerKey = await loadAnswerKey(version);

    // Score with AI
    console.log(`Scoring ${Object.keys(userAnswers).length} answers with AI...`);
    const results = await batchScoreWithAI(userAnswers, answerKey);
    console.log(`Scoring complete: ${results.correct} correct, ${results.incorrect} incorrect, ${results.missing} missing`);

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
        byTopic: results.byTopic
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

