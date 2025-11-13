#!/usr/bin/env node
/**
 * Simple dev server for local testing
 * 
 * Usage: node dev-server.js
 * Then open http://localhost:3000
 */

import { createServer } from 'http';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 3000;

// Import API handlers
import scoreHandler from './api/score.js';
import leaderboardHandler from './api/leaderboard.js';

const server = createServer(async (req, res) => {
  console.log(`${req.method} ${req.url}`);
  
  // Parse body for POST requests
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    await new Promise(resolve => req.on('end', resolve));
    try {
      req.body = JSON.parse(body);
    } catch (e) {
      req.body = {};
    }
  }
  
  // API routes
  if (req.url === '/api/score' || req.url.startsWith('/api/score?')) {
    try {
      return scoreHandler(req, res);
    } catch (error) {
      console.error('Score API error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: error.message }));
      return;
    }
  }

  if (req.url === '/api/leaderboard' || req.url.startsWith('/api/leaderboard?')) {
    try {
      return leaderboardHandler(req, res);
    } catch (error) {
      console.error('Leaderboard API error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: error.message }));
      return;
    }
  }
  
  // Static files
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = join(__dirname, '../public', filePath);
  
  try {
    const content = readFileSync(filePath);
    const ext = filePath.split('.').pop();
    const contentType = {
      'html': 'text/html',
      'js': 'application/javascript',
      'json': 'application/json',
      'css': 'text/css'
    }[ext] || 'text/plain';
    
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (error) {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`\n🚀 Dev server running at http://localhost:${PORT}\n`);
  console.log('   Open in browser to test the quiz UI');
  console.log('   Press Ctrl+C to stop\n');
});

