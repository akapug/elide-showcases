/**
 * SQLite Database Driver
 *
 * Implements database operations for SQLite
 */

import { DatabaseDriver } from './manager';
import { DatabaseConfig, Table, Query, QueryResult, Column } from '../types';
import { Logger } from '../utils/logger';

/**
 * SQLite driver implementation
 */
export class SQLiteDriver implements DatabaseDriver {
  private config: DatabaseConfig;
  private logger: Logger;
  private db: any = null;

  constructor(config: DatabaseConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  /**
   * Connect to SQLite database
   */
  async connect(): Promise<void> {
    try {
      // Mock database connection
      // In real implementation, would use better-sqlite3
      this.db = {
        filename: this.config.database,
        mode: 'readwrite',
        verbose: this.logger.debug.bind(this.logger)
      };

      this.logger.info(`Connected to SQLite database: ${this.config.database}`);

      // Enable foreign keys
      await this.query('PRAGMA foreign_keys = ON');
    } catch (error) {
      this.logger.error('SQLite connection failed:', error);
      throw error;
    }
  }

  /**
   * Disconnect from database
   */
  async disconnect(): Promise<void> {
    if (this.db) {
      // In real implementation: this.db.close()
      this.db = null;
      this.logger.info('Disconnected from SQLite');
    }
  }

  /**
   * Execute a SQL query
   */
  async query(sql: string, params?: any[]): Promise<any> {
    try {
      this.logger.debug('Executing query:', sql, params);

      // Mock query execution
      // In real implementation: const result = this.db.prepare(sql).all(params)
      const mockResult = {
        changes: 0,
        lastInsertRowid: 0,
        rows: []
      };

      return mockResult;
    } catch (error) {
      this.logger.error('Query execution failed:', error);
      throw error;
    }
  }

  /**
   * Get all tables in database
   */
  async getTables(): Promise<Table[]> {
    const sql = `
      SELECT name
      FROM sqlite_master
      WHERE type = 'table'
        AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `;

    const result = await this.query(sql);

    const tables: Table[] = [];
    for (const row of result.rows || []) {
      const table = await this.getTable(row.name);
      tables.push(table);
    }

    return tables;
  }

  /**
   * Get table schema
   */
  async getTable(name: string): Promise<Table> {
    // Get columns
    const sql = `PRAGMA table_info(${name})`;
    const result = await this.query(sql);

    const columns: Column[] = (result.rows || []).map((row: any) => ({
      name: row.name,
      type: row.type,
      nullable: row.notnull === 0,
      default: row.dflt_value,
      unique: false,
      autoIncrement: row.pk === 1 && row.type.toUpperCase() === 'INTEGER'
    }));

    // Get primary key
    const primaryKey = (result.rows || [])
      .filter((row: any) => row.pk > 0)
      .sort((a: any, b: any) => a.pk - b.pk)
      .map((row: any) => row.name);

    // Get indexes
    const indexesSql = `PRAGMA index_list(${name})`;
    const indexesResult = await this.query(indexesSql);

    const indexes = [];
    for (const indexRow of indexesResult.rows || []) {
      const indexInfoSql = `PRAGMA index_info(${indexRow.name})`;
      const indexInfo = await this.query(indexInfoSql);

      indexes.push({
        name: indexRow.name,
        columns: (indexInfo.rows || []).map((col: any) => col.name),
        unique: indexRow.unique === 1
      });
    }

    return {
      name,
      schema: 'main',
      columns,
      primaryKey,
      foreignKeys: [],
      indexes,
      policies: []
    };
  }

  /**
   * Create a new table
   */
  async createTable(table: Table): Promise<void> {
    const columnDefs = table.columns.map(col => {
      const parts = [col.name, this.mapColumnType(col.type)];

      if (table.primaryKey.includes(col.name) && col.autoIncrement) {
        parts.push('PRIMARY KEY AUTOINCREMENT');
      }

      if (!col.nullable) {
        parts.push('NOT NULL');
      }

      if (col.default !== undefined) {
        parts.push(`DEFAULT ${col.default}`);
      }

      if (col.unique && !table.primaryKey.includes(col.name)) {
        parts.push('UNIQUE');
      }

      return parts.join(' ');
    });

    // Add composite primary key if not auto-increment
    if (
      table.primaryKey.length > 1 ||
      (table.primaryKey.length === 1 &&
        !table.columns.find(c => c.name === table.primaryKey[0])?.autoIncrement)
    ) {
      columnDefs.push(`PRIMARY KEY (${table.primaryKey.join(', ')})`);
    }

    const sql = `
      CREATE TABLE ${table.name} (
        ${columnDefs.join(',\n        ')}
      )
    `;

    await this.query(sql);

    // Create indexes
    for (const index of table.indexes) {
      await this.createIndex(table.name, index);
    }
  }

  /**
   * Drop a table
   */
  async dropTable(name: string): Promise<void> {
    await this.query(`DROP TABLE IF EXISTS ${name}`);
  }

  /**
   * Insert a row
   */
  async insert(table: string, data: Record<string, any>): Promise<any> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map(() => '?');

    const sql = `
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
    `;

    const result = await this.query(sql, values);

    // Get inserted row
    const selectSql = `SELECT * FROM ${table} WHERE rowid = ?`;
    const selectResult = await this.query(selectSql, [result.lastInsertRowid]);

    return selectResult.rows?.[0];
  }

  /**
   * Update a row
   */
  async update(table: string, id: any, data: Record<string, any>): Promise<any> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const sets = columns.map(col => `${col} = ?`);

    const sql = `
      UPDATE ${table}
      SET ${sets.join(', ')}
      WHERE id = ?
    `;

    await this.query(sql, [...values, id]);

    // Get updated row
    const selectSql = `SELECT * FROM ${table} WHERE id = ?`;
    const selectResult = await this.query(selectSql, [id]);

    return selectResult.rows?.[0];
  }

  /**
   * Delete a row
   */
  async delete(table: string, id: any): Promise<void> {
    const sql = `DELETE FROM ${table} WHERE id = ?`;
    await this.query(sql, [id]);
  }

  /**
   * Select rows with filtering and pagination
   */
  async select(query: Query): Promise<QueryResult> {
    const parts: string[] = [];

    // SELECT clause
    const columns = query.select?.join(', ') || '*';
    parts.push(`SELECT ${columns} FROM ${query.table}`);

    // WHERE clause
    const params: any[] = [];
    if (query.filter && query.filter.length > 0) {
      const conditions = query.filter.map(filter => {
        params.push(filter.value);
        return `${filter.column} ${this.mapOperator(filter.operator)} ?`;
      });
      parts.push(`WHERE ${conditions.join(' AND ')}`);
    }

    // ORDER BY clause
    if (query.orderBy && query.orderBy.length > 0) {
      const orders = query.orderBy.map(
        order => `${order.column} ${order.direction.toUpperCase()}`
      );
      parts.push(`ORDER BY ${orders.join(', ')}`);
    }

    // LIMIT and OFFSET
    if (query.limit) {
      parts.push(`LIMIT ${query.limit}`);
    }
    if (query.offset) {
      parts.push(`OFFSET ${query.offset}`);
    }

    const sql = parts.join(' ');
    const result = await this.query(sql, params);

    // Get total count if needed
    let count: number | undefined;
    if (query.limit || query.offset) {
      const countSql = `SELECT COUNT(*) as count FROM ${query.table}`;
      const countResult = await this.query(countSql);
      count = countResult.rows?.[0]?.count;
    }

    return {
      data: result.rows || [],
      count
    };
  }

  /**
   * Begin transaction
   */
  async beginTransaction(): Promise<void> {
    await this.query('BEGIN TRANSACTION');
  }

  /**
   * Commit transaction
   */
  async commit(): Promise<void> {
    await this.query('COMMIT');
  }

  /**
   * Rollback transaction
   */
  async rollback(): Promise<void> {
    await this.query('ROLLBACK');
  }

  /**
   * Get health status
   */
  async getHealth(): Promise<any> {
    try {
      await this.query('SELECT 1');
      return { status: 'healthy', type: 'sqlite' };
    } catch (error) {
      return { status: 'unhealthy', type: 'sqlite', error };
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<any> {
    const pageSizeSql = `PRAGMA page_size`;
    const pageCountSql = `PRAGMA page_count`;

    const pageSizeResult = await this.query(pageSizeSql);
    const pageCountResult = await this.query(pageCountSql);

    const pageSize = pageSizeResult.rows?.[0]?.page_size || 4096;
    const pageCount = pageCountResult.rows?.[0]?.page_count || 0;

    const tableCountSql = `
      SELECT COUNT(*) as count
      FROM sqlite_master
      WHERE type = 'table'
        AND name NOT LIKE 'sqlite_%'
    `;
    const tableResult = await this.query(tableCountSql);

    return {
      size: pageSize * pageCount,
      tables: tableResult.rows?.[0]?.count || 0,
      pageSize,
      pageCount
    };
  }

  /**
   * Create an index
   */
  private async createIndex(table: string, index: any): Promise<void> {
    const unique = index.unique ? 'UNIQUE' : '';
    const sql = `
      CREATE ${unique} INDEX ${index.name}
      ON ${table} (${index.columns.join(', ')})
    `;
    await this.query(sql);
  }

  /**
   * Map column type to SQLite type
   */
  private mapColumnType(type: string): string {
    const typeMap: Record<string, string> = {
      string: 'TEXT',
      text: 'TEXT',
      integer: 'INTEGER',
      int: 'INTEGER',
      bigint: 'INTEGER',
      float: 'REAL',
      decimal: 'REAL',
      boolean: 'INTEGER',
      date: 'TEXT',
      datetime: 'TEXT',
      timestamp: 'TEXT',
      json: 'TEXT',
      uuid: 'TEXT'
    };

    return typeMap[type.toLowerCase()] || 'TEXT';
  }

  /**
   * Map filter operator to SQL operator
   */
  private mapOperator(operator: string): string {
    const operatorMap: Record<string, string> = {
      eq: '=',
      neq: '!=',
      gt: '>',
      gte: '>=',
      lt: '<',
      lte: '<=',
      like: 'LIKE',
      ilike: 'LIKE', // SQLite doesn't have ILIKE, use COLLATE NOCASE instead
      in: 'IN',
      is: 'IS',
      not: 'IS NOT'
    };

    return operatorMap[operator] || '=';
  }
}
