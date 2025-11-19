/**
 * Query Builder - SQL query construction
 */

import { WhereInput, OrderByInput } from './types';

/**
 * Query Builder class
 */
export class QueryBuilder {
  private _select: string[] = [];
  private _from: string;
  private _joins: JoinClause[] = [];
  private _where: WhereClause[] = [];
  private _groupBy: string[] = [];
  private _having: WhereClause[] = [];
  private _orderBy: OrderByClause[] = [];
  private _limit?: number;
  private _offset?: number;
  private _distinct?: string[];
  private _values: any[] = [];
  private _returning: string[] = [];

  constructor(tableName: string) {
    this._from = tableName;
  }

  /**
   * Select columns
   */
  select(columns: string[] | string): this {
    if (typeof columns === 'string') {
      this._select.push(columns);
    } else {
      this._select.push(...columns);
    }
    return this;
  }

  /**
   * Join table
   */
  join(table: string, on: string, type: 'INNER' | 'LEFT' | 'RIGHT' = 'INNER'): this {
    this._joins.push({ type, table, on });
    return this;
  }

  /**
   * Where clause
   */
  where(conditions?: WhereInput<any>): this {
    if (conditions) {
      this._where.push(...this._buildWhereClause(conditions));
    }
    return this;
  }

  /**
   * Group by
   */
  groupBy(columns: string[] | string): this {
    if (typeof columns === 'string') {
      this._groupBy.push(columns);
    } else {
      this._groupBy.push(...columns);
    }
    return this;
  }

  /**
   * Having clause
   */
  having(conditions?: any): this {
    if (conditions) {
      this._having.push(...this._buildWhereClause(conditions));
    }
    return this;
  }

  /**
   * Order by
   */
  orderBy(order?: OrderByInput<any>): this {
    if (order) {
      this._orderBy.push(...this._buildOrderByClause(order));
    }
    return this;
  }

  /**
   * Limit (take)
   */
  take(limit?: number): this {
    if (limit !== undefined) {
      this._limit = limit;
    }
    return this;
  }

  /**
   * Offset (skip)
   */
  skip(offset?: number): this {
    if (offset !== undefined) {
      this._offset = offset;
    }
    return this;
  }

  /**
   * Distinct
   */
  distinct(columns?: string | string[]): this {
    if (columns) {
      this._distinct = typeof columns === 'string' ? [columns] : columns;
    }
    return this;
  }

  /**
   * Cursor-based pagination
   */
  cursor(cursor?: any): this {
    if (cursor) {
      this._where.push(...this._buildCursorClause(cursor));
    }
    return this;
  }

  /**
   * Include relations
   */
  include(includes?: any): this {
    if (includes) {
      for (const [relation, config] of Object.entries(includes)) {
        if (config === true || typeof config === 'object') {
          // Add join for relation
          this._joins.push({
            type: 'LEFT',
            table: relation,
            on: `${this._from}.id = ${relation}.${this._from}_id`
          });
        }
      }
    }
    return this;
  }

  /**
   * Insert data
   */
  insert(data: any): this {
    this._values.push(data);
    return this;
  }

  /**
   * Insert many
   */
  insertMany(data: any[]): this {
    this._values.push(...data);
    return this;
  }

  /**
   * Update data
   */
  update(data: any): this {
    this._values.push(data);
    return this;
  }

  /**
   * Delete
   */
  delete(): this {
    return this;
  }

  /**
   * Returning clause
   */
  returning(columns?: string[]): this {
    if (columns) {
      this._returning = columns;
    }
    return this;
  }

  /**
   * Count aggregation
   */
  count(field?: any): this {
    if (field === true || field === undefined) {
      this._select.push('COUNT(*) as count');
    } else {
      for (const key of Object.keys(field)) {
        this._select.push(`COUNT("${key}") as count_${key}`);
      }
    }
    return this;
  }

  /**
   * Aggregate functions
   */
  aggregate(aggregations: any[]): this {
    for (const agg of aggregations) {
      const func = agg.type.toUpperCase();

      if (agg.fields === true) {
        this._select.push(`${func}(*) as ${agg.type}_all`);
      } else {
        for (const field of Object.keys(agg.fields)) {
          this._select.push(`${func}("${field}") as ${agg.type}_${field}`);
        }
      }
    }
    return this;
  }

  /**
   * Build SQL query
   */
  build(): any {
    if (this._values.length > 0 && this._where.length === 0) {
      // INSERT or CREATE
      return this._buildInsert();
    } else if (this._values.length > 0) {
      // UPDATE
      return this._buildUpdate();
    } else if (this._select.length === 0 && this._where.length > 0) {
      // DELETE
      return this._buildDelete();
    } else {
      // SELECT
      return this._buildSelect();
    }
  }

  /**
   * Build SELECT query
   */
  private _buildSelect(): any {
    let sql = 'SELECT ';

    if (this._distinct) {
      sql += `DISTINCT ON (${this._distinct.map(c => `"${c}"`).join(', ')}) `;
    }

    if (this._select.length > 0) {
      sql += this._select.map(c => c.includes('(') ? c : `"${c}"`).join(', ');
    } else {
      sql += '*';
    }

    sql += ` FROM "${this._from}"`;

    // Joins
    for (const join of this._joins) {
      sql += ` ${join.type} JOIN "${join.table}" ON ${join.on}`;
    }

    // Where
    if (this._where.length > 0) {
      sql += ' WHERE ' + this._where.map(w => w.clause).join(' AND ');
    }

    // Group by
    if (this._groupBy.length > 0) {
      sql += ' GROUP BY ' + this._groupBy.map(c => `"${c}"`).join(', ');
    }

    // Having
    if (this._having.length > 0) {
      sql += ' HAVING ' + this._having.map(h => h.clause).join(' AND ');
    }

    // Order by
    if (this._orderBy.length > 0) {
      sql += ' ORDER BY ' + this._orderBy.map(o => `"${o.field}" ${o.direction}`).join(', ');
    }

    // Limit
    if (this._limit !== undefined) {
      sql += ` LIMIT ${this._limit}`;
    }

    // Offset
    if (this._offset !== undefined) {
      sql += ` OFFSET ${this._offset}`;
    }

    return {
      sql,
      params: this._where.flatMap(w => w.params).concat(this._having.flatMap(h => h.params))
    };
  }

  /**
   * Build INSERT query
   */
  private _buildInsert(): any {
    if (this._values.length === 0) {
      throw new Error('No data to insert');
    }

    const fields = Object.keys(this._values[0]);
    const placeholders = this._values.map((_, idx) => {
      const start = idx * fields.length + 1;
      return `(${fields.map((_, i) => `$${start + i}`).join(', ')})`;
    });

    let sql = `INSERT INTO "${this._from}" (${fields.map(f => `"${f}"`).join(', ')}) VALUES ${placeholders.join(', ')}`;

    if (this._returning.length > 0) {
      sql += ` RETURNING ${this._returning.map(c => `"${c}"`).join(', ')}`;
    }

    const params = this._values.flatMap(v => fields.map(f => v[f]));

    return { sql, params };
  }

  /**
   * Build UPDATE query
   */
  private _buildUpdate(): any {
    if (this._values.length === 0) {
      throw new Error('No data to update');
    }

    const data = this._values[0];
    const fields = Object.keys(data);
    const setClauses = fields.map((f, idx) => `"${f}" = $${idx + 1}`);

    let sql = `UPDATE "${this._from}" SET ${setClauses.join(', ')}`;

    const params = fields.map(f => data[f]);

    // Where
    if (this._where.length > 0) {
      const whereParams = this._where.flatMap(w => w.params);
      const whereClauses = this._where.map((w, idx) => {
        return w.clause.replace(/\$(\d+)/g, (_, n) => `$${parseInt(n) + params.length}`);
      });

      sql += ' WHERE ' + whereClauses.join(' AND ');
      params.push(...whereParams);
    }

    if (this._returning.length > 0) {
      sql += ` RETURNING ${this._returning.map(c => `"${c}"`).join(', ')}`;
    }

    return { sql, params };
  }

  /**
   * Build DELETE query
   */
  private _buildDelete(): any {
    let sql = `DELETE FROM "${this._from}"`;
    const params: any[] = [];

    // Where
    if (this._where.length > 0) {
      sql += ' WHERE ' + this._where.map(w => w.clause).join(' AND ');
      params.push(...this._where.flatMap(w => w.params));
    }

    if (this._returning.length > 0) {
      sql += ` RETURNING ${this._returning.map(c => `"${c}"`).join(', ')}`;
    }

    return { sql, params };
  }

  /**
   * Build where clause from conditions
   */
  private _buildWhereClause(conditions: any, prefix = ''): WhereClause[] {
    const clauses: WhereClause[] = [];

    for (const [key, value] of Object.entries(conditions)) {
      const fieldPath = prefix ? `${prefix}."${key}"` : `"${key}"`;

      if (key === 'AND' || key === 'OR' || key === 'NOT') {
        const operator = key === 'NOT' ? 'NOT' : key;
        const subClauses = Array.isArray(value)
          ? value.flatMap(v => this._buildWhereClause(v, prefix))
          : this._buildWhereClause(value, prefix);

        if (subClauses.length > 0) {
          const joined = subClauses.map(c => c.clause).join(` ${operator} `);
          const params = subClauses.flatMap(c => c.params);
          clauses.push({ clause: `(${joined})`, params });
        }
        continue;
      }

      if (value === null) {
        clauses.push({ clause: `${fieldPath} IS NULL`, params: [] });
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        // Condition object
        for (const [op, val] of Object.entries(value)) {
          clauses.push(...this._buildCondition(fieldPath, op, val));
        }
      } else {
        // Direct equality
        clauses.push({
          clause: `${fieldPath} = $${this._getNextParamIndex()}`,
          params: [value]
        });
      }
    }

    return clauses;
  }

  /**
   * Build condition
   */
  private _buildCondition(field: string, operator: string, value: any): WhereClause[] {
    const clauses: WhereClause[] = [];
    const paramIdx = this._getNextParamIndex();

    switch (operator) {
      case 'equals':
        clauses.push({ clause: `${field} = $${paramIdx}`, params: [value] });
        break;
      case 'not':
        if (typeof value === 'object') {
          clauses.push(...this._buildWhereClause({ [field]: value }));
        } else {
          clauses.push({ clause: `${field} != $${paramIdx}`, params: [value] });
        }
        break;
      case 'in':
        clauses.push({
          clause: `${field} IN (${value.map((_: any, i: number) => `$${paramIdx + i}`).join(', ')})`,
          params: value
        });
        break;
      case 'notIn':
        clauses.push({
          clause: `${field} NOT IN (${value.map((_: any, i: number) => `$${paramIdx + i}`).join(', ')})`,
          params: value
        });
        break;
      case 'lt':
        clauses.push({ clause: `${field} < $${paramIdx}`, params: [value] });
        break;
      case 'lte':
        clauses.push({ clause: `${field} <= $${paramIdx}`, params: [value] });
        break;
      case 'gt':
        clauses.push({ clause: `${field} > $${paramIdx}`, params: [value] });
        break;
      case 'gte':
        clauses.push({ clause: `${field} >= $${paramIdx}`, params: [value] });
        break;
      case 'contains':
        clauses.push({ clause: `${field} LIKE $${paramIdx}`, params: [`%${value}%`] });
        break;
      case 'startsWith':
        clauses.push({ clause: `${field} LIKE $${paramIdx}`, params: [`${value}%`] });
        break;
      case 'endsWith':
        clauses.push({ clause: `${field} LIKE $${paramIdx}`, params: [`%${value}`] });
        break;
      case 'search':
        clauses.push({
          clause: `to_tsvector('english', ${field}) @@ plainto_tsquery('english', $${paramIdx})`,
          params: [value]
        });
        break;
    }

    return clauses;
  }

  /**
   * Build order by clause
   */
  private _buildOrderByClause(order: OrderByInput<any>): OrderByClause[] {
    const clauses: OrderByClause[] = [];

    if (Array.isArray(order)) {
      for (const item of order) {
        clauses.push(...this._buildOrderByClause(item));
      }
    } else {
      for (const [field, direction] of Object.entries(order)) {
        if (typeof direction === 'string') {
          clauses.push({ field, direction: direction.toUpperCase() as 'ASC' | 'DESC' });
        } else if (typeof direction === 'object') {
          // Nested order by (e.g., for aggregations)
          for (const [agg, dir] of Object.entries(direction)) {
            clauses.push({
              field: `${agg}(${field})`,
              direction: (dir as string).toUpperCase() as 'ASC' | 'DESC'
            });
          }
        }
      }
    }

    return clauses;
  }

  /**
   * Build cursor clause
   */
  private _buildCursorClause(cursor: any): WhereClause[] {
    const clauses: WhereClause[] = [];

    for (const [field, value] of Object.entries(cursor)) {
      clauses.push({
        clause: `"${field}" > $${this._getNextParamIndex()}`,
        params: [value]
      });
    }

    return clauses;
  }

  /**
   * Get next parameter index
   */
  private _getNextParamIndex(): number {
    return this._where.reduce((sum, w) => sum + w.params.length, 1);
  }
}

/**
 * Raw Query Builder
 */
export class RawQueryBuilder {
  private _sql: string = '';
  private _params: any[] = [];

  /**
   * Set SQL
   */
  sql(sql: string): this {
    this._sql = sql;
    return this;
  }

  /**
   * Add parameter
   */
  param(value: any): this {
    this._params.push(value);
    return this;
  }

  /**
   * Build query
   */
  build(): { sql: string; params: any[] } {
    return {
      sql: this._sql,
      params: this._params
    };
  }
}

/**
 * Helper types
 */
interface JoinClause {
  type: 'INNER' | 'LEFT' | 'RIGHT';
  table: string;
  on: string;
}

interface WhereClause {
  clause: string;
  params: any[];
}

interface OrderByClause {
  field: string;
  direction: 'ASC' | 'DESC';
}
