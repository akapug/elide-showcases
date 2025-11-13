/**
 * Vercel Serverless Function for Leaderboard
 * 
 * GET /api/leaderboard - Get all submissions
 * POST /api/leaderboard - Add new submission
 * 
 * Storage: GitHub Gist (public, append-only)
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Storage file path (in /tmp for Vercel, or local for dev)
const STORAGE_FILE = process.env.VERCEL
  ? '/tmp/leaderboard.json'
  : join(__dirname, '../../public/leaderboard.json');

// Initialize storage
function initStorage() {
  if (!existsSync(STORAGE_FILE)) {
    writeFileSync(STORAGE_FILE, JSON.stringify({ submissions: [] }), 'utf-8');
  }
}

// Read submissions
function readSubmissions() {
  try {
    initStorage();
    const data = readFileSync(STORAGE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading submissions:', error);
    return { submissions: [] };
  }
}

// Write submissions
function writeSubmissions(data) {
  try {
    writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing submissions:', error);
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
export default function handler(req, res) {
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
    const data = readSubmissions();
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
      const data = readSubmissions();

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
      const success = writeSubmissions(data);

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

