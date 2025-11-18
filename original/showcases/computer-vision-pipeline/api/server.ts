/**
 * Computer Vision API Server
 *
 * Production-grade HTTP API server for image/video processing using CV pipelines.
 * Features:
 * - RESTful API endpoints for image upload and processing
 * - Zero-copy buffer sharing with Python OpenCV/Pillow
 * - Real-time video frame processing (30fps)
 * - Face detection and object tracking
 * - Image filters and transformations
 * - Shared memory buffer pool
 * - Performance monitoring
 *
 * @module api/server
 */

import { createServer, IncomingMessage, ServerResponse } from 'http';
import { parse as parseUrl } from 'url';
import { router } from './routes';
import { corsMiddleware, loggingMiddleware, uploadMiddleware } from './middleware';
import { BufferPool } from '../shared/buffer-pool';
import { MemoryManager } from '../shared/memory-manager';

// Server configuration
const CONFIG = {
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  environment: process.env.NODE_ENV || 'development',
  maxRequestSize: 10 * 1024 * 1024, // 10MB for images
  maxVideoSize: 100 * 1024 * 1024, // 100MB for videos
  requestTimeout: 30000, // 30 seconds
  shutdownTimeout: 10000, // 10 seconds
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS', 'DELETE'],
    headers: ['Content-Type', 'Authorization'],
  },
};

// Server metrics
interface Metrics {
  requestsTotal: number;
  requestsSuccess: number;
  requestsError: number;
  requestDuration: number[];
  activeConnections: number;
  imagesProcessed: number;
  videoFramesProcessed: number;
  totalProcessingTime: number;
  bufferPoolHits: number;
  bufferPoolMisses: number;
  uptime: number;
  startTime: number;
}

const metrics: Metrics = {
  requestsTotal: 0,
  requestsSuccess: 0,
  requestsError: 0,
  requestDuration: [],
  activeConnections: 0,
  imagesProcessed: 0,
  videoFramesProcessed: 0,
  totalProcessingTime: 0,
  bufferPoolHits: 0,
  bufferPoolMisses: 0,
  uptime: 0,
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
  bufferPool?: BufferPool;
  memoryManager?: MemoryManager;
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Send JSON response
 */
export function sendJson(res: ServerResponse, statusCode: number, data: any): void {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
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
 * Handle health check
 */
function handleHealthCheck(ctx: RequestContext): void {
  const uptime = Date.now() - metrics.startTime;
  const memUsage = process.memoryUsage();
  const bufferStats = BufferPool.getInstance().getStats();

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
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
    },
    bufferPool: {
      size: bufferStats.totalBuffers,
      available: bufferStats.availableBuffers,
      inUse: bufferStats.buffersInUse,
      totalMemory: `${Math.round(bufferStats.totalMemory / 1024 / 1024)}MB`,
      usedMemory: `${Math.round(bufferStats.usedMemory / 1024 / 1024)}MB`,
      hitRate: bufferStats.hitRate.toFixed(2),
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

  const avgProcessingTime = metrics.imagesProcessed > 0
    ? metrics.totalProcessingTime / metrics.imagesProcessed
    : 0;

  const bufferStats = BufferPool.getInstance().getStats();

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
      minDuration: metrics.requestDuration.length > 0
        ? `${Math.min(...metrics.requestDuration).toFixed(2)}ms`
        : 'N/A',
      maxDuration: metrics.requestDuration.length > 0
        ? `${Math.max(...metrics.requestDuration).toFixed(2)}ms`
        : 'N/A',
      avgProcessingTime: `${avgProcessingTime.toFixed(2)}ms`,
    },
    processing: {
      imagesProcessed: metrics.imagesProcessed,
      videoFramesProcessed: metrics.videoFramesProcessed,
      totalProcessingTime: `${metrics.totalProcessingTime.toFixed(2)}ms`,
    },
    bufferPool: {
      hits: bufferStats.hits,
      misses: bufferStats.misses,
      hitRate: `${(bufferStats.hitRate * 100).toFixed(2)}%`,
      totalBuffers: bufferStats.totalBuffers,
      availableBuffers: bufferStats.availableBuffers,
      memoryUsage: `${Math.round(bufferStats.usedMemory / 1024 / 1024)}MB / ${Math.round(bufferStats.totalMemory / 1024 / 1024)}MB`,
    },
    connections: {
      active: metrics.activeConnections,
    },
    uptime: {
      ms: Date.now() - metrics.startTime,
      formatted: formatUptime(Date.now() - metrics.startTime),
    },
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
      bufferPool: BufferPool.getInstance(),
      memoryManager: MemoryManager.getInstance(),
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

    // Handle file uploads
    if (ctx.method === 'POST' && (path.startsWith('/api/v1/process') || path.startsWith('/api/v1/video'))) {
      try {
        await uploadMiddleware(ctx, CONFIG.maxRequestSize);
      } catch (error) {
        sendError(res, 400, 'Invalid upload', {
          message: error instanceof Error ? error.message : 'Unknown error',
        });
        metrics.requestsError++;
        return;
      }
    }

    // Route request
    const handled = await router.handle(ctx, metrics);

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

  // Cleanup buffer pool
  BufferPool.getInstance().cleanup();
  MemoryManager.getInstance().cleanup();

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
  BufferPool.getInstance().cleanup();
  MemoryManager.getInstance().cleanup();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  BufferPool.getInstance().cleanup();
  MemoryManager.getInstance().cleanup();
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
║     Computer Vision Pipeline - Zero-Copy Processing       ║
╠═══════════════════════════════════════════════════════════╣
║  Environment: ${CONFIG.environment.padEnd(42)}  ║
║  Address:     http://${CONFIG.host}:${CONFIG.port}${' '.repeat(32 - CONFIG.host.length - CONFIG.port.toString().length)}  ║
║  Endpoints:                                               ║
║    POST   /api/v1/process/detect-faces                    ║
║    POST   /api/v1/process/track-objects                   ║
║    POST   /api/v1/process/apply-filter                    ║
║    POST   /api/v1/process/transform                       ║
║    POST   /api/v1/video/process                           ║
║    GET    /api/v1/capabilities                            ║
║    GET    /health                                         ║
║    GET    /metrics                                        ║
╠═══════════════════════════════════════════════════════════╣
║  Features:                                                ║
║    • Zero-copy buffer sharing (TypeScript ↔ Python)       ║
║    • Real-time video processing (30fps)                   ║
║    • Face detection & object tracking (OpenCV)            ║
║    • Image filters & transformations (Pillow)             ║
║    • Shared memory buffer pool                            ║
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
      BufferPool.getInstance().cleanup();
      MemoryManager.getInstance().cleanup();
      resolve();
    });
  });
}

// Export metrics for routes
export { metrics, CONFIG };

// Start server if run directly
if (require.main === module) {
  start().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}
