#!/usr/bin/env elide

/**
 * Elide Ghost Clone - Main Server Entry Point
 *
 * A production-ready blogging platform built with Elide.
 * This demonstrates Elide's native HTTP capabilities, database integration,
 * and polyglot features for a real-world CMS application.
 */

import { Server } from 'elide:http';
import { SQLite } from 'elide:sqlite';
import { readFile, writeFile, exists, mkdir } from 'elide:fs';
import { join, dirname } from 'elide:path';
import { parse } from 'elide:url';

// Import application modules
import { DatabaseManager } from './database/manager.js';
import { ContentAPI } from './api/content-api.js';
import { AdminAPI } from './api/admin-api.js';
import { AuthenticationService } from './api/auth.js';
import { ThemeRenderer } from './frontend/renderer.js';
import { MediaService } from './api/media.js';
import { CacheManager } from './frontend/cache.js';
import { WebhookManager } from './api/webhooks.js';
import { AnalyticsService } from './api/analytics.js';
import { SEOService } from './frontend/seo.js';
import { Config } from './config/index.js';

class GhostCloneServer {
  constructor(config) {
    this.config = config;
    this.db = null;
    this.server = null;
    this.cache = null;
    this.services = {};
  }

  async initialize() {
    console.log('🚀 Initializing Elide Ghost Clone...');

    // Initialize database
    await this.initializeDatabase();

    // Initialize services
    await this.initializeServices();

    // Initialize cache
    this.cache = new CacheManager(this.config.cache);

    // Setup HTTP server
    await this.setupServer();

    console.log('✅ Server initialized successfully');
  }

  async initializeDatabase() {
    console.log('📊 Initializing database...');

    const dbPath = this.config.database.path;
    const dbDir = dirname(dbPath);

    if (!await exists(dbDir)) {
      await mkdir(dbDir, { recursive: true });
    }

    this.db = new DatabaseManager(dbPath);
    await this.db.initialize();
    await this.db.runMigrations();

    console.log('✅ Database initialized');
  }

  async initializeServices() {
    console.log('⚙️  Initializing services...');

    // Core services
    this.services.auth = new AuthenticationService(this.db, this.config.auth);
    this.services.content = new ContentAPI(this.db, this.config);
    this.services.admin = new AdminAPI(this.db, this.config);
    this.services.media = new MediaService(this.config.media);
    this.services.theme = new ThemeRenderer(this.db, this.config.themes);
    this.services.webhooks = new WebhookManager(this.db);
    this.services.analytics = new AnalyticsService(this.db);
    this.services.seo = new SEOService(this.config.seo);

    // Initialize services that need setup
    await this.services.theme.loadThemes();
    await this.services.webhooks.initialize();

    console.log('✅ Services initialized');
  }

  async setupServer() {
    console.log('🌐 Setting up HTTP server...');

    this.server = new Server({
      port: this.config.server.port,
      host: this.config.server.host,
    });

    // Middleware
    this.server.use(this.loggingMiddleware.bind(this));
    this.server.use(this.corsMiddleware.bind(this));
    this.server.use(this.analyticsMiddleware.bind(this));

    // Static files
    this.server.static('/assets', './public/assets');
    this.server.static('/content/images', this.config.media.uploadPath);
    this.server.static('/admin', './admin/dist');

    // API Routes
    this.setupAPIRoutes();

    // Frontend Routes
    this.setupFrontendRoutes();

    console.log('✅ HTTP server configured');
  }

  setupAPIRoutes() {
    const api = this.server.router('/api');

    // Content API (Public)
    api.get('/v1/posts', this.handleRequest('content', 'getPosts'));
    api.get('/v1/posts/:slug', this.handleRequest('content', 'getPost'));
    api.get('/v1/posts/:id/related', this.handleRequest('content', 'getRelatedPosts'));
    api.get('/v1/pages', this.handleRequest('content', 'getPages'));
    api.get('/v1/pages/:slug', this.handleRequest('content', 'getPage'));
    api.get('/v1/tags', this.handleRequest('content', 'getTags'));
    api.get('/v1/tags/:slug', this.handleRequest('content', 'getTag'));
    api.get('/v1/authors', this.handleRequest('content', 'getAuthors'));
    api.get('/v1/authors/:slug', this.handleRequest('content', 'getAuthor'));
    api.get('/v1/settings', this.handleRequest('content', 'getSettings'));

    // Admin API (Protected)
    const admin = api.router('/admin');

    // Authentication
    admin.post('/session', this.handleRequest('auth', 'login'));
    admin.delete('/session', this.requireAuth.bind(this), this.handleRequest('auth', 'logout'));
    admin.post('/password-reset', this.handleRequest('auth', 'requestPasswordReset'));
    admin.put('/password-reset/:token', this.handleRequest('auth', 'resetPassword'));

    // Posts
    admin.get('/posts', this.requireAuth.bind(this), this.handleRequest('admin', 'listPosts'));
    admin.post('/posts', this.requireAuth.bind(this), this.requireRole('author'), this.handleRequest('admin', 'createPost'));
    admin.get('/posts/:id', this.requireAuth.bind(this), this.handleRequest('admin', 'getPost'));
    admin.put('/posts/:id', this.requireAuth.bind(this), this.requireRole('author'), this.handleRequest('admin', 'updatePost'));
    admin.delete('/posts/:id', this.requireAuth.bind(this), this.requireRole('editor'), this.handleRequest('admin', 'deletePost'));
    admin.put('/posts/:id/publish', this.requireAuth.bind(this), this.requireRole('editor'), this.handleRequest('admin', 'publishPost'));
    admin.put('/posts/:id/unpublish', this.requireAuth.bind(this), this.requireRole('editor'), this.handleRequest('admin', 'unpublishPost'));

    // Pages
    admin.get('/pages', this.requireAuth.bind(this), this.handleRequest('admin', 'listPages'));
    admin.post('/pages', this.requireAuth.bind(this), this.requireRole('author'), this.handleRequest('admin', 'createPage'));
    admin.put('/pages/:id', this.requireAuth.bind(this), this.requireRole('author'), this.handleRequest('admin', 'updatePage'));
    admin.delete('/pages/:id', this.requireAuth.bind(this), this.requireRole('editor'), this.handleRequest('admin', 'deletePage'));

    // Tags
    admin.get('/tags', this.requireAuth.bind(this), this.handleRequest('admin', 'listTags'));
    admin.post('/tags', this.requireAuth.bind(this), this.requireRole('editor'), this.handleRequest('admin', 'createTag'));
    admin.put('/tags/:id', this.requireAuth.bind(this), this.requireRole('editor'), this.handleRequest('admin', 'updateTag'));
    admin.delete('/tags/:id', this.requireAuth.bind(this), this.requireRole('editor'), this.handleRequest('admin', 'deleteTag'));

    // Media
    admin.post('/media/upload', this.requireAuth.bind(this), this.handleRequest('media', 'upload'));
    admin.get('/media', this.requireAuth.bind(this), this.handleRequest('media', 'list'));
    admin.delete('/media/:id', this.requireAuth.bind(this), this.requireRole('editor'), this.handleRequest('media', 'delete'));

    // Users
    admin.get('/users', this.requireAuth.bind(this), this.requireRole('admin'), this.handleRequest('admin', 'listUsers'));
    admin.post('/users', this.requireAuth.bind(this), this.requireRole('admin'), this.handleRequest('admin', 'createUser'));
    admin.get('/users/:id', this.requireAuth.bind(this), this.handleRequest('admin', 'getUser'));
    admin.put('/users/:id', this.requireAuth.bind(this), this.handleRequest('admin', 'updateUser'));
    admin.delete('/users/:id', this.requireAuth.bind(this), this.requireRole('admin'), this.handleRequest('admin', 'deleteUser'));

    // Settings
    admin.get('/settings', this.requireAuth.bind(this), this.handleRequest('admin', 'getSettings'));
    admin.put('/settings', this.requireAuth.bind(this), this.requireRole('admin'), this.handleRequest('admin', 'updateSettings'));

    // Analytics
    admin.get('/analytics/dashboard', this.requireAuth.bind(this), this.handleRequest('analytics', 'getDashboard'));
    admin.get('/analytics/posts/:id', this.requireAuth.bind(this), this.handleRequest('analytics', 'getPostAnalytics'));

    // Webhooks
    admin.get('/webhooks', this.requireAuth.bind(this), this.requireRole('admin'), this.handleRequest('webhooks', 'list'));
    admin.post('/webhooks', this.requireAuth.bind(this), this.requireRole('admin'), this.handleRequest('webhooks', 'create'));
    admin.delete('/webhooks/:id', this.requireAuth.bind(this), this.requireRole('admin'), this.handleRequest('webhooks', 'delete'));
  }

  setupFrontendRoutes() {
    // Special routes
    this.server.get('/rss', this.handleFrontend('renderRSS'));
    this.server.get('/sitemap.xml', this.handleFrontend('renderSitemap'));
    this.server.get('/robots.txt', this.handleFrontend('renderRobots'));
    this.server.get('/amp/:slug', this.handleFrontend('renderAMP'));

    // Content routes
    this.server.get('/tag/:slug', this.handleFrontend('renderTag'));
    this.server.get('/author/:slug', this.handleFrontend('renderAuthor'));
    this.server.get('/page/:page', this.handleFrontend('renderPage'));
    this.server.get('/:slug', this.handleFrontend('renderPost'));

    // Home page
    this.server.get('/', this.handleFrontend('renderHome'));

    // Admin SPA
    this.server.get('/admin/*', async (req, res) => {
      const indexPath = './admin/dist/index.html';
      if (await exists(indexPath)) {
        const content = await readFile(indexPath, 'utf8');
        res.html(content);
      } else {
        res.status(404).text('Admin dashboard not built. Run: npm run build:admin');
      }
    });
  }

  loggingMiddleware(req, res, next) {
    const start = Date.now();
    console.log(`→ ${req.method} ${req.url}`);

    const originalSend = res.send.bind(res);
    res.send = (...args) => {
      const duration = Date.now() - start;
      console.log(`← ${req.method} ${req.url} ${res.statusCode} (${duration}ms)`);
      return originalSend(...args);
    };

    next();
  }

  corsMiddleware(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', this.config.server.allowOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }

    next();
  }

  async analyticsMiddleware(req, res, next) {
    // Track page views and API calls
    if (!req.url.startsWith('/api/admin') && !req.url.startsWith('/assets')) {
      await this.services.analytics.track({
        type: req.url.startsWith('/api') ? 'api_call' : 'page_view',
        path: req.url,
        method: req.method,
        userAgent: req.headers['user-agent'],
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
    }
    next();
  }

  handleRequest(service, method) {
    return async (req, res) => {
      try {
        const result = await this.services[service][method](req, res);

        if (!res.headersSent) {
          res.json(result || { success: true });
        }
      } catch (error) {
        console.error(`Error in ${service}.${method}:`, error);

        if (!res.headersSent) {
          res.status(error.status || 500).json({
            error: error.message || 'Internal server error',
            code: error.code || 'INTERNAL_ERROR',
          });
        }
      }
    };
  }

  handleFrontend(method) {
    return async (req, res) => {
      try {
        // Check cache first
        const cacheKey = `page:${req.url}`;
        const cached = await this.cache.get(cacheKey);

        if (cached && !this.config.dev) {
          res.html(cached);
          return;
        }

        // Render page
        const html = await this.services.theme[method](req, res);

        // Cache the result
        if (!this.config.dev) {
          await this.cache.set(cacheKey, html, this.config.cache.ttl);
        }

        res.html(html);
      } catch (error) {
        console.error(`Error rendering ${method}:`, error);

        if (error.status === 404) {
          const notFound = await this.services.theme.render404(req);
          res.status(404).html(notFound);
        } else {
          const errorPage = await this.services.theme.renderError(error);
          res.status(500).html(errorPage);
        }
      }
    };
  }

  async requireAuth(req, res, next) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        throw { status: 401, code: 'NO_TOKEN', message: 'Authentication required' };
      }

      const user = await this.services.auth.verifyToken(token);
      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({
        error: error.message || 'Unauthorized',
        code: error.code || 'UNAUTHORIZED',
      });
    }
  }

  requireRole(minRole) {
    const roles = ['contributor', 'author', 'editor', 'admin'];
    const minLevel = roles.indexOf(minRole);

    return (req, res, next) => {
      const userLevel = roles.indexOf(req.user.role);

      if (userLevel >= minLevel) {
        next();
      } else {
        res.status(403).json({
          error: 'Insufficient permissions',
          code: 'FORBIDDEN',
          required: minRole,
          current: req.user.role,
        });
      }
    };
  }

  async start() {
    await this.initialize();

    await this.server.listen();

    console.log('');
    console.log('🎉 Elide Ghost Clone is running!');
    console.log('');
    console.log(`   Frontend: http://${this.config.server.host}:${this.config.server.port}`);
    console.log(`   Admin:    http://${this.config.server.host}:${this.config.server.port}/admin`);
    console.log(`   API:      http://${this.config.server.host}:${this.config.server.port}/api`);
    console.log('');
    console.log('Press Ctrl+C to stop');
  }

  async stop() {
    console.log('⏹️  Stopping server...');
    await this.server.close();
    await this.db.close();
    console.log('👋 Server stopped');
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  if (global.app) {
    await global.app.stop();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  if (global.app) {
    await global.app.stop();
  }
  process.exit(0);
});

// Start the server
const config = await Config.load();
global.app = new GhostCloneServer(config);
await global.app.start();
