import express from 'express';
import pino from 'pino';
import dotenv from 'dotenv';
import { createRoutes } from './routes.js';
import { errorHandler, requestLogger, rateLimiter } from './middleware.js';

dotenv.config();

const app = express();
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.LOG_FORMAT === 'pretty' ? {
    target: 'pino-pretty',
    options: { colorize: true }
  } : undefined
});

// Middleware
app.use(express.json());
app.use(requestLogger(logger));
app.use(rateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: Date.now(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '1.0.0'
  });
});

// API routes
app.use('/api/v1', createRoutes(logger));

// Error handling
app.use(errorHandler(logger));

const PORT = parseInt(process.env.PORT || '3000');
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  logger.info(`🚀 Recommendation Engine API listening on ${HOST}:${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🤖 Default Algorithm: ${process.env.DEFAULT_ALGORITHM || 'hybrid'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  process.exit(0);
});
