/**
 * ElideBase - Polyglot Backend-in-a-File
 *
 * Main entry point for ElideBase server.
 * Start the server with: elidebase serve
 */

import { SQLiteDatabase } from './database/sqlite';
import { SchemaManager } from './database/schema';
import { MigrationManager, systemMigrations } from './database/migrations';
import { RestAPI } from './api/rest-api';
import { RealtimeServer, ChangeTracker } from './api/realtime';
import { FileStorage } from './api/files';
import { UserManager } from './auth/users';
import { OAuthManager, OAUTH_PROVIDERS } from './auth/oauth';
import { TokenManager } from './auth/tokens';
import { AdminAPI } from './admin/admin-api';
import { ElideBaseConfig } from './config';

export class ElideBase {
  private db: SQLiteDatabase;
  private schema: SchemaManager;
  private migrations: MigrationManager;
  private restAPI: RestAPI;
  private realtime: RealtimeServer;
  private fileStorage: FileStorage;
  private userManager: UserManager;
  private tokenManager: TokenManager;
  private oauthManager: OAuthManager;
  private adminAPI: AdminAPI;
  private changeTracker: ChangeTracker;
  private config: ElideBaseConfig;

  constructor(config: ElideBaseConfig) {
    this.config = config;
    this.initialize();
  }

  /**
   * Initialize ElideBase components
   */
  private initialize(): void {
    console.log('Initializing ElideBase...');

    // Initialize database
    this.db = new SQLiteDatabase({
      filename: this.config.database.filename,
      wal: this.config.database.wal,
      verbose: this.config.debug
    });

    // Initialize schema manager
    this.schema = new SchemaManager(this.db);

    // Initialize migrations
    this.migrations = new MigrationManager(this.db, this.config.migrations.dir);

    // Register system migrations
    for (const migration of systemMigrations) {
      this.migrations.register(migration);
    }

    // Initialize authentication
    this.userManager = new UserManager(this.db);
    this.tokenManager = new TokenManager(
      this.db,
      this.config.auth.secret,
      this.config.auth.sessionDuration
    );

    // Initialize OAuth if configured
    if (this.config.auth.oauth) {
      this.oauthManager = new OAuthManager(
        this.db,
        this.userManager,
        this.config.auth.oauth
      );
    }

    // Initialize API
    this.restAPI = new RestAPI(this.db, this.schema, this.config.api.basePath);

    // Initialize real-time
    this.realtime = new RealtimeServer(this.db, this.schema);
    this.changeTracker = new ChangeTracker(this.realtime);

    // Initialize file storage
    this.fileStorage = new FileStorage(this.db, {
      baseDir: this.config.storage.baseDir,
      maxFileSize: this.config.storage.maxFileSize,
      allowedMimeTypes: this.config.storage.allowedMimeTypes
    });

    // Initialize admin API
    this.adminAPI = new AdminAPI(this.db, this.schema, this.userManager);

    console.log('ElideBase initialized successfully');
  }

  /**
   * Run database migrations
   */
  async migrate(): Promise<void> {
    console.log('Running migrations...');
    await this.migrations.migrate();
    console.log('Migrations complete');
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    // Run migrations
    await this.migrate();

    console.log(`\n${'='.repeat(60)}`);
    console.log('ElideBase Server Starting...');
    console.log(`${'='.repeat(60)}\n`);

    console.log('Configuration:');
    console.log(`  Database: ${this.config.database.filename}`);
    console.log(`  API Base Path: ${this.config.api.basePath}`);
    console.log(`  Admin Dashboard: ${this.config.admin.enabled ? 'Enabled' : 'Disabled'}`);
    console.log(`  File Storage: ${this.config.storage.baseDir}`);
    console.log(`  Real-time: Enabled`);
    console.log(`  Polyglot Hooks: Enabled\n`);

    // Display statistics
    const stats = this.adminAPI.getStats();
    console.log('Database Statistics:');
    console.log(`  Collections: ${stats.collections}`);
    console.log(`  Users: ${stats.users}`);
    console.log(`  Files: ${stats.files}`);
    console.log(`  Total Records: ${stats.totalRecords}\n`);

    console.log(`${'='.repeat(60)}`);
    console.log('Server ready!');
    console.log(`${'='.repeat(60)}\n`);

    console.log('API Endpoints:');
    console.log(`  REST API: ${this.config.api.basePath}/collections/:collection`);
    console.log(`  Admin API: ${this.config.api.basePath}/admin`);
    console.log(`  Files API: ${this.config.api.basePath}/files`);
    console.log(`  WebSocket: ws://localhost:${this.config.server.port}/ws\n`);

    if (this.config.admin.enabled) {
      console.log(`Admin Dashboard: http://localhost:${this.config.server.port}/admin\n`);
    }

    console.log('Press Ctrl+C to stop\n');

    // Keep process running
    process.stdin.resume();
  }

  /**
   * Stop the server
   */
  stop(): void {
    console.log('\nShutting down ElideBase...');

    // Close database connection
    this.db.close();

    console.log('ElideBase stopped');
    process.exit(0);
  }

  /**
   * Get API instance
   */
  getAPI(): RestAPI {
    return this.restAPI;
  }

  /**
   * Get real-time server
   */
  getRealtime(): RealtimeServer {
    return this.realtime;
  }

  /**
   * Get schema manager
   */
  getSchema(): SchemaManager {
    return this.schema;
  }

  /**
   * Get user manager
   */
  getUserManager(): UserManager {
    return this.userManager;
  }

  /**
   * Get admin API
   */
  getAdminAPI(): AdminAPI {
    return this.adminAPI;
  }
}

/**
 * CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'serve';

  // Load config
  const config = new ElideBaseConfig();

  // Create ElideBase instance
  const elidebase = new ElideBase(config);

  // Handle commands
  switch (command) {
    case 'serve':
      await elidebase.start();
      break;

    case 'migrate':
      await elidebase.migrate();
      console.log('Migrations complete');
      process.exit(0);
      break;

    case 'version':
      console.log('ElideBase v1.0.0');
      process.exit(0);
      break;

    case 'help':
      console.log(`
ElideBase - Polyglot Backend-in-a-File

Usage:
  elidebase serve          Start the server
  elidebase migrate        Run database migrations
  elidebase version        Show version
  elidebase help           Show this help

Features:
  - Embedded SQLite database
  - Auto-generated REST API
  - Real-time WebSocket subscriptions
  - File storage
  - User authentication (email + OAuth)
  - Admin dashboard
  - Polyglot hooks (Python, Ruby, Java)

Documentation: https://elidebase.dev
      `);
      process.exit(0);
      break;

    default:
      console.error(`Unknown command: ${command}`);
      console.log('Run "elidebase help" for usage');
      process.exit(1);
  }

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    elidebase.stop();
  });

  process.on('SIGTERM', () => {
    elidebase.stop();
  });
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export default ElideBase;
