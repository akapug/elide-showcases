/**
 * API routes for anomaly detection endpoints.
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { validateRequest } from './middleware.js';
import { ModelManager } from '../core/model-manager.js';
import { RealtimeScorer } from '../core/scorer.js';
import { AlertManager } from '../core/alert-manager.js';
import { EventBuffer, Event } from '../core/event-buffer.js';

// Validation schemas
const eventSchema = z.object({
  id: z.string().optional(),
  features: z.array(z.number()),
  metadata: z.record(z.any()).optional()
});

const batchEventsSchema = z.object({
  events: z.array(eventSchema),
  algorithm: z.enum(['isolation_forest', 'lof', 'one_class_svm', 'timeseries', 'ensemble']).optional()
});

const trainModelSchema = z.object({
  algorithm: z.enum(['isolation_forest', 'lof', 'one_class_svm', 'timeseries']),
  data: z.array(z.array(z.number())),
  config: z.object({
    contamination: z.number().min(0).max(0.5).optional(),
    n_estimators: z.number().optional(),
    n_neighbors: z.number().optional(),
    kernel: z.string().optional(),
    novelty: z.boolean().optional()
  }).optional()
});

export function createRoutes(
  modelManager: ModelManager,
  scorer: RealtimeScorer,
  alertManager: AlertManager,
  eventBuffer: EventBuffer
): Router {
  const router = Router();

  /**
   * POST /api/v1/detect
   * Real-time anomaly detection for a single event.
   */
  router.post(
    '/detect',
    validateRequest({ body: eventSchema }),
    async (req: Request, res: Response) => {
      try {
        const event: Event = {
          id: req.body.id || `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          features: req.body.features,
          metadata: req.body.metadata
        };

        // Score the event
        const result = await scorer.scoreEvent(event);

        // Process alert
        const alert = await alertManager.processResult(result);

        res.json({
          status: 'success',
          result,
          alert: alert ? {
            id: alert.id,
            severity: alert.severity,
            message: alert.message
          } : null
        });
      } catch (error: any) {
        res.status(500).json({
          status: 'error',
          message: error.message
        });
      }
    }
  );

  /**
   * POST /api/v1/detect/batch
   * Batch anomaly detection for multiple events.
   */
  router.post(
    '/detect/batch',
    validateRequest({ body: batchEventsSchema }),
    async (req: Request, res: Response) => {
      try {
        const events: Event[] = req.body.events.map((e: any) => ({
          id: e.id || `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          features: e.features,
          metadata: e.metadata
        }));

        const result = await scorer.scoreBatch(events, {
          algorithm: req.body.algorithm
        });

        // Process alerts for anomalies
        const alerts = await Promise.all(
          result.results
            .filter(r => r.isAnomaly)
            .map(r => alertManager.processResult(r))
        );

        res.json({
          status: 'success',
          result: {
            ...result,
            alerts: alerts.filter(a => a !== null).map(a => ({
              id: a!.id,
              severity: a!.severity,
              message: a!.message
            }))
          }
        });
      } catch (error: any) {
        res.status(500).json({
          status: 'error',
          message: error.message
        });
      }
    }
  );

  /**
   * POST /api/v1/train
   * Train a new anomaly detection model.
   */
  router.post(
    '/train',
    validateRequest({ body: trainModelSchema }),
    async (req: Request, res: Response) => {
      try {
        const { algorithm, data, config = {} } = req.body;

        const metadata = await modelManager.trainModel(algorithm, data, config);

        res.json({
          status: 'success',
          model: metadata
        });
      } catch (error: any) {
        res.status(500).json({
          status: 'error',
          message: error.message
        });
      }
    }
  );

  /**
   * GET /api/v1/models
   * List all available models.
   */
  router.get('/models', (req: Request, res: Response) => {
    const models = modelManager.getModels();
    res.json({
      status: 'success',
      models: models.map(m => ({
        algorithm: m.metadata.algorithm,
        version: m.metadata.version,
        trainedAt: m.metadata.trainedAt,
        nSamples: m.metadata.nSamples,
        loaded: m.loaded
      }))
    });
  });

  /**
   * GET /api/v1/models/:algorithm
   * Get specific model info.
   */
  router.get('/models/:algorithm', (req: Request, res: Response) => {
    const models = modelManager.getModels();
    const model = models.find(m => m.metadata.algorithm === req.params.algorithm);

    if (!model) {
      res.status(404).json({
        status: 'error',
        message: 'Model not found'
      });
      return;
    }

    res.json({
      status: 'success',
      model: {
        ...model.metadata,
        loaded: model.loaded,
        lastUsed: model.lastUsed
      }
    });
  });

  /**
   * POST /api/v1/models/:algorithm/load
   * Load a specific model.
   */
  router.post('/models/:algorithm/load', async (req: Request, res: Response) => {
    try {
      const loaded = await modelManager.loadModel(req.params.algorithm);

      if (loaded) {
        res.json({
          status: 'success',
          message: `Model ${req.params.algorithm} loaded successfully`
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Failed to load model'
        });
      }
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  });

  /**
   * GET /api/v1/alerts
   * Get all active alerts.
   */
  router.get('/alerts', (req: Request, res: Response) => {
    const alerts = alertManager.getActiveAlerts();
    res.json({
      status: 'success',
      alerts
    });
  });

  /**
   * GET /api/v1/alerts/:id
   * Get specific alert.
   */
  router.get('/alerts/:id', (req: Request, res: Response) => {
    const alert = alertManager.getAlert(req.params.id);

    if (!alert) {
      res.status(404).json({
        status: 'error',
        message: 'Alert not found'
      });
      return;
    }

    res.json({
      status: 'success',
      alert
    });
  });

  /**
   * POST /api/v1/alerts/:id/acknowledge
   * Acknowledge an alert.
   */
  router.post('/alerts/:id/acknowledge', (req: Request, res: Response) => {
    const acknowledged = alertManager.acknowledgeAlert(req.params.id);

    if (acknowledged) {
      res.json({
        status: 'success',
        message: 'Alert acknowledged'
      });
    } else {
      res.status(404).json({
        status: 'error',
        message: 'Alert not found'
      });
    }
  });

  /**
   * POST /api/v1/alerts/:id/resolve
   * Resolve an alert.
   */
  router.post('/alerts/:id/resolve', (req: Request, res: Response) => {
    const resolved = alertManager.resolveAlert(req.params.id);

    if (resolved) {
      res.json({
        status: 'success',
        message: 'Alert resolved'
      });
    } else {
      res.status(404).json({
        status: 'error',
        message: 'Alert not found'
      });
    }
  });

  /**
   * GET /api/v1/stats/scorer
   * Get scorer statistics.
   */
  router.get('/stats/scorer', (req: Request, res: Response) => {
    const stats = scorer.getStats();
    res.json({
      status: 'success',
      stats
    });
  });

  /**
   * GET /api/v1/stats/alerts
   * Get alert statistics.
   */
  router.get('/stats/alerts', (req: Request, res: Response) => {
    const stats = alertManager.getStats();
    res.json({
      status: 'success',
      stats
    });
  });

  /**
   * GET /api/v1/stats/buffer
   * Get buffer statistics.
   */
  router.get('/stats/buffer', (req: Request, res: Response) => {
    const stats = eventBuffer.getStats();
    res.json({
      status: 'success',
      stats
    });
  });

  /**
   * POST /api/v1/stats/reset
   * Reset all statistics.
   */
  router.post('/stats/reset', (req: Request, res: Response) => {
    scorer.resetStats();
    res.json({
      status: 'success',
      message: 'Statistics reset'
    });
  });

  return router;
}
