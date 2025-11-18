/**
 * High-performance embeddings API server
 * Integrates TypeScript HTTP API with Python ML backends
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { EmbeddingService } from './embedding-service';
import { EmbeddingCache } from '../shared/cache';
import { SimilaritySearch } from '../shared/similarity';
import { Logger, formatDuration } from '../shared/utils';
import {
  EmbeddingRequest,
  EmbeddingResponse,
  SimilarityRequest,
  SimilarityResponse,
  BatchEmbeddingRequest,
  BatchEmbeddingResponse,
  HealthCheck,
} from '../shared/types';

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize services
const embeddingService = new EmbeddingService();
const cache = new EmbeddingCache(
  parseInt(process.env.CACHE_MAX_SIZE || '10000'),
  parseInt(process.env.CACHE_TTL || '3600000')
);

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Request logging
app.use((req, _res, next) => {
  Logger.info(`${req.method} ${req.path}`);
  next();
});

/**
 * Health check endpoint
 */
app.get('/health', async (_req: Request, res: Response) => {
  try {
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();

    const health: HealthCheck = {
      status: 'healthy',
      uptime: uptime,
      models: {
        text: process.env.TEXT_MODEL || 'sentence-transformers/all-MiniLM-L6-v2',
        image: process.env.IMAGE_MODEL || 'openai/clip-vit-base-patch32',
      },
      cache: cache.getStats(),
      memory: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100,
      },
    };

    res.json(health);
  } catch (error) {
    Logger.error('Health check failed:', error);
    res.status(500).json({ status: 'unhealthy', error: String(error) });
  }
});

/**
 * Generate text embeddings
 */
app.post('/embed/text', async (req: Request, res: Response) => {
  try {
    const { texts, model, normalize = true }: EmbeddingRequest = req.body;

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({ error: 'texts array is required' });
    }

    const startTime = performance.now();

    // Check cache for single text
    if (texts.length === 1) {
      const modelName = model || process.env.TEXT_MODEL || 'sentence-transformers/all-MiniLM-L6-v2';
      const cached = cache.get(texts[0], modelName);

      if (cached) {
        const response: EmbeddingResponse = {
          embeddings: [cached],
          model: modelName,
          dimensions: cached.length,
          processingTime: performance.now() - startTime,
          cached: true,
        };
        return res.json(response);
      }
    }

    // Generate embeddings
    const result = await embeddingService.encodeText(texts, model, normalize);

    // Cache single embedding
    if (texts.length === 1) {
      cache.set(texts[0], result.model, result.embeddings[0]);
    }

    const response: EmbeddingResponse = {
      embeddings: result.embeddings,
      model: result.model,
      dimensions: result.dimensions,
      processingTime: performance.now() - startTime,
      cached: false,
    };

    Logger.info(`Text embedding: ${texts.length} texts in ${formatDuration(response.processingTime)}`);

    res.json(response);
  } catch (error) {
    Logger.error('Text embedding failed:', error);
    res.status(500).json({ error: String(error) });
  }
});

/**
 * Generate image embeddings
 */
app.post('/embed/image', async (req: Request, res: Response) => {
  try {
    const { images, model, normalize = true }: EmbeddingRequest = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'images array is required' });
    }

    const startTime = performance.now();

    // Generate embeddings
    const result = await embeddingService.encodeImage(images, model, normalize);

    const response: EmbeddingResponse = {
      embeddings: result.embeddings,
      model: result.model,
      dimensions: result.dimensions,
      processingTime: performance.now() - startTime,
      cached: false,
    };

    Logger.info(`Image embedding: ${images.length} images in ${formatDuration(response.processingTime)}`);

    res.json(response);
  } catch (error) {
    Logger.error('Image embedding failed:', error);
    res.status(500).json({ error: String(error) });
  }
});

/**
 * Batch embeddings with optimized processing
 */
app.post('/embed/batch', async (req: Request, res: Response) => {
  try {
    const { items, model, batchSize = 100 }: BatchEmbeddingRequest = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items array is required' });
    }

    const startTime = performance.now();

    // Separate text and image items
    const textItems = items.filter(item => item.text).map(item => item.text!);
    const imageItems = items.filter(item => item.image).map(item => item.image!);

    const embeddings: number[][] = [];
    let batchesProcessed = 0;

    // Process text items
    if (textItems.length > 0) {
      const result = await embeddingService.encodeTextBatch(textItems, model, batchSize);
      embeddings.push(...result.embeddings);
      batchesProcessed += Math.ceil(textItems.length / batchSize);
    }

    // Process image items
    if (imageItems.length > 0) {
      const result = await embeddingService.encodeImageBatch(imageItems, model, batchSize);
      embeddings.push(...result.embeddings);
      batchesProcessed += Math.ceil(imageItems.length / batchSize);
    }

    const totalTime = performance.now() - startTime;

    const response: BatchEmbeddingResponse = {
      embeddings,
      model: model || process.env.TEXT_MODEL || 'sentence-transformers/all-MiniLM-L6-v2',
      totalItems: items.length,
      batchesProcessed,
      totalTime,
      avgTimePerItem: totalTime / items.length,
    };

    Logger.info(`Batch embedding: ${items.length} items in ${formatDuration(totalTime)}`);

    res.json(response);
  } catch (error) {
    Logger.error('Batch embedding failed:', error);
    res.status(500).json({ error: String(error) });
  }
});

/**
 * Similarity search
 */
app.post('/similarity', async (req: Request, res: Response) => {
  try {
    const { query, candidates, topK = 10, threshold }: SimilarityRequest = req.body;

    if (!query || !Array.isArray(query)) {
      return res.status(400).json({ error: 'query vector is required' });
    }

    if (!candidates || !Array.isArray(candidates)) {
      return res.status(400).json({ error: 'candidates array is required' });
    }

    const startTime = performance.now();

    const results = threshold !== undefined
      ? SimilaritySearch.findAboveThreshold(query, candidates, threshold)
      : SimilaritySearch.findTopK(query, candidates, topK);

    const processingTime = performance.now() - startTime;

    const response: SimilarityResponse = {
      results,
      processingTime,
    };

    Logger.info(`Similarity search: ${candidates.length} candidates in ${formatDuration(processingTime)}`);

    res.json(response);
  } catch (error) {
    Logger.error('Similarity search failed:', error);
    res.status(500).json({ error: String(error) });
  }
});

/**
 * Cache management
 */
app.get('/cache/stats', (_req: Request, res: Response) => {
  res.json(cache.getStats());
});

app.post('/cache/clear', (_req: Request, res: Response) => {
  cache.clear();
  res.json({ message: 'Cache cleared' });
});

/**
 * Error handling
 */
app.use((err: Error, _req: Request, res: Response, _next: any) => {
  Logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

/**
 * Start server
 */
app.listen(PORT, () => {
  Logger.info(`Embeddings service listening on port ${PORT}`);
  Logger.info(`Text model: ${process.env.TEXT_MODEL || 'sentence-transformers/all-MiniLM-L6-v2'}`);
  Logger.info(`Image model: ${process.env.IMAGE_MODEL || 'openai/clip-vit-base-patch32'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  Logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  Logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});
