#!/usr/bin/env node
/**
 * Main server for the anomaly detection engine.
 * Combines TypeScript API with Python ML models.
 */

import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { config } from 'dotenv';
import { createServer } from 'http';

// Load environment variables
config();

// Import core components
import { ModelManager } from '../core/model-manager.js';
import { RealtimeScorer } from '../core/scorer.js';
import { AlertManager } from '../core/alert-manager.js';
import { EventBuffer } from '../core/event-buffer.js';

// Import API components
import { createRoutes } from './routes.js';
import { AnomalyWebSocketServer } from './websocket.js';
import {
  logger,
  requestLogger,
  errorHandler,
  rateLimiter,
  healthCheck,
  corsOptions,
  MetricsCollector,
  requestTimeout
} from './middleware.js';

// Configuration
const PORT = parseInt(process.env.PORT || '3000');
const HOST = process.env.HOST || '0.0.0.0';
const MODELS_DIR = process.env.MODEL_PATH || './models';
const SCORING_TIMEOUT = parseInt(process.env.SCORING_TIMEOUT || '100');
const BUFFER_SIZE = parseInt(process.env.EVENT_BUFFER_SIZE || '10000');

/**
 * Main application class.
 */
class AnomalyDetectionServer {
  private app: express.Application;
  private server: any;
  private modelManager!: ModelManager;
  private scorer!: RealtimeScorer;
  private alertManager!: AlertManager;
  private eventBuffer!: EventBuffer;
  private wsServer!: AnomalyWebSocketServer;
  private metricsCollector: MetricsCollector;

  constructor() {
    this.app = express();
    this.metricsCollector = new MetricsCollector();
  }

  /**
   * Initialize all components.
   */
  async initialize(): Promise<void> {
    logger.info('Initializing anomaly detection engine...');

    // Initialize core components
    this.modelManager = new ModelManager(MODELS_DIR);
    await this.modelManager.initialize();

    this.scorer = new RealtimeScorer(
      this.modelManager,
      SCORING_TIMEOUT
    );

    this.alertManager = new AlertManager();

    this.eventBuffer = new EventBuffer(BUFFER_SIZE);

    // Configure alert channels
    if (process.env.WEBHOOK_URL) {
      this.alertManager.addChannel({
        type: 'webhook',
        enabled: true,
        config: {
          url: process.env.WEBHOOK_URL
        }
      });
    }

    this.alertManager.addChannel({
      type: 'log',
      enabled: true,
      config: {}
    });

    logger.info('Core components initialized');

    // Load default model if available
    const models = this.modelManager.getModels();
    if (models.length > 0) {
      const defaultModel = models.find(m =>
        m.metadata.algorithm === (process.env.DEFAULT_ALGORITHM || 'isolation_forest')
      ) || models[0];

      await this.modelManager.loadModel(
        defaultModel.metadata.algorithm
      );

      logger.info(`Loaded default model: ${defaultModel.metadata.algorithm}`);
    } else {
      logger.warn('No models found. Train a model to start detecting anomalies.');
    }
  }

  /**
   * Configure Express middleware.
   */
  private configureMiddleware(): void {
    // Basic middleware
    this.app.use(cors(corsOptions));
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Custom middleware
    this.app.use(requestLogger);
    this.app.use(this.metricsCollector.middleware());
    this.app.use(requestTimeout(30000));

    // Rate limiting (except health check)
    this.app.use('/api', rateLimiter);
  }

  /**
   * Configure routes.
   */
  private configureRoutes(): void {
    // Health check
    this.app.get('/health', healthCheck);

    // Metrics endpoint
    this.app.get('/metrics', (req, res) => {
      const metrics = this.metricsCollector.getMetrics();
      const wsStats = this.wsServer.getStats();

      res.json({
        status: 'success',
        metrics: {
          http: metrics,
          websocket: wsStats,
          scorer: this.scorer.getStats(),
          alerts: this.alertManager.getStats(),
          buffer: this.eventBuffer.getStats()
        }
      });
    });

    // API routes
    const apiRoutes = createRoutes(
      this.modelManager,
      this.scorer,
      this.alertManager,
      this.eventBuffer
    );
    this.app.use('/api/v1', apiRoutes);

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        status: 'error',
        message: 'Endpoint not found',
        path: req.path
      });
    });

    // Error handler (must be last)
    this.app.use(errorHandler);
  }

  /**
   * Start the server.
   */
  async start(): Promise<void> {
    await this.initialize();

    this.configureMiddleware();
    this.configureRoutes();

    // Create HTTP server
    this.server = createServer(this.app);

    // Initialize WebSocket server
    if (process.env.ENABLE_WEBSOCKET !== 'false') {
      this.wsServer = new AnomalyWebSocketServer(
        this.server,
        this.alertManager,
        this.scorer
      );
      logger.info('WebSocket server enabled');
    }

    // Start listening
    await new Promise<void>((resolve) => {
      this.server.listen(PORT, HOST, () => {
        logger.info({
          message: 'Anomaly Detection Engine started',
          host: HOST,
          port: PORT,
          environment: process.env.NODE_ENV || 'development',
          websocket: process.env.ENABLE_WEBSOCKET !== 'false'
        });
        resolve();
      });
    });

    // Setup graceful shutdown
    this.setupGracefulShutdown();
  }

  /**
   * Setup graceful shutdown.
   */
  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);

      // Stop accepting new connections
      this.server.close(() => {
        logger.info('HTTP server closed');
      });

      // Close WebSocket server
      if (this.wsServer) {
        this.wsServer.close();
      }

      // Cleanup
      this.eventBuffer.destroy();

      logger.info('Shutdown complete');
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }
}

// Start the server
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new AnomalyDetectionServer();
  server.start().catch((error) => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });
}

export { AnomalyDetectionServer };
