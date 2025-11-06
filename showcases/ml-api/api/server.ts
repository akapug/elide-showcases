/**
 * ML API Server - Sentiment Analysis
 *
 * Production-grade HTTP API server for sentiment analysis using ML models.
 * Features:
 * - RESTful API endpoints
 * - WebSocket support for real-time analysis
 * - Health checks and metrics
 * - Graceful shutdown
 * - Request validation
 * - Error handling
 *
 * @module api/server
 */

import { createServer, IncomingMessage, ServerResponse } from 'http';
import { parse as parseUrl } from 'url';
import { parse as parseQuery } from 'querystring';
import { router } from './routes';
import { rateLimitMiddleware, authMiddleware, corsMiddleware, loggingMiddleware } from './middleware';
import { cache } from './cache';

// Server configuration
const CONFIG = {
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  environment: process.env.NODE_ENV || 'development',
  maxRequestSize: 10 * 1024 * 1024, // 10MB
  requestTimeout: 30000, // 30 seconds
  shutdownTimeout: 10000, // 10 seconds
  enableMetrics: true,
  enableHealthCheck: true,
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
  requestDuration: number[];
  activeConnections: number;
  uptime: number;
  startTime: number;
}

const metrics: Metrics = {
  requestsTotal: 0,
  requestsSuccess: 0,
  requestsError: 0,
  requestDuration: [],
  activeConnections: 0,
  uptime: 0,
  startTime: Date.now(),
};

// Request context
interface RequestContext {
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
  user?: {
    id: string;
    apiKey: string;
    tier: 'free' | 'pro' | 'enterprise';
  };
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
          } else if (contentType.includes('application/x-www-form-urlencoded')) {
            resolve(parseQuery(body));
          } else {
            resolve(body);
          }
        } else {
          resolve(null);
        }
      } catch (error) {
        reject(new Error('Invalid request body'));
      }
    });

    req.on('error', reject);
  });
}

/**
 * Send JSON response
 */
function sendJson(res: ServerResponse, statusCode: number, data: any): void {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
  });
  res.end(JSON.stringify(data, null, 2));
}

/**
 * Send error response
 */
function sendError(res: ServerResponse, statusCode: number, message: string, details?: any): void {
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
 * Handle health check
 */
function handleHealthCheck(ctx: RequestContext): void {
  const uptime = Date.now() - metrics.startTime;
  const memUsage = process.memoryUsage();

  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: uptime,
    uptimeFormatted: formatUptime(uptime),
    environment: CONFIG.environment,
    version: '1.0.0',
    memory: {
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
    },
    cache: {
      size: cache.size(),
      hits: cache.getStats().hits,
      misses: cache.getStats().misses,
      hitRate: cache.getStats().hitRate,
    },
  };

  sendJson(ctx.res, 200, health);
}

/**
 * Handle metrics endpoint
 */
function handleMetrics(ctx: RequestContext): void {
  const avgDuration = metrics.requestDuration.length > 0
    ? metrics.requestDuration.reduce((a, b) => a + b, 0) / metrics.requestDuration.length
    : 0;

  const metricsData = {
    requests: {
      total: metrics.requestsTotal,
      success: metrics.requestsSuccess,
      error: metrics.requestsError,
      successRate: metrics.requestsTotal > 0
        ? ((metrics.requestsSuccess / metrics.requestsTotal) * 100).toFixed(2) + '%'
        : '0%',
    },
    performance: {
      avgDuration: `${avgDuration.toFixed(2)}ms`,
      minDuration: `${Math.min(...metrics.requestDuration).toFixed(2)}ms`,
      maxDuration: `${Math.max(...metrics.requestDuration).toFixed(2)}ms`,
    },
    connections: {
      active: metrics.activeConnections,
    },
    uptime: {
      ms: Date.now() - metrics.startTime,
      formatted: formatUptime(Date.now() - metrics.startTime),
    },
    cache: cache.getStats(),
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
 * Handle OPTIONS request (CORS preflight)
 */
function handleOptions(ctx: RequestContext): void {
  ctx.res.writeHead(204, {
    'Access-Control-Allow-Origin': CONFIG.cors.origin,
    'Access-Control-Allow-Methods': CONFIG.cors.methods.join(', '),
    'Access-Control-Allow-Headers': CONFIG.cors.headers.join(', '),
    'Access-Control-Max-Age': '86400',
  });
  ctx.res.end();
}

/**
 * Handle request
 */
async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const startTime = Date.now();
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

    // Apply CORS middleware
    corsMiddleware(ctx);

    // Handle OPTIONS
    if (ctx.method === 'OPTIONS') {
      handleOptions(ctx);
      metrics.requestsSuccess++;
      return;
    }

    // Apply logging middleware
    loggingMiddleware(ctx);

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

    // Apply rate limiting
    const rateLimitResult = await rateLimitMiddleware(ctx);
    if (!rateLimitResult.allowed) {
      sendError(res, 429, 'Rate limit exceeded', {
        limit: rateLimitResult.limit,
        remaining: rateLimitResult.remaining,
        resetAt: rateLimitResult.resetAt,
      });
      metrics.requestsError++;
      return;
    }

    // Apply auth middleware
    const authResult = await authMiddleware(ctx);
    if (!authResult.authenticated) {
      sendError(res, 401, 'Unauthorized', {
        message: authResult.message,
      });
      metrics.requestsError++;
      return;
    }

    // Set user context
    ctx.user = authResult.user;

    // Parse request body
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

    // Route request
    const handled = await router.handle(ctx);

    if (!handled) {
      sendError(res, 404, 'Not found', {
        path: ctx.path,
        method: ctx.method,
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
    const duration = Date.now() - startTime;
    metrics.requestDuration.push(duration);

    // Keep only last 1000 durations
    if (metrics.requestDuration.length > 1000) {
      metrics.requestDuration.shift();
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
export function start(): Promise<void> {
  return new Promise((resolve, reject) => {
    server.listen(CONFIG.port, CONFIG.host, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║         ML API Server - Sentiment Analysis                ║
╠═══════════════════════════════════════════════════════════╣
║  Environment: ${CONFIG.environment.padEnd(42)}  ║
║  Address:     http://${CONFIG.host}:${CONFIG.port}${' '.repeat(32 - CONFIG.host.length - CONFIG.port.toString().length)}  ║
║  Endpoints:                                               ║
║    POST   /api/v1/analyze                                 ║
║    POST   /api/v1/batch                                   ║
║    GET    /api/v1/models                                  ║
║    GET    /health                                         ║
║    GET    /metrics                                        ║
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

// Export context type
export type { RequestContext };
export { sendJson, sendError, CONFIG };

// Start server if run directly
if (require.main === module) {
  start().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}
