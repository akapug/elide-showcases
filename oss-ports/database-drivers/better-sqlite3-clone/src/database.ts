/**
 * Database connection implementation
 */

import { Statement } from './statement';
import { Transaction } from './transaction';
import { Backup } from './backup';
import * as types from './types';

/**
 * SQLite database connection
 */
export class Database {
  private handle: any;
  private filename: string;
  private options: types.DatabaseOptions;
  private _open: boolean = false;
  private _inTransaction: boolean = false;
  private statements: Set<Statement> = new Set();
  private customFunctions: Map<string, types.UserDefinedFunction> = new Map();
  private customAggregates: Map<string, types.UserDefinedAggregate> = new Map();

  constructor(filename: string, options: types.DatabaseOptions = {}) {
    this.filename = filename;
    this.options = {
      timeout: 5000,
      enableWAL: false,
      enableForeignKeys: true,
      cacheSize: -2000,
      pageSize: 4096,
      ...options
    };

    this.open();
  }

  /**
   * Open database connection
   */
  private open(): void {
    if (this._open) {
      throw new Error('Database is already open');
    }

    const mode = this.calculateOpenMode();

    // Use Elide's native SQLite binding
    this.handle = this.nativeOpen(this.filename, mode);
    this._open = true;

    // Apply initial pragmas
    this.applyInitialPragmas();

    if (this.options.verbose) {
      this.options.verbose(`Database opened: ${this.filename}`);
    }
  }

  /**
   * Calculate SQLite open mode flags
   */
  private calculateOpenMode(): number {
    let mode = types.OpenMode.READWRITE | types.OpenMode.CREATE;

    if (this.options.readonly) {
      mode = types.OpenMode.READONLY;
    }

    if (this.filename === ':memory:') {
      mode |= types.OpenMode.MEMORY;
    }

    if (this.options.fileMustExist && !this.options.readonly) {
      mode &= ~types.OpenMode.CREATE;
    }

    return mode;
  }

  /**
   * Apply initial pragma settings
   */
  private applyInitialPragmas(): void {
    if (this.options.enableWAL) {
      this.pragma('journal_mode = WAL');
    }

    if (this.options.enableForeignKeys) {
      this.pragma('foreign_keys = ON');
    }

    if (this.options.cacheSize) {
      this.pragma(`cache_size = ${this.options.cacheSize}`);
    }

    if (this.options.timeout) {
      this.pragma(`busy_timeout = ${this.options.timeout}`);
    }
  }

  /**
   * Prepare a SQL statement
   */
  prepare(sql: string, options?: types.StatementOptions): Statement {
    this.ensureOpen();
    const stmt = new Statement(this, sql, options);
    this.statements.add(stmt);
    return stmt;
  }

  /**
   * Execute SQL without returning results
   */
  exec(sql: string): this {
    this.ensureOpen();
    this.nativeExec(this.handle, sql);

    if (this.options.verbose) {
      this.options.verbose(`Executed: ${sql}`);
    }

    return this;
  }

  /**
   * Execute a prepared statement and get all results
   */
  all<T = types.RowData>(sql: string, ...params: any[]): T[] {
    const stmt = this.prepare(sql);
    try {
      return stmt.all<T>(...params);
    } finally {
      stmt.finalize();
    }
  }

  /**
   * Execute a prepared statement and get first result
   */
  get<T = types.RowData>(sql: string, ...params: any[]): T | undefined {
    const stmt = this.prepare(sql);
    try {
      return stmt.get<T>(...params);
    } finally {
      stmt.finalize();
    }
  }

  /**
   * Execute a prepared statement and run without returning results
   */
  run(sql: string, ...params: any[]): types.QueryResult {
    const stmt = this.prepare(sql);
    try {
      return stmt.run(...params);
    } finally {
      stmt.finalize();
    }
  }

  /**
   * Create a transaction function
   */
  transaction<F extends (...args: any[]) => any>(
    fn: F,
    options?: types.TransactionOptions
  ): (...args: Parameters<F>) => ReturnType<F> {
    return Transaction.create(this, fn, options);
  }

  /**
   * Begin a transaction manually
   */
  beginTransaction(options?: types.TransactionOptions): void {
    this.ensureOpen();

    if (this._inTransaction) {
      throw new Error('Already in a transaction');
    }

    let sql = 'BEGIN';
    if (options?.immediate) {
      sql = 'BEGIN IMMEDIATE';
    } else if (options?.exclusive) {
      sql = 'BEGIN EXCLUSIVE';
    } else if (options?.deferred) {
      sql = 'BEGIN DEFERRED';
    }

    this.exec(sql);
    this._inTransaction = true;
  }

  /**
   * Commit current transaction
   */
  commit(): void {
    this.ensureOpen();

    if (!this._inTransaction) {
      throw new Error('Not in a transaction');
    }

    this.exec('COMMIT');
    this._inTransaction = false;
  }

  /**
   * Rollback current transaction
   */
  rollback(): void {
    this.ensureOpen();

    if (!this._inTransaction) {
      throw new Error('Not in a transaction');
    }

    this.exec('ROLLBACK');
    this._inTransaction = false;
  }

  /**
   * Execute or set pragma
   */
  pragma(source: string, options?: { simple?: boolean }): any {
    this.ensureOpen();

    const result = this.nativePragma(this.handle, source);

    if (options?.simple && Array.isArray(result) && result.length === 1) {
      return Object.values(result[0])[0];
    }

    return result;
  }

  /**
   * Create a backup
   */
  backup(destination: string | Database, options?: types.BackupOptions): Backup {
    this.ensureOpen();
    return new Backup(this, destination, options);
  }

  /**
   * Register a user-defined function
   */
  function(name: string, fn: types.UserDefinedFunction): this;
  function(name: string, options: { deterministic?: boolean; varargs?: boolean }, fn: types.UserDefinedFunction): this;
  function(name: string, optionsOrFn: any, fn?: types.UserDefinedFunction): this {
    this.ensureOpen();

    const actualFn = typeof optionsOrFn === 'function' ? optionsOrFn : fn!;
    const options = typeof optionsOrFn === 'object' ? optionsOrFn : {};

    this.customFunctions.set(name, actualFn);
    this.nativeCreateFunction(this.handle, name, actualFn, options);

    return this;
  }

  /**
   * Register a user-defined aggregate
   */
  aggregate(name: string, aggregate: types.UserDefinedAggregate): this {
    this.ensureOpen();

    this.customAggregates.set(name, aggregate);
    this.nativeCreateAggregate(this.handle, name, aggregate);

    return this;
  }

  /**
   * Get column metadata
   */
  table(tableName: string): types.ColumnMetadata[] {
    this.ensureOpen();
    return this.nativeTableInfo(this.handle, tableName);
  }

  /**
   * Load an extension
   */
  loadExtension(path: string): this {
    this.ensureOpen();
    this.nativeLoadExtension(this.handle, path);
    return this;
  }

  /**
   * Get database statistics
   */
  get stats(): types.Statistics {
    this.ensureOpen();
    return this.nativeStats(this.handle);
  }

  /**
   * Get connection information
   */
  get info(): types.ConnectionInfo {
    return {
      filename: this.filename,
      readonly: this.options.readonly || false,
      inTransaction: this._inTransaction,
      memory: this.filename === ':memory:',
      wal: this.pragma('journal_mode', { simple: true }) === 'wal',
      foreignKeys: this.pragma('foreign_keys', { simple: true }) === 1
    };
  }

  /**
   * Get number of changes from last operation
   */
  get changes(): number {
    this.ensureOpen();
    return this.nativeChanges(this.handle);
  }

  /**
   * Get total number of changes
   */
  get totalChanges(): number {
    this.ensureOpen();
    return this.nativeTotalChanges(this.handle);
  }

  /**
   * Get last inserted row ID
   */
  get lastInsertRowid(): number | bigint {
    this.ensureOpen();
    return this.nativeLastInsertRowid(this.handle);
  }

  /**
   * Check if database is open
   */
  get open(): boolean {
    return this._open;
  }

  /**
   * Check if in transaction
   */
  get inTransaction(): boolean {
    return this._inTransaction;
  }

  /**
   * Close database connection
   */
  close(): void {
    if (!this._open) {
      return;
    }

    // Finalize all statements
    for (const stmt of this.statements) {
      stmt.finalize();
    }
    this.statements.clear();

    // Close native handle
    this.nativeClose(this.handle);
    this._open = false;
    this.handle = null;

    if (this.options.verbose) {
      this.options.verbose(`Database closed: ${this.filename}`);
    }
  }

  /**
   * Ensure database is open
   */
  private ensureOpen(): void {
    if (!this._open) {
      throw new Error('Database is not open');
    }
  }

  // Native bindings (implemented via Elide's SQLite integration)
  private nativeOpen(filename: string, mode: number): any {
    // Use Elide's native SQLite binding
    return (globalThis as any).__elide_sqlite_open?.(filename, mode) || { mock: true };
  }

  private nativeClose(handle: any): void {
    (globalThis as any).__elide_sqlite_close?.(handle);
  }

  private nativeExec(handle: any, sql: string): void {
    (globalThis as any).__elide_sqlite_exec?.(handle, sql);
  }

  private nativePragma(handle: any, source: string): any {
    return (globalThis as any).__elide_sqlite_pragma?.(handle, source) || [];
  }

  private nativeCreateFunction(handle: any, name: string, fn: types.UserDefinedFunction, options: any): void {
    (globalThis as any).__elide_sqlite_create_function?.(handle, name, fn, options);
  }

  private nativeCreateAggregate(handle: any, name: string, aggregate: types.UserDefinedAggregate): void {
    (globalThis as any).__elide_sqlite_create_aggregate?.(handle, name, aggregate);
  }

  private nativeTableInfo(handle: any, tableName: string): types.ColumnMetadata[] {
    return (globalThis as any).__elide_sqlite_table_info?.(handle, tableName) || [];
  }

  private nativeLoadExtension(handle: any, path: string): void {
    (globalThis as any).__elide_sqlite_load_extension?.(handle, path);
  }

  private nativeStats(handle: any): types.Statistics {
    return (globalThis as any).__elide_sqlite_stats?.(handle) || {
      memory: { current: 0, highwater: 0 },
      changes: 0,
      totalChanges: 0,
      lastInsertRowid: 0
    };
  }

  private nativeChanges(handle: any): number {
    return (globalThis as any).__elide_sqlite_changes?.(handle) || 0;
  }

  private nativeTotalChanges(handle: any): number {
    return (globalThis as any).__elide_sqlite_total_changes?.(handle) || 0;
  }

  private nativeLastInsertRowid(handle: any): number | bigint {
    return (globalThis as any).__elide_sqlite_last_insert_rowid?.(handle) || 0;
  }

  /**
   * Internal method to remove statement from tracking
   */
  _removeStatement(stmt: Statement): void {
    this.statements.delete(stmt);
  }
}
