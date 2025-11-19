/**
 * Records API
 * Auto-generated CRUD operations for collections
 */

import { nanoid } from 'nanoid';
import { DatabaseConnection } from '../database/connection.js';
import { QueryBuilder, table } from '../database/query-builder.js';
import { Collection, CollectionManager } from '../collections/manager.js';

export interface ListOptions {
  page?: number;
  perPage?: number;
  sort?: string;
  filter?: string;
  expand?: string;
  fields?: string;
}

export interface ListResult<T = any> {
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  items: T[];
}

export class RecordsAPI {
  private db: DatabaseConnection;
  private collections: CollectionManager;

  constructor(db: DatabaseConnection, collections: CollectionManager) {
    this.db = db;
    this.collections = collections;
  }

  /**
   * List records with pagination, filtering, and sorting
   */
  async list(collectionName: string, options: ListOptions = {}): Promise<ListResult> {
    const collection = this.collections.getCollection(collectionName);
    if (!collection) {
      throw new Error(`Collection '${collectionName}' not found`);
    }

    const page = Math.max(1, options.page || 1);
    const perPage = Math.min(500, Math.max(1, options.perPage || 30));
    const offset = (page - 1) * perPage;

    let query = table(collectionName, this.db);

    // Apply filter
    if (options.filter) {
      const filterClauses = this.parseFilter(options.filter);
      for (const clause of filterClauses) {
        query = query.where(clause.field, clause.operator, clause.value);
      }
    }

    // Apply sorting
    if (options.sort) {
      const sorts = options.sort.split(',');
      for (const sort of sorts) {
        const desc = sort.startsWith('-');
        const field = desc ? sort.substring(1) : sort;
        query = query.orderBy(field, desc ? 'DESC' : 'ASC');
      }
    } else {
      query.orderBy('created', 'DESC');
    }

    // Get total count
    const totalItems = query.count();
    const totalPages = Math.ceil(totalItems / perPage);

    // Apply pagination
    query = query.limit(perPage).offset(offset);

    // Get records
    let items = query.get();

    // Deserialize records
    items = items.map(item => this.collections.deserializeRecord(collection, item));

    // Apply field filtering
    if (options.fields) {
      const fields = options.fields.split(',');
      items = items.map(item => {
        const filtered: any = {};
        for (const field of fields) {
          if (item[field] !== undefined) {
            filtered[field] = item[field];
          }
        }
        return filtered;
      });
    }

    // Apply expand (relations)
    if (options.expand) {
      items = await this.expandRecords(collection, items, options.expand);
    }

    return {
      page,
      perPage,
      totalItems,
      totalPages,
      items,
    };
  }

  /**
   * Get a single record by ID
   */
  async getOne(collectionName: string, id: string, expand?: string): Promise<any> {
    const collection = this.collections.getCollection(collectionName);
    if (!collection) {
      throw new Error(`Collection '${collectionName}' not found`);
    }

    const record = table(collectionName, this.db).where('id', id).first();

    if (!record) {
      throw new Error(`Record '${id}' not found`);
    }

    let deserialized = this.collections.deserializeRecord(collection, record);

    // Apply expand (relations)
    if (expand) {
      const expanded = await this.expandRecords(collection, [deserialized], expand);
      deserialized = expanded[0];
    }

    return deserialized;
  }

  /**
   * Create a new record
   */
  async create(collectionName: string, data: Record<string, any>): Promise<any> {
    const collection = this.collections.getCollection(collectionName);
    if (!collection) {
      throw new Error(`Collection '${collectionName}' not found`);
    }

    // Validate data
    const errors = this.collections.validateRecord(collection, data);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    // Prepare record
    const now = new Date().toISOString();
    const record = {
      id: nanoid(15),
      created: now,
      updated: now,
      ...data,
    };

    // Serialize for storage
    const serialized = this.collections.serializeRecord(collection, record);

    // Insert
    table(collectionName, this.db).insert(serialized);

    return this.collections.deserializeRecord(collection, serialized);
  }

  /**
   * Update a record
   */
  async update(collectionName: string, id: string, data: Record<string, any>): Promise<any> {
    const collection = this.collections.getCollection(collectionName);
    if (!collection) {
      throw new Error(`Collection '${collectionName}' not found`);
    }

    // Check if record exists
    const existing = table(collectionName, this.db).where('id', id).first();
    if (!existing) {
      throw new Error(`Record '${id}' not found`);
    }

    // Validate data
    const errors = this.collections.validateRecord(collection, data, true);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    // Prepare update
    const now = new Date().toISOString();
    const update = {
      ...data,
      updated: now,
    };

    // Serialize for storage
    const serialized = this.collections.serializeRecord(collection, update);

    // Update
    table(collectionName, this.db).where('id', id).update(serialized);

    // Get updated record
    const updated = table(collectionName, this.db).where('id', id).first();
    return this.collections.deserializeRecord(collection, updated);
  }

  /**
   * Delete a record
   */
  async delete(collectionName: string, id: string): Promise<void> {
    const collection = this.collections.getCollection(collectionName);
    if (!collection) {
      throw new Error(`Collection '${collectionName}' not found`);
    }

    // Check if record exists
    const existing = table(collectionName, this.db).where('id', id).first();
    if (!existing) {
      throw new Error(`Record '${id}' not found`);
    }

    // Delete
    table(collectionName, this.db).where('id', id).delete();
  }

  /**
   * Batch create records
   */
  async batchCreate(collectionName: string, records: Record<string, any>[]): Promise<any[]> {
    const collection = this.collections.getCollection(collectionName);
    if (!collection) {
      throw new Error(`Collection '${collectionName}' not found`);
    }

    const results: any[] = [];

    this.db.transaction(() => {
      for (const data of records) {
        // Validate data
        const errors = this.collections.validateRecord(collection, data);
        if (errors.length > 0) {
          throw new Error(`Validation failed: ${errors.join(', ')}`);
        }

        // Prepare record
        const now = new Date().toISOString();
        const record = {
          id: nanoid(15),
          created: now,
          updated: now,
          ...data,
        };

        // Serialize for storage
        const serialized = this.collections.serializeRecord(collection, record);

        // Insert
        table(collectionName, this.db).insert(serialized);

        results.push(this.collections.deserializeRecord(collection, serialized));
      }
    });

    return results;
  }

  /**
   * Batch update records
   */
  async batchUpdate(collectionName: string, updates: { id: string; data: Record<string, any> }[]): Promise<any[]> {
    const collection = this.collections.getCollection(collectionName);
    if (!collection) {
      throw new Error(`Collection '${collectionName}' not found`);
    }

    const results: any[] = [];

    this.db.transaction(() => {
      for (const { id, data } of updates) {
        // Check if record exists
        const existing = table(collectionName, this.db).where('id', id).first();
        if (!existing) {
          throw new Error(`Record '${id}' not found`);
        }

        // Validate data
        const errors = this.collections.validateRecord(collection, data, true);
        if (errors.length > 0) {
          throw new Error(`Validation failed: ${errors.join(', ')}`);
        }

        // Prepare update
        const now = new Date().toISOString();
        const update = {
          ...data,
          updated: now,
        };

        // Serialize for storage
        const serialized = this.collections.serializeRecord(collection, update);

        // Update
        table(collectionName, this.db).where('id', id).update(serialized);

        // Get updated record
        const updated = table(collectionName, this.db).where('id', id).first();
        results.push(this.collections.deserializeRecord(collection, updated));
      }
    });

    return results;
  }

  /**
   * Batch delete records
   */
  async batchDelete(collectionName: string, ids: string[]): Promise<void> {
    const collection = this.collections.getCollection(collectionName);
    if (!collection) {
      throw new Error(`Collection '${collectionName}' not found`);
    }

    this.db.transaction(() => {
      for (const id of ids) {
        table(collectionName, this.db).where('id', id).delete();
      }
    });
  }

  /**
   * Full-text search
   */
  async search(collectionName: string, query: string, options: ListOptions = {}): Promise<ListResult> {
    const collection = this.collections.getCollection(collectionName);
    if (!collection) {
      throw new Error(`Collection '${collectionName}' not found`);
    }

    const page = Math.max(1, options.page || 1);
    const perPage = Math.min(500, Math.max(1, options.perPage || 30));
    const offset = (page - 1) * perPage;

    // Use FTS table if available
    const ftsTable = `${collectionName}_fts`;
    if (this.db.tableExists(ftsTable)) {
      const sql = `
        SELECT ${collectionName}.* FROM ${collectionName}
        INNER JOIN ${ftsTable} ON ${collectionName}.rowid = ${ftsTable}.rowid
        WHERE ${ftsTable} MATCH ?
        ORDER BY rank
        LIMIT ? OFFSET ?
      `;

      const items = this.db.all(sql, [query, perPage, offset]);

      // Get total count
      const countSql = `
        SELECT COUNT(*) as count FROM ${ftsTable}
        WHERE ${ftsTable} MATCH ?
      `;
      const countResult = this.db.get<{ count: number }>(countSql, [query]);
      const totalItems = countResult?.count || 0;
      const totalPages = Math.ceil(totalItems / perPage);

      // Deserialize records
      const deserialized = items.map(item => this.collections.deserializeRecord(collection, item));

      return {
        page,
        perPage,
        totalItems,
        totalPages,
        items: deserialized,
      };
    }

    // Fallback to LIKE search
    return this.list(collectionName, {
      ...options,
      filter: `name~'${query}'`,
    });
  }

  /**
   * Parse filter string into clauses
   */
  private parseFilter(filter: string): Array<{ field: string; operator: any; value: any }> {
    const clauses: Array<{ field: string; operator: any; value: any }> = [];

    // Simple parser for basic filters
    // Format: field=value, field!=value, field>value, field<value, field~value
    const parts = filter.split('&&').map(p => p.trim());

    for (const part of parts) {
      let match;

      // Handle different operators
      if ((match = part.match(/^(.+?)~'(.+)'$/))) {
        // LIKE operator
        clauses.push({ field: match[1].trim(), operator: 'LIKE', value: `%${match[2]}%` });
      } else if ((match = part.match(/^(.+?)!=(.+)$/))) {
        clauses.push({ field: match[1].trim(), operator: '!=', value: this.parseValue(match[2].trim()) });
      } else if ((match = part.match(/^(.+?)>=(.+)$/))) {
        clauses.push({ field: match[1].trim(), operator: '>=', value: this.parseValue(match[2].trim()) });
      } else if ((match = part.match(/^(.+?)<=(.+)$/))) {
        clauses.push({ field: match[1].trim(), operator: '<=', value: this.parseValue(match[2].trim()) });
      } else if ((match = part.match(/^(.+?)>(.+)$/))) {
        clauses.push({ field: match[1].trim(), operator: '>', value: this.parseValue(match[2].trim()) });
      } else if ((match = part.match(/^(.+?)<(.+)$/))) {
        clauses.push({ field: match[1].trim(), operator: '<', value: this.parseValue(match[2].trim()) });
      } else if ((match = part.match(/^(.+?)=(.+)$/))) {
        clauses.push({ field: match[1].trim(), operator: '=', value: this.parseValue(match[2].trim()) });
      }
    }

    return clauses;
  }

  /**
   * Parse a value from filter string
   */
  private parseValue(value: string): any {
    value = value.trim();

    // String literal
    if (value.startsWith("'") && value.endsWith("'")) {
      return value.slice(1, -1);
    }

    // Number
    if (/^-?\d+(\.\d+)?$/.test(value)) {
      return Number(value);
    }

    // Boolean
    if (value === 'true') return true;
    if (value === 'false') return false;

    // Null
    if (value === 'null') return null;

    return value;
  }

  /**
   * Expand relations in records
   */
  private async expandRecords(collection: Collection, records: any[], expand: string): Promise<any[]> {
    const expandFields = expand.split(',');

    for (const record of records) {
      for (const fieldName of expandFields) {
        const field = collection.schema.find(f => f.name === fieldName);
        if (!field || field.type !== 'relation') continue;

        const relationCollectionId = field.options?.collectionId;
        if (!relationCollectionId) continue;

        const relationCollection = this.collections.getAllCollections().find(c => c.id === relationCollectionId);
        if (!relationCollection) continue;

        const value = record[fieldName];
        if (!value) continue;

        // Handle single or multiple relations
        if (Array.isArray(value)) {
          const expanded = [];
          for (const id of value) {
            try {
              const related = await this.getOne(relationCollection.name, id);
              expanded.push(related);
            } catch {
              // Ignore missing relations
            }
          }
          record[`expand_${fieldName}`] = expanded;
        } else {
          try {
            const related = await this.getOne(relationCollection.name, value);
            record[`expand_${fieldName}`] = related;
          } catch {
            // Ignore missing relation
          }
        }
      }
    }

    return records;
  }
}
