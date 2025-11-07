/**
 * Database Loader
 *
 * Loads data into database systems with batch processing and error handling.
 */

import { PipelineContext } from '../orchestrator/pipeline';

// Database loader configuration
export interface DbLoaderConfig {
  type: 'sqlite' | 'postgres' | 'mysql' | 'mongodb' | 'mock';
  connection: ConnectionConfig;
  table: string;
  batchSize?: number;
  mode: 'insert' | 'upsert' | 'update' | 'replace';
  conflictKeys?: string[]; // Keys to check for conflicts in upsert mode
  createTable?: boolean;
  schema?: TableSchema;
  onError?: 'continue' | 'rollback' | 'stop';
}

export interface ConnectionConfig {
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  connectionString?: string;
  options?: Record<string, any>;
}

export interface TableSchema {
  columns: ColumnDefinition[];
  primaryKey?: string[];
  indexes?: IndexDefinition[];
}

export interface ColumnDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'json';
  nullable?: boolean;
  unique?: boolean;
  default?: any;
}

export interface IndexDefinition {
  name: string;
  columns: string[];
  unique?: boolean;
}

// Load result
export interface LoadResult {
  totalRecords: number;
  insertedRecords: number;
  updatedRecords: number;
  failedRecords: number;
  errors: LoadError[];
}

export interface LoadError {
  record: any;
  error: string;
}

/**
 * Database Loader
 */
export class DatabaseLoader {
  private connections: Map<string, any> = new Map();

  /**
   * Load data into database
   */
  async load(
    data: any[],
    config: DbLoaderConfig,
    context: PipelineContext
  ): Promise<void> {
    console.log(`[${context.runId}] Loading ${data.length} records to database`);

    const result: LoadResult = {
      totalRecords: data.length,
      insertedRecords: 0,
      updatedRecords: 0,
      failedRecords: 0,
      errors: []
    };

    try {
      // Get or create connection
      const connection = await this.getConnection(config, context);

      // Create table if configured
      if (config.createTable && config.schema) {
        await this.createTable(connection, config, context);
      }

      // Load data in batches
      const batchSize = config.batchSize || 1000;

      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);

        try {
          const batchResult = await this.loadBatch(connection, batch, config, context);

          result.insertedRecords += batchResult.insertedRecords;
          result.updatedRecords += batchResult.updatedRecords;
          result.failedRecords += batchResult.failedRecords;
          result.errors.push(...batchResult.errors);

          console.log(
            `[${context.runId}] Loaded batch ${Math.floor(i / batchSize) + 1}: ` +
            `${batchResult.insertedRecords} inserted, ${batchResult.updatedRecords} updated`
          );

        } catch (error) {
          console.error(`[${context.runId}] Batch load failed:`, error);

          if (config.onError === 'stop') {
            throw error;
          } else if (config.onError === 'rollback') {
            await this.rollback(connection, config);
            throw error;
          } else {
            // Continue on error
            result.failedRecords += batch.length;
            result.errors.push({
              record: batch,
              error: (error as Error).message
            });
          }
        }
      }

      console.log(
        `[${context.runId}] Load complete: ${result.insertedRecords} inserted, ` +
        `${result.updatedRecords} updated, ${result.failedRecords} failed`
      );

    } catch (error) {
      console.error(`[${context.runId}] Database load failed:`, error);
      throw error;
    }
  }

  /**
   * Get or create database connection
   */
  private async getConnection(config: DbLoaderConfig, context: PipelineContext): any {
    const connectionKey = this.getConnectionKey(config);

    if (this.connections.has(connectionKey)) {
      return this.connections.get(connectionKey);
    }

    console.log(`[${context.runId}] Creating database connection: ${config.type}`);

    let connection: any;

    switch (config.type) {
      case 'mock':
        connection = new MockDatabaseConnection();
        break;

      case 'sqlite':
        connection = await this.createSQLiteConnection(config);
        break;

      default:
        throw new Error(`Database type not implemented: ${config.type}`);
    }

    this.connections.set(connectionKey, connection);

    return connection;
  }

  /**
   * Create SQLite connection (mock implementation)
   */
  private async createSQLiteConnection(config: DbLoaderConfig): Promise<any> {
    // In a real implementation, this would use a library like better-sqlite3
    return new MockDatabaseConnection();
  }

  /**
   * Create table if it doesn't exist
   */
  private async createTable(
    connection: any,
    config: DbLoaderConfig,
    context: PipelineContext
  ): Promise<void> {
    if (!config.schema) {
      return;
    }

    console.log(`[${context.runId}] Creating table: ${config.table}`);

    const columns = config.schema.columns.map(col => {
      const parts = [col.name];

      // Add type
      parts.push(this.mapColumnType(col.type, config.type));

      // Add constraints
      if (!col.nullable) {
        parts.push('NOT NULL');
      }

      if (col.unique) {
        parts.push('UNIQUE');
      }

      if (col.default !== undefined) {
        parts.push(`DEFAULT ${JSON.stringify(col.default)}`);
      }

      return parts.join(' ');
    });

    // Add primary key
    if (config.schema.primaryKey && config.schema.primaryKey.length > 0) {
      columns.push(`PRIMARY KEY (${config.schema.primaryKey.join(', ')})`);
    }

    const sql = `CREATE TABLE IF NOT EXISTS ${config.table} (${columns.join(', ')})`;

    await connection.execute(sql);

    // Create indexes
    if (config.schema.indexes) {
      for (const index of config.schema.indexes) {
        const uniqueStr = index.unique ? 'UNIQUE' : '';
        const sql = `CREATE ${uniqueStr} INDEX IF NOT EXISTS ${index.name} ` +
          `ON ${config.table} (${index.columns.join(', ')})`;
        await connection.execute(sql);
      }
    }
  }

  /**
   * Map column type to database-specific type
   */
  private mapColumnType(type: string, dbType: string): string {
    const typeMap: Record<string, Record<string, string>> = {
      sqlite: {
        string: 'TEXT',
        number: 'REAL',
        boolean: 'INTEGER',
        date: 'TEXT',
        json: 'TEXT'
      },
      postgres: {
        string: 'VARCHAR',
        number: 'NUMERIC',
        boolean: 'BOOLEAN',
        date: 'TIMESTAMP',
        json: 'JSONB'
      },
      mysql: {
        string: 'VARCHAR(255)',
        number: 'DECIMAL',
        boolean: 'BOOLEAN',
        date: 'DATETIME',
        json: 'JSON'
      }
    };

    return typeMap[dbType]?.[type] || 'TEXT';
  }

  /**
   * Load a batch of records
   */
  private async loadBatch(
    connection: any,
    batch: any[],
    config: DbLoaderConfig,
    context: PipelineContext
  ): Promise<LoadResult> {
    const result: LoadResult = {
      totalRecords: batch.length,
      insertedRecords: 0,
      updatedRecords: 0,
      failedRecords: 0,
      errors: []
    };

    switch (config.mode) {
      case 'insert':
        result.insertedRecords = await this.insertRecords(connection, batch, config);
        break;

      case 'upsert':
        const upsertResult = await this.upsertRecords(connection, batch, config);
        result.insertedRecords = upsertResult.inserted;
        result.updatedRecords = upsertResult.updated;
        break;

      case 'update':
        result.updatedRecords = await this.updateRecords(connection, batch, config);
        break;

      case 'replace':
        await this.deleteRecords(connection, batch, config);
        result.insertedRecords = await this.insertRecords(connection, batch, config);
        break;
    }

    return result;
  }

  /**
   * Insert records
   */
  private async insertRecords(
    connection: any,
    records: any[],
    config: DbLoaderConfig
  ): Promise<number> {
    if (records.length === 0) {
      return 0;
    }

    const columns = Object.keys(records[0]);
    const placeholders = columns.map(() => '?').join(', ');

    const sql = `INSERT INTO ${config.table} (${columns.join(', ')}) VALUES (${placeholders})`;

    const values = records.map(record => columns.map(col => record[col]));

    await connection.executeBatch(sql, values);

    return records.length;
  }

  /**
   * Upsert records (insert or update)
   */
  private async upsertRecords(
    connection: any,
    records: any[],
    config: DbLoaderConfig
  ): Promise<{ inserted: number; updated: number }> {
    let inserted = 0;
    let updated = 0;

    for (const record of records) {
      const exists = await this.recordExists(connection, record, config);

      if (exists) {
        await this.updateRecords(connection, [record], config);
        updated++;
      } else {
        await this.insertRecords(connection, [record], config);
        inserted++;
      }
    }

    return { inserted, updated };
  }

  /**
   * Update records
   */
  private async updateRecords(
    connection: any,
    records: any[],
    config: DbLoaderConfig
  ): Promise<number> {
    if (records.length === 0 || !config.conflictKeys || config.conflictKeys.length === 0) {
      return 0;
    }

    let updated = 0;

    for (const record of records) {
      const columns = Object.keys(record).filter(k => !config.conflictKeys!.includes(k));
      const setClause = columns.map(col => `${col} = ?`).join(', ');
      const whereClause = config.conflictKeys.map(key => `${key} = ?`).join(' AND ');

      const sql = `UPDATE ${config.table} SET ${setClause} WHERE ${whereClause}`;

      const values = [
        ...columns.map(col => record[col]),
        ...config.conflictKeys.map(key => record[key])
      ];

      await connection.execute(sql, values);
      updated++;
    }

    return updated;
  }

  /**
   * Delete records
   */
  private async deleteRecords(
    connection: any,
    records: any[],
    config: DbLoaderConfig
  ): Promise<number> {
    if (records.length === 0 || !config.conflictKeys || config.conflictKeys.length === 0) {
      return 0;
    }

    let deleted = 0;

    for (const record of records) {
      const whereClause = config.conflictKeys.map(key => `${key} = ?`).join(' AND ');
      const sql = `DELETE FROM ${config.table} WHERE ${whereClause}`;
      const values = config.conflictKeys.map(key => record[key]);

      await connection.execute(sql, values);
      deleted++;
    }

    return deleted;
  }

  /**
   * Check if record exists
   */
  private async recordExists(
    connection: any,
    record: any,
    config: DbLoaderConfig
  ): Promise<boolean> {
    if (!config.conflictKeys || config.conflictKeys.length === 0) {
      return false;
    }

    const whereClause = config.conflictKeys.map(key => `${key} = ?`).join(' AND ');
    const sql = `SELECT 1 FROM ${config.table} WHERE ${whereClause} LIMIT 1`;
    const values = config.conflictKeys.map(key => record[key]);

    const result = await connection.query(sql, values);

    return result.length > 0;
  }

  /**
   * Rollback transaction
   */
  private async rollback(connection: any, config: DbLoaderConfig): Promise<void> {
    await connection.rollback();
  }

  /**
   * Get connection key for caching
   */
  private getConnectionKey(config: DbLoaderConfig): string {
    return `${config.type}:${config.connection.host}:${config.connection.database}`;
  }

  /**
   * Close all connections
   */
  async closeConnections(): Promise<void> {
    for (const [key, connection] of this.connections) {
      try {
        await connection.close();
      } catch (error) {
        console.error(`Failed to close connection ${key}:`, error);
      }
    }

    this.connections.clear();
  }
}

/**
 * Mock database connection for testing
 */
class MockDatabaseConnection {
  private tables: Map<string, any[]> = new Map();

  async execute(sql: string, values?: any[]): Promise<void> {
    console.log('Mock DB Execute:', sql, values);
  }

  async executeBatch(sql: string, valuesList: any[][]): Promise<void> {
    console.log('Mock DB Execute Batch:', sql, `${valuesList.length} rows`);
  }

  async query(sql: string, values?: any[]): Promise<any[]> {
    console.log('Mock DB Query:', sql, values);
    return [];
  }

  async rollback(): Promise<void> {
    console.log('Mock DB Rollback');
  }

  async close(): Promise<void> {
    console.log('Mock DB Close');
  }
}
