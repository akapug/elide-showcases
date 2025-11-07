/**
 * Database Migration Runner
 *
 * Handles database schema migrations with up/down support
 */

import { DatabaseDriver } from './manager';
import { DatabaseConfig, Migration } from '../types';
import { Logger } from '../utils/logger';

/**
 * Migration runner
 */
export class MigrationRunner {
  private driver: DatabaseDriver;
  private config: DatabaseConfig;
  private logger: Logger;
  private migrationsTable: string = '_migrations';

  constructor(driver: DatabaseDriver, config: DatabaseConfig, logger: Logger) {
    this.driver = driver;
    this.config = config;
    this.logger = logger;
  }

  /**
   * Initialize migrations table
   */
  async initialize(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS ${this.migrationsTable} (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await this.driver.query(sql);
    this.logger.debug('Migrations table initialized');
  }

  /**
   * Get all applied migrations
   */
  async getAppliedMigrations(): Promise<Migration[]> {
    await this.initialize();

    const result = await this.driver.query(`
      SELECT id, name, applied_at
      FROM ${this.migrationsTable}
      ORDER BY applied_at
    `);

    return (result.rows || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      up: '',
      down: '',
      timestamp: new Date(row.applied_at),
      appliedAt: new Date(row.applied_at)
    }));
  }

  /**
   * Get all pending migrations
   */
  async getPendingMigrations(): Promise<Migration[]> {
    const applied = await this.getAppliedMigrations();
    const appliedIds = new Set(applied.map(m => m.id));

    // Load migrations from directory or built-in
    const allMigrations = this.getBuiltInMigrations();

    return allMigrations.filter(m => !appliedIds.has(m.id));
  }

  /**
   * Run a migration
   */
  async runMigration(migration: Migration): Promise<void> {
    this.logger.info(`Running migration: ${migration.name}`);

    try {
      await this.driver.beginTransaction();

      // Execute migration SQL
      const statements = this.splitSQL(migration.up);
      for (const statement of statements) {
        if (statement.trim()) {
          await this.driver.query(statement);
        }
      }

      // Record migration
      await this.driver.query(
        `INSERT INTO ${this.migrationsTable} (id, name) VALUES (?, ?)`,
        [migration.id, migration.name]
      );

      await this.driver.commit();

      this.logger.info(`Migration completed: ${migration.name}`);
    } catch (error) {
      await this.driver.rollback();
      this.logger.error(`Migration failed: ${migration.name}`, error);
      throw error;
    }
  }

  /**
   * Rollback a migration
   */
  async rollbackMigration(migration: Migration): Promise<void> {
    this.logger.info(`Rolling back migration: ${migration.name}`);

    try {
      await this.driver.beginTransaction();

      // Execute rollback SQL
      const statements = this.splitSQL(migration.down);
      for (const statement of statements) {
        if (statement.trim()) {
          await this.driver.query(statement);
        }
      }

      // Remove migration record
      await this.driver.query(
        `DELETE FROM ${this.migrationsTable} WHERE id = ?`,
        [migration.id]
      );

      await this.driver.commit();

      this.logger.info(`Rollback completed: ${migration.name}`);
    } catch (error) {
      await this.driver.rollback();
      this.logger.error(`Rollback failed: ${migration.name}`, error);
      throw error;
    }
  }

  /**
   * Get built-in migrations
   */
  private getBuiltInMigrations(): Migration[] {
    return [
      {
        id: '001_create_users',
        name: 'Create users table',
        timestamp: new Date('2024-01-01'),
        up: `
          CREATE TABLE users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            email_verified INTEGER DEFAULT 0,
            password_hash TEXT,
            role TEXT DEFAULT 'user',
            metadata TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP
          );

          CREATE INDEX idx_users_email ON users(email);
          CREATE INDEX idx_users_role ON users(role);
        `,
        down: `
          DROP TABLE IF EXISTS users;
        `
      },
      {
        id: '002_create_sessions',
        name: 'Create sessions table',
        timestamp: new Date('2024-01-02'),
        up: `
          CREATE TABLE sessions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            token TEXT UNIQUE NOT NULL,
            refresh_token TEXT UNIQUE,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ip_address TEXT,
            user_agent TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          );

          CREATE INDEX idx_sessions_user_id ON sessions(user_id);
          CREATE INDEX idx_sessions_token ON sessions(token);
          CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
        `,
        down: `
          DROP TABLE IF EXISTS sessions;
        `
      },
      {
        id: '003_create_storage_buckets',
        name: 'Create storage buckets table',
        timestamp: new Date('2024-01-03'),
        up: `
          CREATE TABLE storage_buckets (
            id TEXT PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            public INTEGER DEFAULT 0,
            file_size_limit INTEGER,
            allowed_mime_types TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE INDEX idx_buckets_name ON storage_buckets(name);
        `,
        down: `
          DROP TABLE IF EXISTS storage_buckets;
        `
      },
      {
        id: '004_create_storage_objects',
        name: 'Create storage objects table',
        timestamp: new Date('2024-01-04'),
        up: `
          CREATE TABLE storage_objects (
            id TEXT PRIMARY KEY,
            bucket_id TEXT NOT NULL,
            name TEXT NOT NULL,
            path TEXT NOT NULL,
            size INTEGER NOT NULL,
            mime_type TEXT NOT NULL,
            metadata TEXT,
            owner_id TEXT,
            public INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (bucket_id) REFERENCES storage_buckets(id) ON DELETE CASCADE,
            FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL,
            UNIQUE(bucket_id, path)
          );

          CREATE INDEX idx_objects_bucket_id ON storage_objects(bucket_id);
          CREATE INDEX idx_objects_owner_id ON storage_objects(owner_id);
          CREATE INDEX idx_objects_path ON storage_objects(path);
        `,
        down: `
          DROP TABLE IF EXISTS storage_objects;
        `
      },
      {
        id: '005_create_edge_functions',
        name: 'Create edge functions table',
        timestamp: new Date('2024-01-05'),
        up: `
          CREATE TABLE edge_functions (
            id TEXT PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            language TEXT NOT NULL,
            code TEXT NOT NULL,
            handler TEXT NOT NULL,
            runtime TEXT NOT NULL,
            environment TEXT,
            timeout INTEGER DEFAULT 30000,
            memory_limit INTEGER DEFAULT 128,
            version INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE INDEX idx_functions_name ON edge_functions(name);
          CREATE INDEX idx_functions_language ON edge_functions(language);
        `,
        down: `
          DROP TABLE IF EXISTS edge_functions;
        `
      },
      {
        id: '006_create_function_invocations',
        name: 'Create function invocations table',
        timestamp: new Date('2024-01-06'),
        up: `
          CREATE TABLE function_invocations (
            id TEXT PRIMARY KEY,
            function_id TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            input TEXT,
            output TEXT,
            error TEXT,
            duration INTEGER,
            memory_used INTEGER,
            started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP,
            FOREIGN KEY (function_id) REFERENCES edge_functions(id) ON DELETE CASCADE
          );

          CREATE INDEX idx_invocations_function_id ON function_invocations(function_id);
          CREATE INDEX idx_invocations_status ON function_invocations(status);
          CREATE INDEX idx_invocations_started_at ON function_invocations(started_at);
        `,
        down: `
          DROP TABLE IF EXISTS function_invocations;
        `
      },
      {
        id: '007_create_webhooks',
        name: 'Create webhooks table',
        timestamp: new Date('2024-01-07'),
        up: `
          CREATE TABLE webhooks (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            table_name TEXT NOT NULL,
            events TEXT NOT NULL,
            url TEXT,
            function_id TEXT,
            headers TEXT,
            enabled INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (function_id) REFERENCES edge_functions(id) ON DELETE SET NULL
          );

          CREATE INDEX idx_webhooks_table_name ON webhooks(table_name);
          CREATE INDEX idx_webhooks_enabled ON webhooks(enabled);
        `,
        down: `
          DROP TABLE IF EXISTS webhooks;
        `
      }
    ];
  }

  /**
   * Split SQL into individual statements
   */
  private splitSQL(sql: string): string[] {
    return sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }
}
