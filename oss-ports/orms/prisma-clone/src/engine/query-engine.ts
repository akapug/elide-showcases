/**
 * Query Engine - Executes queries against the database
 */

import { ConnectionPool } from '../connection/pool';
import { QueryEngineConfig, QueryResult, TransactionOptions } from '../types';

/**
 * Query Engine
 */
export class QueryEngine {
  private pool: ConnectionPool;
  private inTransaction: boolean = false;
  private transactionConnection: any = null;

  constructor(private config: QueryEngineConfig) {
    this.pool = config.pool;
  }

  /**
   * Connect to database
   */
  async connect(): Promise<void> {
    await this.pool.connect();
  }

  /**
   * Disconnect from database
   */
  async disconnect(): Promise<void> {
    if (this.inTransaction) {
      await this.rollbackTransaction();
    }
    await this.pool.disconnect();
  }

  /**
   * Execute query
   */
  async execute(query: any): Promise<QueryResult> {
    const connection = this.inTransaction
      ? this.transactionConnection
      : await this.pool.acquire();

    try {
      const result = await this._executeQuery(connection, query);
      return this._formatResult(result);
    } finally {
      if (!this.inTransaction) {
        await this.pool.release(connection);
      }
    }
  }

  /**
   * Execute raw SQL
   */
  async executeRaw(sql: string, params: any[] = []): Promise<QueryResult> {
    const connection = this.inTransaction
      ? this.transactionConnection
      : await this.pool.acquire();

    try {
      const result = await connection.query(sql, params);
      return this._formatResult(result);
    } finally {
      if (!this.inTransaction) {
        await this.pool.release(connection);
      }
    }
  }

  /**
   * Execute command (INSERT, UPDATE, DELETE)
   */
  async executeCommand(sql: string, params: any[] = []): Promise<{ affectedRows: number }> {
    const result = await this.executeRaw(sql, params);
    return { affectedRows: result.affectedRows };
  }

  /**
   * Begin transaction
   */
  async beginTransaction(options?: TransactionOptions): Promise<void> {
    if (this.inTransaction) {
      throw new Error('Transaction already in progress');
    }

    this.transactionConnection = await this.pool.acquire();
    await this.transactionConnection.query('BEGIN');

    if (options?.isolationLevel) {
      await this.transactionConnection.query(
        `SET TRANSACTION ISOLATION LEVEL ${options.isolationLevel}`
      );
    }

    this.inTransaction = true;
  }

  /**
   * Commit transaction
   */
  async commitTransaction(): Promise<void> {
    if (!this.inTransaction) {
      throw new Error('No transaction in progress');
    }

    try {
      await this.transactionConnection.query('COMMIT');
    } finally {
      await this.pool.release(this.transactionConnection);
      this.transactionConnection = null;
      this.inTransaction = false;
    }
  }

  /**
   * Rollback transaction
   */
  async rollbackTransaction(): Promise<void> {
    if (!this.inTransaction) {
      throw new Error('No transaction in progress');
    }

    try {
      await this.transactionConnection.query('ROLLBACK');
    } finally {
      await this.pool.release(this.transactionConnection);
      this.transactionConnection = null;
      this.inTransaction = false;
    }
  }

  /**
   * Execute query on connection
   */
  private async _executeQuery(connection: any, query: any): Promise<any> {
    return connection.query(query.sql, query.params);
  }

  /**
   * Format query result
   */
  private _formatResult(result: any): QueryResult {
    return {
      rows: result.rows || [],
      affectedRows: result.rowCount || 0,
      fields: result.fields || []
    };
  }
}
