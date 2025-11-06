/**
 * ElideBase - Schema Definition and Management
 *
 * Provides a type-safe schema definition system with validation,
 * indexing, and automatic CRUD generation.
 */

import { SQLiteDatabase } from './sqlite';

export type FieldType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'date'
  | 'json'
  | 'file'
  | 'relation'
  | 'email'
  | 'url';

export interface FieldOptions {
  required?: boolean;
  unique?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  default?: any;
  index?: boolean;
  cascade?: boolean;
}

export interface Field {
  name: string;
  type: FieldType;
  options?: FieldOptions;
  relation?: {
    collection: string;
    field?: string;
    cascadeDelete?: boolean;
  };
}

export interface CollectionSchema {
  name: string;
  fields: Field[];
  indexes?: string[][];
  timestamps?: boolean;
  hooks?: {
    beforeCreate?: string;
    afterCreate?: string;
    beforeUpdate?: string;
    afterUpdate?: string;
    beforeDelete?: string;
    afterDelete?: string;
  };
}

export class SchemaManager {
  private db: SQLiteDatabase;
  private collections: Map<string, CollectionSchema>;

  constructor(db: SQLiteDatabase) {
    this.db = db;
    this.collections = new Map();
    this.initializeSystemCollections();
  }

  /**
   * Initialize system collections for metadata
   */
  private initializeSystemCollections(): void {
    // Create schema metadata table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS _collections (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        schema TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('System collections initialized');
  }

  /**
   * Register a new collection schema
   */
  registerCollection(schema: CollectionSchema): void {
    this.validateSchema(schema);
    this.collections.set(schema.name, schema);

    // Create the table
    this.createTable(schema);

    // Store schema metadata
    this.saveSchemaMetadata(schema);

    console.log(`Collection registered: ${schema.name}`);
  }

  /**
   * Validate schema definition
   */
  private validateSchema(schema: CollectionSchema): void {
    if (!schema.name || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(schema.name)) {
      throw new Error(`Invalid collection name: ${schema.name}`);
    }

    if (!schema.fields || schema.fields.length === 0) {
      throw new Error(`Collection ${schema.name} must have at least one field`);
    }

    const fieldNames = new Set<string>();
    for (const field of schema.fields) {
      if (fieldNames.has(field.name)) {
        throw new Error(`Duplicate field name: ${field.name}`);
      }
      fieldNames.add(field.name);
      this.validateField(field);
    }
  }

  /**
   * Validate field definition
   */
  private validateField(field: Field): void {
    const validTypes: FieldType[] = [
      'text',
      'number',
      'boolean',
      'date',
      'json',
      'file',
      'relation',
      'email',
      'url'
    ];

    if (!validTypes.includes(field.type)) {
      throw new Error(`Invalid field type: ${field.type}`);
    }

    if (field.type === 'relation' && !field.relation) {
      throw new Error(`Relation field ${field.name} must have relation config`);
    }
  }

  /**
   * Create database table from schema
   */
  private createTable(schema: CollectionSchema): void {
    const columns: string[] = [
      'id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16))))'
    ];

    for (const field of schema.fields) {
      columns.push(this.fieldToSQL(field));
    }

    if (schema.timestamps !== false) {
      columns.push('created_at DATETIME DEFAULT CURRENT_TIMESTAMP');
      columns.push('updated_at DATETIME DEFAULT CURRENT_TIMESTAMP');
    }

    const sql = `
      CREATE TABLE IF NOT EXISTS ${schema.name} (
        ${columns.join(',\n        ')}
      )
    `;

    this.db.exec(sql);

    // Create indexes
    if (schema.indexes) {
      for (const indexFields of schema.indexes) {
        const indexName = `idx_${schema.name}_${indexFields.join('_')}`;
        const indexSQL = `
          CREATE INDEX IF NOT EXISTS ${indexName}
          ON ${schema.name} (${indexFields.join(', ')})
        `;
        this.db.exec(indexSQL);
      }
    }

    // Create field indexes
    for (const field of schema.fields) {
      if (field.options?.index) {
        const indexName = `idx_${schema.name}_${field.name}`;
        const indexSQL = `
          CREATE INDEX IF NOT EXISTS ${indexName}
          ON ${schema.name} (${field.name})
        `;
        this.db.exec(indexSQL);
      }
    }
  }

  /**
   * Convert field definition to SQL column definition
   */
  private fieldToSQL(field: Field): string {
    let sql = field.name;

    // Determine SQL type
    switch (field.type) {
      case 'text':
      case 'email':
      case 'url':
      case 'file':
        sql += ' TEXT';
        break;
      case 'number':
        sql += ' REAL';
        break;
      case 'boolean':
        sql += ' INTEGER';
        break;
      case 'date':
        sql += ' DATETIME';
        break;
      case 'json':
        sql += ' TEXT';
        break;
      case 'relation':
        sql += ' TEXT';
        if (field.relation) {
          sql += ` REFERENCES ${field.relation.collection}(id)`;
          if (field.relation.cascadeDelete) {
            sql += ' ON DELETE CASCADE';
          }
        }
        break;
    }

    // Add constraints
    if (field.options?.required) {
      sql += ' NOT NULL';
    }

    if (field.options?.unique) {
      sql += ' UNIQUE';
    }

    if (field.options?.default !== undefined) {
      sql += ` DEFAULT ${this.formatDefault(field.options.default)}`;
    }

    return sql;
  }

  /**
   * Format default value for SQL
   */
  private formatDefault(value: any): string {
    if (typeof value === 'string') {
      return `'${value}'`;
    }
    if (typeof value === 'boolean') {
      return value ? '1' : '0';
    }
    return String(value);
  }

  /**
   * Save schema metadata
   */
  private saveSchemaMetadata(schema: CollectionSchema): void {
    const sql = `
      INSERT OR REPLACE INTO _collections (id, name, schema)
      VALUES (?, ?, ?)
    `;
    this.db.execute(sql, [
      schema.name,
      schema.name,
      JSON.stringify(schema)
    ]);
  }

  /**
   * Get collection schema
   */
  getCollection(name: string): CollectionSchema | undefined {
    return this.collections.get(name);
  }

  /**
   * Get all collection names
   */
  getCollectionNames(): string[] {
    return Array.from(this.collections.keys());
  }

  /**
   * Validate data against schema
   */
  validate(collectionName: string, data: any): { valid: boolean; errors: string[] } {
    const schema = this.collections.get(collectionName);
    if (!schema) {
      return { valid: false, errors: [`Collection ${collectionName} not found`] };
    }

    const errors: string[] = [];

    for (const field of schema.fields) {
      const value = data[field.name];

      // Check required fields
      if (field.options?.required && (value === undefined || value === null)) {
        errors.push(`Field ${field.name} is required`);
        continue;
      }

      // Skip validation if field is not provided and not required
      if (value === undefined || value === null) {
        continue;
      }

      // Type validation
      const typeError = this.validateFieldType(field, value);
      if (typeError) {
        errors.push(typeError);
      }

      // Additional validations
      if (field.options?.min !== undefined && value < field.options.min) {
        errors.push(`Field ${field.name} must be at least ${field.options.min}`);
      }

      if (field.options?.max !== undefined && value > field.options.max) {
        errors.push(`Field ${field.name} must be at most ${field.options.max}`);
      }

      if (field.options?.pattern) {
        const regex = new RegExp(field.options.pattern);
        if (!regex.test(String(value))) {
          errors.push(`Field ${field.name} does not match pattern ${field.options.pattern}`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate field type
   */
  private validateFieldType(field: Field, value: any): string | null {
    switch (field.type) {
      case 'text':
        if (typeof value !== 'string') {
          return `Field ${field.name} must be a string`;
        }
        break;
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return `Field ${field.name} must be a number`;
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          return `Field ${field.name} must be a boolean`;
        }
        break;
      case 'email':
        if (typeof value !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return `Field ${field.name} must be a valid email`;
        }
        break;
      case 'url':
        if (typeof value !== 'string' || !this.isValidUrl(value)) {
          return `Field ${field.name} must be a valid URL`;
        }
        break;
      case 'date':
        if (!(value instanceof Date) && isNaN(Date.parse(value))) {
          return `Field ${field.name} must be a valid date`;
        }
        break;
      case 'json':
        if (typeof value !== 'object') {
          return `Field ${field.name} must be a valid JSON object`;
        }
        break;
    }

    return null;
  }

  /**
   * Check if string is a valid URL
   */
  private isValidUrl(value: string): boolean {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Drop a collection
   */
  dropCollection(name: string): void {
    if (!this.collections.has(name)) {
      throw new Error(`Collection ${name} does not exist`);
    }

    this.db.exec(`DROP TABLE IF EXISTS ${name}`);
    this.db.execute('DELETE FROM _collections WHERE name = ?', [name]);
    this.collections.delete(name);

    console.log(`Collection dropped: ${name}`);
  }

  /**
   * Get collection statistics
   */
  getStats(collectionName: string): any {
    const schema = this.collections.get(collectionName);
    if (!schema) {
      throw new Error(`Collection ${collectionName} not found`);
    }

    const countResult = this.db.queryOne(
      `SELECT COUNT(*) as count FROM ${collectionName}`
    );

    return {
      name: collectionName,
      fields: schema.fields.length,
      count: countResult?.count || 0,
      indexes: schema.indexes?.length || 0
    };
  }
}
