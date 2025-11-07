/**
 * Database Manager
 *
 * Handles database connections, queries, and schema management
 * Supports both PostgreSQL and SQLite
 */

import { DatabaseConfig, Table, Query, QueryResult, Migration } from '../types';
import { PostgresDriver } from './postgres';
import { SQLiteDriver } from './sqlite';
import { MigrationRunner } from './migrations';
import { RLSEngine } from './rls';
import { Logger } from '../utils/logger';

/**
 * Database driver interface
 */
export interface DatabaseDriver {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  query(sql: string, params?: any[]): Promise<any>;
  getTables(): Promise<Table[]>;
  getTable(name: string): Promise<Table>;
  createTable(table: Table): Promise<void>;
  dropTable(name: string): Promise<void>;
  insert(table: string, data: Record<string, any>): Promise<any>;
  update(table: string, id: any, data: Record<string, any>): Promise<any>;
  delete(table: string, id: any): Promise<void>;
  select(query: Query): Promise<QueryResult>;
  beginTransaction(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  getHealth(): Promise<any>;
  getStats(): Promise<any>;
}

/**
 * Main database manager
 */
export class DatabaseManager {
  private driver: DatabaseDriver;
  private migrationRunner: MigrationRunner;
  private rlsEngine: RLSEngine;
  private config: DatabaseConfig;
  private logger: Logger;
  private connected: boolean = false;
  private transactionDepth: number = 0;

  constructor(config: DatabaseConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;

    // Initialize appropriate driver
    if (config.type === 'postgresql') {
      this.driver = new PostgresDriver(config, logger);
    } else if (config.type === 'sqlite') {
      this.driver = new SQLiteDriver(config, logger);
    } else {
      throw new Error(`Unsupported database type: ${config.type}`);
    }

    this.migrationRunner = new MigrationRunner(this.driver, config, logger);
    this.rlsEngine = new RLSEngine(this.driver, logger);
  }

  /**
   * Initialize database connection
   */
  async initialize(): Promise<void> {
    try {
      await this.driver.connect();
      this.connected = true;
      this.logger.info(`Connected to ${this.config.type} database: ${this.config.database}`);

      // Enable RLS if PostgreSQL
      if (this.config.type === 'postgresql') {
        await this.rlsEngine.initialize();
      }
    } catch (error) {
      this.logger.error('Failed to initialize database:', error);
      throw error;
    }
  }

  /**
   * Run database migrations
   */
  async runMigrations(): Promise<void> {
    if (!this.config.migrations?.enabled) {
      return;
    }

    try {
      const migrations = await this.migrationRunner.getPendingMigrations();

      if (migrations.length === 0) {
        this.logger.info('No pending migrations');
        return;
      }

      this.logger.info(`Running ${migrations.length} migration(s)...`);

      for (const migration of migrations) {
        await this.migrationRunner.runMigration(migration);
      }

      this.logger.info('All migrations completed successfully');
    } catch (error) {
      this.logger.error('Migration failed:', error);
      throw error;
    }
  }

  /**
   * Get all tables
   */
  async getTables(): Promise<Table[]> {
    this.ensureConnected();
    return await this.driver.getTables();
  }

  /**
   * Get table schema
   */
  async getTable(name: string): Promise<Table> {
    this.ensureConnected();
    return await this.driver.getTable(name);
  }

  /**
   * Create a new table
   */
  async createTable(table: Table): Promise<void> {
    this.ensureConnected();
    await this.driver.createTable(table);
    this.logger.info(`Created table: ${table.name}`);
  }

  /**
   * Drop a table
   */
  async dropTable(name: string): Promise<void> {
    this.ensureConnected();
    await this.driver.dropTable(name);
    this.logger.info(`Dropped table: ${name}`);
  }

  /**
   * Insert a row
   */
  async insert(table: string, data: Record<string, any>, userId?: string): Promise<any> {
    this.ensureConnected();

    // Check RLS policies for INSERT
    if (this.config.type === 'postgresql') {
      const allowed = await this.rlsEngine.checkPolicy(table, 'INSERT', data, userId);
      if (!allowed) {
        throw new Error(`Row-level security policy violation on ${table}`);
      }
    }

    const result = await this.driver.insert(table, data);
    this.logger.debug(`Inserted row into ${table}:`, result);
    return result;
  }

  /**
   * Update a row
   */
  async update(
    table: string,
    id: any,
    data: Record<string, any>,
    userId?: string
  ): Promise<any> {
    this.ensureConnected();

    // Check RLS policies for UPDATE
    if (this.config.type === 'postgresql') {
      const allowed = await this.rlsEngine.checkPolicy(table, 'UPDATE', data, userId);
      if (!allowed) {
        throw new Error(`Row-level security policy violation on ${table}`);
      }
    }

    const result = await this.driver.update(table, id, data);
    this.logger.debug(`Updated row in ${table}:`, result);
    return result;
  }

  /**
   * Delete a row
   */
  async delete(table: string, id: any, userId?: string): Promise<void> {
    this.ensureConnected();

    // Check RLS policies for DELETE
    if (this.config.type === 'postgresql') {
      const allowed = await this.rlsEngine.checkPolicy(table, 'DELETE', { id }, userId);
      if (!allowed) {
        throw new Error(`Row-level security policy violation on ${table}`);
      }
    }

    await this.driver.delete(table, id);
    this.logger.debug(`Deleted row from ${table}:`, id);
  }

  /**
   * Select rows with filtering, ordering, pagination
   */
  async select(query: Query, userId?: string): Promise<QueryResult> {
    this.ensureConnected();

    // Apply RLS policies to query
    if (this.config.type === 'postgresql') {
      query = await this.rlsEngine.applyPolicies(query, userId);
    }

    const result = await this.driver.select(query);
    this.logger.debug(`Selected from ${query.table}:`, result);
    return result;
  }

  /**
   * Execute raw SQL query
   */
  async query(sql: string, params?: any[]): Promise<any> {
    this.ensureConnected();
    return await this.driver.query(sql, params);
  }

  /**
   * Begin a transaction
   */
  async beginTransaction(): Promise<void> {
    this.ensureConnected();

    if (this.transactionDepth === 0) {
      await this.driver.beginTransaction();
    }

    this.transactionDepth++;
    this.logger.debug(`Transaction started (depth: ${this.transactionDepth})`);
  }

  /**
   * Commit a transaction
   */
  async commit(): Promise<void> {
    this.ensureConnected();

    if (this.transactionDepth === 0) {
      throw new Error('No active transaction to commit');
    }

    this.transactionDepth--;

    if (this.transactionDepth === 0) {
      await this.driver.commit();
      this.logger.debug('Transaction committed');
    }
  }

  /**
   * Rollback a transaction
   */
  async rollback(): Promise<void> {
    this.ensureConnected();

    if (this.transactionDepth === 0) {
      throw new Error('No active transaction to rollback');
    }

    this.transactionDepth = 0;
    await this.driver.rollback();
    this.logger.debug('Transaction rolled back');
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.connected) {
      await this.driver.disconnect();
      this.connected = false;
      this.logger.info('Database connection closed');
    }
  }

  /**
   * Get database health status
   */
  async getHealth(): Promise<any> {
    return await this.driver.getHealth();
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<any> {
    return await this.driver.getStats();
  }

  /**
   * Ensure database is connected
   */
  private ensureConnected(): void {
    if (!this.connected) {
      throw new Error('Database not connected');
    }
  }
}
