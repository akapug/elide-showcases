/**
 * Model Delegate - Provides CRUD operations for each model
 */

import { PrismaClient } from './client';
import { QueryBuilder } from './query-builder';
import {
  FindUniqueArgs,
  FindFirstArgs,
  FindManyArgs,
  CreateArgs,
  CreateManyArgs,
  UpdateArgs,
  UpdateManyArgs,
  UpsertArgs,
  DeleteArgs,
  DeleteManyArgs,
  CountArgs,
  AggregateArgs,
  GroupByArgs
} from './types';
import { PrismaClientKnownRequestError } from './errors';

/**
 * Model configuration
 */
export interface ModelConfig {
  name: string;
  fields: FieldConfig[];
  relations: RelationConfig[];
  primaryKey: string;
  uniqueKeys: string[][];
  indexes: IndexConfig[];
}

export interface FieldConfig {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: any;
  isId: boolean;
  isUnique: boolean;
  isUpdatedAt: boolean;
}

export interface RelationConfig {
  name: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  model: string;
  fields: string[];
  references: string[];
}

export interface IndexConfig {
  name: string;
  fields: string[];
  unique: boolean;
}

/**
 * Model Delegate class
 */
export class ModelDelegate<T> {
  private queryBuilder: QueryBuilder;

  constructor(
    private model: ModelConfig,
    private client: PrismaClient
  ) {
    this.queryBuilder = new QueryBuilder(model.name);
  }

  /**
   * Find unique record
   */
  async findUnique(args: FindUniqueArgs<T>): Promise<T | null> {
    const query = this.queryBuilder
      .select(this._buildSelect(args.select))
      .where(args.where)
      .include(args.include)
      .build();

    const result = await this._execute('findUnique', query);
    return result[0] || null;
  }

  /**
   * Find first record
   */
  async findFirst(args?: FindFirstArgs<T>): Promise<T | null> {
    const query = this.queryBuilder
      .select(this._buildSelect(args?.select))
      .where(args?.where)
      .orderBy(args?.orderBy)
      .include(args?.include)
      .skip(args?.skip)
      .take(1)
      .build();

    const result = await this._execute('findFirst', query);
    return result[0] || null;
  }

  /**
   * Find many records
   */
  async findMany(args?: FindManyArgs<T>): Promise<T[]> {
    const query = this.queryBuilder
      .select(this._buildSelect(args?.select))
      .where(args?.where)
      .orderBy(args?.orderBy)
      .include(args?.include)
      .skip(args?.skip)
      .take(args?.take)
      .cursor(args?.cursor)
      .distinct(args?.distinct)
      .build();

    return this._execute('findMany', query);
  }

  /**
   * Create record
   */
  async create(args: CreateArgs<T>): Promise<T> {
    this._validateData(args.data);

    const query = this.queryBuilder
      .insert(this._processCreateData(args.data))
      .returning(this._buildSelect(args.select))
      .build();

    const result = await this._execute('create', query);

    if (args.include) {
      return this._loadIncludes(result[0], args.include);
    }

    return result[0];
  }

  /**
   * Create many records
   */
  async createMany(args: CreateManyArgs<T>): Promise<{ count: number }> {
    const data = Array.isArray(args.data) ? args.data : [args.data];

    for (const item of data) {
      this._validateData(item);
    }

    const query = this.queryBuilder
      .insertMany(data.map(d => this._processCreateData(d)))
      .build();

    const result = await this._execute('createMany', query);
    return { count: result.affectedRows };
  }

  /**
   * Update record
   */
  async update(args: UpdateArgs<T>): Promise<T> {
    this._validateData(args.data);

    const query = this.queryBuilder
      .update(this._processUpdateData(args.data))
      .where(args.where)
      .returning(this._buildSelect(args.select))
      .build();

    const result = await this._execute('update', query);

    if (!result[0]) {
      throw new PrismaClientKnownRequestError(
        'Record to update not found',
        'P2025',
        { model: this.model.name, where: args.where }
      );
    }

    if (args.include) {
      return this._loadIncludes(result[0], args.include);
    }

    return result[0];
  }

  /**
   * Update many records
   */
  async updateMany(args: UpdateManyArgs<T>): Promise<{ count: number }> {
    this._validateData(args.data);

    const query = this.queryBuilder
      .update(this._processUpdateData(args.data))
      .where(args.where)
      .build();

    const result = await this._execute('updateMany', query);
    return { count: result.affectedRows };
  }

  /**
   * Upsert record
   */
  async upsert(args: UpsertArgs<T>): Promise<T> {
    const existing = await this.findUnique({ where: args.where });

    if (existing) {
      return this.update({
        where: args.where,
        data: args.update,
        select: args.select,
        include: args.include
      });
    } else {
      return this.create({
        data: args.create,
        select: args.select,
        include: args.include
      });
    }
  }

  /**
   * Delete record
   */
  async delete(args: DeleteArgs<T>): Promise<T> {
    const query = this.queryBuilder
      .delete()
      .where(args.where)
      .returning(this._buildSelect(args.select))
      .build();

    const result = await this._execute('delete', query);

    if (!result[0]) {
      throw new PrismaClientKnownRequestError(
        'Record to delete not found',
        'P2025',
        { model: this.model.name, where: args.where }
      );
    }

    return result[0];
  }

  /**
   * Delete many records
   */
  async deleteMany(args?: DeleteManyArgs<T>): Promise<{ count: number }> {
    const query = this.queryBuilder
      .delete()
      .where(args?.where)
      .build();

    const result = await this._execute('deleteMany', query);
    return { count: result.affectedRows };
  }

  /**
   * Count records
   */
  async count(args?: CountArgs<T>): Promise<number> {
    const query = this.queryBuilder
      .count(args?.select)
      .where(args?.where)
      .build();

    const result = await this._execute('count', query);
    return result[0]?.count || 0;
  }

  /**
   * Aggregate records
   */
  async aggregate(args: AggregateArgs<T>): Promise<any> {
    const aggregations = [];

    if (args._count) aggregations.push({ type: 'count', fields: args._count });
    if (args._sum) aggregations.push({ type: 'sum', fields: args._sum });
    if (args._avg) aggregations.push({ type: 'avg', fields: args._avg });
    if (args._min) aggregations.push({ type: 'min', fields: args._min });
    if (args._max) aggregations.push({ type: 'max', fields: args._max });

    const query = this.queryBuilder
      .aggregate(aggregations)
      .where(args.where)
      .build();

    const result = await this._execute('aggregate', query);
    return this._formatAggregateResult(result[0], aggregations);
  }

  /**
   * Group by
   */
  async groupBy(args: GroupByArgs<T>): Promise<any[]> {
    const query = this.queryBuilder
      .select(args.by)
      .groupBy(args.by)
      .having(args.having)
      .where(args.where)
      .orderBy(args.orderBy)
      .skip(args.skip)
      .take(args.take)
      .build();

    return this._execute('groupBy', query);
  }

  /**
   * Execute query with middleware
   */
  private async _execute(action: string, query: any): Promise<any> {
    const params = {
      model: this.model.name,
      action,
      args: query
    };

    return this.client._executeWithMiddleware(params, async () => {
      const engine = this.client._getEngine();
      if (!engine) {
        throw new PrismaClientKnownRequestError(
          'Client not connected',
          'P1001',
          {}
        );
      }

      const startTime = Date.now();
      try {
        const result = await engine.execute(query);
        const duration = Date.now() - startTime;

        this._logQuery(action, query, duration);
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        this._logQueryError(action, query, error, duration);
        throw error;
      }
    });
  }

  /**
   * Process create data
   */
  private _processCreateData(data: any): any {
    const processed: any = {};

    for (const field of this.model.fields) {
      if (field.name in data) {
        processed[field.name] = data[field.name];
      } else if (field.defaultValue !== undefined) {
        processed[field.name] = this._evaluateDefaultValue(field.defaultValue);
      } else if (field.isUpdatedAt) {
        processed[field.name] = new Date();
      }
    }

    // Process nested creates
    for (const relation of this.model.relations) {
      if (relation.name in data) {
        processed[`_${relation.name}`] = this._processNestedCreate(
          data[relation.name],
          relation
        );
      }
    }

    return processed;
  }

  /**
   * Process update data
   */
  private _processUpdateData(data: any): any {
    const processed: any = {};

    for (const [key, value] of Object.entries(data)) {
      const field = this.model.fields.find(f => f.name === key);

      if (field) {
        if (field.isUpdatedAt) {
          processed[key] = new Date();
        } else {
          processed[key] = value;
        }
      } else {
        // Might be a relation update
        const relation = this.model.relations.find(r => r.name === key);
        if (relation) {
          processed[`_${key}`] = this._processNestedUpdate(value, relation);
        }
      }
    }

    return processed;
  }

  /**
   * Process nested create
   */
  private _processNestedCreate(data: any, relation: RelationConfig): any {
    if ('create' in data) {
      return { type: 'create', data: data.create };
    } else if ('connect' in data) {
      return { type: 'connect', where: data.connect };
    } else if ('connectOrCreate' in data) {
      return { type: 'connectOrCreate', ...data.connectOrCreate };
    }
    return null;
  }

  /**
   * Process nested update
   */
  private _processNestedUpdate(data: any, relation: RelationConfig): any {
    const operations: any[] = [];

    if ('create' in data) operations.push({ type: 'create', data: data.create });
    if ('update' in data) operations.push({ type: 'update', data: data.update });
    if ('delete' in data) operations.push({ type: 'delete', where: data.delete });
    if ('connect' in data) operations.push({ type: 'connect', where: data.connect });
    if ('disconnect' in data) operations.push({ type: 'disconnect', where: data.disconnect });

    return operations;
  }

  /**
   * Load includes
   */
  private async _loadIncludes(record: T, include: any): Promise<T> {
    const result = { ...record };

    for (const [key, value] of Object.entries(include)) {
      if (value === true || typeof value === 'object') {
        const relation = this.model.relations.find(r => r.name === key);
        if (relation) {
          // Load related records
          // Implementation would query related model
          (result as any)[key] = [];
        }
      }
    }

    return result;
  }

  /**
   * Build select clause
   */
  private _buildSelect(select?: any): string[] {
    if (!select) {
      return this.model.fields.map(f => f.name);
    }

    return Object.keys(select).filter(key => select[key] === true);
  }

  /**
   * Validate data
   */
  private _validateData(data: any): void {
    for (const field of this.model.fields) {
      if (field.name in data) {
        const value = data[field.name];

        if (!field.nullable && value === null) {
          throw new PrismaClientKnownRequestError(
            `Field '${field.name}' cannot be null`,
            'P2011',
            { field: field.name }
          );
        }

        // Type validation
        this._validateFieldType(field, value);
      }
    }
  }

  /**
   * Validate field type
   */
  private _validateFieldType(field: FieldConfig, value: any): void {
    const typeMap: Record<string, string> = {
      String: 'string',
      Int: 'number',
      Float: 'number',
      Boolean: 'boolean',
      DateTime: 'object'
    };

    const expectedType = typeMap[field.type];
    if (expectedType && typeof value !== expectedType) {
      throw new PrismaClientKnownRequestError(
        `Invalid type for field '${field.name}'. Expected ${field.type}, got ${typeof value}`,
        'P2012',
        { field: field.name, expected: field.type, got: typeof value }
      );
    }
  }

  /**
   * Evaluate default value
   */
  private _evaluateDefaultValue(defaultValue: any): any {
    if (typeof defaultValue === 'function') {
      return defaultValue();
    }

    if (defaultValue === 'autoincrement()') {
      return undefined; // Let database handle
    }

    if (defaultValue === 'now()') {
      return new Date();
    }

    if (defaultValue === 'uuid()') {
      return this._generateUUID();
    }

    return defaultValue;
  }

  /**
   * Generate UUID
   */
  private _generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Format aggregate result
   */
  private _formatAggregateResult(result: any, aggregations: any[]): any {
    const formatted: any = {};

    for (const agg of aggregations) {
      formatted[`_${agg.type}`] = {};

      if (agg.fields === true) {
        formatted[`_${agg.type}`]._all = result[`${agg.type}_all`];
      } else {
        for (const field of Object.keys(agg.fields)) {
          formatted[`_${agg.type}`][field] = result[`${agg.type}_${field}`];
        }
      }
    }

    return formatted;
  }

  /**
   * Log query
   */
  private _logQuery(action: string, query: any, duration: number): void {
    // Implementation would log to metrics
  }

  /**
   * Log query error
   */
  private _logQueryError(action: string, query: any, error: any, duration: number): void {
    // Implementation would log error
  }
}
