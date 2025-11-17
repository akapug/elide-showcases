/**
 * Prepared statement implementation
 */

import type { Database } from './database';
import * as types from './types';

/**
 * SQLite prepared statement
 */
export class Statement<T = types.RowData> {
  private handle: any;
  private db: Database;
  private sql: string;
  private options: types.StatementOptions;
  private _finalized: boolean = false;
  private bindingsCache: types.BindParameters | null = null;
  private columnNames: string[] = [];
  private safeIntegers: boolean;

  constructor(db: Database, sql: string, options: types.StatementOptions = {}) {
    this.db = db;
    this.sql = sql;
    this.options = {
      raw: false,
      expand: false,
      safeIntegers: false,
      ...options
    };
    this.safeIntegers = this.options.safeIntegers || false;

    // Prepare statement via native binding
    this.handle = this.nativePrepare((db as any).handle, sql);
    this.columnNames = this.nativeColumnNames(this.handle);
  }

  /**
   * Execute statement and return all rows
   */
  all<R = T>(...params: any[]): R[] {
    this.ensureNotFinalized();

    const bindings = this.normalizeBindings(params);
    this.bind(bindings);

    const rows: R[] = [];

    while (this.nativeStep(this.handle)) {
      const row = this.getRow<R>();
      rows.push(row);
    }

    this.nativeReset(this.handle);
    return rows;
  }

  /**
   * Execute statement and return first row
   */
  get<R = T>(...params: any[]): R | undefined {
    this.ensureNotFinalized();

    const bindings = this.normalizeBindings(params);
    this.bind(bindings);

    let result: R | undefined;

    if (this.nativeStep(this.handle)) {
      result = this.getRow<R>();
    }

    this.nativeReset(this.handle);
    return result;
  }

  /**
   * Execute statement without returning rows
   */
  run(...params: any[]): types.QueryResult {
    this.ensureNotFinalized();

    const bindings = this.normalizeBindings(params);
    this.bind(bindings);

    // Execute until complete
    while (this.nativeStep(this.handle)) {
      // Consume rows
    }

    const result: types.QueryResult = {
      rows: [],
      changes: this.nativeChanges(this.handle),
      lastInsertRowid: this.nativeLastInsertRowid(this.handle)
    };

    this.nativeReset(this.handle);
    return result;
  }

  /**
   * Create an iterator for rows
   */
  *iterate<R = T>(...params: any[]): IterableIterator<R> {
    this.ensureNotFinalized();

    const bindings = this.normalizeBindings(params);
    this.bind(bindings);

    while (this.nativeStep(this.handle)) {
      yield this.getRow<R>();
    }

    this.nativeReset(this.handle);
  }

  /**
   * Bind parameters to statement
   */
  bind(...params: any[]): this {
    this.ensureNotFinalized();

    const bindings = this.normalizeBindings(params);
    this.bindingsCache = bindings;

    if (Array.isArray(bindings)) {
      this.nativeBindArray(this.handle, bindings);
    } else {
      this.nativeBindObject(this.handle, bindings);
    }

    return this;
  }

  /**
   * Execute a pluck operation (return single column)
   */
  pluck(toggle: boolean = true): this {
    this.options.raw = toggle;
    return this;
  }

  /**
   * Toggle expansion of joined rows
   */
  expand(toggle: boolean = true): this {
    this.options.expand = toggle;
    return this;
  }

  /**
   * Toggle safe integer mode
   */
  safeIntegers(toggle: boolean = true): this {
    this.safeIntegers = toggle;
    return this;
  }

  /**
   * Get raw statement handle (for advanced use)
   */
  raw(toggle: boolean = true): this {
    this.options.raw = toggle;
    return this;
  }

  /**
   * Get column names
   */
  columns(): types.ColumnMetadata[] {
    this.ensureNotFinalized();
    return this.nativeColumns(this.handle);
  }

  /**
   * Finalize and free statement
   */
  finalize(): void {
    if (this._finalized) {
      return;
    }

    this.nativeFinalize(this.handle);
    this._finalized = true;
    this.handle = null;

    // Remove from database tracking
    (this.db as any)._removeStatement(this);
  }

  /**
   * Get current row data
   */
  private getRow<R>(): R {
    const values = this.nativeRow(this.handle, this.safeIntegers);

    if (this.options.raw) {
      return values as R;
    }

    if (this.options.expand) {
      return this.expandRow(values) as R;
    }

    const row: any = {};
    for (let i = 0; i < this.columnNames.length; i++) {
      row[this.columnNames[i]] = values[i];
    }

    return row as R;
  }

  /**
   * Expand row for joined tables
   */
  private expandRow(values: any[]): any {
    const expanded: any = {};

    for (let i = 0; i < this.columnNames.length; i++) {
      const name = this.columnNames[i];
      const value = values[i];

      if (name.includes('.')) {
        const parts = name.split('.');
        let current = expanded;

        for (let j = 0; j < parts.length - 1; j++) {
          if (!current[parts[j]]) {
            current[parts[j]] = {};
          }
          current = current[parts[j]];
        }

        current[parts[parts.length - 1]] = value;
      } else {
        expanded[name] = value;
      }
    }

    return expanded;
  }

  /**
   * Normalize parameter bindings
   */
  private normalizeBindings(params: any[]): types.BindParameters {
    if (params.length === 0) {
      return [];
    }

    if (params.length === 1) {
      const param = params[0];

      if (Array.isArray(param)) {
        return param;
      }

      if (param !== null && typeof param === 'object' && !Buffer.isBuffer(param)) {
        return param as Record<string, types.BindParameter>;
      }
    }

    return params;
  }

  /**
   * Ensure statement is not finalized
   */
  private ensureNotFinalized(): void {
    if (this._finalized) {
      throw new Error('Statement has been finalized');
    }
  }

  /**
   * Get SQL source
   */
  get source(): string {
    return this.sql;
  }

  /**
   * Check if statement is finalized
   */
  get finalized(): boolean {
    return this._finalized;
  }

  // Native bindings
  private nativePrepare(dbHandle: any, sql: string): any {
    return (globalThis as any).__elide_sqlite_prepare?.(dbHandle, sql) || { mock: true };
  }

  private nativeStep(handle: any): boolean {
    return (globalThis as any).__elide_sqlite_step?.(handle) || false;
  }

  private nativeReset(handle: any): void {
    (globalThis as any).__elide_sqlite_reset?.(handle);
  }

  private nativeFinalize(handle: any): void {
    (globalThis as any).__elide_sqlite_finalize?.(handle);
  }

  private nativeBindArray(handle: any, params: types.BindParameter[]): void {
    (globalThis as any).__elide_sqlite_bind_array?.(handle, params);
  }

  private nativeBindObject(handle: any, params: Record<string, types.BindParameter>): void {
    (globalThis as any).__elide_sqlite_bind_object?.(handle, params);
  }

  private nativeRow(handle: any, safeIntegers: boolean): any[] {
    return (globalThis as any).__elide_sqlite_row?.(handle, safeIntegers) || [];
  }

  private nativeColumnNames(handle: any): string[] {
    return (globalThis as any).__elide_sqlite_column_names?.(handle) || [];
  }

  private nativeColumns(handle: any): types.ColumnMetadata[] {
    return (globalThis as any).__elide_sqlite_columns?.(handle) || [];
  }

  private nativeChanges(handle: any): number {
    return (globalThis as any).__elide_sqlite_changes?.(handle) || 0;
  }

  private nativeLastInsertRowid(handle: any): number | bigint {
    return (globalThis as any).__elide_sqlite_last_insert_rowid?.(handle) || 0;
  }
}
