/**
 * Main Game Server - Entry point
 * Runs at 60 FPS with TypeScript game logic and Python AI bots
 */

import { GameEngine } from './GameEngine.js';
import { GameLoop } from './GameLoop.js';
import { WebSocketGameServer } from './WebSocketServer.js';
import { MapConfig } from './GameState.js';

// Configuration
const PORT = parseInt(process.env.PORT || '3000');
const WS_PORT = parseInt(process.env.WS_PORT || '3001');
const AI_BOT_COUNT = parseInt(process.env.AI_BOT_COUNT || '5');
const ENABLE_METRICS = process.env.ENABLE_METRICS !== 'false';

// Create game map
const mapConfig: MapConfig = {
  width: 2000,
  height: 2000,
  obstacles: [
    // Create some obstacles for cover
    { x: 400, y: 400, width: 100, height: 100 },
    { x: 1500, y: 400, width: 100, height: 100 },
    { x: 400, y: 1500, width: 100, height: 100 },
    { x: 1500, y: 1500, width: 100, height: 100 },
    { x: 950, y: 950, width: 100, height: 100 }, // Center
    { x: 800, y: 600, width: 200, height: 50 },
    { x: 1000, y: 1350, width: 200, height: 50 },
    { x: 300, y: 1000, width: 50, height: 200 },
    { x: 1650, y: 800, width: 50, height: 200 }
  ]
};

// Initialize game engine
console.log('🎮 Initializing Tank Battle Server...');
const engine = new GameEngine(mapConfig);

// Spawn AI bots
console.log(`🤖 Spawning ${AI_BOT_COUNT} AI bots...`);
for (let i = 0; i < AI_BOT_COUNT; i++) {
  const botId = `bot_${i}`;
  engine.spawnTank(botId, true);
}

// Create game loop (60 FPS)
const gameLoop = new GameLoop(engine);

// Create WebSocket server for multiplayer
const wsServer = new WebSocketGameServer(WS_PORT, engine);

// Broadcast game state to all clients
gameLoop.onUpdate((state) => {
  wsServer.broadcastGameState(state);
});

// Log metrics
if (ENABLE_METRICS) {
  gameLoop.onMetrics((metrics) => {
    console.log(
      `📊 FPS: ${metrics.fps} | Frame: ${metrics.frameTime.toFixed(2)}ms | AI: ${metrics.aiTime.toFixed(2)}ms | Update: ${metrics.updateTime.toFixed(2)}ms`
    );
  });
}

// Start game loop
gameLoop.start();

// HTTP server for serving client
const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req: any, res: any) => {
  // Serve static files from client directory
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(process.cwd(), 'client', filePath);

  const extname = path.extname(filePath);
  const contentTypeMap: any = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
  };

  const contentType = contentTypeMap[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error: any, content: any) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`, 'utf-8');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     🎮 TANK BATTLE MULTIPLAYER SERVER - RUNNING! 🎮         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`  🌐 HTTP Server:      http://localhost:${PORT}`);
  console.log(`  🔌 WebSocket Server:  ws://localhost:${WS_PORT}`);
  console.log(`  🤖 AI Bots:           ${AI_BOT_COUNT}`);
  console.log(`  ⚡ Target FPS:        60`);
  console.log(`  🐍 Python AI:         Enabled (polyglot mode)`);
  console.log('');
  console.log('  📊 Status: Game loop running at 60 FPS');
  console.log('  🎯 Ready for players!');
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  Open http://localhost:' + PORT + ' in your browser to play!       ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  gameLoop.stop();
  wsServer.close();
  server.close();
  process.exit(0);
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
});
