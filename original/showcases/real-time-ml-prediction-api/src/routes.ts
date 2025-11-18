/**
 * API Route Handlers
 *
 * Handles prediction endpoints and calls ML models via polyglot bridge.
 *
 * @module routes
 */

import { RequestContext, sendJson, sendError } from './server';
import { mlBridge } from './polyglot/bridge';

/**
 * Simple router for handling requests
 */
class Router {
  private routes: Map<string, (ctx: RequestContext) => Promise<boolean>>;

  constructor() {
    this.routes = new Map();
    this.registerRoutes();
  }

  /**
   * Register all API routes
   */
  private registerRoutes(): void {
    this.routes.set('POST /api/predict/sentiment', this.handleSentiment.bind(this));
    this.routes.set('POST /api/predict/image', this.handleImage.bind(this));
    this.routes.set('POST /api/predict/recommend', this.handleRecommendation.bind(this));
    this.routes.set('POST /api/predict/batch', this.handleBatch.bind(this));
    this.routes.set('GET /api/models', this.handleModels.bind(this));
  }

  /**
   * Handle incoming request
   */
  async handle(ctx: RequestContext): Promise<boolean> {
    const routeKey = `${ctx.method} ${ctx.path}`;
    const handler = this.routes.get(routeKey);

    if (!handler) {
      return false;
    }

    try {
      return await handler(ctx);
    } catch (error) {
      console.error('Route handler error:', error);
      sendError(ctx.res, 500, 'Internal server error', {
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      return true;
    }
  }

  /**
   * Handle sentiment analysis endpoint
   * POST /api/predict/sentiment
   */
  private async handleSentiment(ctx: RequestContext): Promise<boolean> {
    // Validate input
    if (!ctx.body || typeof ctx.body.text !== 'string') {
      sendError(ctx.res, 400, 'Invalid request', {
        message: 'Request body must contain "text" field (string)',
        example: {
          text: 'Your text here',
          options: { detailed: false }
        }
      });
      return true;
    }

    // Validate text length
    if (ctx.body.text.length === 0) {
      sendError(ctx.res, 400, 'Invalid request', {
        message: 'Text cannot be empty'
      });
      return true;
    }

    if (ctx.body.text.length > 10000) {
      sendError(ctx.res, 400, 'Invalid request', {
        message: 'Text is too long (max 10,000 characters)'
      });
      return true;
    }

    // Call ML model via polyglot bridge
    const result = await mlBridge.analyzeSentiment({
      text: ctx.body.text,
      options: ctx.body.options || {}
    });

    if (!result.success) {
      sendError(ctx.res, 500, 'Prediction failed', {
        message: result.error?.message || 'Unknown error',
        type: result.error?.type
      });
      return true;
    }

    // Send response
    sendJson(ctx.res, 200, {
      ...result.data,
      latency_ms: parseFloat(result.latency.toFixed(3)),
      model: 'sentiment-v1',
      timestamp: new Date().toISOString()
    });

    return true;
  }

  /**
   * Handle image classification endpoint
   * POST /api/predict/image
   */
  private async handleImage(ctx: RequestContext): Promise<boolean> {
    // Validate input
    if (!ctx.body || (!ctx.body.image_url && !ctx.body.image_data)) {
      sendError(ctx.res, 400, 'Invalid request', {
        message: 'Request body must contain "image_url" or "image_data" field',
        example: {
          image_url: 'https://example.com/image.jpg',
          top_k: 5
        }
      });
      return true;
    }

    // Call ML model via polyglot bridge
    const result = await mlBridge.classifyImage({
      image_url: ctx.body.image_url,
      image_data: ctx.body.image_data,
      top_k: ctx.body.top_k || 5
    });

    if (!result.success) {
      sendError(ctx.res, 500, 'Prediction failed', {
        message: result.error?.message || 'Unknown error',
        type: result.error?.type
      });
      return true;
    }

    // Send response
    sendJson(ctx.res, 200, {
      ...result.data,
      latency_ms: parseFloat(result.latency.toFixed(3)),
      model: 'image-classifier-v1',
      timestamp: new Date().toISOString()
    });

    return true;
  }

  /**
   * Handle recommendation endpoint
   * POST /api/predict/recommend
   */
  private async handleRecommendation(ctx: RequestContext): Promise<boolean> {
    // Validate input
    if (!ctx.body || typeof ctx.body.user_id !== 'string') {
      sendError(ctx.res, 400, 'Invalid request', {
        message: 'Request body must contain "user_id" field (string)',
        example: {
          user_id: 'user123',
          context: { category: 'tech' },
          limit: 10
        }
      });
      return true;
    }

    // Call ML model via polyglot bridge
    const result = await mlBridge.getRecommendations({
      user_id: ctx.body.user_id,
      context: ctx.body.context || {},
      limit: ctx.body.limit || 10
    });

    if (!result.success) {
      sendError(ctx.res, 500, 'Prediction failed', {
        message: result.error?.message || 'Unknown error',
        type: result.error?.type
      });
      return true;
    }

    // Send response
    sendJson(ctx.res, 200, {
      ...result.data,
      latency_ms: parseFloat(result.latency.toFixed(3)),
      model: 'recommender-v1',
      timestamp: new Date().toISOString()
    });

    return true;
  }

  /**
   * Handle batch prediction endpoint
   * POST /api/predict/batch
   */
  private async handleBatch(ctx: RequestContext): Promise<boolean> {
    // Validate input
    if (!ctx.body || !Array.isArray(ctx.body.texts)) {
      sendError(ctx.res, 400, 'Invalid request', {
        message: 'Request body must contain "texts" field (array of strings)',
        example: {
          texts: ['Text 1', 'Text 2', 'Text 3'],
          model: 'sentiment'
        }
      });
      return true;
    }

    // Validate batch size
    if (ctx.body.texts.length === 0) {
      sendError(ctx.res, 400, 'Invalid request', {
        message: 'Texts array cannot be empty'
      });
      return true;
    }

    if (ctx.body.texts.length > 100) {
      sendError(ctx.res, 400, 'Invalid request', {
        message: 'Batch size too large (max 100 items)'
      });
      return true;
    }

    // Validate all items are strings
    if (!ctx.body.texts.every((text: any) => typeof text === 'string')) {
      sendError(ctx.res, 400, 'Invalid request', {
        message: 'All items in texts array must be strings'
      });
      return true;
    }

    // Call ML model via polyglot bridge
    const batchStartTime = performance.now();
    const result = await mlBridge.analyzeSentimentBatch(ctx.body.texts);
    const totalLatency = performance.now() - batchStartTime;

    if (!result.success) {
      sendError(ctx.res, 500, 'Prediction failed', {
        message: result.error?.message || 'Unknown error',
        type: result.error?.type
      });
      return true;
    }

    // Send response
    sendJson(ctx.res, 200, {
      results: result.data,
      count: ctx.body.texts.length,
      latency_ms: parseFloat(totalLatency.toFixed(3)),
      avg_latency_per_item_ms: parseFloat((totalLatency / ctx.body.texts.length).toFixed(3)),
      model: 'sentiment-v1-batch',
      timestamp: new Date().toISOString()
    });

    return true;
  }

  /**
   * Handle models info endpoint
   * GET /api/models
   */
  private async handleModels(ctx: RequestContext): Promise<boolean> {
    const metrics = mlBridge.getMetrics();

    const modelsInfo = {
      models: [
        {
          name: 'sentiment-v1',
          type: 'text-classification',
          description: 'Sentiment analysis using scikit-learn',
          endpoint: '/api/predict/sentiment',
          input: 'text',
          output: 'sentiment (positive/negative/neutral)',
          avg_latency_ms: metrics.avgLatency.toFixed(3),
          status: 'ready'
        },
        {
          name: 'image-classifier-v1',
          type: 'image-classification',
          description: 'Image classification using PyTorch ResNet-50',
          endpoint: '/api/predict/image',
          input: 'image_url or image_data',
          output: 'predictions with labels and confidence',
          status: 'ready'
        },
        {
          name: 'recommender-v1',
          type: 'recommendation',
          description: 'Personalized recommendations using collaborative filtering',
          endpoint: '/api/predict/recommend',
          input: 'user_id and context',
          output: 'recommended items with scores',
          status: 'ready'
        }
      ],
      polyglot: {
        totalCalls: metrics.totalCalls,
        successRate: metrics.totalCalls > 0
          ? ((metrics.successfulCalls / metrics.totalCalls) * 100).toFixed(2) + '%'
          : '100%',
        avgLatency: `${metrics.avgLatency.toFixed(3)}ms`,
        cacheHitRate: metrics.totalCalls > 0
          ? ((metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) * 100).toFixed(2) + '%'
          : 'N/A'
      },
      timestamp: new Date().toISOString()
    };

    sendJson(ctx.res, 200, modelsInfo);
    return true;
  }
}

export const router = new Router();
