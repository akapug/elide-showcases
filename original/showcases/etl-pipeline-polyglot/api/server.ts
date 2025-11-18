/**
 * ETL Pipeline API Server
 * Demonstrates Zod + Pydantic validation with zero-copy DataFrames
 */

import express from 'express';
import cors from 'cors';
import compression from 'compression';
import pino from 'pino';
import { ETLPipeline } from '../core/pipeline.js';
import { ETLJobConfigSchema, UserRecordSchema, validateBatch } from '../core/schemas.js';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(compression());
app.use(express.json({ limit: '50mb' }));

// Initialize pipeline
const pipeline = new ETLPipeline();

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: Date.now(),
    uptime: process.uptime(),
  });
});

// Validate data endpoint
app.post('/api/v1/validate', async (req, res) => {
  try {
    const { data, schema = 'user' } = req.body;

    if (!Array.isArray(data)) {
      return res.status(400).json({ error: 'Data must be an array' });
    }

    const result = validateBatch(data, UserRecordSchema);

    res.json({
      status: 'success',
      result,
    });
  } catch (error) {
    logger.error({ error }, 'Validation failed');
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Run ETL job
app.post('/api/v1/jobs', async (req, res) => {
  try {
    const config = ETLJobConfigSchema.parse(req.body);

    const result = await pipeline.runJob(config);

    res.json({
      status: 'success',
      result,
    });
  } catch (error) {
    logger.error({ error }, 'Job execution failed');
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Transform data endpoint
app.post('/api/v1/transform', async (req, res) => {
  try {
    const { data, transformations = [] } = req.body;

    if (!Array.isArray(data)) {
      return res.status(400).json({ error: 'Data must be an array' });
    }

    const result = await pipeline.callPython('transform_batch', {
      data,
      transformations,
    });

    res.json({
      status: 'success',
      result: {
        data: result,
        count: result.length,
        transformations_applied: transformations,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Transform failed');
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Stats endpoint
app.get('/api/v1/stats', (req, res) => {
  res.json({
    status: 'success',
    stats: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: '1.0.0',
    },
  });
});

// Start server
async function start() {
  try {
    await pipeline.initialize();

    app.listen(port, () => {
      logger.info(`ETL Pipeline API server running on port ${port}`);
      logger.info(`Health check: http://localhost:${port}/health`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully');
      await pipeline.shutdown();
      process.exit(0);
    });
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}

start();
