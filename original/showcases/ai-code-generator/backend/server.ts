/**
 * AI Code Generator - Main HTTP Server
 *
 * Elide-powered HTTP server for the AI code generation platform.
 * Handles all API routes and serves the frontend application.
 *
 * Key features:
 * - Instant startup (0ms with Elide)
 * - RESTful API endpoints
 * - WebSocket support for real-time updates
 * - CORS, rate limiting, caching
 * - Static file serving
 */

import * as http from 'http';
import * as url from 'url';
import * as fs from 'fs';
import * as path from 'path';
import { handleGenerate } from './routes/generateRoute';
import { handlePreview } from './routes/previewRoute';
import { handleTranspile } from './routes/transpileRoute';
import { handleExport } from './routes/exportRoute';
import { handleTemplates } from './routes/templatesRoute';
import { corsMiddleware, rateLimitMiddleware, authMiddleware, errorHandler } from './middleware';
import { logger } from './utils/logger';
import { Cache } from './utils/cache';

// Configuration
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Initialize cache
const cache = new Cache({
  maxSize: 1000,
  maxMemory: 100 * 1024 * 1024, // 100MB
  ttl: 3600000, // 1 hour
});

// MIME type mapping
const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

/**
 * Parse request body
 */
async function parseBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const contentType = req.headers['content-type'] || '';
        if (contentType.includes('application/json')) {
          resolve(JSON.parse(body || '{}'));
        } else {
          resolve(body);
        }
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

/**
 * Send JSON response
 */
function sendJSON(res: http.ServerResponse, data: any, status: number = 200): void {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
  });
  res.end(JSON.stringify(data, null, 2));
}

/**
 * Send error response
 */
function sendError(res: http.ServerResponse, message: string, status: number = 500): void {
  logger.error(`Error response: ${status} - ${message}`);
  sendJSON(res, {
    error: message,
    status,
    timestamp: new Date().toISOString(),
  }, status);
}

/**
 * Serve static files
 */
function serveStatic(req: http.IncomingMessage, res: http.ServerResponse, filePath: string): void {
  const ext = path.extname(filePath);
  const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // File not found, serve index.html for SPA routing
        const indexPath = path.join(__dirname, '../public/index.html');
        fs.readFile(indexPath, (indexErr, indexData) => {
          if (indexErr) {
            sendError(res, 'Not found', 404);
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(indexData);
          }
        });
      } else {
        sendError(res, 'Internal server error', 500);
      }
    } else {
      res.writeHead(200, {
        'Content-Type': mimeType,
        'Cache-Control': NODE_ENV === 'production' ? 'public, max-age=31536000' : 'no-cache',
      });
      res.end(data);
    }
  });
}

/**
 * Route handler
 */
async function handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  const parsedUrl = url.parse(req.url || '', true);
  const pathname = parsedUrl.pathname || '/';
  const method = req.method || 'GET';

  logger.info(`${method} ${pathname}`);

  try {
    // Apply CORS middleware
    if (!corsMiddleware(req, res)) {
      return;
    }

    // Handle preflight requests
    if (method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // Health check endpoint
    if (pathname === '/health' && method === 'GET') {
      const uptime = process.uptime();
      const memory = process.memoryUsage();

      sendJSON(res, {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: uptime,
        uptimeFormatted: formatUptime(uptime),
        environment: NODE_ENV,
        version: '1.0.0',
        memory: {
          heapUsed: `${Math.round(memory.heapUsed / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memory.heapTotal / 1024 / 1024)}MB`,
          rss: `${Math.round(memory.rss / 1024 / 1024)}MB`,
        },
        cache: cache.getStats(),
      });
      return;
    }

    // API routes
    if (pathname.startsWith('/api/')) {
      // Apply rate limiting
      if (!await rateLimitMiddleware(req, res)) {
        return;
      }

      // Parse request body for POST/PUT requests
      let body: any = {};
      if (method === 'POST' || method === 'PUT') {
        try {
          body = await parseBody(req);
        } catch (error) {
          sendError(res, 'Invalid request body', 400);
          return;
        }
      }

      // Route to appropriate handler
      if (pathname === '/api/generate' && method === 'POST') {
        await handleGenerate(req, res, body, cache);
      } else if (pathname === '/api/preview' && method === 'POST') {
        await handlePreview(req, res, body, cache);
      } else if (pathname === '/api/transpile' && method === 'POST') {
        await handleTranspile(req, res, body, cache);
      } else if (pathname === '/api/export' && method === 'POST') {
        await handleExport(req, res, body);
      } else if (pathname === '/api/templates' && method === 'GET') {
        await handleTemplates(req, res, cache);
      } else {
        sendError(res, 'Endpoint not found', 404);
      }
      return;
    }

    // Serve static files
    const publicDir = path.join(__dirname, '../public');
    const filePath = pathname === '/'
      ? path.join(publicDir, 'index.html')
      : path.join(publicDir, pathname);

    // Security check: prevent directory traversal
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith(publicDir)) {
      sendError(res, 'Forbidden', 403);
      return;
    }

    serveStatic(req, res, filePath);
  } catch (error) {
    errorHandler(error as Error, req, res);
  }
}

/**
 * Format uptime in human-readable format
 */
function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours}h ${minutes}m ${secs}s`;
}

/**
 * Start the server
 */
function startServer(): void {
  const server = http.createServer(handleRequest);

  server.listen(PORT, HOST, () => {
    logger.info(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║         AI Code Generator - Powered by Elide                  ║
║                                                               ║
║  Server running at: http://${HOST}:${PORT}                   ║
║  Environment: ${NODE_ENV}                                    ║
║  AI Provider: ${process.env.AI_PROVIDER || 'mock'}           ║
║                                                               ║
║  Instant startup ⚡️  Polyglot 🌍  Zero config 🎯            ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
    `);
  });

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      logger.error(`Port ${PORT} is already in use`);
      process.exit(1);
    } else {
      logger.error('Server error:', error);
      process.exit(1);
    }
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });
}

// Start the server
if (require.main === module) {
  startServer();
}

export { startServer, handleRequest, sendJSON, sendError, parseBody };
