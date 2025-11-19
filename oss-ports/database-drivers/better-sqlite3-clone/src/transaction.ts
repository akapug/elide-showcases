/**
 * Transaction implementation
 */

import type { Database } from './database';
import * as types from './types';

/**
 * Transaction wrapper for ACID-compliant operations
 */
export class Transaction {
  /**
   * Create a transaction function wrapper
   */
  static create<F extends (...args: any[]) => any>(
    db: Database,
    fn: F,
    options?: types.TransactionOptions
  ): (...args: Parameters<F>) => ReturnType<F> {
    if (typeof fn !== 'function') {
      throw new TypeError('Expected a function');
    }

    const transactionMode = this.getTransactionMode(options);

    return function transactionWrapper(...args: Parameters<F>): ReturnType<F> {
      // Check if already in transaction
      if (db.inTransaction) {
        throw new Error('Cannot start a transaction within another transaction');
      }

      // Begin transaction
      db.exec(transactionMode);

      try {
        // Execute function
        const result = fn.apply(null, args);

        // Commit if successful
        db.exec('COMMIT');

        return result;
      } catch (error) {
        // Rollback on error
        try {
          db.exec('ROLLBACK');
        } catch (rollbackError) {
          // Ignore rollback errors
        }

        throw error;
      }
    };
  }

  /**
   * Get transaction mode SQL
   */
  private static getTransactionMode(options?: types.TransactionOptions): string {
    if (options?.exclusive) {
      return 'BEGIN EXCLUSIVE';
    }

    if (options?.immediate) {
      return 'BEGIN IMMEDIATE';
    }

    if (options?.deferred) {
      return 'BEGIN DEFERRED';
    }

    return 'BEGIN';
  }

  /**
   * Execute function within a savepoint
   */
  static savepoint<F extends (...args: any[]) => any>(
    db: Database,
    name: string,
    fn: F
  ): (...args: Parameters<F>) => ReturnType<F> {
    if (typeof fn !== 'function') {
      throw new TypeError('Expected a function');
    }

    return function savepointWrapper(...args: Parameters<F>): ReturnType<F> {
      // Create savepoint
      db.exec(`SAVEPOINT ${name}`);

      try {
        // Execute function
        const result = fn.apply(null, args);

        // Release savepoint if successful
        db.exec(`RELEASE ${name}`);

        return result;
      } catch (error) {
        // Rollback to savepoint on error
        try {
          db.exec(`ROLLBACK TO ${name}`);
        } catch (rollbackError) {
          // Ignore rollback errors
        }

        throw error;
      }
    };
  }
}

/**
 * Async transaction support
 */
export class AsyncTransaction {
  /**
   * Create an async transaction function wrapper
   */
  static create<F extends (...args: any[]) => Promise<any>>(
    db: Database,
    fn: F,
    options?: types.TransactionOptions
  ): (...args: Parameters<F>) => Promise<Awaited<ReturnType<F>>> {
    if (typeof fn !== 'function') {
      throw new TypeError('Expected a function');
    }

    const transactionMode = Transaction['getTransactionMode'](options);

    return async function asyncTransactionWrapper(...args: Parameters<F>): Promise<Awaited<ReturnType<F>>> {
      // Check if already in transaction
      if (db.inTransaction) {
        throw new Error('Cannot start a transaction within another transaction');
      }

      // Begin transaction
      db.exec(transactionMode);

      try {
        // Execute function
        const result = await fn.apply(null, args);

        // Commit if successful
        db.exec('COMMIT');

        return result;
      } catch (error) {
        // Rollback on error
        try {
          db.exec('ROLLBACK');
        } catch (rollbackError) {
          // Ignore rollback errors
        }

        throw error;
      }
    };
  }
}
