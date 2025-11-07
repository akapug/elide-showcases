/**
 * API Routes - Sentiment Analysis Endpoints
 *
 * Defines all API routes and handlers for sentiment analysis:
 * - Single text analysis
 * - Batch text analysis
 * - Model information
 * - Analysis history
 *
 * @module api/routes
 */

import { RequestContext, sendJson, sendError } from './server';
import { cache } from './cache';
import { spawn } from 'child_process';
import { createHash } from 'crypto';
import { validate as validateEmail } from 'validator';
import { nanoid } from 'nanoid';

// Route handler type
type RouteHandler = (ctx: RequestContext) => Promise<boolean>;

// Sentiment analysis result
interface SentimentResult {
  text: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  confidence: number;
  emotions?: {
    joy?: number;
    sadness?: number;
    anger?: number;
    fear?: number;
    surprise?: number;
  };
  keywords?: string[];
  language?: string;
  processingTime: number;
}

// Batch analysis result
interface BatchResult {
  id: string;
  total: number;
  processed: number;
  results: SentimentResult[];
  summary: {
    positive: number;
    negative: number;
    neutral: number;
    avgScore: number;
    avgConfidence: number;
  };
  processingTime: number;
}

/**
 * Router class
 */
class Router {
  private routes: Map<string, Map<string, RouteHandler>>;

  constructor() {
    this.routes = new Map();
    this.registerRoutes();
  }

  /**
   * Register a route
   */
  register(method: string, path: string, handler: RouteHandler): void {
    if (!this.routes.has(path)) {
      this.routes.set(path, new Map());
    }
    this.routes.get(path)!.set(method, handler);
  }

  /**
   * Handle request
   */
  async handle(ctx: RequestContext): Promise<boolean> {
    const pathRoutes = this.routes.get(ctx.path);
    if (!pathRoutes) {
      return false;
    }

    const handler = pathRoutes.get(ctx.method);
    if (!handler) {
      sendError(ctx.res, 405, 'Method not allowed', {
        allowed: Array.from(pathRoutes.keys()),
      });
      return true;
    }

    return await handler(ctx);
  }

  /**
   * Register all routes
   */
  private registerRoutes(): void {
    // API v1 routes
    this.register('POST', '/api/v1/analyze', this.handleAnalyze.bind(this));
    this.register('POST', '/api/v1/batch', this.handleBatch.bind(this));
    this.register('GET', '/api/v1/models', this.handleModels.bind(this));
    this.register('GET', '/api/v1/history', this.handleHistory.bind(this));
    this.register('POST', '/api/v1/feedback', this.handleFeedback.bind(this));

    // Root endpoint
    this.register('GET', '/', this.handleRoot.bind(this));
  }

  /**
   * Handle root endpoint
   */
  private async handleRoot(ctx: RequestContext): Promise<boolean> {
    sendJson(ctx.res, 200, {
      name: 'ML API - Sentiment Analysis',
      version: '1.0.0',
      description: 'Production-grade sentiment analysis API with ML models',
      endpoints: {
        analyze: 'POST /api/v1/analyze',
        batch: 'POST /api/v1/batch',
        models: 'GET /api/v1/models',
        history: 'GET /api/v1/history',
        feedback: 'POST /api/v1/feedback',
        health: 'GET /health',
        metrics: 'GET /metrics',
      },
      documentation: 'https://github.com/elide-tools/elide-showcases',
    });
    return true;
  }

  /**
   * Handle single text analysis
   */
  private async handleAnalyze(ctx: RequestContext): Promise<boolean> {
    const startTime = Date.now();

    // Validate request body
    if (!ctx.body || typeof ctx.body !== 'object') {
      sendError(ctx.res, 400, 'Invalid request body', {
        expected: {
          text: 'string (required)',
          language: 'string (optional, default: auto)',
          includeEmotions: 'boolean (optional, default: false)',
          includeKeywords: 'boolean (optional, default: false)',
        },
      });
      return true;
    }

    const { text, language, includeEmotions, includeKeywords } = ctx.body;

    // Validate text
    if (!text || typeof text !== 'string') {
      sendError(ctx.res, 400, 'Text is required and must be a string');
      return true;
    }

    if (text.length === 0) {
      sendError(ctx.res, 400, 'Text cannot be empty');
      return true;
    }

    if (text.length > 10000) {
      sendError(ctx.res, 400, 'Text too long (max 10,000 characters)');
      return true;
    }

    // Generate cache key
    const cacheKey = this.generateCacheKey('analyze', {
      text,
      language,
      includeEmotions,
      includeKeywords,
    });

    // Check cache
    const cached = cache.get<SentimentResult>(cacheKey);
    if (cached) {
      sendJson(ctx.res, 200, {
        ...cached,
        cached: true,
        requestId: ctx.requestId,
      });
      return true;
    }

    try {
      // Call Python ML inference
      const result = await this.analyzeSentiment(text, {
        language,
        includeEmotions: includeEmotions === true,
        includeKeywords: includeKeywords === true,
      });

      result.processingTime = Date.now() - startTime;

      // Cache result
      cache.set(cacheKey, result, 3600); // Cache for 1 hour

      sendJson(ctx.res, 200, {
        ...result,
        cached: false,
        requestId: ctx.requestId,
      });

    } catch (error) {
      sendError(ctx.res, 500, 'Analysis failed', {
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return true;
  }

  /**
   * Handle batch text analysis
   */
  private async handleBatch(ctx: RequestContext): Promise<boolean> {
    const startTime = Date.now();

    // Validate request body
    if (!ctx.body || typeof ctx.body !== 'object') {
      sendError(ctx.res, 400, 'Invalid request body', {
        expected: {
          texts: 'string[] (required)',
          language: 'string (optional, default: auto)',
          includeEmotions: 'boolean (optional, default: false)',
          includeKeywords: 'boolean (optional, default: false)',
        },
      });
      return true;
    }

    const { texts, language, includeEmotions, includeKeywords } = ctx.body;

    // Validate texts
    if (!Array.isArray(texts)) {
      sendError(ctx.res, 400, 'Texts must be an array');
      return true;
    }

    if (texts.length === 0) {
      sendError(ctx.res, 400, 'Texts array cannot be empty');
      return true;
    }

    // Check batch size limits based on user tier
    const maxBatchSize = ctx.user?.tier === 'enterprise' ? 1000 : ctx.user?.tier === 'pro' ? 100 : 10;
    if (texts.length > maxBatchSize) {
      sendError(ctx.res, 400, `Batch size exceeds limit for ${ctx.user?.tier || 'free'} tier`, {
        limit: maxBatchSize,
        provided: texts.length,
      });
      return true;
    }

    // Validate each text
    for (let i = 0; i < texts.length; i++) {
      if (typeof texts[i] !== 'string') {
        sendError(ctx.res, 400, `Text at index ${i} must be a string`);
        return true;
      }
      if (texts[i].length > 10000) {
        sendError(ctx.res, 400, `Text at index ${i} too long (max 10,000 characters)`);
        return true;
      }
    }

    const batchId = nanoid();

    try {
      // Process all texts
      const results: SentimentResult[] = [];
      const options = {
        language,
        includeEmotions: includeEmotions === true,
        includeKeywords: includeKeywords === true,
      };

      for (const text of texts) {
        // Check cache for each text
        const cacheKey = this.generateCacheKey('analyze', { text, ...options });
        let result = cache.get<SentimentResult>(cacheKey);

        if (!result) {
          result = await this.analyzeSentiment(text, options);
          cache.set(cacheKey, result, 3600);
        }

        results.push(result);
      }

      // Calculate summary
      const summary = this.calculateSummary(results);

      const batchResult: BatchResult = {
        id: batchId,
        total: texts.length,
        processed: results.length,
        results,
        summary,
        processingTime: Date.now() - startTime,
      };

      sendJson(ctx.res, 200, {
        ...batchResult,
        requestId: ctx.requestId,
      });

    } catch (error) {
      sendError(ctx.res, 500, 'Batch analysis failed', {
        message: error instanceof Error ? error.message : 'Unknown error',
        batchId,
      });
    }

    return true;
  }

  /**
   * Handle models endpoint
   */
  private async handleModels(ctx: RequestContext): Promise<boolean> {
    const models = [
      {
        id: 'sentiment-transformer-v1',
        name: 'Sentiment Transformer V1',
        description: 'BERT-based sentiment analysis model trained on diverse datasets',
        version: '1.0.0',
        languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'zh', 'auto'],
        features: ['sentiment', 'emotions', 'keywords'],
        performance: {
          accuracy: 0.94,
          f1Score: 0.93,
          inferenceTime: '~50ms',
        },
        size: '420MB',
        active: true,
      },
      {
        id: 'sentiment-lstm-v2',
        name: 'Sentiment LSTM V2',
        description: 'LSTM-based model optimized for speed',
        version: '2.1.0',
        languages: ['en', 'es', 'fr', 'de', 'auto'],
        features: ['sentiment'],
        performance: {
          accuracy: 0.89,
          f1Score: 0.88,
          inferenceTime: '~20ms',
        },
        size: '85MB',
        active: false,
      },
      {
        id: 'sentiment-roberta-v3',
        name: 'Sentiment RoBERTa V3',
        description: 'RoBERTa-based model with highest accuracy',
        version: '3.0.0',
        languages: ['en', 'auto'],
        features: ['sentiment', 'emotions', 'keywords', 'sarcasm-detection'],
        performance: {
          accuracy: 0.97,
          f1Score: 0.96,
          inferenceTime: '~120ms',
        },
        size: '1.2GB',
        active: false,
      },
    ];

    sendJson(ctx.res, 200, {
      models,
      default: 'sentiment-transformer-v1',
      total: models.length,
      requestId: ctx.requestId,
    });

    return true;
  }

  /**
   * Handle analysis history
   */
  private async handleHistory(ctx: RequestContext): Promise<boolean> {
    const limit = parseInt(ctx.query.limit as string) || 50;
    const offset = parseInt(ctx.query.offset as string) || 0;

    if (limit > 100) {
      sendError(ctx.res, 400, 'Limit cannot exceed 100');
      return true;
    }

    // In production, this would query a database
    // For demo, return mock history
    const history = this.generateMockHistory(limit, offset);

    sendJson(ctx.res, 200, {
      history,
      pagination: {
        limit,
        offset,
        total: 1000,
        hasMore: offset + limit < 1000,
      },
      requestId: ctx.requestId,
    });

    return true;
  }

  /**
   * Handle feedback submission
   */
  private async handleFeedback(ctx: RequestContext): Promise<boolean> {
    if (!ctx.body || typeof ctx.body !== 'object') {
      sendError(ctx.res, 400, 'Invalid request body');
      return true;
    }

    const { analysisId, rating, comment, expectedSentiment } = ctx.body;

    if (!analysisId) {
      sendError(ctx.res, 400, 'Analysis ID is required');
      return true;
    }

    if (rating !== undefined && (typeof rating !== 'number' || rating < 1 || rating > 5)) {
      sendError(ctx.res, 400, 'Rating must be a number between 1 and 5');
      return true;
    }

    // Store feedback (in production, save to database)
    const feedback = {
      id: nanoid(),
      analysisId,
      rating,
      comment,
      expectedSentiment,
      userId: ctx.user?.id,
      timestamp: new Date().toISOString(),
    };

    sendJson(ctx.res, 201, {
      message: 'Feedback received successfully',
      feedback,
      requestId: ctx.requestId,
    });

    return true;
  }

  /**
   * Analyze sentiment using Python ML model
   */
  private async analyzeSentiment(
    text: string,
    options: {
      language?: string;
      includeEmotions?: boolean;
      includeKeywords?: boolean;
    }
  ): Promise<SentimentResult> {
    return new Promise((resolve, reject) => {
      const python = spawn('python3', [
        '/home/user/elide-showcases/showcases/ml-api/ml/inference.py',
        '--text', text,
        '--language', options.language || 'auto',
        '--include-emotions', options.includeEmotions ? 'true' : 'false',
        '--include-keywords', options.includeKeywords ? 'true' : 'false',
      ]);

      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python process exited with code ${code}: ${stderr}`));
          return;
        }

        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse Python output: ${error}`));
        }
      });

      python.on('error', (error) => {
        reject(new Error(`Failed to spawn Python process: ${error.message}`));
      });
    });
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(prefix: string, data: any): string {
    const hash = createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex')
      .substring(0, 16);
    return `${prefix}:${hash}`;
  }

  /**
   * Calculate batch summary
   */
  private calculateSummary(results: SentimentResult[]): BatchResult['summary'] {
    const counts = {
      positive: 0,
      negative: 0,
      neutral: 0,
    };

    let totalScore = 0;
    let totalConfidence = 0;

    for (const result of results) {
      counts[result.sentiment]++;
      totalScore += result.score;
      totalConfidence += result.confidence;
    }

    return {
      positive: counts.positive,
      negative: counts.negative,
      neutral: counts.neutral,
      avgScore: totalScore / results.length,
      avgConfidence: totalConfidence / results.length,
    };
  }

  /**
   * Generate mock history
   */
  private generateMockHistory(limit: number, offset: number): any[] {
    const history = [];
    const sentiments = ['positive', 'negative', 'neutral'] as const;
    const texts = [
      'This is an amazing product!',
      'Terrible experience, very disappointed.',
      'It works as expected.',
      'Absolutely love it!',
      'Not worth the money.',
    ];

    for (let i = 0; i < limit; i++) {
      const idx = (offset + i) % texts.length;
      history.push({
        id: nanoid(),
        text: texts[idx],
        sentiment: sentiments[idx % 3],
        score: Math.random() * 2 - 1,
        confidence: 0.8 + Math.random() * 0.2,
        timestamp: new Date(Date.now() - i * 3600000).toISOString(),
      });
    }

    return history;
  }
}

// Export router instance
export const router = new Router();
export type { SentimentResult, BatchResult };
