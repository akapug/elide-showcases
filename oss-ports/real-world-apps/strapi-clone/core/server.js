/**
 * Core Server Implementation
 * Handles HTTP server setup, routing, and middleware
 */

import { HTTPServer, Router, middleware } from '@elide/http';
import { setupRESTAPI } from '../api/rest.js';
import { setupGraphQLAPI } from '../api/graphql.js';
import { setupAdminRoutes } from '../admin/routes.js';
import { authMiddleware } from '../auth/middleware.js';
import { permissionMiddleware } from '../permissions/middleware.js';
import { corsMiddleware } from './middleware/cors.js';
import { rateLimitMiddleware } from './middleware/rate-limit.js';
import { compressionMiddleware } from './middleware/compression.js';
import { errorHandler } from './middleware/error-handler.js';
import { requestLogger } from './middleware/request-logger.js';
import { webhookEmitter } from '../webhooks/emitter.js';

export async function createServer(config) {
  const server = new HTTPServer({
    host: config.server.host,
    port: config.server.port,
    ssl: config.server.ssl,
  });

  const router = new Router();

  // Global middleware
  server.use(requestLogger);
  server.use(corsMiddleware(config.cors));
  server.use(compressionMiddleware);
  server.use(rateLimitMiddleware(config.rateLimit));
  server.use(middleware.json({ limit: config.server.bodyLimit || '10mb' }));
  server.use(middleware.urlencoded({ extended: true }));

  // Authentication middleware (applied selectively)
  const auth = authMiddleware(config.auth);
  const permissions = permissionMiddleware(config.permissions);

  // Health check endpoint
  router.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.environment,
    });
  });

  // Setup Admin Panel routes
  router.use('/admin', auth, permissions, setupAdminRoutes(config));

  // Setup REST API
  router.use('/api', auth, permissions, setupRESTAPI(config));

  // Setup GraphQL API
  router.use('/graphql', auth, setupGraphQLAPI(config));

  // Documentation endpoint
  router.get('/docs', (req, res) => {
    res.json({
      message: 'API Documentation',
      endpoints: {
        admin: '/admin',
        rest: '/api',
        graphql: '/graphql',
        health: '/health',
      },
      version: config.version || '1.0.0',
    });
  });

  // Register webhook emitter
  server.context.webhooks = webhookEmitter;

  // Mount router
  server.use(router);

  // Error handler (must be last)
  server.use(errorHandler);

  return server;
}

export class ServerContext {
  constructor(config) {
    this.config = config;
    this.plugins = new Map();
    this.contentTypes = new Map();
    this.routes = new Map();
  }

  registerPlugin(name, plugin) {
    this.plugins.set(name, plugin);
  }

  registerContentType(name, contentType) {
    this.contentTypes.set(name, contentType);
  }

  registerRoute(path, handler) {
    this.routes.set(path, handler);
  }

  getPlugin(name) {
    return this.plugins.get(name);
  }

  getContentType(name) {
    return this.contentTypes.get(name);
  }

  getAllContentTypes() {
    return Array.from(this.contentTypes.values());
  }
}
