/**
 * Database Connection Manager
 * Manages SQLite database connections with pooling and transactions
 */

import Database from 'better-sqlite3';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

export interface DatabaseConfig {
  path: string;
  readonly?: boolean;
  fileMustExist?: boolean;
  timeout?: number;
  verbose?: boolean;
}

export class DatabaseConnection {
  private db: Database.Database;
  private transactionDepth = 0;

  constructor(config: DatabaseConfig) {
    // Ensure directory exists
    const dir = config.path.substring(0, config.path.lastIndexOf('/'));
    if (dir && !existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(config.path, {
      readonly: config.readonly || false,
      fileMustExist: config.fileMustExist || false,
      timeout: config.timeout || 5000,
      verbose: config.verbose ? console.log : undefined,
    });

    // Enable foreign keys
    this.db.pragma('foreign_keys = ON');

    // Set journal mode to WAL for better concurrency
    this.db.pragma('journal_mode = WAL');

    // Set synchronous to NORMAL for better performance
    this.db.pragma('synchronous = NORMAL');

    // Set temp store to memory
    this.db.pragma('temp_store = MEMORY');

    // Set cache size (negative value = KB, 64MB)
    this.db.pragma('cache_size = -64000');
  }

  /**
   * Execute a raw SQL query
   */
  exec(sql: string): void {
    this.db.exec(sql);
  }

  /**
   * Prepare a statement
   */
  prepare<T = any>(sql: string): Database.Statement<T[]> {
    return this.db.prepare<T[]>(sql);
  }

  /**
   * Run a query (INSERT, UPDATE, DELETE)
   */
  run(sql: string, params?: any[]): Database.RunResult {
    const stmt = this.prepare(sql);
    return stmt.run(...(params || []));
  }

  /**
   * Get a single row
   */
  get<T = any>(sql: string, params?: any[]): T | undefined {
    const stmt = this.prepare<T>(sql);
    return stmt.get(...(params || [])) as T | undefined;
  }

  /**
   * Get all rows
   */
  all<T = any>(sql: string, params?: any[]): T[] {
    const stmt = this.prepare<T>(sql);
    return stmt.all(...(params || [])) as T[];
  }

  /**
   * Begin a transaction
   */
  transaction<T>(fn: () => T): T {
    const transaction = this.db.transaction(fn);
    return transaction();
  }

  /**
   * Begin a deferred transaction
   */
  begin(): void {
    this.transactionDepth++;
    if (this.transactionDepth === 1) {
      this.db.exec('BEGIN');
    }
  }

  /**
   * Commit a transaction
   */
  commit(): void {
    if (this.transactionDepth === 0) {
      throw new Error('No transaction to commit');
    }
    this.transactionDepth--;
    if (this.transactionDepth === 0) {
      this.db.exec('COMMIT');
    }
  }

  /**
   * Rollback a transaction
   */
  rollback(): void {
    if (this.transactionDepth === 0) {
      throw new Error('No transaction to rollback');
    }
    this.transactionDepth--;
    if (this.transactionDepth === 0) {
      this.db.exec('ROLLBACK');
    }
  }

  /**
   * Check if a table exists
   */
  tableExists(tableName: string): boolean {
    const result = this.get<{ count: number }>(
      `SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name=?`,
      [tableName]
    );
    return (result?.count || 0) > 0;
  }

  /**
   * Get table schema
   */
  getTableSchema(tableName: string): any[] {
    return this.all(`PRAGMA table_info(${tableName})`);
  }

  /**
   * Get all tables
   */
  getTables(): string[] {
    const tables = this.all<{ name: string }>(
      `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`
    );
    return tables.map(t => t.name);
  }

  /**
   * Get database size in bytes
   */
  getSize(): number {
    const result = this.get<{ page_count: number; page_size: number }>(
      `SELECT
        (SELECT COUNT(*) FROM pragma_page_count()) as page_count,
        (SELECT * FROM pragma_page_size()) as page_size`
    );
    return (result?.page_count || 0) * (result?.page_size || 0);
  }

  /**
   * Vacuum the database
   */
  vacuum(): void {
    this.db.exec('VACUUM');
  }

  /**
   * Optimize the database
   */
  optimize(): void {
    this.db.exec('PRAGMA optimize');
  }

  /**
   * Create a backup
   */
  backup(destinationPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const backup = this.db.backup(destinationPath);

        // Perform incremental backup
        let remaining = -1;
        while (remaining !== 0) {
          backup.step(100);
          remaining = backup.remaining();
        }

        backup.close();
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db.open) {
      this.db.close();
    }
  }

  /**
   * Get the underlying database instance
   */
  getDatabase(): Database.Database {
    return this.db;
  }

  /**
   * Check if database is open
   */
  isOpen(): boolean {
    return this.db.open;
  }
}

// Global database instance
let globalDB: DatabaseConnection | null = null;

export function initDatabase(config: DatabaseConfig): DatabaseConnection {
  if (globalDB) {
    globalDB.close();
  }
  globalDB = new DatabaseConnection(config);
  return globalDB;
}

export function getDatabase(): DatabaseConnection {
  if (!globalDB) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return globalDB;
}

export function closeDatabase(): void {
  if (globalDB) {
    globalDB.close();
    globalDB = null;
  }
}
