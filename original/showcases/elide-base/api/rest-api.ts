/**
 * ElideBase - Auto-generated REST API
 *
 * Automatically generates REST endpoints for all collections with
 * CRUD operations, filtering, sorting, and pagination.
 */

import { SQLiteDatabase, QueryBuilder } from '../database/sqlite';
import { SchemaManager } from '../database/schema';

export interface APIRequest {
  method: string;
  path: string;
  query: Record<string, any>;
  body?: any;
  headers: Record<string, string>;
  user?: any;
}

export interface APIResponse {
  status: number;
  headers?: Record<string, string>;
  body: any;
}

export interface QueryParams {
  page?: number;
  perPage?: number;
  sort?: string;
  filter?: string;
  expand?: string;
  fields?: string;
}

export class RestAPI {
  private db: SQLiteDatabase;
  private schema: SchemaManager;
  private basePath: string;

  constructor(db: SQLiteDatabase, schema: SchemaManager, basePath: string = '/api') {
    this.db = db;
    this.schema = schema;
    this.basePath = basePath;
  }

  /**
   * Handle API request
   */
  async handle(request: APIRequest): Promise<APIResponse> {
    try {
      const route = this.parseRoute(request.path);

      if (!route) {
        return this.notFound();
      }

      // Route to appropriate handler
      switch (request.method) {
        case 'GET':
          if (route.recordId) {
            return await this.getOne(route.collection, route.recordId, request.query);
          }
          return await this.getList(route.collection, request.query);

        case 'POST':
          return await this.create(route.collection, request.body, request.user);

        case 'PATCH':
        case 'PUT':
          if (!route.recordId) {
            return this.badRequest('Record ID required');
          }
          return await this.update(route.collection, route.recordId, request.body, request.user);

        case 'DELETE':
          if (!route.recordId) {
            return this.badRequest('Record ID required');
          }
          return await this.delete(route.collection, route.recordId, request.user);

        default:
          return this.methodNotAllowed();
      }
    } catch (error) {
      return this.error(error);
    }
  }

  /**
   * Parse route from path
   */
  private parseRoute(path: string): { collection: string; recordId?: string } | null {
    const pattern = new RegExp(`^${this.basePath}/collections/([^/]+)(?:/([^/]+))?$`);
    const match = path.match(pattern);

    if (!match) {
      return null;
    }

    return {
      collection: match[1],
      recordId: match[2]
    };
  }

  /**
   * Get list of records with filtering, sorting, and pagination
   */
  private async getList(collection: string, params: QueryParams): Promise<APIResponse> {
    const collectionSchema = this.schema.getCollection(collection);
    if (!collectionSchema) {
      return this.notFound(`Collection ${collection} not found`);
    }

    const page = Math.max(1, parseInt(String(params.page || 1)));
    const perPage = Math.min(100, Math.max(1, parseInt(String(params.perPage || 30))));
    const offset = (page - 1) * perPage;

    // Build query
    const qb = new QueryBuilder().from(collection);

    // Apply filters
    if (params.filter) {
      const filters = this.parseFilter(params.filter);
      for (const filter of filters) {
        qb.where(filter.condition, ...filter.params);
      }
    }

    // Apply sorting
    if (params.sort) {
      const sorts = params.sort.split(',');
      for (const sort of sorts) {
        const desc = sort.startsWith('-');
        const field = desc ? sort.substring(1) : sort;
        qb.orderBy(field, desc ? 'DESC' : 'ASC');
      }
    } else {
      qb.orderBy('created_at', 'DESC');
    }

    // Apply pagination
    qb.limit(perPage).offset(offset);

    // Get total count
    const countResult = this.db.queryOne(`SELECT COUNT(*) as total FROM ${collection}`);
    const total = countResult?.total || 0;

    // Execute query
    const result = qb.execute(this.db);

    return {
      status: 200,
      body: {
        page,
        perPage,
        totalItems: total,
        totalPages: Math.ceil(total / perPage),
        items: result.rows
      }
    };
  }

  /**
   * Get single record by ID
   */
  private async getOne(collection: string, id: string, params: QueryParams): Promise<APIResponse> {
    const collectionSchema = this.schema.getCollection(collection);
    if (!collectionSchema) {
      return this.notFound(`Collection ${collection} not found`);
    }

    const record = this.db.queryOne(
      `SELECT * FROM ${collection} WHERE id = ?`,
      [id]
    );

    if (!record) {
      return this.notFound(`Record not found`);
    }

    // Expand relations if requested
    if (params.expand) {
      const expanded = await this.expandRelations(collection, record, params.expand);
      return { status: 200, body: expanded };
    }

    return { status: 200, body: record };
  }

  /**
   * Create a new record
   */
  private async create(collection: string, data: any, user?: any): Promise<APIResponse> {
    const collectionSchema = this.schema.getCollection(collection);
    if (!collectionSchema) {
      return this.notFound(`Collection ${collection} not found`);
    }

    // Validate data
    const validation = this.schema.validate(collection, data);
    if (!validation.valid) {
      return this.badRequest(validation.errors.join(', '));
    }

    // Build insert query
    const fields = Object.keys(data);
    const placeholders = fields.map(() => '?').join(', ');
    const values = fields.map(f => this.serializeValue(data[f]));

    const sql = `
      INSERT INTO ${collection} (${fields.join(', ')})
      VALUES (${placeholders})
    `;

    const result = this.db.execute(sql, values);

    // Fetch created record
    const created = this.db.queryOne(
      `SELECT * FROM ${collection} WHERE id = ?`,
      [result.lastInsertRowid]
    );

    return { status: 201, body: created };
  }

  /**
   * Update an existing record
   */
  private async update(collection: string, id: string, data: any, user?: any): Promise<APIResponse> {
    const collectionSchema = this.schema.getCollection(collection);
    if (!collectionSchema) {
      return this.notFound(`Collection ${collection} not found`);
    }

    // Check if record exists
    const existing = this.db.queryOne(
      `SELECT * FROM ${collection} WHERE id = ?`,
      [id]
    );

    if (!existing) {
      return this.notFound(`Record not found`);
    }

    // Validate data
    const validation = this.schema.validate(collection, data);
    if (!validation.valid) {
      return this.badRequest(validation.errors.join(', '));
    }

    // Build update query
    const fields = Object.keys(data);
    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => this.serializeValue(data[f]));

    const sql = `
      UPDATE ${collection}
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    this.db.execute(sql, [...values, id]);

    // Fetch updated record
    const updated = this.db.queryOne(
      `SELECT * FROM ${collection} WHERE id = ?`,
      [id]
    );

    return { status: 200, body: updated };
  }

  /**
   * Delete a record
   */
  private async delete(collection: string, id: string, user?: any): Promise<APIResponse> {
    const collectionSchema = this.schema.getCollection(collection);
    if (!collectionSchema) {
      return this.notFound(`Collection ${collection} not found`);
    }

    // Check if record exists
    const existing = this.db.queryOne(
      `SELECT * FROM ${collection} WHERE id = ?`,
      [id]
    );

    if (!existing) {
      return this.notFound(`Record not found`);
    }

    // Delete record
    this.db.execute(`DELETE FROM ${collection} WHERE id = ?`, [id]);

    return { status: 204, body: null };
  }

  /**
   * Parse filter string into SQL conditions
   */
  private parseFilter(filter: string): Array<{ condition: string; params: any[] }> {
    const filters: Array<{ condition: string; params: any[] }> = [];

    // Simple filter format: field=value or field~value (contains)
    const parts = filter.split('&&');

    for (const part of parts) {
      const trimmed = part.trim();

      if (trimmed.includes('~')) {
        const [field, value] = trimmed.split('~');
        filters.push({
          condition: `${field.trim()} LIKE ?`,
          params: [`%${value.trim()}%`]
        });
      } else if (trimmed.includes('>=')) {
        const [field, value] = trimmed.split('>=');
        filters.push({
          condition: `${field.trim()} >= ?`,
          params: [value.trim()]
        });
      } else if (trimmed.includes('<=')) {
        const [field, value] = trimmed.split('<=');
        filters.push({
          condition: `${field.trim()} <= ?`,
          params: [value.trim()]
        });
      } else if (trimmed.includes('>')) {
        const [field, value] = trimmed.split('>');
        filters.push({
          condition: `${field.trim()} > ?`,
          params: [value.trim()]
        });
      } else if (trimmed.includes('<')) {
        const [field, value] = trimmed.split('<');
        filters.push({
          condition: `${field.trim()} < ?`,
          params: [value.trim()]
        });
      } else if (trimmed.includes('!=')) {
        const [field, value] = trimmed.split('!=');
        filters.push({
          condition: `${field.trim()} != ?`,
          params: [value.trim()]
        });
      } else if (trimmed.includes('=')) {
        const [field, value] = trimmed.split('=');
        filters.push({
          condition: `${field.trim()} = ?`,
          params: [value.trim()]
        });
      }
    }

    return filters;
  }

  /**
   * Expand relations in record
   */
  private async expandRelations(collection: string, record: any, expand: string): Promise<any> {
    const collectionSchema = this.schema.getCollection(collection);
    if (!collectionSchema) {
      return record;
    }

    const expandFields = expand.split(',').map(f => f.trim());
    const expanded = { ...record };

    for (const fieldName of expandFields) {
      const field = collectionSchema.fields.find(f => f.name === fieldName);

      if (field && field.type === 'relation' && field.relation && record[fieldName]) {
        const relatedRecord = this.db.queryOne(
          `SELECT * FROM ${field.relation.collection} WHERE id = ?`,
          [record[fieldName]]
        );

        if (relatedRecord) {
          expanded[`expand_${fieldName}`] = relatedRecord;
        }
      }
    }

    return expanded;
  }

  /**
   * Serialize value for database
   */
  private serializeValue(value: any): any {
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    if (typeof value === 'boolean') {
      return value ? 1 : 0;
    }
    return value;
  }

  /**
   * Response helpers
   */
  private notFound(message: string = 'Not found'): APIResponse {
    return { status: 404, body: { error: message } };
  }

  private badRequest(message: string): APIResponse {
    return { status: 400, body: { error: message } };
  }

  private methodNotAllowed(): APIResponse {
    return { status: 405, body: { error: 'Method not allowed' } };
  }

  private error(error: any): APIResponse {
    console.error('API Error:', error);
    return {
      status: 500,
      body: { error: error.message || 'Internal server error' }
    };
  }
}
