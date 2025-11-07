/**
 * Edge Compute Platform - Main entry point
 *
 * Integrates all components into a unified platform.
 */

import { EventEmitter } from 'events';
import FunctionManager from './control-plane/function-manager';
import DeploymentService from './control-plane/deployment-service';
import FunctionExecutor from './runtime/executor';
import RuntimePool from './runtime/pool';
import EdgeRouter from './router/edge-router';
import LoadBalancer from './router/load-balancer';
import GeolocationService from './router/geolocation';
import KVStore from './storage/kv-store';
import Cache from './storage/cache';
import MetricsService from './monitoring/metrics';
import Logger from './monitoring/logger';
import Tracer from './monitoring/tracer';

export interface PlatformConfig {
  storageDir?: string;
  dataDir?: string;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  enableMetrics?: boolean;
  enableTracing?: boolean;
  enableCaching?: boolean;
  poolConfig?: {
    minSize?: number;
    maxSize?: number;
  };
}

export interface InvokeRequest {
  path: string;
  method: string;
  headers?: Record<string, string>;
  query?: Record<string, string>;
  body?: any;
  ip?: string;
}

export interface InvokeResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: any;
  cached?: boolean;
  executionTime?: number;
}

export class EdgeComputePlatform extends EventEmitter {
  private config: PlatformConfig;

  // Core components
  private functionManager: FunctionManager;
  private deploymentService: DeploymentService;
  private runtimePool: RuntimePool;
  private router: EdgeRouter;
  private loadBalancer: LoadBalancer;
  private geoService: GeolocationService;

  // Storage
  private kvStore: KVStore;
  private cache: Cache;

  // Monitoring
  private metrics: MetricsService;
  private logger: Logger;
  private tracer: Tracer;

  private initialized: boolean;

  constructor(config: PlatformConfig = {}) {
    super();

    this.config = {
      storageDir: config.storageDir || './functions',
      dataDir: config.dataDir || './data',
      logLevel: config.logLevel || 'info',
      enableMetrics: config.enableMetrics !== false,
      enableTracing: config.enableTracing !== false,
      enableCaching: config.enableCaching !== false,
      poolConfig: config.poolConfig || { minSize: 2, maxSize: 10 },
    };

    this.initialized = false;

    // Initialize monitoring
    this.logger = new Logger({
      level: this.config.logLevel,
      console: true,
      file: true,
    });

    this.metrics = new MetricsService();
    this.tracer = new Tracer();

    // Initialize storage
    this.kvStore = new KVStore({
      persistent: true,
      dataDir: `${this.config.dataDir}/kv`,
    });

    this.cache = new Cache({
      maxSize: 1000,
      defaultTTL: 300,
    });

    // Initialize control plane
    this.functionManager = new FunctionManager(this.config.storageDir);
    this.deploymentService = new DeploymentService(this.functionManager);

    // Initialize runtime
    this.runtimePool = new RuntimePool(
      this.config.storageDir,
      this.config.poolConfig
    );

    // Initialize router
    this.router = new EdgeRouter(this.functionManager);
    this.loadBalancer = new LoadBalancer({
      strategy: 'round-robin',
    });
    this.geoService = new GeolocationService();

    this.setupEventHandlers();
    this.logger.info('Edge Compute Platform initialized');
  }

  /**
   * Initialize the platform
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.logger.info('Starting Edge Compute Platform...');

    // Initialize components
    await this.initializeComponents();

    // Set up default routes
    await this.setupDefaultRoutes();

    this.initialized = true;
    this.logger.info('Edge Compute Platform started successfully');
    this.emit('ready');
  }

  /**
   * Deploy a function
   */
  async deploy(request: {
    name: string;
    code: string;
    runtime: 'typescript' | 'python' | 'ruby';
    routes?: string[];
    env?: Record<string, string>;
    memory?: number;
    timeout?: number;
  }): Promise<any> {
    const span = this.tracer.startTrace('deploy', {
      functionName: request.name,
    });

    try {
      this.logger.info(`Deploying function: ${request.name}`, {
        runtime: request.runtime,
      });

      const result = await this.deploymentService.deploy(request);

      // Register routes
      if (request.routes) {
        for (const route of request.routes) {
          this.router.addRoute({
            path: route,
            functionId: result.functionId,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
          });
        }
      }

      this.metrics.increment('deployments.success');
      this.logger.info(`Function deployed successfully: ${request.name}`, {
        functionId: result.functionId,
        version: result.version,
      });

      this.tracer.finishSpan(span);

      return result;
    } catch (error) {
      this.metrics.increment('deployments.failed');
      this.logger.error(`Deployment failed: ${request.name}`, error as Error);
      this.tracer.finishSpan(span, error as Error);
      throw error;
    }
  }

  /**
   * Invoke a function via HTTP request
   */
  async invoke(request: InvokeRequest): Promise<InvokeResponse> {
    const startTime = Date.now();
    const span = this.tracer.startTrace('invoke', {
      path: request.path,
      method: request.method,
    });

    try {
      // Match route
      const match = this.router.match({
        path: request.path,
        method: request.method,
        headers: request.headers || {},
        query: request.query || {},
        ip: request.ip,
      });

      if (!match) {
        this.metrics.increment('requests.not_found');
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'application/json' },
          body: { error: 'Not Found' },
          executionTime: Date.now() - startTime,
        };
      }

      // Check cache
      if (this.config.enableCaching && request.method === 'GET') {
        const cacheKey = `${request.path}${JSON.stringify(request.query || {})}`;
        const cached = this.cache.get(cacheKey);

        if (cached) {
          this.metrics.increment('cache.hits');
          this.logger.debug(`Cache hit: ${cacheKey}`);

          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: cached,
            cached: true,
            executionTime: Date.now() - startTime,
          };
        }

        this.metrics.increment('cache.misses');
      }

      // Execute function
      const executeSpan = this.tracer.startSpan('execute', span);

      const result = await this.runtimePool.execute({
        functionId: match.function.id,
        version: match.function.version,
        event: {
          path: request.path,
          method: request.method,
          headers: request.headers,
          query: request.query,
          params: match.params,
          body: request.body,
        },
        context: {
          requestId: span.spanId,
          functionName: match.function.name,
        },
      });

      this.tracer.finishSpan(executeSpan);

      // Cache result if successful and GET request
      if (
        this.config.enableCaching &&
        request.method === 'GET' &&
        result.success
      ) {
        const cacheKey = `${request.path}${JSON.stringify(request.query || {})}`;
        this.cache.set(cacheKey, result.result, { ttl: 300 });
      }

      // Record metrics
      const duration = Date.now() - startTime;
      this.metrics.increment('requests.total');
      this.metrics.increment(result.success ? 'requests.success' : 'requests.error');
      this.metrics.timing('request.duration', duration);

      // Log request
      this.logger.logRequest(
        request.method,
        request.path,
        result.success ? 200 : 500,
        duration,
        {
          functionId: match.function.id,
          functionName: match.function.name,
        }
      );

      this.tracer.finishSpan(span);

      return {
        statusCode: result.success ? 200 : 500,
        headers: { 'Content-Type': 'application/json' },
        body: result.success ? result.result : { error: result.error },
        executionTime: duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.metrics.increment('requests.error');
      this.logger.error('Request failed', error as Error, {
        path: request.path,
        method: request.method,
      });

      this.tracer.finishSpan(span, error as Error);

      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: { error: 'Internal Server Error' },
        executionTime: duration,
      };
    }
  }

  /**
   * Get platform status
   */
  getStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number;
    components: Record<string, any>;
  } {
    const uptime = Date.now() - this.metrics['startTime']?.getTime() || 0;

    return {
      status: 'healthy',
      uptime,
      components: {
        functions: this.functionManager.getStats(),
        runtime: this.runtimePool.getStats(),
        router: this.router.getStats(),
        cache: this.cache.getStats(),
        kv: this.kvStore.getStats(),
        metrics: this.metrics.getSummary(),
        tracer: this.tracer.getStats(),
      },
    };
  }

  /**
   * Get KV store
   */
  getKV(): KVStore {
    return this.kvStore;
  }

  /**
   * Get cache
   */
  getCache(): Cache {
    return this.cache;
  }

  /**
   * Get metrics
   */
  getMetrics(): MetricsService {
    return this.metrics;
  }

  /**
   * Get logger
   */
  getLogger(): Logger {
    return this.logger;
  }

  /**
   * Get tracer
   */
  getTracer(): Tracer {
    return this.tracer;
  }

  /**
   * Shutdown the platform
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down Edge Compute Platform...');

    await this.runtimePool.shutdown();
    await this.kvStore.shutdown();
    await this.logger.flush();

    this.logger.info('Edge Compute Platform shut down successfully');
    this.emit('shutdown');
  }

  // Private methods

  private async initializeComponents(): Promise<void> {
    // No async initialization needed for now
  }

  private async setupDefaultRoutes(): Promise<void> {
    // Set up health check route
    // In a real implementation, this would be a special system function
  }

  private setupEventHandlers(): void {
    // Deployment events
    this.deploymentService.on('deployment:completed', (result) => {
      this.emit('deployment:completed', result);
    });

    this.deploymentService.on('deployment:failed', (result) => {
      this.emit('deployment:failed', result);
    });

    // Router events
    this.router.on('route:added', (route) => {
      this.logger.info('Route added', { path: route.path });
    });

    // Metrics events
    if (this.config.enableMetrics) {
      this.metrics.on('metric', (metric) => {
        this.emit('metric', metric);
      });
    }

    // Tracer events
    if (this.config.enableTracing) {
      this.tracer.on('trace:finish', (trace) => {
        this.emit('trace:finish', trace);
      });
    }
  }
}

export default EdgeComputePlatform;
