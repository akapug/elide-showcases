/**
 * Admin Dashboard
 *
 * Web-based admin interface for managing ElideSupabase
 */

import { DatabaseManager } from '../../database/manager';
import { AuthManager } from '../../auth/manager';
import { StorageManager } from '../../storage/manager';
import { EdgeFunctionRunner } from '../../functions/edge-functions';
import { DashboardConfig, DashboardStats } from '../../types';
import { Logger } from '../../utils/logger';

/**
 * Dashboard route
 */
interface Route {
  path: string;
  handler: (request: any) => Promise<any>;
}

/**
 * Admin dashboard
 */
export class AdminDashboard {
  private config: DashboardConfig;
  private database: DatabaseManager;
  private auth: AuthManager;
  private storage: StorageManager;
  private functions: EdgeFunctionRunner;
  private logger: Logger;
  private server: any = null;
  private routes: Route[] = [];

  constructor(
    config: DashboardConfig,
    database: DatabaseManager,
    auth: AuthManager,
    storage: StorageManager,
    functions: EdgeFunctionRunner,
    logger: Logger
  ) {
    this.config = config;
    this.database = database;
    this.auth = auth;
    this.storage = storage;
    this.functions = functions;
    this.logger = logger;
  }

  /**
   * Initialize dashboard
   */
  async initialize(): Promise<void> {
    this.logger.info('Initializing admin dashboard...');

    // Register routes
    this.registerRoutes();

    this.logger.info('Admin dashboard initialized');
  }

  /**
   * Start dashboard server
   */
  async start(): Promise<void> {
    // Mock dashboard server
    this.server = {
      host: this.config.host,
      port: this.config.port,
      status: 'running'
    };

    this.logger.info(
      `Admin dashboard started on http://${this.config.host}:${this.config.port}`
    );
  }

  /**
   * Stop dashboard server
   */
  async stop(): Promise<void> {
    if (this.server) {
      this.server.status = 'stopped';
      this.server = null;
      this.logger.info('Admin dashboard stopped');
    }
  }

  /**
   * Register dashboard routes
   */
  private registerRoutes(): void {
    // Dashboard home
    this.routes.push({
      path: '/',
      handler: this.handleHome.bind(this)
    });

    // Statistics
    this.routes.push({
      path: '/api/stats',
      handler: this.handleStats.bind(this)
    });

    // Database management
    this.routes.push({
      path: '/api/tables',
      handler: this.handleTables.bind(this)
    });

    this.routes.push({
      path: '/api/tables/:table/data',
      handler: this.handleTableData.bind(this)
    });

    // User management
    this.routes.push({
      path: '/api/users',
      handler: this.handleUsers.bind(this)
    });

    // Storage management
    this.routes.push({
      path: '/api/buckets',
      handler: this.handleBuckets.bind(this)
    });

    this.routes.push({
      path: '/api/buckets/:bucket/objects',
      handler: this.handleObjects.bind(this)
    });

    // Function management
    this.routes.push({
      path: '/api/functions',
      handler: this.handleFunctions.bind(this)
    });

    // Logs
    this.routes.push({
      path: '/api/logs',
      handler: this.handleLogs.bind(this)
    });
  }

  /**
   * Handle dashboard home
   */
  private async handleHome(request: any): Promise<any> {
    return {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
      body: this.renderHTML(`
        <html>
          <head>
            <title>ElideSupabase Dashboard</title>
            <style>
              body { font-family: system-ui; margin: 0; padding: 20px; background: #f5f5f5; }
              .container { max-width: 1200px; margin: 0 auto; }
              .header { background: #1a73e8; color: white; padding: 20px; border-radius: 8px; }
              .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
              .stat-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
              .stat-value { font-size: 32px; font-weight: bold; color: #1a73e8; }
              .stat-label { color: #666; margin-top: 5px; }
              .nav { background: white; padding: 15px; border-radius: 8px; margin: 20px 0; }
              .nav a { margin-right: 20px; text-decoration: none; color: #1a73e8; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>ElideSupabase Dashboard</h1>
                <p>All-in-one backend platform</p>
              </div>

              <div class="nav">
                <a href="/">Dashboard</a>
                <a href="/tables">Tables</a>
                <a href="/users">Users</a>
                <a href="/storage">Storage</a>
                <a href="/functions">Functions</a>
                <a href="/logs">Logs</a>
              </div>

              <div class="stats" id="stats">
                Loading statistics...
              </div>
            </div>

            <script>
              fetch('/api/stats')
                .then(r => r.json())
                .then(stats => {
                  document.getElementById('stats').innerHTML = \`
                    <div class="stat-card">
                      <div class="stat-value">\${stats.tables}</div>
                      <div class="stat-label">Tables</div>
                    </div>
                    <div class="stat-card">
                      <div class="stat-value">\${stats.users.total}</div>
                      <div class="stat-label">Users</div>
                    </div>
                    <div class="stat-card">
                      <div class="stat-value">\${stats.functions.total}</div>
                      <div class="stat-label">Functions</div>
                    </div>
                    <div class="stat-card">
                      <div class="stat-value">\${(stats.storage.used / 1024 / 1024).toFixed(2)} MB</div>
                      <div class="stat-label">Storage Used</div>
                    </div>
                  \`;
                });
            </script>
          </body>
        </html>
      `)
    };
  }

  /**
   * Handle statistics request
   */
  private async handleStats(request: any): Promise<any> {
    const stats = await this.getStats();

    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stats)
    };
  }

  /**
   * Handle tables request
   */
  private async handleTables(request: any): Promise<any> {
    const tables = await this.database.getTables();

    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tables)
    };
  }

  /**
   * Handle table data request
   */
  private async handleTableData(request: any): Promise<any> {
    const table = request.params.table;
    const limit = parseInt(request.query.limit || '100', 10);
    const offset = parseInt(request.query.offset || '0', 10);

    const result = await this.database.select({
      table,
      limit,
      offset
    });

    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    };
  }

  /**
   * Handle users request
   */
  private async handleUsers(request: any): Promise<any> {
    const result = await this.database.select({
      table: 'users',
      select: ['id', 'email', 'role', 'created_at', 'last_login'],
      orderBy: [{ column: 'created_at', direction: 'desc' }],
      limit: 100
    });

    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result.data)
    };
  }

  /**
   * Handle buckets request
   */
  private async handleBuckets(request: any): Promise<any> {
    const result = await this.database.select({
      table: 'storage_buckets'
    });

    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result.data)
    };
  }

  /**
   * Handle objects request
   */
  private async handleObjects(request: any): Promise<any> {
    const bucket = request.params.bucket;
    const objects = await this.storage.list(bucket);

    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(objects)
    };
  }

  /**
   * Handle functions request
   */
  private async handleFunctions(request: any): Promise<any> {
    const functions = await this.functions.list();

    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(functions)
    };
  }

  /**
   * Handle logs request
   */
  private async handleLogs(request: any): Promise<any> {
    // In real implementation, would fetch logs from storage
    const logs = [
      { level: 'info', message: 'Server started', timestamp: new Date() },
      { level: 'info', message: 'Database connected', timestamp: new Date() }
    ];

    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logs)
    };
  }

  /**
   * Get dashboard statistics
   */
  private async getStats(): Promise<DashboardStats> {
    const tables = await this.database.getTables();

    const userResult = await this.database.select({
      table: 'users'
    });

    const functionResult = await this.database.select({
      table: 'edge_functions'
    });

    const invocationResult = await this.database.select({
      table: 'function_invocations'
    });

    const dbStats = await this.database.getStats();
    const apiStats = await this.auth.getStats();
    const storageStats = await this.storage.getStats();

    return {
      tables: tables.length,
      rows: 0, // Would need to sum across all tables
      storage: {
        used: storageStats.bytesUploaded,
        limit: 10 * 1024 * 1024 * 1024 // 10GB default
      },
      users: {
        total: userResult.count || 0,
        active: 0 // Would need to count recent logins
      },
      functions: {
        total: functionResult.count || 0,
        invocations: invocationResult.count || 0
      },
      api: {
        requests: apiStats.logins + apiStats.registrations,
        errors: apiStats.failures
      }
    };
  }

  /**
   * Render HTML template
   */
  private renderHTML(content: string): string {
    return content.trim();
  }

  /**
   * Get health status
   */
  async getHealth(): Promise<any> {
    return {
      status: this.server?.status || 'stopped',
      host: this.config.host,
      port: this.config.port
    };
  }
}
