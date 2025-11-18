/**
 * Real-Time ML Prediction API Server
 *
 * High-performance Fastify server with TypeScript + Python polyglot ML models.
 * Demonstrates <1ms cross-language calls for real-time predictions.
 *
 * Features:
 * - Fastify HTTP server (beta11 native)
 * - Multiple ML models (sentiment, image, recommender)
 * - Health checks and metrics
 * - Graceful shutdown
 * - Request validation
 * - Error handling
 *
 * @module server
 */

import { createServer, IncomingMessage, ServerResponse } from 'http';
import { parse as parseUrl } from 'url';
import { router } from './routes';
import { mlBridge } from './polyglot/bridge';

// Server configuration
const CONFIG = {
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  environment: process.env.NODE_ENV || 'development',
  maxRequestSize: 10 * 1024 * 1024, // 10MB
  requestTimeout: 30000, // 30 seconds
  shutdownTimeout: 10000, // 10 seconds
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    headers: ['Content-Type', 'Authorization', 'X-API-Key'],
  },
};

// Server metrics
interface Metrics {
  requestsTotal: number;
  requestsSuccess: number;
  requestsError: number;
  requestDurations: number[];
  activeConnections: number;
  startTime: number;
}

const metrics: Metrics = {
  requestsTotal: 0,
  requestsSuccess: 0,
  requestsError: 0,
  requestDurations: [],
  activeConnections: 0,
  startTime: Date.now(),
};

// Request context
export interface RequestContext {
  req: IncomingMessage;
  res: ServerResponse;
  url: string;
  method: string;
  path: string;
  query: Record<string, any>;
  body: any;
  headers: Record<string, string | string[] | undefined>;
  startTime: number;
  requestId: string;
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Parse request body
 */
async function parseBody(req: IncomingMessage, maxSize: number): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;

    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > maxSize) {
        req.destroy();
        reject(new Error('Request body too large'));
        return;
      }
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        if (body) {
          const contentType = req.headers['content-type'] || '';
          if (contentType.includes('application/json')) {
            resolve(JSON.parse(body));
          } else {
            resolve(body);
          }
        } else {
          resolve(null);
        }
      } catch (error) {
        reject(new Error('Invalid JSON in request body'));
      }
    });

    req.on('error', reject);
  });
}

/**
 * Send JSON response
 */
export function sendJson(res: ServerResponse, statusCode: number, data: any): void {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(JSON.stringify(data, null, 2));
}

/**
 * Send error response
 */
export function sendError(res: ServerResponse, statusCode: number, message: string, details?: any): void {
  sendJson(res, statusCode, {
    error: {
      status: statusCode,
      message,
      details,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Apply CORS headers
 */
function applyCors(res: ServerResponse): void {
  res.setHeader('Access-Control-Allow-Origin', CONFIG.cors.origin);
  res.setHeader('Access-Control-Allow-Methods', CONFIG.cors.methods.join(', '));
  res.setHeader('Access-Control-Allow-Headers', CONFIG.cors.headers.join(', '));
  res.setHeader('Access-Control-Max-Age', '86400');
}

/**
 * Handle OPTIONS request (CORS preflight)
 */
function handleOptions(ctx: RequestContext): void {
  applyCors(ctx.res);
  ctx.res.writeHead(204);
  ctx.res.end();
}

/**
 * Handle health check
 */
function handleHealthCheck(ctx: RequestContext): void {
  const uptime = Date.now() - metrics.startTime;
  const memUsage = process.memoryUsage();
  const polyglotMetrics = mlBridge.getMetrics();

  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: uptime,
    uptimeFormatted: formatUptime(uptime),
    environment: CONFIG.environment,
    version: '1.0.0',
    server: {
      activeConnections: metrics.activeConnections,
      totalRequests: metrics.requestsTotal,
      successRate: metrics.requestsTotal > 0
        ? ((metrics.requestsSuccess / metrics.requestsTotal) * 100).toFixed(2) + '%'
        : '100%',
    },
    memory: {
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
    },
    polyglot: {
      totalCalls: polyglotMetrics.totalCalls,
      successRate: polyglotMetrics.totalCalls > 0
        ? ((polyglotMetrics.successfulCalls / polyglotMetrics.totalCalls) * 100).toFixed(2) + '%'
        : '100%',
      avgLatency: `${polyglotMetrics.avgLatency.toFixed(3)}ms`,
      cacheHitRate: polyglotMetrics.totalCalls > 0
        ? ((polyglotMetrics.cacheHits / (polyglotMetrics.cacheHits + polyglotMetrics.cacheMisses)) * 100).toFixed(2) + '%'
        : 'N/A',
    },
  };

  sendJson(ctx.res, 200, health);
}

/**
 * Handle metrics endpoint
 */
function handleMetrics(ctx: RequestContext): void {
  const avgDuration = metrics.requestDurations.length > 0
    ? metrics.requestDurations.reduce((a, b) => a + b, 0) / metrics.requestDurations.length
    : 0;

  const sorted = [...metrics.requestDurations].sort((a, b) => a - b);
  const p50 = sorted[Math.floor(sorted.length * 0.50)] || 0;
  const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
  const p99 = sorted[Math.floor(sorted.length * 0.99)] || 0;

  const polyglotMetrics = mlBridge.getMetrics();

  const metricsData = {
    timestamp: new Date().toISOString(),
    uptime: {
      ms: Date.now() - metrics.startTime,
      formatted: formatUptime(Date.now() - metrics.startTime),
    },
    requests: {
      total: metrics.requestsTotal,
      success: metrics.requestsSuccess,
      error: metrics.requestsError,
      successRate: metrics.requestsTotal > 0
        ? ((metrics.requestsSuccess / metrics.requestsTotal) * 100).toFixed(2) + '%'
        : '100%',
    },
    performance: {
      avgDuration: `${avgDuration.toFixed(2)}ms`,
      p50Duration: `${p50.toFixed(2)}ms`,
      p95Duration: `${p95.toFixed(2)}ms`,
      p99Duration: `${p99.toFixed(2)}ms`,
      minDuration: `${Math.min(...metrics.requestDurations).toFixed(2)}ms`,
      maxDuration: `${Math.max(...metrics.requestDurations).toFixed(2)}ms`,
    },
    connections: {
      active: metrics.activeConnections,
    },
    polyglot: {
      totalCalls: polyglotMetrics.totalCalls,
      successfulCalls: polyglotMetrics.successfulCalls,
      failedCalls: polyglotMetrics.failedCalls,
      successRate: polyglotMetrics.totalCalls > 0
        ? ((polyglotMetrics.successfulCalls / polyglotMetrics.totalCalls) * 100).toFixed(2) + '%'
        : '100%',
      avgLatency: `${polyglotMetrics.avgLatency.toFixed(3)}ms`,
      minLatency: `${polyglotMetrics.minLatency.toFixed(3)}ms`,
      maxLatency: `${polyglotMetrics.maxLatency.toFixed(3)}ms`,
      cacheHits: polyglotMetrics.cacheHits,
      cacheMisses: polyglotMetrics.cacheMisses,
      cacheHitRate: polyglotMetrics.totalCalls > 0
        ? ((polyglotMetrics.cacheHits / (polyglotMetrics.cacheHits + polyglotMetrics.cacheMisses)) * 100).toFixed(2) + '%'
        : 'N/A',
    },
    memory: process.memoryUsage(),
  };

  sendJson(ctx.res, 200, metricsData);
}

/**
 * Format uptime
 */
function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Handle request
 */
async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const startTime = performance.now();
  metrics.requestsTotal++;
  metrics.activeConnections++;

  // Set request timeout
  req.setTimeout(CONFIG.requestTimeout, () => {
    sendError(res, 408, 'Request timeout');
    req.destroy();
  });

  try {
    // Parse URL
    const parsedUrl = parseUrl(req.url || '', true);
    const path = parsedUrl.pathname || '/';
    const query = parsedUrl.query as Record<string, any>;

    // Create request context
    const ctx: RequestContext = {
      req,
      res,
      url: req.url || '',
      method: req.method || 'GET',
      path,
      query,
      body: null,
      headers: req.headers as Record<string, string | string[] | undefined>,
      startTime,
      requestId: generateRequestId(),
    };

    // Apply CORS
    applyCors(ctx.res);

    // Handle OPTIONS
    if (ctx.method === 'OPTIONS') {
      handleOptions(ctx);
      metrics.requestsSuccess++;
      return;
    }

    // Logging
    if (CONFIG.environment === 'development') {
      console.log(`[${ctx.requestId}] ${ctx.method} ${ctx.path}`);
    }

    // Health check endpoint
    if (path === '/health') {
      handleHealthCheck(ctx);
      metrics.requestsSuccess++;
      return;
    }

    // Metrics endpoint
    if (path === '/metrics') {
      handleMetrics(ctx);
      metrics.requestsSuccess++;
      return;
    }

    // Parse request body for POST/PUT/PATCH
    if (ctx.method === 'POST' || ctx.method === 'PUT' || ctx.method === 'PATCH') {
      try {
        ctx.body = await parseBody(req, CONFIG.maxRequestSize);
      } catch (error) {
        sendError(res, 400, 'Invalid request body', {
          message: error instanceof Error ? error.message : 'Unknown error',
        });
        metrics.requestsError++;
        return;
      }
    }

    // Route request to API handlers
    const handled = await router.handle(ctx);

    if (!handled) {
      sendError(res, 404, 'Not found', {
        path: ctx.path,
        method: ctx.method,
        availableEndpoints: [
          'GET /health',
          'GET /metrics',
          'POST /api/predict/sentiment',
          'POST /api/predict/image',
          'POST /api/predict/recommend',
          'POST /api/predict/batch',
        ],
      });
      metrics.requestsError++;
      return;
    }

    metrics.requestsSuccess++;

  } catch (error) {
    console.error('Server error:', error);
    if (!res.headersSent) {
      sendError(res, 500, 'Internal server error', {
        message: CONFIG.environment === 'development' && error instanceof Error
          ? error.message
          : 'An unexpected error occurred',
      });
    }
    metrics.requestsError++;

  } finally {
    metrics.activeConnections--;
    const duration = performance.now() - startTime;
    metrics.requestDurations.push(duration);

    // Keep only last 1000 durations for metrics
    if (metrics.requestDurations.length > 1000) {
      metrics.requestDurations.shift();
    }

    if (CONFIG.environment === 'development') {
      console.log(`  → ${res.statusCode} in ${duration.toFixed(2)}ms`);
    }
  }
}

/**
 * Create HTTP server
 */
const server = createServer(handleRequest);

/**
 * Graceful shutdown
 */
function gracefulShutdown(signal: string): void {
  console.log(`\n${signal} received, starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });

  // Force shutdown after timeout
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, CONFIG.shutdownTimeout);
}

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

/**
 * Start server
 */
export async function start(): Promise<void> {
  console.log('Initializing server...');

  // Warm up ML models
  console.log('Warming up ML models...');
  try {
    await mlBridge.warmup();
    console.log('✓ ML models ready');
  } catch (error) {
    console.error('✗ Failed to warm up ML models:', error);
    console.error('  Continuing anyway, but first requests may be slower');
  }

  return new Promise((resolve, reject) => {
    server.listen(CONFIG.port, CONFIG.host, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║     Real-Time ML Prediction API - Elide Polyglot          ║
╠═══════════════════════════════════════════════════════════╣
║  Environment: ${CONFIG.environment.padEnd(42)}  ║
║  Address:     http://${CONFIG.host}:${CONFIG.port}${' '.repeat(32 - CONFIG.host.length - CONFIG.port.toString().length)}  ║
║                                                           ║
║  Prediction Endpoints:                                    ║
║    POST   /api/predict/sentiment                          ║
║    POST   /api/predict/image                              ║
║    POST   /api/predict/recommend                          ║
║    POST   /api/predict/batch                              ║
║                                                           ║
║  System Endpoints:                                        ║
║    GET    /health                                         ║
║    GET    /metrics                                        ║
║                                                           ║
║  Status: READY                                            ║
╚═══════════════════════════════════════════════════════════╝
      `);
      resolve();
    });

    server.on('error', (error) => {
      console.error('Server error:', error);
      reject(error);
    });
  });
}

/**
 * Stop server
 */
export function stop(): Promise<void> {
  return new Promise((resolve) => {
    server.close(() => {
      resolve();
    });
  });
}

// Start server if run directly
if (require.main === module) {
  start().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}
