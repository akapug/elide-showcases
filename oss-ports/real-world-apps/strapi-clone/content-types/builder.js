/**
 * Content Type Builder
 * Dynamic content type creation and management
 */

import { getDatabase, getQueryBuilder } from '../database/connection.js';
import { logger } from '../core/logger.js';
import { validateContentType } from './validator.js';
import { generateSchema } from './schema-generator.js';

export class ContentTypeBuilder {
  constructor() {
    this.contentTypes = new Map();
    this.logger = logger.child('ContentTypeBuilder');
  }

  /**
   * Create a new content type
   */
  async createContentType(definition) {
    try {
      // Validate definition
      validateContentType(definition);

      // Generate UID if not provided
      if (!definition.uid) {
        definition.uid = `api::${definition.singularName}.${definition.singularName}`;
      }

      // Check if content type already exists
      const existing = await this.findByUID(definition.uid);
      if (existing) {
        throw new Error(`Content type with UID ${definition.uid} already exists`);
      }

      // Generate database schema
      const schema = generateSchema(definition);

      // Create database table
      await this.createTable(schema);

      // Save content type definition
      const db = getDatabase();
      await db.execute(
        `INSERT INTO cms_content_types
         (uid, display_name, singular_name, plural_name, description, kind, draft_and_publish, attributes, options, plugin_options)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          definition.uid,
          definition.displayName,
          definition.singularName,
          definition.pluralName,
          definition.description || null,
          definition.kind || 'collectionType',
          definition.draftAndPublish !== false,
          JSON.stringify(definition.attributes),
          JSON.stringify(definition.options || {}),
          JSON.stringify(definition.pluginOptions || {}),
        ]
      );

      this.contentTypes.set(definition.uid, definition);
      this.logger.info(`Content type ${definition.uid} created successfully`);

      return definition;
    } catch (error) {
      this.logger.error('Failed to create content type:', error);
      throw error;
    }
  }

  /**
   * Update existing content type
   */
  async updateContentType(uid, updates) {
    try {
      const existing = await this.findByUID(uid);
      if (!existing) {
        throw new Error(`Content type ${uid} not found`);
      }

      const updated = { ...existing, ...updates };
      validateContentType(updated);

      // Update database schema if attributes changed
      if (updates.attributes) {
        const schema = generateSchema(updated);
        await this.updateTable(schema);
      }

      // Update content type definition
      const db = getDatabase();
      await db.execute(
        `UPDATE cms_content_types
         SET display_name = ?, singular_name = ?, plural_name = ?, description = ?,
             attributes = ?, options = ?, plugin_options = ?, updated_at = CURRENT_TIMESTAMP
         WHERE uid = ?`,
        [
          updated.displayName,
          updated.singularName,
          updated.pluralName,
          updated.description || null,
          JSON.stringify(updated.attributes),
          JSON.stringify(updated.options || {}),
          JSON.stringify(updated.pluginOptions || {}),
          uid,
        ]
      );

      this.contentTypes.set(uid, updated);
      this.logger.info(`Content type ${uid} updated successfully`);

      return updated;
    } catch (error) {
      this.logger.error('Failed to update content type:', error);
      throw error;
    }
  }

  /**
   * Delete content type
   */
  async deleteContentType(uid) {
    try {
      const existing = await this.findByUID(uid);
      if (!existing) {
        throw new Error(`Content type ${uid} not found`);
      }

      // Drop database table
      const tableName = this.getTableName(existing);
      const db = getDatabase();
      await db.execute(`DROP TABLE IF EXISTS ${tableName}`);

      // Delete content type definition
      await db.execute('DELETE FROM cms_content_types WHERE uid = ?', [uid]);

      this.contentTypes.delete(uid);
      this.logger.info(`Content type ${uid} deleted successfully`);

      return true;
    } catch (error) {
      this.logger.error('Failed to delete content type:', error);
      throw error;
    }
  }

  /**
   * Find content type by UID
   */
  async findByUID(uid) {
    // Check cache first
    if (this.contentTypes.has(uid)) {
      return this.contentTypes.get(uid);
    }

    // Query database
    const db = getDatabase();
    const results = await db.query(
      'SELECT * FROM cms_content_types WHERE uid = ?',
      [uid]
    );

    if (results.length === 0) {
      return null;
    }

    const contentType = this.deserializeContentType(results[0]);
    this.contentTypes.set(uid, contentType);

    return contentType;
  }

  /**
   * Get all content types
   */
  async findAll() {
    const db = getDatabase();
    const results = await db.query('SELECT * FROM cms_content_types ORDER BY display_name');

    return results.map(row => this.deserializeContentType(row));
  }

  /**
   * Create database table for content type
   */
  async createTable(schema) {
    const db = getDatabase();
    await db.execute(schema.createTable);

    // Create indexes
    for (const index of schema.indexes || []) {
      await db.execute(index);
    }

    // Create foreign key constraints
    for (const fk of schema.foreignKeys || []) {
      await db.execute(fk);
    }
  }

  /**
   * Update database table for content type
   */
  async updateTable(schema) {
    const db = getDatabase();

    // Note: In production, use proper migration strategy
    // For now, we'll recreate the table (data loss warning!)
    await db.execute(`DROP TABLE IF EXISTS ${schema.tableName}`);
    await this.createTable(schema);
  }

  /**
   * Get table name for content type
   */
  getTableName(contentType) {
    return `ct_${contentType.singularName.toLowerCase()}`;
  }

  /**
   * Deserialize content type from database row
   */
  deserializeContentType(row) {
    return {
      id: row.id,
      uid: row.uid,
      displayName: row.display_name,
      singularName: row.singular_name,
      pluralName: row.plural_name,
      description: row.description,
      kind: row.kind,
      draftAndPublish: row.draft_and_publish,
      attributes: JSON.parse(row.attributes),
      options: JSON.parse(row.options || '{}'),
      pluginOptions: JSON.parse(row.plugin_options || '{}'),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

/**
 * Component Builder
 * Manages reusable field groups
 */
export class ComponentBuilder {
  constructor() {
    this.components = new Map();
    this.logger = logger.child('ComponentBuilder');
  }

  async createComponent(definition) {
    validateContentType(definition);

    definition.kind = 'component';
    if (!definition.uid) {
      definition.uid = `component::${definition.category}.${definition.singularName}`;
    }

    // Save component definition
    const db = getDatabase();
    await db.execute(
      `INSERT INTO cms_content_types
       (uid, display_name, singular_name, plural_name, kind, attributes, options)
       VALUES (?, ?, ?, ?, 'component', ?, ?)`,
      [
        definition.uid,
        definition.displayName,
        definition.singularName,
        definition.pluralName || definition.singularName,
        JSON.stringify(definition.attributes),
        JSON.stringify({ category: definition.category, ...definition.options }),
      ]
    );

    this.components.set(definition.uid, definition);
    this.logger.info(`Component ${definition.uid} created successfully`);

    return definition;
  }

  async findByUID(uid) {
    if (this.components.has(uid)) {
      return this.components.get(uid);
    }

    const db = getDatabase();
    const results = await db.query(
      "SELECT * FROM cms_content_types WHERE uid = ? AND kind = 'component'",
      [uid]
    );

    if (results.length === 0) {
      return null;
    }

    const component = this.deserializeContentType(results[0]);
    this.components.set(uid, component);

    return component;
  }

  deserializeContentType(row) {
    const builder = new ContentTypeBuilder();
    return builder.deserializeContentType(row);
  }
}

// Export singleton instances
export const contentTypeBuilder = new ContentTypeBuilder();
export const componentBuilder = new ComponentBuilder();
