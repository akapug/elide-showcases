/**
 * ElideSupabase - Open-source Firebase Alternative
 *
 * Complete backend platform with:
 * - Database (PostgreSQL/SQLite)
 * - Auto-generated REST API
 * - Real-time subscriptions
 * - Authentication (email, OAuth, magic links)
 * - File storage with CDN
 * - Polyglot edge functions
 * - Admin dashboard
 *
 * All backend services in one self-hosted binary.
 */

import { DatabaseManager } from './database/manager';
import { RestAPIServer } from './api/rest-api';
import { RealtimeServer } from './api/realtime';
import { GraphQLServer } from './api/graphql';
import { AuthManager } from './auth/manager';
import { StorageManager } from './storage/manager';
import { EdgeFunctionRunner } from './functions/edge-functions';
import { WebhookManager } from './functions/webhooks';
import { AdminDashboard } from './dashboard/admin-ui/dashboard';
import { SQLEditor } from './dashboard/sql-editor/editor';
import { Config, loadConfig } from './config/config';
import { Logger } from './utils/logger';

/**
 * Main ElideSupabase server class
 * Orchestrates all backend services
 */
export class ElideSupabase {
  private config: Config;
  private logger: Logger;
  private database: DatabaseManager;
  private restAPI: RestAPIServer;
  private realtime: RealtimeServer;
  private graphql: GraphQLServer;
  private auth: AuthManager;
  private storage: StorageManager;
  private functions: EdgeFunctionRunner;
  private webhooks: WebhookManager;
  private dashboard: AdminDashboard;
  private sqlEditor: SQLEditor;
  private isRunning: boolean = false;

  constructor(configPath?: string) {
    this.config = loadConfig(configPath);
    this.logger = new Logger(this.config.logging);
    this.logger.info('Initializing ElideSupabase...');
  }

  /**
   * Initialize all services
   */
  async initialize(): Promise<void> {
    try {
      // Initialize database first
      this.logger.info('Initializing database...');
      this.database = new DatabaseManager(this.config.database, this.logger);
      await this.database.initialize();
      await this.database.runMigrations();

      // Initialize authentication
      this.logger.info('Initializing authentication...');
      this.auth = new AuthManager(
        this.config.auth,
        this.database,
        this.logger
      );
      await this.auth.initialize();

      // Initialize storage
      this.logger.info('Initializing storage...');
      this.storage = new StorageManager(
        this.config.storage,
        this.database,
        this.auth,
        this.logger
      );
      await this.storage.initialize();

      // Initialize edge functions
      this.logger.info('Initializing edge functions...');
      this.functions = new EdgeFunctionRunner(
        this.config.functions,
        this.database,
        this.auth,
        this.logger
      );
      await this.functions.initialize();

      // Initialize webhooks
      this.logger.info('Initializing webhooks...');
      this.webhooks = new WebhookManager(
        this.config.webhooks,
        this.database,
        this.functions,
        this.logger
      );
      await this.webhooks.initialize();

      // Initialize API servers
      this.logger.info('Initializing REST API...');
      this.restAPI = new RestAPIServer(
        this.config.api,
        this.database,
        this.auth,
        this.storage,
        this.logger
      );
      await this.restAPI.initialize();

      this.logger.info('Initializing real-time subscriptions...');
      this.realtime = new RealtimeServer(
        this.config.realtime,
        this.database,
        this.auth,
        this.logger
      );
      await this.realtime.initialize();

      if (this.config.graphql?.enabled) {
        this.logger.info('Initializing GraphQL API...');
        this.graphql = new GraphQLServer(
          this.config.graphql,
          this.database,
          this.auth,
          this.logger
        );
        await this.graphql.initialize();
      }

      // Initialize admin dashboard
      if (this.config.dashboard?.enabled) {
        this.logger.info('Initializing admin dashboard...');
        this.dashboard = new AdminDashboard(
          this.config.dashboard,
          this.database,
          this.auth,
          this.storage,
          this.functions,
          this.logger
        );
        await this.dashboard.initialize();

        this.sqlEditor = new SQLEditor(
          this.config.dashboard,
          this.database,
          this.auth,
          this.logger
        );
        await this.sqlEditor.initialize();
      }

      this.logger.info('ElideSupabase initialized successfully!');
    } catch (error) {
      this.logger.error('Failed to initialize ElideSupabase:', error);
      throw error;
    }
  }

  /**
   * Start all services
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('ElideSupabase is already running');
      return;
    }

    try {
      // Start API servers
      await Promise.all([
        this.restAPI.start(),
        this.realtime.start(),
        this.graphql?.start(),
        this.dashboard?.start(),
        this.sqlEditor?.start()
      ].filter(Boolean));

      // Start background services
      await this.webhooks.start();
      await this.storage.startCDN();

      this.isRunning = true;

      this.logger.info('='.repeat(60));
      this.logger.info('ElideSupabase is running!');
      this.logger.info('='.repeat(60));
      this.logger.info(`REST API: http://${this.config.api.host}:${this.config.api.port}`);
      this.logger.info(`Real-time: ws://${this.config.realtime.host}:${this.config.realtime.port}`);

      if (this.config.graphql?.enabled) {
        this.logger.info(`GraphQL: http://${this.config.graphql.host}:${this.config.graphql.port}/graphql`);
      }

      if (this.config.dashboard?.enabled) {
        this.logger.info(`Dashboard: http://${this.config.dashboard.host}:${this.config.dashboard.port}`);
      }

      this.logger.info('='.repeat(60));
    } catch (error) {
      this.logger.error('Failed to start ElideSupabase:', error);
      throw error;
    }
  }

  /**
   * Stop all services gracefully
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.logger.info('Stopping ElideSupabase...');

    try {
      // Stop API servers
      await Promise.all([
        this.restAPI.stop(),
        this.realtime.stop(),
        this.graphql?.stop(),
        this.dashboard?.stop(),
        this.sqlEditor?.stop()
      ].filter(Boolean));

      // Stop background services
      await this.webhooks.stop();
      await this.storage.stopCDN();

      // Close database connections
      await this.database.close();

      this.isRunning = false;
      this.logger.info('ElideSupabase stopped successfully');
    } catch (error) {
      this.logger.error('Error stopping ElideSupabase:', error);
      throw error;
    }
  }

  /**
   * Get service health status
   */
  async getHealth(): Promise<HealthStatus> {
    return {
      status: this.isRunning ? 'healthy' : 'stopped',
      services: {
        database: await this.database.getHealth(),
        restAPI: await this.restAPI.getHealth(),
        realtime: await this.realtime.getHealth(),
        graphql: this.graphql ? await this.graphql.getHealth() : null,
        auth: await this.auth.getHealth(),
        storage: await this.storage.getHealth(),
        functions: await this.functions.getHealth(),
        webhooks: await this.webhooks.getHealth(),
        dashboard: this.dashboard ? await this.dashboard.getHealth() : null
      },
      uptime: this.isRunning ? process.uptime() : 0,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get service statistics
   */
  async getStats(): Promise<ServiceStats> {
    return {
      database: await this.database.getStats(),
      api: await this.restAPI.getStats(),
      realtime: await this.realtime.getStats(),
      auth: await this.auth.getStats(),
      storage: await this.storage.getStats(),
      functions: await this.functions.getStats(),
      webhooks: await this.webhooks.getStats()
    };
  }
}

/**
 * Health status types
 */
interface HealthStatus {
  status: 'healthy' | 'degraded' | 'stopped';
  services: {
    database: any;
    restAPI: any;
    realtime: any;
    graphql: any;
    auth: any;
    storage: any;
    functions: any;
    webhooks: any;
    dashboard: any;
  };
  uptime: number;
  timestamp: string;
}

interface ServiceStats {
  database: any;
  api: any;
  realtime: any;
  auth: any;
  storage: any;
  functions: any;
  webhooks: any;
}

/**
 * CLI entry point
 */
async function main() {
  const configPath = process.argv[2];
  const supabase = new ElideSupabase(configPath);

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nReceived SIGINT, shutting down gracefully...');
    await supabase.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\nReceived SIGTERM, shutting down gracefully...');
    await supabase.stop();
    process.exit(0);
  });

  try {
    await supabase.initialize();
    await supabase.start();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.main) {
  main();
}

export default ElideSupabase;
