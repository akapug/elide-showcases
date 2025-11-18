/**
 * Speech-to-Text HTTP Server
 * Provides REST API and WebSocket endpoints for transcription
 */

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import multer from 'multer';
import dotenv from 'dotenv';
import { routes } from './routes.js';
import { setupWebSocket } from './websocket.js';
import logger from '../shared/logger.js';

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const PORT = parseInt(process.env.PORT || '3000');
const HOST = process.env.HOST || '0.0.0.0';

// Middleware
app.use(cors());
app.use(express.json({ limit: '100mb' }));

// File upload configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_AUDIO_SIZE || '104857600'), // 100MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'audio/wav',
      'audio/wave',
      'audio/x-wav',
      'audio/mpeg',
      'audio/mp3',
      'audio/mp4',
      'audio/m4a',
      'audio/flac',
      'audio/ogg',
      'audio/webm',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported audio format: ${file.mimetype}`));
    }
  },
});

// Request logging
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    });
  });

  next();
});

// Health check
app.get('/health', (req, res) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();

  res.json({
    status: 'healthy',
    uptime: uptime,
    timestamp: new Date().toISOString(),
    memory: {
      rss: memoryUsage.rss,
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
    },
  });
});

// API routes
app.use('/api/v1', routes(upload));

// WebSocket setup
setupWebSocket(wss);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
  });

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// Start server
server.listen(PORT, HOST, () => {
  logger.info(`Speech-to-Text Service started`, {
    port: PORT,
    host: HOST,
    env: process.env.NODE_ENV || 'development',
    whisperModel: process.env.WHISPER_MODEL || 'base',
    device: process.env.WHISPER_DEVICE || 'cpu',
  });

  console.log('='.repeat(80));
  console.log('Speech-to-Text Service - Production Ready');
  console.log('='.repeat(80));
  console.log(`HTTP Server: http://${HOST}:${PORT}`);
  console.log(`WebSocket:   ws://${HOST}:${PORT}/ws`);
  console.log(`Health:      http://${HOST}:${PORT}/health`);
  console.log('='.repeat(80));
  console.log('Features:');
  console.log('  ✓ Audio upload transcription');
  console.log('  ✓ Real-time streaming transcription');
  console.log('  ✓ Speaker diarization');
  console.log('  ✓ Multi-language support');
  console.log('  ✓ Word-level timestamps');
  console.log('='.repeat(80));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');

  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');

  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export { app, server };
