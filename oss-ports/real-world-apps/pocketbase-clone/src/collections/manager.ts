/**
 * Collection Manager
 * Manages collections (tables) in the database
 */

import { nanoid } from 'nanoid';
import { DatabaseConnection } from '../database/connection.js';
import {
  Collection,
  SchemaField,
  SYSTEM_FIELDS,
  AUTH_FIELDS,
  getColumnDefinition,
  validateField,
  serializeValue,
  deserializeValue,
} from './schema.js';

export class CollectionManager {
  private db: DatabaseConnection;
  private collections: Map<string, Collection> = new Map();

  constructor(db: DatabaseConnection) {
    this.db = db;
    this.initSystemCollections();
    this.loadCollections();
  }

  /**
   * Initialize system collections table
   */
  private initSystemCollections(): void {
    // Create _collections table if it doesn't exist
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS _collections (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        type TEXT NOT NULL DEFAULT 'base',
        system INTEGER NOT NULL DEFAULT 0,
        schema TEXT NOT NULL,
        indexes TEXT,
        listRule TEXT,
        viewRule TEXT,
        createRule TEXT,
        updateRule TEXT,
        deleteRule TEXT,
        options TEXT,
        created TEXT NOT NULL,
        updated TEXT NOT NULL
      )
    `);

    // Create _admins table if it doesn't exist
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS _admins (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        tokenKey TEXT NOT NULL,
        avatar INTEGER NOT NULL DEFAULT 0,
        created TEXT NOT NULL,
        updated TEXT NOT NULL
      )
    `);
  }

  /**
   * Load all collections from database
   */
  private loadCollections(): void {
    const rows = this.db.all<any>('SELECT * FROM _collections');
    for (const row of rows) {
      const collection: Collection = {
        id: row.id,
        name: row.name,
        type: row.type,
        system: Boolean(row.system),
        schema: JSON.parse(row.schema),
        indexes: row.indexes ? JSON.parse(row.indexes) : [],
        listRule: row.listRule,
        viewRule: row.viewRule,
        createRule: row.createRule,
        updateRule: row.updateRule,
        deleteRule: row.deleteRule,
        options: row.options ? JSON.parse(row.options) : {},
        created: row.created,
        updated: row.updated,
      };
      this.collections.set(collection.name, collection);
    }
  }

  /**
   * Create a new collection
   */
  async createCollection(data: Partial<Collection>): Promise<Collection> {
    const now = new Date().toISOString();
    const collection: Collection = {
      id: data.id || nanoid(15),
      name: data.name!,
      type: data.type || 'base',
      system: false,
      schema: data.schema || [],
      indexes: data.indexes || [],
      listRule: data.listRule !== undefined ? data.listRule : null,
      viewRule: data.viewRule !== undefined ? data.viewRule : null,
      createRule: data.createRule !== undefined ? data.createRule : null,
      updateRule: data.updateRule !== undefined ? data.updateRule : null,
      deleteRule: data.deleteRule !== undefined ? data.deleteRule : null,
      options: data.options || {},
      created: now,
      updated: now,
    };

    // Validate collection name
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(collection.name)) {
      throw new Error('Collection name must start with a letter and contain only letters, numbers, and underscores');
    }

    // Check if collection already exists
    if (this.collections.has(collection.name)) {
      throw new Error(`Collection '${collection.name}' already exists`);
    }

    // Create table
    await this.createTable(collection);

    // Save to _collections
    this.db.run(
      `INSERT INTO _collections (id, name, type, system, schema, indexes, listRule, viewRule, createRule, updateRule, deleteRule, options, created, updated)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        collection.id,
        collection.name,
        collection.type,
        collection.system ? 1 : 0,
        JSON.stringify(collection.schema),
        JSON.stringify(collection.indexes),
        collection.listRule,
        collection.viewRule,
        collection.createRule,
        collection.updateRule,
        collection.deleteRule,
        JSON.stringify(collection.options),
        collection.created,
        collection.updated,
      ]
    );

    this.collections.set(collection.name, collection);
    return collection;
  }

  /**
   * Update a collection
   */
  async updateCollection(name: string, data: Partial<Collection>): Promise<Collection> {
    const collection = this.collections.get(name);
    if (!collection) {
      throw new Error(`Collection '${name}' not found`);
    }

    if (collection.system) {
      throw new Error('Cannot update system collection');
    }

    const now = new Date().toISOString();
    const updated: Collection = {
      ...collection,
      ...data,
      updated: now,
    };

    // If schema changed, update table
    if (data.schema) {
      await this.updateTable(collection, updated);
    }

    // Update in _collections
    this.db.run(
      `UPDATE _collections SET name=?, type=?, schema=?, indexes=?, listRule=?, viewRule=?, createRule=?, updateRule=?, deleteRule=?, options=?, updated=? WHERE id=?`,
      [
        updated.name,
        updated.type,
        JSON.stringify(updated.schema),
        JSON.stringify(updated.indexes),
        updated.listRule,
        updated.viewRule,
        updated.createRule,
        updated.updateRule,
        updated.deleteRule,
        JSON.stringify(updated.options),
        updated.updated,
        updated.id,
      ]
    );

    this.collections.delete(name);
    this.collections.set(updated.name, updated);
    return updated;
  }

  /**
   * Delete a collection
   */
  async deleteCollection(name: string): Promise<void> {
    const collection = this.collections.get(name);
    if (!collection) {
      throw new Error(`Collection '${name}' not found`);
    }

    if (collection.system) {
      throw new Error('Cannot delete system collection');
    }

    // Drop table
    this.db.exec(`DROP TABLE IF EXISTS ${collection.name}`);

    // Delete from _collections
    this.db.run('DELETE FROM _collections WHERE id = ?', [collection.id]);

    this.collections.delete(name);
  }

  /**
   * Get a collection by name
   */
  getCollection(name: string): Collection | undefined {
    return this.collections.get(name);
  }

  /**
   * Get all collections
   */
  getAllCollections(): Collection[] {
    return Array.from(this.collections.values());
  }

  /**
   * Create table for a collection
   */
  private async createTable(collection: Collection): Promise<void> {
    const allFields = this.getAllFields(collection);
    const columns = allFields.map(field => getColumnDefinition(field));

    let sql = `CREATE TABLE ${collection.name} (\n  ${columns.join(',\n  ')}`;

    // Add primary key
    sql += ',\n  PRIMARY KEY (id)';

    sql += '\n)';

    this.db.exec(sql);

    // Create indexes
    if (collection.indexes) {
      for (const index of collection.indexes) {
        const indexName = `idx_${collection.name}_${index.replace(/,/g, '_')}`;
        this.db.exec(`CREATE INDEX IF NOT EXISTS ${indexName} ON ${collection.name}(${index})`);
      }
    }

    // Create full-text search if any text fields
    const textFields = allFields.filter(f => f.type === 'text' && !f.system);
    if (textFields.length > 0) {
      const ftsColumns = textFields.map(f => f.name).join(', ');
      this.db.exec(`
        CREATE VIRTUAL TABLE IF NOT EXISTS ${collection.name}_fts USING fts5(${ftsColumns}, content=${collection.name}, content_rowid=rowid)
      `);

      // Create triggers to keep FTS in sync
      this.db.exec(`
        CREATE TRIGGER IF NOT EXISTS ${collection.name}_fts_insert AFTER INSERT ON ${collection.name} BEGIN
          INSERT INTO ${collection.name}_fts(rowid, ${ftsColumns}) VALUES (new.rowid, ${textFields.map(f => `new.${f.name}`).join(', ')});
        END
      `);

      this.db.exec(`
        CREATE TRIGGER IF NOT EXISTS ${collection.name}_fts_update AFTER UPDATE ON ${collection.name} BEGIN
          UPDATE ${collection.name}_fts SET ${textFields.map(f => `${f.name}=new.${f.name}`).join(', ')} WHERE rowid=old.rowid;
        END
      `);

      this.db.exec(`
        CREATE TRIGGER IF NOT EXISTS ${collection.name}_fts_delete AFTER DELETE ON ${collection.name} BEGIN
          DELETE FROM ${collection.name}_fts WHERE rowid=old.rowid;
        END
      `);
    }
  }

  /**
   * Update table for a collection
   */
  private async updateTable(oldCollection: Collection, newCollection: Collection): Promise<void> {
    const oldFields = this.getAllFields(oldCollection);
    const newFields = this.getAllFields(newCollection);

    // Find added and removed fields
    const oldFieldNames = new Set(oldFields.map(f => f.name));
    const newFieldNames = new Set(newFields.map(f => f.name));

    const addedFields = newFields.filter(f => !oldFieldNames.has(f.name) && !f.system);
    const removedFields = oldFields.filter(f => !newFieldNames.has(f.name) && !f.system);

    // SQLite doesn't support DROP COLUMN, so we need to recreate the table
    if (removedFields.length > 0) {
      const tempTable = `${oldCollection.name}_temp_${Date.now()}`;

      // Create temp table with new schema
      const columns = newFields.map(field => getColumnDefinition(field));
      let sql = `CREATE TABLE ${tempTable} (\n  ${columns.join(',\n  ')}`;
      sql += ',\n  PRIMARY KEY (id)';
      sql += '\n)';
      this.db.exec(sql);

      // Copy data
      const columnList = newFields.map(f => f.name).join(', ');
      this.db.exec(`INSERT INTO ${tempTable} (${columnList}) SELECT ${columnList} FROM ${oldCollection.name}`);

      // Drop old table and rename temp
      this.db.exec(`DROP TABLE ${oldCollection.name}`);
      this.db.exec(`ALTER TABLE ${tempTable} RENAME TO ${oldCollection.name}`);
    } else {
      // Just add new columns
      for (const field of addedFields) {
        this.db.exec(`ALTER TABLE ${oldCollection.name} ADD COLUMN ${getColumnDefinition(field)}`);
      }
    }
  }

  /**
   * Get all fields for a collection (including system fields)
   */
  private getAllFields(collection: Collection): SchemaField[] {
    const fields = [...SYSTEM_FIELDS];

    if (collection.type === 'auth') {
      fields.push(...AUTH_FIELDS);
    }

    fields.push(...collection.schema);

    return fields;
  }

  /**
   * Validate record data against collection schema
   */
  validateRecord(collection: Collection, data: Record<string, any>, isUpdate: boolean = false): string[] {
    const errors: string[] = [];
    const allFields = this.getAllFields(collection);

    for (const field of allFields) {
      // Skip system fields that shouldn't be set by users
      if (field.system && field.name !== 'username') {
        continue;
      }

      const value = data[field.name];

      // Skip validation for undefined values in updates
      if (isUpdate && value === undefined) {
        continue;
      }

      const error = validateField(value, field);
      if (error) {
        errors.push(error);
      }
    }

    return errors;
  }

  /**
   * Serialize record for database storage
   */
  serializeRecord(collection: Collection, data: Record<string, any>): Record<string, any> {
    const allFields = this.getAllFields(collection);
    const serialized: Record<string, any> = {};

    for (const field of allFields) {
      if (data[field.name] !== undefined) {
        serialized[field.name] = serializeValue(data[field.name], field);
      }
    }

    return serialized;
  }

  /**
   * Deserialize record from database
   */
  deserializeRecord(collection: Collection, data: Record<string, any>): Record<string, any> {
    const allFields = this.getAllFields(collection);
    const deserialized: Record<string, any> = {};

    for (const field of allFields) {
      if (data[field.name] !== undefined) {
        deserialized[field.name] = deserializeValue(data[field.name], field);
      }
    }

    // Remove password field from auth collections
    if (collection.type === 'auth' && deserialized.password) {
      delete deserialized.password;
    }

    return deserialized;
  }
}
