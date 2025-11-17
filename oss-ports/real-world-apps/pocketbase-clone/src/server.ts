/**
 * Main Server
 * HTTP server with REST API routes
 */

import { createServer, IncomingMessage, ServerResponse } from 'http';
import { parse } from 'url';
import { initDatabase, getDatabase, DatabaseConnection } from './database/connection.js';
import { CollectionManager, Collection } from './collections/manager.js';
import { RecordsAPI, ListOptions } from './api/records.js';
import { AuthService } from './auth/service.js';
import { RealtimeService, SSEManager } from './realtime/subscriptions.js';
import { StorageService } from './storage/service.js';
import { RulesEngine, RulesMiddleware } from './rules/engine.js';
import { HooksManager } from './hooks/manager.js';
import { MigrationsManager } from './migrations/manager.js';
import { nanoid } from 'nanoid';

export interface ServerConfig {
  port: number;
  host: string;
  dbPath: string;
  jwtSecret: string;
  storagePath: string;
  migrationsPath?: string;
  hooksPath?: string;
}

export class PocketBaseServer {
  private config: ServerConfig;
  private db!: DatabaseConnection;
  private collections!: CollectionManager;
  private records!: RecordsAPI;
  private auth!: AuthService;
  private realtime!: RealtimeService;
  private sse!: SSEManager;
  private storage!: StorageService;
  private rules!: RulesEngine;
  private rulesMiddleware!: RulesMiddleware;
  private hooks!: HooksManager;
  private migrations!: MigrationsManager;
  private server?: ReturnType<typeof createServer>;

  constructor(config: ServerConfig) {
    this.config = config;
  }

  /**
   * Initialize all services
   */
  async init(): Promise<void> {
    // Initialize database
    this.db = initDatabase({ path: this.config.dbPath });

    // Initialize collections manager
    this.collections = new CollectionManager(this.db);

    // Initialize records API
    this.records = new RecordsAPI(this.db, this.collections);

    // Initialize auth service
    this.auth = new AuthService(this.db, this.collections, this.config.jwtSecret);

    // Initialize real-time service
    this.realtime = new RealtimeService(this.db, this.collections);
    this.sse = new SSEManager(this.realtime);

    // Initialize storage service
    this.storage = new StorageService({
      type: 'local',
      basePath: this.config.storagePath,
    });

    // Initialize rules engine
    this.rules = new RulesEngine();
    this.rulesMiddleware = new RulesMiddleware(this.rules);

    // Initialize hooks manager
    this.hooks = new HooksManager();

    // Load hooks if path provided
    if (this.config.hooksPath) {
      try {
        await this.hooks.loadHooksFromFile(this.config.hooksPath);
      } catch (error) {
        console.warn('No hooks file found or error loading hooks');
      }
    }

    // Initialize migrations manager
    this.migrations = new MigrationsManager(
      this.db,
      this.config.migrationsPath || './migrations'
    );

    // Load and run migrations
    await this.migrations.loadMigrations();
    await this.migrations.migrate();

    console.log('✓ All services initialized');
  }

  /**
   * Start the HTTP server
   */
  async start(): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    this.server = createServer(async (req, res) => {
      try {
        await this.handleRequest(req, res);
      } catch (error) {
        console.error('Request error:', error);
        this.sendError(res, 500, 'Internal Server Error');
      }
    });

    return new Promise((resolve) => {
      this.server!.listen(this.config.port, this.config.host, () => {
        console.log(`\n🚀 Server running at http://${this.config.host}:${this.config.port}\n`);
        resolve();
      });
    });
  }

  /**
   * Stop the server
   */
  async stop(): Promise<void> {
    if (this.server) {
      await new Promise<void>((resolve) => {
        this.server!.close(() => resolve());
      });
    }
    this.db.close();
  }

  /**
   * Handle HTTP request
   */
  private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = parse(req.url || '', true);
    const path = url.pathname || '/';
    const method = req.method || 'GET';

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // Parse auth token
    const authHeader = req.headers.authorization;
    let authContext: any = { admin: false };

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        authContext = await this.auth.getUserFromToken(token);
      } catch (error) {
        // Invalid token, continue as guest
      }
    }

    // Route handling
    if (path === '/' || path === '/api') {
      this.sendJSON(res, {
        name: 'Elide PocketBase Clone',
        version: '1.0.0',
        status: 'ok',
      });
      return;
    }

    // Admin auth routes
    if (path === '/api/admins/auth-with-password' && method === 'POST') {
      await this.handleAdminLogin(req, res);
      return;
    }

    // Collection routes
    if (path.startsWith('/api/collections')) {
      await this.handleCollectionRoutes(path, method, req, res, authContext);
      return;
    }

    // Record routes
    if (path.startsWith('/api/records/')) {
      await this.handleRecordRoutes(path, method, req, res, authContext);
      return;
    }

    // Auth routes
    if (path.includes('/auth-with-password')) {
      await this.handleAuthRoutes(path, method, req, res);
      return;
    }

    // Real-time routes
    if (path === '/api/realtime' && method === 'GET') {
      await this.handleRealtime(req, res, authContext);
      return;
    }

    // File routes
    if (path.startsWith('/api/files/')) {
      await this.handleFileRoutes(path, method, req, res, authContext);
      return;
    }

    // Custom endpoints
    const customEndpoint = this.hooks.getEndpoint(method, path);
    if (customEndpoint) {
      await this.handleCustomEndpoint(customEndpoint, req, res, authContext);
      return;
    }

    // 404
    this.sendError(res, 404, 'Not Found');
  }

  /**
   * Handle admin login
   */
  private async handleAdminLogin(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const body = await this.parseBody(req);
    try {
      const result = await this.auth.adminLogin(body.identity, body.password);
      this.sendJSON(res, result);
    } catch (error: any) {
      this.sendError(res, 400, error.message);
    }
  }

  /**
   * Handle collection routes
   */
  private async handleCollectionRoutes(
    path: string,
    method: string,
    req: IncomingMessage,
    res: ServerResponse,
    authContext: any
  ): Promise<void> {
    // Only admins can manage collections
    if (!authContext.admin) {
      this.sendError(res, 403, 'Forbidden');
      return;
    }

    if (path === '/api/collections' && method === 'GET') {
      const collections = this.collections.getAllCollections();
      this.sendJSON(res, collections);
      return;
    }

    if (path === '/api/collections' && method === 'POST') {
      const body = await this.parseBody(req);
      const collection = await this.collections.createCollection(body);
      this.sendJSON(res, collection);
      return;
    }

    const match = path.match(/^\/api\/collections\/([^/]+)$/);
    if (match) {
      const name = match[1];

      if (method === 'GET') {
        const collection = this.collections.getCollection(name);
        if (!collection) {
          this.sendError(res, 404, 'Collection not found');
          return;
        }
        this.sendJSON(res, collection);
        return;
      }

      if (method === 'PATCH') {
        const body = await this.parseBody(req);
        const collection = await this.collections.updateCollection(name, body);
        this.sendJSON(res, collection);
        return;
      }

      if (method === 'DELETE') {
        await this.collections.deleteCollection(name);
        this.sendJSON(res, { success: true });
        return;
      }
    }

    this.sendError(res, 404, 'Not Found');
  }

  /**
   * Handle record routes
   */
  private async handleRecordRoutes(
    path: string,
    method: string,
    req: IncomingMessage,
    res: ServerResponse,
    authContext: any
  ): Promise<void> {
    const parts = path.split('/').filter(Boolean);
    // /api/records/:collection/:id?

    if (parts.length < 3) {
      this.sendError(res, 400, 'Invalid path');
      return;
    }

    const collectionName = parts[2];
    const recordId = parts[3];

    const collection = this.collections.getCollection(collectionName);
    if (!collection) {
      this.sendError(res, 404, 'Collection not found');
      return;
    }

    try {
      if (method === 'GET' && !recordId) {
        // List records
        await this.rulesMiddleware.checkListAccess(collection, authContext);

        const url = parse(req.url || '', true);
        const options: ListOptions = {
          page: Number(url.query.page) || 1,
          perPage: Number(url.query.perPage) || 30,
          sort: url.query.sort as string,
          filter: url.query.filter as string,
          expand: url.query.expand as string,
          fields: url.query.fields as string,
        };

        const result = await this.records.list(collectionName, options);
        this.sendJSON(res, result);
        return;
      }

      if (method === 'GET' && recordId) {
        // Get single record
        const record = await this.records.getOne(collectionName, recordId);
        await this.rulesMiddleware.checkViewAccess(collection, record, authContext);

        const url = parse(req.url || '', true);
        const expand = url.query.expand as string;
        const result = await this.records.getOne(collectionName, recordId, expand);

        this.sendJSON(res, result);
        return;
      }

      if (method === 'POST' && !recordId) {
        // Create record
        const body = await this.parseBody(req);
        await this.rulesMiddleware.checkCreateAccess(collection, body, authContext);

        // Execute before hooks
        let context = await this.hooks.executeHooks('before-create', collectionName, {
          collection,
          data: body,
          auth: authContext,
        });

        const record = await this.records.create(collectionName, context.data || body);

        // Execute after hooks
        await this.hooks.executeHooks('after-create', collectionName, {
          collection,
          record,
          auth: authContext,
        });

        // Emit real-time event
        this.realtime.emitRecordEvent(collectionName, 'create', record);

        this.sendJSON(res, record, 201);
        return;
      }

      if ((method === 'PATCH' || method === 'PUT') && recordId) {
        // Update record
        const body = await this.parseBody(req);
        const existing = await this.records.getOne(collectionName, recordId);
        await this.rulesMiddleware.checkUpdateAccess(collection, existing, body, authContext);

        // Execute before hooks
        let context = await this.hooks.executeHooks('before-update', collectionName, {
          collection,
          record: existing,
          data: body,
          auth: authContext,
        });

        const record = await this.records.update(collectionName, recordId, context.data || body);

        // Execute after hooks
        await this.hooks.executeHooks('after-update', collectionName, {
          collection,
          record,
          auth: authContext,
        });

        // Emit real-time event
        this.realtime.emitRecordEvent(collectionName, 'update', record);

        this.sendJSON(res, record);
        return;
      }

      if (method === 'DELETE' && recordId) {
        // Delete record
        const existing = await this.records.getOne(collectionName, recordId);
        await this.rulesMiddleware.checkDeleteAccess(collection, existing, authContext);

        // Execute before hooks
        await this.hooks.executeHooks('before-delete', collectionName, {
          collection,
          record: existing,
          auth: authContext,
        });

        await this.records.delete(collectionName, recordId);

        // Execute after hooks
        await this.hooks.executeHooks('after-delete', collectionName, {
          collection,
          record: existing,
          auth: authContext,
        });

        // Emit real-time event
        this.realtime.emitRecordEvent(collectionName, 'delete', existing);

        this.sendJSON(res, { success: true });
        return;
      }

      this.sendError(res, 405, 'Method Not Allowed');
    } catch (error: any) {
      this.sendError(res, 400, error.message);
    }
  }

  /**
   * Handle auth routes
   */
  private async handleAuthRoutes(
    path: string,
    method: string,
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<void> {
    if (method !== 'POST') {
      this.sendError(res, 405, 'Method Not Allowed');
      return;
    }

    const body = await this.parseBody(req);

    // Extract collection name from path
    const match = path.match(/\/api\/collections\/([^/]+)\/auth-with-password/);
    if (!match) {
      this.sendError(res, 404, 'Not Found');
      return;
    }

    const collectionName = match[1];

    try {
      const result = await this.auth.loginWithPassword(
        collectionName,
        body.identity,
        body.password
      );
      this.sendJSON(res, result);
    } catch (error: any) {
      this.sendError(res, 400, error.message);
    }
  }

  /**
   * Handle real-time SSE
   */
  private async handleRealtime(
    req: IncomingMessage,
    res: ServerResponse,
    authContext: any
  ): Promise<void> {
    const clientId = nanoid(15);
    this.sse.createConnection(clientId, res);
  }

  /**
   * Handle file routes
   */
  private async handleFileRoutes(
    path: string,
    method: string,
    req: IncomingMessage,
    res: ServerResponse,
    authContext: any
  ): Promise<void> {
    // /api/files/:collection/:recordId/:fieldName/:filename
    const parts = path.split('/').filter(Boolean);

    if (parts.length < 6) {
      this.sendError(res, 400, 'Invalid path');
      return;
    }

    const collectionName = parts[2];
    const recordId = parts[3];
    const fieldName = parts[4];
    const filename = parts[5];

    const collection = this.collections.getCollection(collectionName);
    if (!collection) {
      this.sendError(res, 404, 'Collection not found');
      return;
    }

    try {
      const fileBuffer = await this.storage.getFile(collection, recordId, fieldName, filename);

      // Set content type
      const ext = filename.split('.').pop();
      const mimeType = ext ? require('mime-types').lookup(ext) : 'application/octet-stream';

      res.writeHead(200, {
        'Content-Type': mimeType,
        'Content-Length': fileBuffer.length,
      });
      res.end(fileBuffer);
    } catch (error: any) {
      this.sendError(res, 404, error.message);
    }
  }

  /**
   * Handle custom endpoint
   */
  private async handleCustomEndpoint(
    endpoint: any,
    req: IncomingMessage,
    res: ServerResponse,
    authContext: any
  ): Promise<void> {
    if (endpoint.requireAdmin && !authContext.admin) {
      this.sendError(res, 403, 'Forbidden');
      return;
    }

    if (endpoint.requireAuth && !authContext.auth) {
      this.sendError(res, 401, 'Unauthorized');
      return;
    }

    try {
      const result = await endpoint.handler(req, res);
      if (result !== undefined) {
        this.sendJSON(res, result);
      }
    } catch (error: any) {
      this.sendError(res, 500, error.message);
    }
  }

  /**
   * Parse request body
   */
  private async parseBody(req: IncomingMessage): Promise<any> {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', chunk => (body += chunk.toString()));
      req.on('end', () => {
        try {
          resolve(JSON.parse(body || '{}'));
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
  private sendJSON(res: ServerResponse, data: any, status: number = 200): void {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  }

  /**
   * Send error response
   */
  private sendError(res: ServerResponse, status: number, message: string): void {
    this.sendJSON(res, { error: message }, status);
  }

  /**
   * Get server info
   */
  getInfo() {
    return {
      collections: this.collections.getAllCollections().length,
      realtime: {
        subscriptions: this.realtime.getSubscriptionCount(),
        clients: this.sse.getConnectionCount(),
      },
      hooks: this.hooks.getStats(),
      migrations: this.migrations.getStatus(),
    };
  }
}
