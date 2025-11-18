import { Router } from 'express';
import type { Logger } from 'pino';
import { z } from 'zod';
import { RecommendationEngine } from '../core/recommendation-engine.js';
import { ModelManager } from '../core/model-manager.js';
import { ABTesting } from '../core/ab-testing.js';
import { AnalyticsTracker } from '../core/analytics-tracker.js';

const RecommendSchema = z.object({
  userId: z.string(),
  limit: z.number().int().min(1).max(100).optional().default(10),
  algorithm: z.enum(['collaborative_filtering', 'matrix_factorization', 'neural_cf', 'content_based', 'hybrid']).optional(),
  context: z.object({
    device: z.string().optional(),
    location: z.string().optional(),
    time: z.string().optional()
  }).optional(),
  filters: z.object({
    category: z.array(z.string()).optional(),
    minRating: z.number().optional()
  }).optional(),
  diversityWeight: z.number().min(0).max(1).optional()
});

const SimilarItemsSchema = z.object({
  itemId: z.string(),
  limit: z.number().int().min(1).max(100).optional().default(10),
  algorithm: z.enum(['content_based', 'collaborative_filtering']).optional()
});

const InteractionSchema = z.object({
  userId: z.string(),
  itemId: z.string(),
  interactionType: z.enum(['view', 'click', 'purchase', 'rating']),
  rating: z.number().min(1).max(5).optional(),
  timestamp: z.number().optional(),
  context: z.object({
    sessionId: z.string().optional(),
    position: z.number().optional()
  }).optional()
});

export function createRoutes(logger: Logger): Router {
  const router = Router();
  const engine = new RecommendationEngine(logger);
  const modelManager = new ModelManager(logger);
  const abTesting = new ABTesting(logger);
  const analytics = new AnalyticsTracker(logger);

  // Get recommendations
  router.post('/recommend', async (req, res, next) => {
    try {
      const startTime = performance.now();
      const input = RecommendSchema.parse(req.body);

      // A/B test assignment
      let algorithm = input.algorithm;
      if (!algorithm && process.env.ENABLE_AB_TESTING === 'true') {
        const assignment = abTesting.assign(input.userId);
        algorithm = assignment.variant as any;
      }

      const recommendations = await engine.recommend({
        ...input,
        algorithm: algorithm || (process.env.DEFAULT_ALGORITHM as any) || 'hybrid'
      });

      const latencyMs = performance.now() - startTime;

      // Track analytics
      analytics.trackRecommendation({
        userId: input.userId,
        algorithm: recommendations.algorithm,
        count: recommendations.recommendations.length,
        latencyMs
      });

      res.json({
        status: 'success',
        result: {
          ...recommendations,
          latencyMs
        }
      });
    } catch (error) {
      next(error);
    }
  });

  // Get similar items
  router.post('/similar', async (req, res, next) => {
    try {
      const startTime = performance.now();
      const input = SimilarItemsSchema.parse(req.body);

      const similar = await engine.getSimilarItems(input);
      const latencyMs = performance.now() - startTime;

      res.json({
        status: 'success',
        result: {
          ...similar,
          latencyMs
        }
      });
    } catch (error) {
      next(error);
    }
  });

  // Record interaction
  router.post('/interaction', async (req, res, next) => {
    try {
      const input = InteractionSchema.parse(req.body);

      const result = await engine.recordInteraction(input);

      // Track for analytics
      analytics.trackInteraction(input);

      res.json({
        status: 'success',
        result
      });
    } catch (error) {
      next(error);
    }
  });

  // Get user profile
  router.get('/user/:userId/profile', async (req, res, next) => {
    try {
      const { userId } = req.params;
      const profile = await engine.getUserProfile(userId);

      res.json({
        status: 'success',
        profile
      });
    } catch (error) {
      next(error);
    }
  });

  // A/B test assignment
  router.post('/experiment/assign', async (req, res, next) => {
    try {
      const { userId, experimentId } = req.body;
      const assignment = abTesting.assign(userId, experimentId);

      res.json({
        status: 'success',
        result: assignment
      });
    } catch (error) {
      next(error);
    }
  });

  // Get models info
  router.get('/models', async (req, res, next) => {
    try {
      const models = await modelManager.listModels();

      res.json({
        status: 'success',
        models
      });
    } catch (error) {
      next(error);
    }
  });

  // Get statistics
  router.get('/stats', async (req, res, next) => {
    try {
      const stats = analytics.getStats();

      res.json({
        status: 'success',
        stats
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
