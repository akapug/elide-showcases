/**
 * IoT Device Management Platform - Main Server
 *
 * Production-ready server handling:
 * - MQTT broker integration
 * - HTTP API endpoints
 * - Device management
 * - Telemetry processing
 * - Real-time dashboard
 * - Health monitoring
 */

import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import pino from 'pino';
import Redis from 'ioredis';
import { Pool } from 'pg';
import { InfluxDB, Point } from 'influx';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { DeviceManager } from './device-manager';
import { MQTTBroker } from './mqtt-broker';
import { TelemetryProcessor } from './telemetry-processor';
import { RulesEngine } from './rules-engine';
import { WebSocketDashboard } from './dashboard/websocket-server';

// Logger configuration
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
    },
  },
});

// Configuration from environment
const CONFIG = {
  port: parseInt(process.env.PORT || '3000'),
  host: process.env.HOST || '0.0.0.0',
  mqtt: {
    port: parseInt(process.env.MQTT_PORT || '1883'),
    wsPort: parseInt(process.env.MQTT_WS_PORT || '8883'),
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0'),
  },
  influx: {
    host: process.env.INFLUX_HOST || 'localhost',
    port: parseInt(process.env.INFLUX_PORT || '8086'),
    database: process.env.INFLUX_DATABASE || 'iot_telemetry',
    username: process.env.INFLUX_USERNAME || 'admin',
    password: process.env.INFLUX_PASSWORD || 'admin',
  },
  postgres: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DB || 'iot_platform',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    max: 20,
  },
  limits: {
    maxDevices: parseInt(process.env.MAX_DEVICES || '50000'),
    maxTelemetryRate: parseInt(process.env.MAX_TELEMETRY_RATE || '10000'),
    batchSize: parseInt(process.env.BATCH_SIZE || '1000'),
    batchInterval: parseInt(process.env.BATCH_INTERVAL || '5000'),
  },
};

// Validation schemas
const DeviceRegistrationSchema = z.object({
  deviceId: z.string().min(1).max(255),
  type: z.string().min(1).max(100),
  metadata: z.record(z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
  location: z.object({
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    name: z.string().optional(),
  }).optional(),
});

const TelemetryQuerySchema = z.object({
  start: z.string().datetime().optional(),
  end: z.string().datetime().optional(),
  metric: z.string().optional(),
  aggregation: z.enum(['mean', 'min', 'max', 'sum', 'count']).optional(),
  interval: z.string().optional(),
  limit: z.coerce.number().min(1).max(10000).default(1000),
});

const RuleCreationSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  condition: z.string().min(1),
  deviceFilter: z.object({
    types: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    ids: z.array(z.string()).optional(),
  }).optional(),
  actions: z.array(z.object({
    type: z.enum(['webhook', 'email', 'sms', 'log']),
    config: z.record(z.unknown()),
  })),
  enabled: z.boolean().default(true),
  cooldown: z.number().min(0).default(300),
});

const BatchOperationSchema = z.object({
  operation: z.enum(['update_firmware', 'update_config', 'restart', 'delete']),
  filter: z.object({
    type: z.string().optional(),
    tags: z.array(z.string()).optional(),
    location: z.string().optional(),
  }),
  params: z.record(z.unknown()).optional(),
});

/**
 * Main IoT Platform Server
 */
export class IoTPlatformServer {
  private app: express.Application;
  private httpServer: any;
  private redis: Redis;
  private postgres: Pool;
  private influx: InfluxDB;
  private deviceManager: DeviceManager;
  private mqttBroker: MQTTBroker;
  private telemetryProcessor: TelemetryProcessor;
  private rulesEngine: RulesEngine;
  private dashboard: WebSocketDashboard;
  private stats = {
    startTime: Date.now(),
    requestCount: 0,
    errorCount: 0,
    telemetryReceived: 0,
    alertsTriggered: 0,
  };

  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.redis = new Redis(CONFIG.redis);
    this.postgres = new Pool(CONFIG.postgres);
    this.influx = new InfluxDB({
      host: CONFIG.influx.host,
      port: CONFIG.influx.port,
      database: CONFIG.influx.database,
      username: CONFIG.influx.username,
      password: CONFIG.influx.password,
    });

    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Initialize all components
   */
  async initialize(): Promise<void> {
    logger.info('Initializing IoT Platform Server...');

    try {
      // Test database connections
      await this.testConnections();

      // Initialize device manager
      this.deviceManager = new DeviceManager(
        this.postgres,
        this.redis,
        logger.child({ component: 'device-manager' })
      );
      await this.deviceManager.initialize();

      // Initialize telemetry processor
      this.telemetryProcessor = new TelemetryProcessor(
        this.influx,
        this.redis,
        CONFIG.limits,
        logger.child({ component: 'telemetry-processor' })
      );
      await this.telemetryProcessor.initialize();

      // Initialize rules engine
      this.rulesEngine = new RulesEngine(
        this.postgres,
        this.redis,
        logger.child({ component: 'rules-engine' })
      );
      await this.rulesEngine.initialize();

      // Initialize MQTT broker
      this.mqttBroker = new MQTTBroker(
        CONFIG.mqtt,
        this.deviceManager,
        this.telemetryProcessor,
        logger.child({ component: 'mqtt-broker' })
      );
      await this.mqttBroker.start();

      // Initialize dashboard
      this.dashboard = new WebSocketDashboard(
        parseInt(process.env.WS_PORT || '8080'),
        this.redis,
        logger.child({ component: 'dashboard' })
      );
      await this.dashboard.start();

      // Connect telemetry processor to rules engine
      this.telemetryProcessor.on('telemetry', async (data) => {
        await this.rulesEngine.evaluate(data);
        this.stats.telemetryReceived++;
      });

      // Connect rules engine to dashboard
      this.rulesEngine.on('alert', (alert) => {
        this.dashboard.broadcast('alert', alert);
        this.stats.alertsTriggered++;
      });

      // Start background jobs
      this.startBackgroundJobs();

      logger.info('IoT Platform Server initialized successfully');
    } catch (error) {
      logger.error({ error }, 'Failed to initialize server');
      throw error;
    }
  }

  /**
   * Test database connections
   */
  private async testConnections(): Promise<void> {
    logger.info('Testing database connections...');

    // Test Redis
    await this.redis.ping();
    logger.info('Redis connection OK');

    // Test PostgreSQL
    const pgResult = await this.postgres.query('SELECT NOW()');
    logger.info({ time: pgResult.rows[0].now }, 'PostgreSQL connection OK');

    // Test InfluxDB
    const databases = await this.influx.getDatabaseNames();
    if (!databases.includes(CONFIG.influx.database)) {
      await this.influx.createDatabase(CONFIG.influx.database);
      logger.info({ database: CONFIG.influx.database }, 'Created InfluxDB database');
    }
    logger.info('InfluxDB connection OK');
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info({
          method: req.method,
          path: req.path,
          status: res.statusCode,
          duration,
        }, 'HTTP request');
        this.stats.requestCount++;
      });
      next();
    });

    // CORS
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
      }
      next();
    });

    // Error handling
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      logger.error({ err, path: req.path }, 'Request error');
      this.stats.errorCount++;
      res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined,
      });
    });
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    const router = express.Router();

    // Health check
    router.get('/health', async (req, res) => {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: Date.now() - this.stats.startTime,
        services: {
          redis: false,
          postgres: false,
          influx: false,
          mqtt: false,
        },
      };

      try {
        await this.redis.ping();
        health.services.redis = true;
      } catch (e) {
        health.status = 'unhealthy';
      }

      try {
        await this.postgres.query('SELECT 1');
        health.services.postgres = true;
      } catch (e) {
        health.status = 'unhealthy';
      }

      try {
        await this.influx.ping(1000);
        health.services.influx = true;
      } catch (e) {
        health.status = 'unhealthy';
      }

      health.services.mqtt = this.mqttBroker?.isRunning() || false;

      res.status(health.status === 'healthy' ? 200 : 503).json(health);
    });

    // Platform statistics
    router.get('/stats', async (req, res) => {
      const devices = await this.deviceManager.getDeviceCount();
      const activeConnections = this.mqttBroker.getConnectionCount();

      res.json({
        ...this.stats,
        uptime: Date.now() - this.stats.startTime,
        devices: {
          total: devices,
          active: activeConnections,
        },
        telemetry: {
          received: this.stats.telemetryReceived,
          rate: this.telemetryProcessor.getCurrentRate(),
        },
        alerts: {
          triggered: this.stats.alertsTriggered,
        },
      });
    });

    // Device Management Routes
    router.post('/api/devices/register', async (req, res) => {
      try {
        const data = DeviceRegistrationSchema.parse(req.body);
        const device = await this.deviceManager.registerDevice(data);
        res.status(201).json(device);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        logger.error({ error }, 'Device registration failed');
        res.status(500).json({ error: 'Registration failed' });
      }
    });

    router.get('/api/devices', async (req, res) => {
      try {
        const { type, status, limit = '100', offset = '0' } = req.query;
        const devices = await this.deviceManager.listDevices({
          type: type as string,
          status: status as string,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
        });
        res.json(devices);
      } catch (error) {
        logger.error({ error }, 'Failed to list devices');
        res.status(500).json({ error: 'Failed to list devices' });
      }
    });

    router.get('/api/devices/:deviceId', async (req, res) => {
      try {
        const device = await this.deviceManager.getDevice(req.params.deviceId);
        if (!device) {
          return res.status(404).json({ error: 'Device not found' });
        }
        res.json(device);
      } catch (error) {
        logger.error({ error, deviceId: req.params.deviceId }, 'Failed to get device');
        res.status(500).json({ error: 'Failed to get device' });
      }
    });

    router.put('/api/devices/:deviceId', async (req, res) => {
      try {
        const device = await this.deviceManager.updateDevice(
          req.params.deviceId,
          req.body
        );
        if (!device) {
          return res.status(404).json({ error: 'Device not found' });
        }
        res.json(device);
      } catch (error) {
        logger.error({ error, deviceId: req.params.deviceId }, 'Failed to update device');
        res.status(500).json({ error: 'Failed to update device' });
      }
    });

    router.delete('/api/devices/:deviceId', async (req, res) => {
      try {
        await this.deviceManager.deleteDevice(req.params.deviceId);
        res.status(204).send();
      } catch (error) {
        logger.error({ error, deviceId: req.params.deviceId }, 'Failed to delete device');
        res.status(500).json({ error: 'Failed to delete device' });
      }
    });

    router.post('/api/devices/batch', async (req, res) => {
      try {
        const data = BatchOperationSchema.parse(req.body);
        const jobId = await this.deviceManager.batchOperation(data);
        res.status(202).json({ jobId, status: 'pending' });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        logger.error({ error }, 'Batch operation failed');
        res.status(500).json({ error: 'Batch operation failed' });
      }
    });

    // Telemetry Routes
    router.post('/api/devices/:deviceId/telemetry', async (req, res) => {
      try {
        await this.telemetryProcessor.processTelemetry({
          deviceId: req.params.deviceId,
          timestamp: Date.now(),
          metrics: req.body,
        });
        res.status(202).json({ status: 'accepted' });
      } catch (error) {
        logger.error({ error, deviceId: req.params.deviceId }, 'Failed to process telemetry');
        res.status(500).json({ error: 'Failed to process telemetry' });
      }
    });

    router.get('/api/telemetry/:deviceId', async (req, res) => {
      try {
        const query = TelemetryQuerySchema.parse(req.query);
        const data = await this.telemetryProcessor.queryTelemetry(
          req.params.deviceId,
          query
        );
        res.json(data);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        logger.error({ error, deviceId: req.params.deviceId }, 'Failed to query telemetry');
        res.status(500).json({ error: 'Failed to query telemetry' });
      }
    });

    router.get('/api/telemetry/:deviceId/latest', async (req, res) => {
      try {
        const data = await this.telemetryProcessor.getLatestTelemetry(req.params.deviceId);
        if (!data) {
          return res.status(404).json({ error: 'No telemetry data found' });
        }
        res.json(data);
      } catch (error) {
        logger.error({ error, deviceId: req.params.deviceId }, 'Failed to get latest telemetry');
        res.status(500).json({ error: 'Failed to get latest telemetry' });
      }
    });

    // Rules Engine Routes
    router.post('/api/rules', async (req, res) => {
      try {
        const data = RuleCreationSchema.parse(req.body);
        const rule = await this.rulesEngine.createRule(data);
        res.status(201).json(rule);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        logger.error({ error }, 'Failed to create rule');
        res.status(500).json({ error: 'Failed to create rule' });
      }
    });

    router.get('/api/rules', async (req, res) => {
      try {
        const rules = await this.rulesEngine.listRules();
        res.json(rules);
      } catch (error) {
        logger.error({ error }, 'Failed to list rules');
        res.status(500).json({ error: 'Failed to list rules' });
      }
    });

    router.get('/api/rules/:ruleId', async (req, res) => {
      try {
        const rule = await this.rulesEngine.getRule(req.params.ruleId);
        if (!rule) {
          return res.status(404).json({ error: 'Rule not found' });
        }
        res.json(rule);
      } catch (error) {
        logger.error({ error, ruleId: req.params.ruleId }, 'Failed to get rule');
        res.status(500).json({ error: 'Failed to get rule' });
      }
    });

    router.put('/api/rules/:ruleId', async (req, res) => {
      try {
        const rule = await this.rulesEngine.updateRule(req.params.ruleId, req.body);
        if (!rule) {
          return res.status(404).json({ error: 'Rule not found' });
        }
        res.json(rule);
      } catch (error) {
        logger.error({ error, ruleId: req.params.ruleId }, 'Failed to update rule');
        res.status(500).json({ error: 'Failed to update rule' });
      }
    });

    router.delete('/api/rules/:ruleId', async (req, res) => {
      try {
        await this.rulesEngine.deleteRule(req.params.ruleId);
        res.status(204).send();
      } catch (error) {
        logger.error({ error, ruleId: req.params.ruleId }, 'Failed to delete rule');
        res.status(500).json({ error: 'Failed to delete rule' });
      }
    });

    router.get('/api/alerts', async (req, res) => {
      try {
        const { limit = '100', offset = '0', severity, status } = req.query;
        const alerts = await this.rulesEngine.getAlerts({
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          severity: severity as string,
          status: status as string,
        });
        res.json(alerts);
      } catch (error) {
        logger.error({ error }, 'Failed to get alerts');
        res.status(500).json({ error: 'Failed to get alerts' });
      }
    });

    this.app.use('/', router);
  }

  /**
   * Start background jobs
   */
  private startBackgroundJobs(): void {
    // Cleanup old data
    setInterval(async () => {
      try {
        const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 days
        await this.telemetryProcessor.cleanupOldData(cutoff);
        logger.info('Old data cleanup completed');
      } catch (error) {
        logger.error({ error }, 'Data cleanup failed');
      }
    }, 24 * 60 * 60 * 1000); // Daily

    // Update device statistics
    setInterval(async () => {
      try {
        await this.deviceManager.updateDeviceStatistics();
        logger.debug('Device statistics updated');
      } catch (error) {
        logger.error({ error }, 'Statistics update failed');
      }
    }, 5 * 60 * 1000); // Every 5 minutes

    // Broadcast platform stats to dashboard
    setInterval(() => {
      const stats = {
        devices: this.mqttBroker.getConnectionCount(),
        telemetryRate: this.telemetryProcessor.getCurrentRate(),
        alertsCount: this.stats.alertsTriggered,
        timestamp: Date.now(),
      };
      this.dashboard.broadcast('stats', stats);
    }, 1000); // Every second
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    await this.initialize();

    return new Promise((resolve) => {
      this.httpServer.listen(CONFIG.port, CONFIG.host, () => {
        logger.info(
          {
            port: CONFIG.port,
            host: CONFIG.host,
            mqttPort: CONFIG.mqtt.port,
            wsPort: process.env.WS_PORT || '8080',
          },
          'IoT Platform Server started'
        );
        resolve();
      });
    });
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down IoT Platform Server...');

    try {
      // Stop accepting new connections
      this.httpServer.close();

      // Stop MQTT broker
      if (this.mqttBroker) {
        await this.mqttBroker.stop();
      }

      // Stop dashboard
      if (this.dashboard) {
        await this.dashboard.stop();
      }

      // Close database connections
      await this.redis.quit();
      await this.postgres.end();

      logger.info('IoT Platform Server shut down successfully');
    } catch (error) {
      logger.error({ error }, 'Error during shutdown');
      throw error;
    }
  }
}

// Main execution
if (require.main === module) {
  const server = new IoTPlatformServer();

  // Handle graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received');
    await server.shutdown();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('SIGINT received');
    await server.shutdown();
    process.exit(0);
  });

  // Start server
  server.start().catch((error) => {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  });
}

export default IoTPlatformServer;
