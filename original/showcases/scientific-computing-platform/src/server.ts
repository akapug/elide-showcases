/**
 * Scientific Computing Platform Server
 *
 * Production-ready HTTP/WebSocket server providing comprehensive scientific computing
 * capabilities through Python's scientific stack (NumPy, SciPy, Matplotlib, Pandas).
 *
 * Features:
 * - RESTful API for scientific operations
 * - WebSocket support for real-time data streaming
 * - Job queue for long-running computations
 * - Result caching and memoization
 * - Performance monitoring and metrics
 * - Rate limiting and authentication
 * - Comprehensive error handling
 */

import { createServer, IncomingMessage, ServerResponse } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { URL } from 'url';
import { LinearAlgebra } from './compute/linear-algebra';
import { Statistics } from './compute/statistics';
import { SignalProcessing } from './compute/signal-processing';
import { Optimization } from './compute/optimization';
import { Plotter } from './visualization/plotter';

// Type definitions
interface ServerConfig {
  port: number;
  host: string;
  enableCors: boolean;
  maxPayloadSize: number;
  enableCompression: boolean;
  cacheEnabled: boolean;
  cacheTTL: number;
  rateLimitWindow: number;
  rateLimitMax: number;
  enableMetrics: boolean;
  enableAuth: boolean;
  jwtSecret?: string;
}

interface ComputeJob {
  id: string;
  type: string;
  params: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  priority: number;
}

interface CacheEntry {
  key: string;
  value: any;
  timestamp: number;
  hits: number;
  size: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface Metrics {
  requestCount: number;
  errorCount: number;
  totalResponseTime: number;
  cacheHits: number;
  cacheMisses: number;
  activeJobs: number;
  completedJobs: number;
  failedJobs: number;
}

/**
 * Main Scientific Computing Server
 */
export class ScientificComputingServer {
  private config: ServerConfig;
  private httpServer: any;
  private wsServer: WebSocketServer;
  private linearAlgebra: LinearAlgebra;
  private statistics: Statistics;
  private signalProcessing: SignalProcessing;
  private optimization: Optimization;
  private plotter: Plotter;
  private jobQueue: ComputeJob[];
  private jobMap: Map<string, ComputeJob>;
  private cache: Map<string, CacheEntry>;
  private rateLimits: Map<string, RateLimitEntry>;
  private metrics: Metrics;
  private wsClients: Set<WebSocket>;

  constructor(config: Partial<ServerConfig> = {}) {
    this.config = {
      port: config.port || 8080,
      host: config.host || '0.0.0.0',
      enableCors: config.enableCors !== false,
      maxPayloadSize: config.maxPayloadSize || 10 * 1024 * 1024, // 10MB
      enableCompression: config.enableCompression !== false,
      cacheEnabled: config.cacheEnabled !== false,
      cacheTTL: config.cacheTTL || 3600000, // 1 hour
      rateLimitWindow: config.rateLimitWindow || 60000, // 1 minute
      rateLimitMax: config.rateLimitMax || 100,
      enableMetrics: config.enableMetrics !== false,
      enableAuth: config.enableAuth || false,
      jwtSecret: config.jwtSecret
    };

    // Initialize compute modules
    this.linearAlgebra = new LinearAlgebra();
    this.statistics = new Statistics();
    this.signalProcessing = new SignalProcessing();
    this.optimization = new Optimization();
    this.plotter = new Plotter();

    // Initialize job management
    this.jobQueue = [];
    this.jobMap = new Map();

    // Initialize cache
    this.cache = new Map();

    // Initialize rate limiting
    this.rateLimits = new Map();

    // Initialize metrics
    this.metrics = {
      requestCount: 0,
      errorCount: 0,
      totalResponseTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
      activeJobs: 0,
      completedJobs: 0,
      failedJobs: 0
    };

    // Initialize WebSocket clients set
    this.wsClients = new Set();

    // Start cache cleanup interval
    if (this.config.cacheEnabled) {
      setInterval(() => this.cleanupCache(), 60000); // Every minute
    }

    // Start job processor
    setInterval(() => this.processJobs(), 100); // Every 100ms
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    return new Promise((resolve) => {
      // Create HTTP server
      this.httpServer = createServer((req, res) => {
        this.handleRequest(req, res).catch(err => {
          console.error('Request handler error:', err);
          this.sendError(res, 500, 'Internal server error');
        });
      });

      // Create WebSocket server
      this.wsServer = new WebSocketServer({ server: this.httpServer });
      this.wsServer.on('connection', (ws) => this.handleWebSocketConnection(ws));

      // Start listening
      this.httpServer.listen(this.config.port, this.config.host, () => {
        console.log(`Scientific Computing Server running at http://${this.config.host}:${this.config.port}`);
        resolve();
      });
    });
  }

  /**
   * Stop the server
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      // Close WebSocket connections
      this.wsClients.forEach(ws => ws.close());
      this.wsServer.close();

      // Close HTTP server
      this.httpServer.close(() => {
        console.log('Server stopped');
        resolve();
      });
    });
  }

  /**
   * Handle incoming HTTP requests
   */
  private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const startTime = Date.now();
    this.metrics.requestCount++;

    try {
      // Apply CORS headers
      if (this.config.enableCors) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      }

      // Handle OPTIONS for CORS preflight
      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      // Parse URL
      const url = new URL(req.url!, `http://${req.headers.host}`);
      const path = url.pathname;

      // Check rate limiting
      const clientId = this.getClientId(req);
      if (!this.checkRateLimit(clientId)) {
        this.sendError(res, 429, 'Too many requests');
        return;
      }

      // Authentication check
      if (this.config.enableAuth && !path.startsWith('/public')) {
        const authorized = await this.checkAuth(req);
        if (!authorized) {
          this.sendError(res, 401, 'Unauthorized');
          return;
        }
      }

      // Route request
      if (req.method === 'GET') {
        await this.handleGet(path, url, res);
      } else if (req.method === 'POST') {
        const body = await this.parseBody(req);
        await this.handlePost(path, body, res);
      } else if (req.method === 'PUT') {
        const body = await this.parseBody(req);
        await this.handlePut(path, body, res);
      } else if (req.method === 'DELETE') {
        await this.handleDelete(path, res);
      } else {
        this.sendError(res, 405, 'Method not allowed');
      }

      // Update metrics
      const responseTime = Date.now() - startTime;
      this.metrics.totalResponseTime += responseTime;

    } catch (error) {
      console.error('Request error:', error);
      this.metrics.errorCount++;
      this.sendError(res, 500, error instanceof Error ? error.message : 'Internal server error');
    }
  }

  /**
   * Handle GET requests
   */
  private async handleGet(path: string, url: URL, res: ServerResponse): Promise<void> {
    if (path === '/health') {
      this.sendJson(res, { status: 'healthy', uptime: process.uptime() });
    } else if (path === '/metrics') {
      this.sendJson(res, this.getMetrics());
    } else if (path === '/jobs') {
      const jobs = Array.from(this.jobMap.values()).map(job => ({
        id: job.id,
        type: job.type,
        status: job.status,
        createdAt: job.createdAt
      }));
      this.sendJson(res, { jobs });
    } else if (path.startsWith('/jobs/')) {
      const jobId = path.split('/')[2];
      const job = this.jobMap.get(jobId);
      if (job) {
        this.sendJson(res, job);
      } else {
        this.sendError(res, 404, 'Job not found');
      }
    } else if (path === '/cache/stats') {
      this.sendJson(res, this.getCacheStats());
    } else {
      this.sendError(res, 404, 'Not found');
    }
  }

  /**
   * Handle POST requests
   */
  private async handlePost(path: string, body: any, res: ServerResponse): Promise<void> {
    // Linear Algebra endpoints
    if (path === '/api/linalg/matmul') {
      await this.executeCached('matmul', body, async () => {
        const result = this.linearAlgebra.matmul(body.A, body.B);
        return { result };
      }, res);
    } else if (path === '/api/linalg/eig') {
      await this.executeCached('eig', body, async () => {
        const result = this.linearAlgebra.eig(body.matrix);
        return result;
      }, res);
    } else if (path === '/api/linalg/svd') {
      await this.executeCached('svd', body, async () => {
        const result = this.linearAlgebra.svd(body.matrix, body.full);
        return result;
      }, res);
    } else if (path === '/api/linalg/solve') {
      await this.executeCached('solve', body, async () => {
        const result = this.linearAlgebra.solve(body.A, body.b);
        return { result };
      }, res);
    }

    // Statistics endpoints
    else if (path === '/api/stats/describe') {
      await this.executeCached('describe', body, async () => {
        const result = this.statistics.describe(body.data);
        return result;
      }, res);
    } else if (path === '/api/stats/ttest') {
      await this.executeCached('ttest', body, async () => {
        const result = this.statistics.ttest(body.a, body.b, body.alternative);
        return result;
      }, res);
    } else if (path === '/api/stats/correlation') {
      await this.executeCached('correlation', body, async () => {
        const result = this.statistics.correlationMatrix(body.data);
        return { correlation: result };
      }, res);
    } else if (path === '/api/stats/regression') {
      await this.executeCached('regression', body, async () => {
        const result = this.statistics.linregress(body.x, body.y);
        return result;
      }, res);
    }

    // Signal Processing endpoints
    else if (path === '/api/signal/fft') {
      await this.executeCached('fft', body, async () => {
        const result = this.signalProcessing.fft(body.signal);
        return { result };
      }, res);
    } else if (path === '/api/signal/filter') {
      await this.executeCached('filter', body, async () => {
        const result = this.signalProcessing.butterFilter(body.signal, body.params);
        return { result };
      }, res);
    } else if (path === '/api/signal/welch') {
      await this.executeCached('welch', body, async () => {
        const result = this.signalProcessing.welch(body.signal, body.sampleRate, body.params);
        return result;
      }, res);
    } else if (path === '/api/signal/spectrogram') {
      await this.executeCached('spectrogram', body, async () => {
        const result = this.signalProcessing.spectrogram(body.signal, body.sampleRate, body.params);
        return result;
      }, res);
    }

    // Optimization endpoints
    else if (path === '/api/optimize/minimize') {
      await this.executeAsync('minimize', body, async () => {
        const result = this.optimization.minimize(
          body.objective,
          body.x0,
          body.method,
          body.options
        );
        return result;
      }, res);
    } else if (path === '/api/optimize/curvefit') {
      await this.executeCached('curvefit', body, async () => {
        const result = this.optimization.curveFit(
          body.func,
          body.xdata,
          body.ydata,
          body.p0
        );
        return result;
      }, res);
    } else if (path === '/api/optimize/root') {
      await this.executeAsync('root', body, async () => {
        const result = this.optimization.root(body.func, body.x0, body.method);
        return result;
      }, res);
    }

    // Visualization endpoints
    else if (path === '/api/plot/create') {
      const plotId = await this.plotter.create(body.type, body.data, body.options);
      this.sendJson(res, { plotId });
    } else if (path === '/api/plot/update') {
      await this.plotter.update(body.plotId, body.data);
      this.sendJson(res, { success: true });
    }

    // Batch operations
    else if (path === '/api/batch') {
      await this.executeBatch(body.operations, res);
    }

    // Job submission
    else if (path === '/api/jobs/submit') {
      const job = this.createJob(body.type, body.params, body.priority);
      this.sendJson(res, { jobId: job.id });
    }

    else {
      this.sendError(res, 404, 'Endpoint not found');
    }
  }

  /**
   * Handle PUT requests
   */
  private async handlePut(path: string, body: any, res: ServerResponse): Promise<void> {
    if (path.startsWith('/api/jobs/')) {
      const jobId = path.split('/')[3];
      const action = path.split('/')[4];

      const job = this.jobMap.get(jobId);
      if (!job) {
        this.sendError(res, 404, 'Job not found');
        return;
      }

      if (action === 'cancel') {
        job.status = 'failed';
        job.error = 'Cancelled by user';
        this.sendJson(res, { success: true });
      } else if (action === 'priority') {
        job.priority = body.priority;
        this.sortJobQueue();
        this.sendJson(res, { success: true });
      } else {
        this.sendError(res, 400, 'Invalid action');
      }
    } else {
      this.sendError(res, 404, 'Endpoint not found');
    }
  }

  /**
   * Handle DELETE requests
   */
  private async handleDelete(path: string, res: ServerResponse): Promise<void> {
    if (path === '/api/cache/clear') {
      this.cache.clear();
      this.sendJson(res, { success: true });
    } else if (path.startsWith('/api/jobs/')) {
      const jobId = path.split('/')[3];
      const deleted = this.jobMap.delete(jobId);
      if (deleted) {
        this.jobQueue = this.jobQueue.filter(j => j.id !== jobId);
        this.sendJson(res, { success: true });
      } else {
        this.sendError(res, 404, 'Job not found');
      }
    } else {
      this.sendError(res, 404, 'Endpoint not found');
    }
  }

  /**
   * Execute operation with caching
   */
  private async executeCached(
    operation: string,
    params: any,
    executor: () => Promise<any>,
    res: ServerResponse
  ): Promise<void> {
    if (this.config.cacheEnabled) {
      const cacheKey = this.generateCacheKey(operation, params);
      const cached = this.cache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < this.config.cacheTTL) {
        cached.hits++;
        this.metrics.cacheHits++;
        this.sendJson(res, { ...cached.value, cached: true });
        return;
      }

      this.metrics.cacheMisses++;
    }

    const result = await executor();

    if (this.config.cacheEnabled) {
      const cacheKey = this.generateCacheKey(operation, params);
      this.cache.set(cacheKey, {
        key: cacheKey,
        value: result,
        timestamp: Date.now(),
        hits: 0,
        size: JSON.stringify(result).length
      });
    }

    this.sendJson(res, result);
  }

  /**
   * Execute operation asynchronously via job queue
   */
  private async executeAsync(
    operation: string,
    params: any,
    executor: () => Promise<any>,
    res: ServerResponse
  ): Promise<void> {
    const job = this.createJob(operation, { executor, params });
    this.sendJson(res, { jobId: job.id, status: 'pending' });
  }

  /**
   * Execute batch operations
   */
  private async executeBatch(operations: any[], res: ServerResponse): Promise<void> {
    const results = await Promise.all(
      operations.map(async (op) => {
        try {
          const result = await this.executeOperation(op);
          return { success: true, result };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    this.sendJson(res, { results });
  }

  /**
   * Execute a single operation
   */
  private async executeOperation(op: any): Promise<any> {
    const { type, params } = op;

    if (type.startsWith('linalg.')) {
      const method = type.split('.')[1];
      return (this.linearAlgebra as any)[method](...Object.values(params));
    } else if (type.startsWith('stats.')) {
      const method = type.split('.')[1];
      return (this.statistics as any)[method](...Object.values(params));
    } else if (type.startsWith('signal.')) {
      const method = type.split('.')[1];
      return (this.signalProcessing as any)[method](...Object.values(params));
    } else if (type.startsWith('optimize.')) {
      const method = type.split('.')[1];
      return (this.optimization as any)[method](...Object.values(params));
    } else {
      throw new Error(`Unknown operation type: ${type}`);
    }
  }

  /**
   * Create a new job
   */
  private createJob(type: string, params: any, priority: number = 0): ComputeJob {
    const job: ComputeJob = {
      id: this.generateJobId(),
      type,
      params,
      status: 'pending',
      createdAt: Date.now(),
      priority
    };

    this.jobMap.set(job.id, job);
    this.jobQueue.push(job);
    this.sortJobQueue();
    this.metrics.activeJobs++;

    return job;
  }

  /**
   * Process jobs from the queue
   */
  private async processJobs(): Promise<void> {
    const runningJobs = this.jobQueue.filter(j => j.status === 'running').length;
    const maxConcurrent = 4; // Process up to 4 jobs concurrently

    if (runningJobs >= maxConcurrent) {
      return;
    }

    const pendingJobs = this.jobQueue.filter(j => j.status === 'pending');
    const jobsToProcess = pendingJobs.slice(0, maxConcurrent - runningJobs);

    for (const job of jobsToProcess) {
      this.processJob(job).catch(err => {
        console.error(`Job ${job.id} failed:`, err);
      });
    }
  }

  /**
   * Process a single job
   */
  private async processJob(job: ComputeJob): Promise<void> {
    job.status = 'running';
    job.startedAt = Date.now();

    try {
      const result = await this.executeOperation(job);
      job.result = result;
      job.status = 'completed';
      job.completedAt = Date.now();
      this.metrics.completedJobs++;
      this.metrics.activeJobs--;

      // Notify WebSocket clients
      this.broadcastJobUpdate(job);

    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      job.completedAt = Date.now();
      this.metrics.failedJobs++;
      this.metrics.activeJobs--;

      // Notify WebSocket clients
      this.broadcastJobUpdate(job);
    }
  }

  /**
   * Handle WebSocket connections
   */
  private handleWebSocketConnection(ws: WebSocket): void {
    this.wsClients.add(ws);

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleWebSocketMessage(ws, message);
      } catch (error) {
        ws.send(JSON.stringify({ error: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      this.wsClients.delete(ws);
    });

    // Send welcome message
    ws.send(JSON.stringify({ type: 'connected', timestamp: Date.now() }));
  }

  /**
   * Handle WebSocket messages
   */
  private async handleWebSocketMessage(ws: WebSocket, message: any): Promise<void> {
    const { type, data } = message;

    if (type === 'subscribe') {
      // Subscribe to job updates
      ws.send(JSON.stringify({ type: 'subscribed', topic: data.topic }));
    } else if (type === 'compute') {
      // Execute computation and stream results
      try {
        const result = await this.executeOperation(data);
        ws.send(JSON.stringify({ type: 'result', data: result }));
      } catch (error) {
        ws.send(JSON.stringify({
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }));
      }
    } else if (type === 'stream') {
      // Stream data processing
      this.handleStreamData(ws, data);
    }
  }

  /**
   * Handle streaming data
   */
  private handleStreamData(ws: WebSocket, data: any): void {
    // Process streaming data chunk
    const { signal, operation } = data;

    if (operation === 'fft') {
      const result = this.signalProcessing.fft(signal);
      ws.send(JSON.stringify({ type: 'stream_result', data: result }));
    } else if (operation === 'filter') {
      const result = this.signalProcessing.butterFilter(signal, data.params);
      ws.send(JSON.stringify({ type: 'stream_result', data: result }));
    }
  }

  /**
   * Broadcast job update to all WebSocket clients
   */
  private broadcastJobUpdate(job: ComputeJob): void {
    const message = JSON.stringify({
      type: 'job_update',
      job: {
        id: job.id,
        status: job.status,
        result: job.result,
        error: job.error
      }
    });

    this.wsClients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }

  /**
   * Parse request body
   */
  private async parseBody(req: IncomingMessage): Promise<any> {
    return new Promise((resolve, reject) => {
      let body = '';
      let size = 0;

      req.on('data', (chunk) => {
        size += chunk.length;
        if (size > this.config.maxPayloadSize) {
          reject(new Error('Payload too large'));
          return;
        }
        body += chunk.toString();
      });

      req.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve(parsed);
        } catch (error) {
          reject(new Error('Invalid JSON'));
        }
      });

      req.on('error', reject);
    });
  }

  /**
   * Send JSON response
   */
  private sendJson(res: ServerResponse, data: any, statusCode: number = 200): void {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  }

  /**
   * Send error response
   */
  private sendError(res: ServerResponse, statusCode: number, message: string): void {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: message }));
  }

  /**
   * Get client identifier for rate limiting
   */
  private getClientId(req: IncomingMessage): string {
    return req.socket.remoteAddress || 'unknown';
  }

  /**
   * Check rate limit
   */
  private checkRateLimit(clientId: string): boolean {
    const now = Date.now();
    const entry = this.rateLimits.get(clientId);

    if (!entry || now > entry.resetTime) {
      this.rateLimits.set(clientId, {
        count: 1,
        resetTime: now + this.config.rateLimitWindow
      });
      return true;
    }

    if (entry.count >= this.config.rateLimitMax) {
      return false;
    }

    entry.count++;
    return true;
  }

  /**
   * Check authentication
   */
  private async checkAuth(req: IncomingMessage): Promise<boolean> {
    // Simple token-based auth (extend for JWT, OAuth, etc.)
    const authHeader = req.headers.authorization;
    if (!authHeader) return false;

    const token = authHeader.split(' ')[1];
    // Validate token (simplified)
    return token === this.config.jwtSecret;
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(operation: string, params: any): string {
    return `${operation}:${JSON.stringify(params)}`;
  }

  /**
   * Generate job ID
   */
  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sort job queue by priority
   */
  private sortJobQueue(): void {
    this.jobQueue.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Cleanup expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    const expired: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > this.config.cacheTTL) {
        expired.push(key);
      }
    });

    expired.forEach(key => this.cache.delete(key));

    if (expired.length > 0) {
      console.log(`Cleaned up ${expired.length} expired cache entries`);
    }
  }

  /**
   * Get cache statistics
   */
  private getCacheStats(): any {
    let totalSize = 0;
    let totalHits = 0;

    this.cache.forEach(entry => {
      totalSize += entry.size;
      totalHits += entry.hits;
    });

    return {
      entries: this.cache.size,
      totalSize,
      totalHits,
      hitRate: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses),
      avgHitsPerEntry: totalHits / this.cache.size || 0
    };
  }

  /**
   * Get server metrics
   */
  private getMetrics(): any {
    return {
      ...this.metrics,
      avgResponseTime: this.metrics.totalResponseTime / this.metrics.requestCount || 0,
      errorRate: this.metrics.errorCount / this.metrics.requestCount || 0,
      cacheHitRate: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) || 0,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      activeConnections: this.wsClients.size
    };
  }
}

/**
 * CLI entry point
 */
export async function main(): Promise<void> {
  const config: Partial<ServerConfig> = {
    port: parseInt(process.env.PORT || '8080'),
    host: process.env.HOST || '0.0.0.0',
    enableCors: process.env.ENABLE_CORS !== 'false',
    enableAuth: process.env.ENABLE_AUTH === 'true',
    jwtSecret: process.env.JWT_SECRET,
    cacheEnabled: process.env.CACHE_ENABLED !== 'false',
    cacheTTL: parseInt(process.env.CACHE_TTL || '3600000'),
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100')
  };

  const server = new ScientificComputingServer(config);

  // Handle shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down server...');
    await server.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\nShutting down server...');
    await server.stop();
    process.exit(0);
  });

  // Start server
  await server.start();
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
