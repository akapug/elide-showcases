/**
 * @elide/better-sqlite3 - Production-ready SQLite driver for Elide
 *
 * High-performance synchronous and asynchronous SQLite3 driver with:
 * - Prepared statements with parameter binding
 * - Transaction support (ACID compliant)
 * - Backup and restore capabilities
 * - User-defined functions and aggregates
 * - Performance optimizations
 * - Full TypeScript support
 */

import { Database } from './database';
import { Statement } from './statement';
import { Transaction } from './transaction';
import { Backup } from './backup';
import * as types from './types';

export { Database, Statement, Transaction, Backup, types };

export default Database;

/**
 * Create a new database connection
 * @param filename Path to database file or ':memory:' for in-memory database
 * @param options Connection options
 */
export function connect(filename: string, options?: types.DatabaseOptions): Database {
  return new Database(filename, options);
}

// Type exports
export type {
  DatabaseOptions,
  OpenMode,
  StatementOptions,
  TransactionOptions,
  BackupOptions,
  BindParameters,
  QueryResult,
  RowData,
  AggregateContext,
  UserDefinedFunction,
  UserDefinedAggregate
} from './types';
