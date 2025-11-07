/**
 * QueryBuilder - Fluent SQL-like API for building queries
 * Provides a familiar interface for developers coming from SQL databases
 */

import {
  Document,
  TableName,
  Query,
  WhereClause,
  WhereOperator,
  OrderByClause,
  StorageAdapter,
  Subscription
} from '../types';
import { SubscriptionManager } from './subscriptions';

export class QueryBuilder<T extends Document> {
  private tableName: TableName;
  private storage: StorageAdapter;
  private subscriptionManager: SubscriptionManager;
  private query: Query;

  constructor(
    tableName: TableName,
    storage: StorageAdapter,
    subscriptionManager: SubscriptionManager
  ) {
    this.tableName = tableName;
    this.storage = storage;
    this.subscriptionManager = subscriptionManager;
    this.query = {
      table: tableName
    };
  }

  /**
   * Filter documents by field values
   *
   * @example
   * db.table('users').where('age', 25)
   * db.table('users').where('age', '>', 18)
   */
  where(field: string, operator: any, value?: any): this {
    if (value === undefined) {
      // Two-argument form: where(field, value)
      value = operator;
      operator = '$eq';
    } else {
      // Three-argument form: where(field, operator, value)
      operator = this.normalizeOperator(operator);
    }

    if (!this.query.where) {
      this.query.where = {};
    }

    this.query.where[field] = { [operator]: value };

    return this;
  }

  /**
   * Filter by exact match
   *
   * @example
   * db.table('users').whereEquals('status', 'active')
   */
  whereEquals(field: string, value: any): this {
    return this.where(field, '$eq', value);
  }

  /**
   * Filter by inequality
   *
   * @example
   * db.table('users').whereNotEquals('status', 'banned')
   */
  whereNotEquals(field: string, value: any): this {
    return this.where(field, '$ne', value);
  }

  /**
   * Filter by greater than
   *
   * @example
   * db.table('products').whereGreaterThan('price', 100)
   */
  whereGreaterThan(field: string, value: number): this {
    return this.where(field, '$gt', value);
  }

  /**
   * Filter by greater than or equal
   *
   * @example
   * db.table('products').whereGreaterThanOrEqual('rating', 4.5)
   */
  whereGreaterThanOrEqual(field: string, value: number): this {
    return this.where(field, '$gte', value);
  }

  /**
   * Filter by less than
   *
   * @example
   * db.table('products').whereLessThan('price', 50)
   */
  whereLessThan(field: string, value: number): this {
    return this.where(field, '$lt', value);
  }

  /**
   * Filter by less than or equal
   *
   * @example
   * db.table('products').whereLessThanOrEqual('stock', 10)
   */
  whereLessThanOrEqual(field: string, value: number): this {
    return this.where(field, '$lte', value);
  }

  /**
   * Filter by value in array
   *
   * @example
   * db.table('users').whereIn('role', ['admin', 'moderator'])
   */
  whereIn(field: string, values: any[]): this {
    return this.where(field, '$in', values);
  }

  /**
   * Filter by value not in array
   *
   * @example
   * db.table('users').whereNotIn('status', ['banned', 'suspended'])
   */
  whereNotIn(field: string, values: any[]): this {
    return this.where(field, '$nin', values);
  }

  /**
   * Filter by pattern match (SQL LIKE)
   *
   * @example
   * db.table('users').whereLike('email', '%@example.com')
   */
  whereLike(field: string, pattern: string): this {
    return this.where(field, '$like', pattern);
  }

  /**
   * Filter by multiple conditions (AND)
   *
   * @example
   * db.table('users').whereMultiple({
   *   age: { $gte: 18 },
   *   status: 'active'
   * })
   */
  whereMultiple(conditions: WhereClause): this {
    this.query.where = {
      ...this.query.where,
      ...conditions
    };
    return this;
  }

  /**
   * Sort results by field
   *
   * @example
   * db.table('users').orderBy('createdAt', 'DESC')
   */
  orderBy(field: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    if (!this.query.orderBy) {
      this.query.orderBy = [];
    }

    this.query.orderBy.push({ field, direction });

    return this;
  }

  /**
   * Sort in ascending order
   *
   * @example
   * db.table('products').orderByAsc('price')
   */
  orderByAsc(field: string): this {
    return this.orderBy(field, 'ASC');
  }

  /**
   * Sort in descending order
   *
   * @example
   * db.table('products').orderByDesc('rating')
   */
  orderByDesc(field: string): this {
    return this.orderBy(field, 'DESC');
  }

  /**
   * Limit number of results
   *
   * @example
   * db.table('users').limit(10)
   */
  limit(count: number): this {
    this.query.limit = count;
    return this;
  }

  /**
   * Skip number of results
   *
   * @example
   * db.table('users').offset(20)
   */
  offset(count: number): this {
    this.query.offset = count;
    return this;
  }

  /**
   * Paginate results
   *
   * @example
   * db.table('users').paginate(2, 10) // page 2, 10 items per page
   */
  paginate(page: number, perPage: number): this {
    this.query.offset = (page - 1) * perPage;
    this.query.limit = perPage;
    return this;
  }

  /**
   * Execute the query and get results
   *
   * @example
   * const users = await db.table('users').where('age', '>', 18).get()
   */
  async get(): Promise<T[]> {
    return this.storage.query(this.query) as Promise<T[]>;
  }

  /**
   * Get first result
   *
   * @example
   * const user = await db.table('users').where('email', email).first()
   */
  async first(): Promise<T | null> {
    const results = await this.limit(1).get();
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Get count of matching documents
   *
   * @example
   * const count = await db.table('users').where('status', 'active').count()
   */
  async count(): Promise<number> {
    const results = await this.get();
    return results.length;
  }

  /**
   * Check if any documents match the query
   *
   * @example
   * const exists = await db.table('users').where('email', email).exists()
   */
  async exists(): Promise<boolean> {
    const count = await this.count();
    return count > 0;
  }

  /**
   * Get all documents from the table
   *
   * @example
   * const allUsers = await db.table('users').all()
   */
  async all(): Promise<T[]> {
    return this.storage.getAll(this.tableName) as Promise<T[]>;
  }

  /**
   * Subscribe to query results (real-time updates)
   *
   * @example
   * const subscription = db.table('users')
   *   .where('status', 'active')
   *   .subscribe((users) => {
   *     console.log('Users updated:', users)
   *   })
   */
  subscribe(callback: (documents: T[]) => void): Subscription {
    return this.subscriptionManager.subscribe(this.query, callback);
  }

  /**
   * Find documents by IDs
   *
   * @example
   * const users = await db.table('users').findMany(['id1', 'id2', 'id3'])
   */
  async findMany(ids: string[]): Promise<T[]> {
    return this.whereIn('id', ids).get();
  }

  /**
   * Aggregate functions
   */

  /**
   * Get sum of a numeric field
   *
   * @example
   * const total = await db.table('orders').sum('amount')
   */
  async sum(field: string): Promise<number> {
    const documents = await this.get();
    return documents.reduce((sum, doc) => sum + (Number(doc[field]) || 0), 0);
  }

  /**
   * Get average of a numeric field
   *
   * @example
   * const avgRating = await db.table('products').avg('rating')
   */
  async avg(field: string): Promise<number> {
    const documents = await this.get();
    if (documents.length === 0) return 0;
    const sum = await this.sum(field);
    return sum / documents.length;
  }

  /**
   * Get minimum value of a numeric field
   *
   * @example
   * const minPrice = await db.table('products').min('price')
   */
  async min(field: string): Promise<number> {
    const documents = await this.get();
    if (documents.length === 0) return 0;
    return Math.min(...documents.map(doc => Number(doc[field]) || 0));
  }

  /**
   * Get maximum value of a numeric field
   *
   * @example
   * const maxPrice = await db.table('products').max('price')
   */
  async max(field: string): Promise<number> {
    const documents = await this.get();
    if (documents.length === 0) return 0;
    return Math.max(...documents.map(doc => Number(doc[field]) || 0));
  }

  /**
   * Get distinct values for a field
   *
   * @example
   * const categories = await db.table('products').distinct('category')
   */
  async distinct(field: string): Promise<any[]> {
    const documents = await this.get();
    const values = documents.map(doc => doc[field]);
    return Array.from(new Set(values));
  }

  /**
   * Group documents by a field
   *
   * @example
   * const grouped = await db.table('products').groupBy('category')
   */
  async groupBy(field: string): Promise<Record<string, T[]>> {
    const documents = await this.get();
    const groups: Record<string, T[]> = {};

    for (const doc of documents) {
      const key = String(doc[field]);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(doc);
    }

    return groups;
  }

  /**
   * Pluck a single field from all documents
   *
   * @example
   * const emails = await db.table('users').pluck('email')
   */
  async pluck(field: string): Promise<any[]> {
    const documents = await this.get();
    return documents.map(doc => doc[field]);
  }

  /**
   * Get the built query object (useful for debugging)
   *
   * @example
   * const query = db.table('users').where('age', '>', 18).toQuery()
   */
  toQuery(): Query {
    return { ...this.query };
  }

  /**
   * Clone the query builder
   *
   * @example
   * const baseQuery = db.table('users').where('status', 'active')
   * const admins = await baseQuery.clone().where('role', 'admin').get()
   */
  clone(): QueryBuilder<T> {
    const cloned = new QueryBuilder<T>(
      this.tableName,
      this.storage,
      this.subscriptionManager
    );
    cloned.query = JSON.parse(JSON.stringify(this.query));
    return cloned;
  }

  /**
   * Normalize operator from SQL-style to internal format
   */
  private normalizeOperator(operator: string): string {
    const operatorMap: Record<string, string> = {
      '=': '$eq',
      '!=': '$ne',
      '<>': '$ne',
      '>': '$gt',
      '>=': '$gte',
      '<': '$lt',
      '<=': '$lte',
      'in': '$in',
      'not in': '$nin',
      'like': '$like'
    };

    return operatorMap[operator.toLowerCase()] || operator;
  }
}

/**
 * SQL query parser (experimental)
 * Converts SQL-like strings to QueryBuilder calls
 */
export class SQLParser {
  /**
   * Parse a simple SQL query into a QueryBuilder
   *
   * @example
   * const query = SQLParser.parse('SELECT * FROM users WHERE age > 18 ORDER BY name LIMIT 10')
   */
  static parse<T extends Document>(
    sql: string,
    storage: StorageAdapter,
    subscriptionManager: SubscriptionManager
  ): QueryBuilder<T> {
    // Simple regex-based parser (for demonstration - use a proper parser in production)
    const selectMatch = sql.match(/SELECT \* FROM (\w+)/i);
    if (!selectMatch) {
      throw new Error('Invalid SQL query');
    }

    const tableName = selectMatch[1];
    const builder = new QueryBuilder<T>(tableName, storage, subscriptionManager);

    // Parse WHERE clause
    const whereMatch = sql.match(/WHERE (.+?)(?:ORDER BY|LIMIT|$)/i);
    if (whereMatch) {
      const conditions = whereMatch[1].trim();
      // Simple condition parsing (field operator value)
      const conditionMatch = conditions.match(/(\w+)\s*([><=!]+)\s*(.+)/);
      if (conditionMatch) {
        const [, field, operator, value] = conditionMatch;
        let parsedValue: any = value.trim();

        // Remove quotes from strings
        if (parsedValue.startsWith("'") && parsedValue.endsWith("'")) {
          parsedValue = parsedValue.slice(1, -1);
        } else if (!isNaN(Number(parsedValue))) {
          parsedValue = Number(parsedValue);
        }

        builder.where(field, operator, parsedValue);
      }
    }

    // Parse ORDER BY clause
    const orderMatch = sql.match(/ORDER BY (\w+)\s*(ASC|DESC)?/i);
    if (orderMatch) {
      const [, field, direction] = orderMatch;
      builder.orderBy(field, (direction?.toUpperCase() as any) || 'ASC');
    }

    // Parse LIMIT clause
    const limitMatch = sql.match(/LIMIT (\d+)/i);
    if (limitMatch) {
      builder.limit(Number(limitMatch[1]));
    }

    // Parse OFFSET clause
    const offsetMatch = sql.match(/OFFSET (\d+)/i);
    if (offsetMatch) {
      builder.offset(Number(offsetMatch[1]));
    }

    return builder;
  }
}
