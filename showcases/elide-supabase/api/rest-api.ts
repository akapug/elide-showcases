/**
 * Auto-generated REST API Server
 *
 * Automatically generates REST endpoints for all database tables
 * Supports CRUD operations, filtering, sorting, pagination
 */

import { DatabaseManager } from '../database/manager';
import { AuthManager } from '../auth/manager';
import { StorageManager } from '../storage/manager';
import { APIConfig, APIRequest, APIResponse, Query, Filter } from '../types';
import { Logger } from '../utils/logger';

/**
 * REST API Server
 */
export class RestAPIServer {
  private config: APIConfig;
  private database: DatabaseManager;
  private auth: AuthManager;
  private storage: StorageManager;
  private logger: Logger;
  private server: any = null;
  private stats = {
    requests: 0,
    errors: 0,
    responseTime: [] as number[]
  };

  constructor(
    config: APIConfig,
    database: DatabaseManager,
    auth: AuthManager,
    storage: StorageManager,
    logger: Logger
  ) {
    this.config = config;
    this.database = database;
    this.auth = auth;
    this.storage = storage;
    this.logger = logger;
  }

  /**
   * Initialize REST API server
   */
  async initialize(): Promise<void> {
    this.logger.info('Initializing REST API server...');

    // In real implementation, would set up Express/Hono server
    // and register routes for all tables
    this.registerRoutes();
  }

  /**
   * Start REST API server
   */
  async start(): Promise<void> {
    // Mock server start
    this.server = {
      host: this.config.host,
      port: this.config.port,
      status: 'running'
    };

    this.logger.info(`REST API server started on ${this.config.host}:${this.config.port}`);
  }

  /**
   * Stop REST API server
   */
  async stop(): Promise<void> {
    if (this.server) {
      this.server.status = 'stopped';
      this.server = null;
      this.logger.info('REST API server stopped');
    }
  }

  /**
   * Register API routes
   */
  private registerRoutes(): void {
    // Auto-generate routes for all tables:
    // GET    /api/v1/:table          - List rows
    // GET    /api/v1/:table/:id      - Get single row
    // POST   /api/v1/:table          - Create row
    // PATCH  /api/v1/:table/:id      - Update row
    // DELETE /api/v1/:table/:id      - Delete row

    this.logger.debug('Auto-generating REST API routes for all tables');
  }

  /**
   * Handle list request
   */
  async handleList(request: APIRequest): Promise<APIResponse> {
    const startTime = Date.now();

    try {
      this.stats.requests++;

      const table = request.path.split('/')[3]; // /api/v1/:table
      const query = this.buildQuery(table, request.query);

      // Check authentication if required
      const userId = request.user?.id;

      const result = await this.database.select(query, userId);

      const duration = Date.now() - startTime;
      this.stats.responseTime.push(duration);

      return {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Response-Time': `${duration}ms`
        },
        body: {
          data: result.data,
          count: result.count,
          error: null
        }
      };
    } catch (error) {
      this.stats.errors++;
      this.logger.error('List request failed:', error);

      return {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        body: {
          data: null,
          error: error instanceof Error ? error.message : 'Internal server error'
        }
      };
    }
  }

  /**
   * Handle get request
   */
  async handleGet(request: APIRequest): Promise<APIResponse> {
    const startTime = Date.now();

    try {
      this.stats.requests++;

      const parts = request.path.split('/');
      const table = parts[3];
      const id = parts[4];

      const query: Query = {
        table,
        filter: [{ column: 'id', operator: 'eq', value: id }]
      };

      const userId = request.user?.id;
      const result = await this.database.select(query, userId);

      if (result.data.length === 0) {
        return {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
          body: {
            data: null,
            error: 'Resource not found'
          }
        };
      }

      const duration = Date.now() - startTime;
      this.stats.responseTime.push(duration);

      return {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Response-Time': `${duration}ms`
        },
        body: {
          data: result.data[0],
          error: null
        }
      };
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Get request failed:', error);

      return {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        body: {
          data: null,
          error: error instanceof Error ? error.message : 'Internal server error'
        }
      };
    }
  }

  /**
   * Handle create request
   */
  async handleCreate(request: APIRequest): Promise<APIResponse> {
    const startTime = Date.now();

    try {
      this.stats.requests++;

      const table = request.path.split('/')[3];
      const userId = request.user?.id;

      const result = await this.database.insert(table, request.body, userId);

      const duration = Date.now() - startTime;
      this.stats.responseTime.push(duration);

      return {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          'X-Response-Time': `${duration}ms`
        },
        body: {
          data: result,
          error: null
        }
      };
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Create request failed:', error);

      return {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        body: {
          data: null,
          error: error instanceof Error ? error.message : 'Internal server error'
        }
      };
    }
  }

  /**
   * Handle update request
   */
  async handleUpdate(request: APIRequest): Promise<APIResponse> {
    const startTime = Date.now();

    try {
      this.stats.requests++;

      const parts = request.path.split('/');
      const table = parts[3];
      const id = parts[4];
      const userId = request.user?.id;

      const result = await this.database.update(table, id, request.body, userId);

      const duration = Date.now() - startTime;
      this.stats.responseTime.push(duration);

      return {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Response-Time': `${duration}ms`
        },
        body: {
          data: result,
          error: null
        }
      };
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Update request failed:', error);

      return {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        body: {
          data: null,
          error: error instanceof Error ? error.message : 'Internal server error'
        }
      };
    }
  }

  /**
   * Handle delete request
   */
  async handleDelete(request: APIRequest): Promise<APIResponse> {
    const startTime = Date.now();

    try {
      this.stats.requests++;

      const parts = request.path.split('/');
      const table = parts[3];
      const id = parts[4];
      const userId = request.user?.id;

      await this.database.delete(table, id, userId);

      const duration = Date.now() - startTime;
      this.stats.responseTime.push(duration);

      return {
        status: 204,
        headers: {
          'X-Response-Time': `${duration}ms`
        },
        body: null
      };
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Delete request failed:', error);

      return {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        body: {
          data: null,
          error: error instanceof Error ? error.message : 'Internal server error'
        }
      };
    }
  }

  /**
   * Build query from request parameters
   */
  private buildQuery(table: string, params: Record<string, any>): Query {
    const query: Query = { table };

    // Select specific columns
    if (params.select) {
      query.select = params.select.split(',').map((s: string) => s.trim());
    }

    // Filters
    const filters: Filter[] = [];
    for (const [key, value] of Object.entries(params)) {
      if (key.startsWith('select') || key.startsWith('order') || key === 'limit' || key === 'offset') {
        continue;
      }

      // Support operators: eq, neq, gt, gte, lt, lte, like, ilike, in, is
      const match = key.match(/^(.+)\[(\w+)\]$/);
      if (match) {
        const [, column, operator] = match;
        filters.push({ column, operator: operator as any, value });
      } else {
        // Default to eq
        filters.push({ column: key, operator: 'eq', value });
      }
    }

    if (filters.length > 0) {
      query.filter = filters;
    }

    // Order by
    if (params.order) {
      query.orderBy = params.order.split(',').map((o: string) => {
        const [column, direction = 'asc'] = o.trim().split('.');
        return { column, direction: direction as 'asc' | 'desc' };
      });
    }

    // Pagination
    if (params.limit) {
      query.limit = parseInt(params.limit, 10);
    }

    if (params.offset) {
      query.offset = parseInt(params.offset, 10);
    }

    return query;
  }

  /**
   * Get server health
   */
  async getHealth(): Promise<any> {
    return {
      status: this.server?.status || 'stopped',
      host: this.config.host,
      port: this.config.port
    };
  }

  /**
   * Get server statistics
   */
  async getStats(): Promise<any> {
    const avgResponseTime =
      this.stats.responseTime.length > 0
        ? this.stats.responseTime.reduce((a, b) => a + b, 0) / this.stats.responseTime.length
        : 0;

    return {
      requests: this.stats.requests,
      errors: this.stats.errors,
      errorRate: this.stats.requests > 0 ? this.stats.errors / this.stats.requests : 0,
      avgResponseTime: Math.round(avgResponseTime),
      uptime: process.uptime()
    };
  }
}
