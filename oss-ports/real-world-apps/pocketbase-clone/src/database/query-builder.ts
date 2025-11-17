/**
 * Query Builder
 * Fluent interface for building SQL queries
 */

import { DatabaseConnection } from './connection.js';

export type WhereOperator = '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'NOT LIKE' | 'IN' | 'NOT IN' | 'IS NULL' | 'IS NOT NULL';
export type OrderDirection = 'ASC' | 'DESC';

interface WhereClause {
  column: string;
  operator: WhereOperator;
  value?: any;
  raw?: string;
}

interface JoinClause {
  type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
  table: string;
  on: string;
}

export class QueryBuilder<T = any> {
  private tableName: string;
  private db: DatabaseConnection;
  private selectColumns: string[] = ['*'];
  private whereClauses: WhereClause[] = [];
  private joinClauses: JoinClause[] = [];
  private orderByColumns: { column: string; direction: OrderDirection }[] = [];
  private limitValue?: number;
  private offsetValue?: number;
  private groupByColumns: string[] = [];
  private havingClause?: string;
  private params: any[] = [];

  constructor(table: string, db: DatabaseConnection) {
    this.tableName = table;
    this.db = db;
  }

  /**
   * Select specific columns
   */
  select(...columns: string[]): this {
    this.selectColumns = columns;
    return this;
  }

  /**
   * Add WHERE clause
   */
  where(column: string, operator: WhereOperator | any, value?: any): this {
    // Handle shorthand: where('id', 5) becomes where('id', '=', 5)
    if (value === undefined && operator !== 'IS NULL' && operator !== 'IS NOT NULL') {
      value = operator;
      operator = '=';
    }

    this.whereClauses.push({ column, operator, value });
    if (value !== undefined && operator !== 'IS NULL' && operator !== 'IS NOT NULL') {
      this.params.push(value);
    }
    return this;
  }

  /**
   * Add WHERE IN clause
   */
  whereIn(column: string, values: any[]): this {
    this.whereClauses.push({ column, operator: 'IN', value: values });
    this.params.push(...values);
    return this;
  }

  /**
   * Add WHERE NOT IN clause
   */
  whereNotIn(column: string, values: any[]): this {
    this.whereClauses.push({ column, operator: 'NOT IN', value: values });
    this.params.push(...values);
    return this;
  }

  /**
   * Add WHERE NULL clause
   */
  whereNull(column: string): this {
    this.whereClauses.push({ column, operator: 'IS NULL' });
    return this;
  }

  /**
   * Add WHERE NOT NULL clause
   */
  whereNotNull(column: string): this {
    this.whereClauses.push({ column, operator: 'IS NOT NULL' });
    return this;
  }

  /**
   * Add WHERE LIKE clause
   */
  whereLike(column: string, pattern: string): this {
    this.whereClauses.push({ column, operator: 'LIKE', value: pattern });
    this.params.push(pattern);
    return this;
  }

  /**
   * Add raw WHERE clause
   */
  whereRaw(sql: string, bindings: any[] = []): this {
    this.whereClauses.push({ column: '', operator: '=', raw: sql });
    this.params.push(...bindings);
    return this;
  }

  /**
   * Add JOIN clause
   */
  join(table: string, on: string, type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL' = 'INNER'): this {
    this.joinClauses.push({ type, table, on });
    return this;
  }

  /**
   * Add LEFT JOIN clause
   */
  leftJoin(table: string, on: string): this {
    return this.join(table, on, 'LEFT');
  }

  /**
   * Add RIGHT JOIN clause
   */
  rightJoin(table: string, on: string): this {
    return this.join(table, on, 'RIGHT');
  }

  /**
   * Add ORDER BY clause
   */
  orderBy(column: string, direction: OrderDirection = 'ASC'): this {
    this.orderByColumns.push({ column, direction });
    return this;
  }

  /**
   * Add GROUP BY clause
   */
  groupBy(...columns: string[]): this {
    this.groupByColumns.push(...columns);
    return this;
  }

  /**
   * Add HAVING clause
   */
  having(clause: string): this {
    this.havingClause = clause;
    return this;
  }

  /**
   * Set LIMIT
   */
  limit(limit: number): this {
    this.limitValue = limit;
    return this;
  }

  /**
   * Set OFFSET
   */
  offset(offset: number): this {
    this.offsetValue = offset;
    return this;
  }

  /**
   * Build SELECT query
   */
  private buildSelectQuery(): string {
    let sql = `SELECT ${this.selectColumns.join(', ')} FROM ${this.tableName}`;

    // Add JOINs
    for (const join of this.joinClauses) {
      sql += ` ${join.type} JOIN ${join.table} ON ${join.on}`;
    }

    // Add WHERE clauses
    if (this.whereClauses.length > 0) {
      const conditions = this.whereClauses.map(clause => {
        if (clause.raw) {
          return clause.raw;
        }
        if (clause.operator === 'IS NULL' || clause.operator === 'IS NOT NULL') {
          return `${clause.column} ${clause.operator}`;
        }
        if (clause.operator === 'IN' || clause.operator === 'NOT IN') {
          const placeholders = (clause.value as any[]).map(() => '?').join(', ');
          return `${clause.column} ${clause.operator} (${placeholders})`;
        }
        return `${clause.column} ${clause.operator} ?`;
      });
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    // Add GROUP BY
    if (this.groupByColumns.length > 0) {
      sql += ` GROUP BY ${this.groupByColumns.join(', ')}`;
    }

    // Add HAVING
    if (this.havingClause) {
      sql += ` HAVING ${this.havingClause}`;
    }

    // Add ORDER BY
    if (this.orderByColumns.length > 0) {
      const orders = this.orderByColumns.map(o => `${o.column} ${o.direction}`);
      sql += ` ORDER BY ${orders.join(', ')}`;
    }

    // Add LIMIT
    if (this.limitValue !== undefined) {
      sql += ` LIMIT ${this.limitValue}`;
    }

    // Add OFFSET
    if (this.offsetValue !== undefined) {
      sql += ` OFFSET ${this.offsetValue}`;
    }

    return sql;
  }

  /**
   * Execute query and get all results
   */
  get(): T[] {
    const sql = this.buildSelectQuery();
    return this.db.all<T>(sql, this.params);
  }

  /**
   * Execute query and get first result
   */
  first(): T | undefined {
    this.limit(1);
    const results = this.get();
    return results[0];
  }

  /**
   * Get count of records
   */
  count(): number {
    const originalSelect = this.selectColumns;
    this.selectColumns = ['COUNT(*) as count'];
    const sql = this.buildSelectQuery();
    const result = this.db.get<{ count: number }>(sql, this.params);
    this.selectColumns = originalSelect;
    return result?.count || 0;
  }

  /**
   * Check if any records exist
   */
  exists(): boolean {
    return this.count() > 0;
  }

  /**
   * Insert a record
   */
  insert(data: Partial<T>): number {
    const columns = Object.keys(data);
    const placeholders = columns.map(() => '?').join(', ');
    const values = Object.values(data);

    const sql = `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
    const result = this.db.run(sql, values);
    return result.lastInsertRowid as number;
  }

  /**
   * Insert multiple records
   */
  insertMany(records: Partial<T>[]): number[] {
    if (records.length === 0) return [];

    const ids: number[] = [];
    this.db.transaction(() => {
      for (const record of records) {
        ids.push(this.insert(record));
      }
    });
    return ids;
  }

  /**
   * Update records
   */
  update(data: Partial<T>): number {
    const columns = Object.keys(data);
    const sets = columns.map(col => `${col} = ?`).join(', ');
    const values = Object.values(data);

    let sql = `UPDATE ${this.tableName} SET ${sets}`;

    // Add WHERE clauses
    if (this.whereClauses.length > 0) {
      const conditions = this.whereClauses.map(clause => {
        if (clause.raw) {
          return clause.raw;
        }
        if (clause.operator === 'IS NULL' || clause.operator === 'IS NOT NULL') {
          return `${clause.column} ${clause.operator}`;
        }
        if (clause.operator === 'IN' || clause.operator === 'NOT IN') {
          const placeholders = (clause.value as any[]).map(() => '?').join(', ');
          return `${clause.column} ${clause.operator} (${placeholders})`;
        }
        return `${clause.column} ${clause.operator} ?`;
      });
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    const result = this.db.run(sql, [...values, ...this.params]);
    return result.changes;
  }

  /**
   * Delete records
   */
  delete(): number {
    let sql = `DELETE FROM ${this.tableName}`;

    // Add WHERE clauses
    if (this.whereClauses.length > 0) {
      const conditions = this.whereClauses.map(clause => {
        if (clause.raw) {
          return clause.raw;
        }
        if (clause.operator === 'IS NULL' || clause.operator === 'IS NOT NULL') {
          return `${clause.column} ${clause.operator}`;
        }
        if (clause.operator === 'IN' || clause.operator === 'NOT IN') {
          const placeholders = (clause.value as any[]).map(() => '?').join(', ');
          return `${clause.column} ${clause.operator} (${placeholders})`;
        }
        return `${clause.column} ${clause.operator} ?`;
      });
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    const result = this.db.run(sql, this.params);
    return result.changes;
  }

  /**
   * Increment a column value
   */
  increment(column: string, amount: number = 1): number {
    const sql = `UPDATE ${this.tableName} SET ${column} = ${column} + ?${this.whereClauses.length > 0 ? ' WHERE ' + this.whereClauses.map(c => `${c.column} ${c.operator} ?`).join(' AND ') : ''}`;
    const result = this.db.run(sql, [amount, ...this.params]);
    return result.changes;
  }

  /**
   * Decrement a column value
   */
  decrement(column: string, amount: number = 1): number {
    return this.increment(column, -amount);
  }

  /**
   * Truncate table
   */
  truncate(): void {
    this.db.exec(`DELETE FROM ${this.tableName}`);
    this.db.exec(`DELETE FROM sqlite_sequence WHERE name='${this.tableName}'`);
  }
}

export function table<T = any>(tableName: string, db: DatabaseConnection): QueryBuilder<T> {
  return new QueryBuilder<T>(tableName, db);
}
