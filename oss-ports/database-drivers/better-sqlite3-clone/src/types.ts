/**
 * Type definitions for @elide/better-sqlite3
 */

/**
 * Database open modes
 */
export enum OpenMode {
  READONLY = 0x01,
  READWRITE = 0x02,
  CREATE = 0x04,
  MEMORY = 0x80,
  NOMUTEX = 0x8000,
  FULLMUTEX = 0x10000,
  SHAREDCACHE = 0x20000,
  PRIVATECACHE = 0x40000,
  URI = 0x100
}

/**
 * Database connection options
 */
export interface DatabaseOptions {
  readonly?: boolean;
  fileMustExist?: boolean;
  timeout?: number;
  verbose?: (message?: any, ...additionalArgs: any[]) => void;
  nativeBinding?: string;
  enableWAL?: boolean;
  enableForeignKeys?: boolean;
  cacheSize?: number;
  pageSize?: number;
  memoryLimit?: number;
}

/**
 * Statement options
 */
export interface StatementOptions {
  raw?: boolean;
  expand?: boolean;
  safeIntegers?: boolean;
}

/**
 * Transaction options
 */
export interface TransactionOptions {
  immediate?: boolean;
  exclusive?: boolean;
  deferred?: boolean;
}

/**
 * Backup options
 */
export interface BackupOptions {
  progress?: (info: BackupProgress) => void;
  pageSize?: number;
  pauseBetweenPages?: number;
}

/**
 * Backup progress information
 */
export interface BackupProgress {
  totalPages: number;
  remainingPages: number;
  percentComplete: number;
}

/**
 * Parameter binding types
 */
export type BindParameter = string | number | bigint | Buffer | null;
export type BindParameters = BindParameter[] | Record<string, BindParameter>;

/**
 * Row data from query results
 */
export type RowData = Record<string, any>;

/**
 * Query result
 */
export interface QueryResult<T = RowData> {
  rows: T[];
  changes: number;
  lastInsertRowid: number | bigint;
}

/**
 * User-defined function
 */
export type UserDefinedFunction = (...args: any[]) => any;

/**
 * Aggregate context for user-defined aggregates
 */
export interface AggregateContext {
  step(...args: any[]): void;
  finalize(): any;
  value?: any;
}

/**
 * User-defined aggregate
 */
export interface UserDefinedAggregate {
  start?: () => any;
  step: (context: any, ...args: any[]) => any;
  finalize: (context: any) => any;
  inverse?: (context: any, ...args: any[]) => any;
}

/**
 * SQLite data types
 */
export enum SQLiteType {
  INTEGER = 1,
  FLOAT = 2,
  TEXT = 3,
  BLOB = 4,
  NULL = 5
}

/**
 * Column metadata
 */
export interface ColumnMetadata {
  name: string;
  type: SQLiteType;
  notNull: boolean;
  primaryKey: boolean;
  autoIncrement: boolean;
  table?: string;
  origin?: string;
}

/**
 * Pragma result
 */
export interface PragmaResult {
  [key: string]: any;
}

/**
 * Statistics information
 */
export interface Statistics {
  memory: {
    current: number;
    highwater: number;
  };
  changes: number;
  totalChanges: number;
  lastInsertRowid: number | bigint;
}

/**
 * Connection information
 */
export interface ConnectionInfo {
  filename: string;
  readonly: boolean;
  inTransaction: boolean;
  memory: boolean;
  wal: boolean;
  foreignKeys: boolean;
}
