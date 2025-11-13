/**
 * Vercel Serverless Function for Leaderboard
 *
 * GET /api/leaderboard - Get all submissions
 * POST /api/leaderboard - Add new submission
 *
 * Storage: Vercel Redis (via @vercel/kv)
 */

import { kv } from '@vercel/kv';

const LEADERBOARD_KEY = 'elide-quiz:leaderboard';

// Read submissions from Redis
async function readSubmissions() {
  try {
    // Check if KV is available (production)
    if (process.env.KV_REST_API_URL) {
      const data = await kv.get(LEADERBOARD_KEY);
      return data || { submissions: [] };
    }

    // Fallback for local dev (no Redis)
    console.log('KV not available, using in-memory storage');
    return { submissions: [] };
  } catch (error) {
    console.error('Error reading submissions from Redis:', error);
    return { submissions: [] };
  }
}

// Write submissions to Redis
async function writeSubmissions(data) {
  try {
    // Check if KV is available (production)
    if (process.env.KV_REST_API_URL) {
      await kv.set(LEADERBOARD_KEY, data);
      return true;
    }

    // Fallback for local dev (no Redis)
    console.log('KV not available, skipping write');
    return false;
  } catch (error) {
    console.error('Error writing submissions to Redis:', error);
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

