/**
 * Vercel Serverless Function for Leaderboard
 *
 * GET /api/leaderboard - Get all submissions
 * POST /api/leaderboard - Add new submission
 *
 * Storage: Vercel KV (Redis)
 */

import { kv } from '@vercel/kv';

const LEADERBOARD_KEY = 'elide-quiz:leaderboard';

// Read submissions from KV
async function readSubmissions() {
  try {
    const data = await kv.get(LEADERBOARD_KEY);
    return data || { submissions: [] };
  } catch (error) {
    console.error('Error reading submissions from KV:', error);
    return { submissions: [] };
  }
}

// Write submissions to KV
async function writeSubmissions(data) {
  try {
    await kv.set(LEADERBOARD_KEY, data);
    return true;
  } catch (error) {
    console.error('Error writing submissions to KV:', error);
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

      // Read current data
      const data = await readSubmissions();

      // Add new submission
      data.submissions.push({
        ...submission,
        id: Date.now().toString(),
        timestamp: submission.timestamp || new Date().toISOString()
      });

      // Keep only last 100 submissions
      if (data.submissions.length > 100) {
        data.submissions = data.submissions.slice(-100);
      }

      // Write back
      const success = await writeSubmissions(data);

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

