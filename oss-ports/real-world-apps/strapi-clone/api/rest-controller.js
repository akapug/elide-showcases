/**
 * REST API Controller
 * Handles CRUD operations for content types
 */

import { getDatabase, getQueryBuilder } from '../database/connection.js';
import { queryParser } from './generator.js';
import { lifecycleHooks } from '../webhooks/lifecycle.js';
import { logger } from '../core/logger.js';

export class RESTController {
  constructor(contentType) {
    this.contentType = contentType;
    this.tableName = `ct_${contentType.singularName.toLowerCase()}`;
    this.logger = logger.child(`REST:${contentType.uid}`);
  }

  /**
   * Find all entries
   */
  async find(ctx) {
    try {
      const query = queryParser.parse(ctx.query, this.contentType);
      const db = getDatabase();

      // Build query
      let sql = `SELECT`;

      // Select fields
      if (query.fields.includes('*')) {
        sql += ` *`;
      } else {
        sql += ` ${query.fields.join(', ')}`;
      }

      sql += ` FROM ${this.tableName}`;

      // Apply filters
      const whereConditions = [];
      const params = [];

      for (const [field, filter] of Object.entries(query.filters)) {
        if (filter.operator === 'IN' || filter.operator === 'NOT IN') {
          whereConditions.push(`${field} ${filter.operator} (${filter.value.map(() => '?').join(', ')})`);
          params.push(...filter.value);
        } else if (filter.operator === 'LIKE' || filter.operator === 'NOT LIKE') {
          whereConditions.push(`${field} ${filter.operator} ?`);
          params.push(`%${filter.value}%`);
        } else if (filter.operator === 'IS NULL' || filter.operator === 'IS NOT NULL') {
          whereConditions.push(`${field} ${filter.operator}`);
        } else {
          whereConditions.push(`${field} ${filter.operator} ?`);
          params.push(filter.value);
        }
      }

      if (whereConditions.length > 0) {
        sql += ` WHERE ${whereConditions.join(' AND ')}`;
      }

      // Apply sorting
      if (query.sort.length > 0) {
        sql += ` ORDER BY ${query.sort.map(s => `${s.field} ${s.direction}`).join(', ')}`;
      }

      // Apply pagination
      let total = null;
      if (query.pagination.withCount) {
        const countSql = `SELECT COUNT(*) as count FROM ${this.tableName}${whereConditions.length > 0 ? ` WHERE ${whereConditions.join(' AND ')}` : ''}`;
        const countResult = await db.query(countSql, params);
        total = countResult[0].count;
      }

      if (query.pagination.limit !== undefined) {
        sql += ` LIMIT ${query.pagination.limit}`;
        if (query.pagination.start !== undefined) {
          sql += ` OFFSET ${query.pagination.start}`;
        }
      } else {
        const offset = (query.pagination.page - 1) * query.pagination.pageSize;
        sql += ` LIMIT ${query.pagination.pageSize} OFFSET ${offset}`;
      }

      // Execute query
      const results = await db.query(sql, params);

      // Populate relations
      if (query.populate.length > 0) {
        for (const result of results) {
          await this.populateRelations(result, query.populate);
        }
      }

      // Build response
      const response = {
        data: results,
        meta: {},
      };

      if (total !== null) {
        response.meta.pagination = {
          page: query.pagination.page,
          pageSize: query.pagination.pageSize,
          pageCount: Math.ceil(total / query.pagination.pageSize),
          total,
        };
      }

      ctx.body = response;
    } catch (error) {
      this.logger.error('Find error:', error);
      ctx.status = 500;
      ctx.body = { error: 'Internal server error' };
    }
  }

  /**
   * Count entries
   */
  async count(ctx) {
    try {
      const query = queryParser.parse(ctx.query, this.contentType);
      const db = getDatabase();

      let sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
      const params = [];
      const whereConditions = [];

      for (const [field, filter] of Object.entries(query.filters)) {
        whereConditions.push(`${field} ${filter.operator} ?`);
        params.push(filter.value);
      }

      if (whereConditions.length > 0) {
        sql += ` WHERE ${whereConditions.join(' AND ')}`;
      }

      const result = await db.query(sql, params);

      ctx.body = { count: result[0].count };
    } catch (error) {
      this.logger.error('Count error:', error);
      ctx.status = 500;
      ctx.body = { error: 'Internal server error' };
    }
  }

  /**
   * Find one entry by ID
   */
  async findOne(ctx) {
    try {
      const { id } = ctx.params;
      const query = queryParser.parse(ctx.query, this.contentType);
      const db = getDatabase();

      const result = await db.query(
        `SELECT * FROM ${this.tableName} WHERE id = ?`,
        [id]
      );

      if (result.length === 0) {
        ctx.status = 404;
        ctx.body = { error: 'Not found' };
        return;
      }

      const entry = result[0];

      // Populate relations
      if (query.populate.length > 0) {
        await this.populateRelations(entry, query.populate);
      }

      ctx.body = { data: entry };
    } catch (error) {
      this.logger.error('FindOne error:', error);
      ctx.status = 500;
      ctx.body = { error: 'Internal server error' };
    }
  }

  /**
   * Create new entry
   */
  async create(ctx) {
    try {
      const data = ctx.request.body;

      // Run beforeCreate lifecycle
      await lifecycleHooks.trigger('beforeCreate', {
        contentType: this.contentType,
        data,
      });

      // Validate data
      const validatedData = this.validateData(data);

      // Insert into database
      const db = getDatabase();
      const columns = Object.keys(validatedData);
      const values = Object.values(validatedData);
      const placeholders = columns.map(() => '?').join(', ');

      const sql = `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
      const result = await db.execute(sql, values);

      // Fetch created entry
      const created = await db.query(
        `SELECT * FROM ${this.tableName} WHERE id = ?`,
        [result.lastInsertRowid || result.insertId]
      );

      // Run afterCreate lifecycle
      await lifecycleHooks.trigger('afterCreate', {
        contentType: this.contentType,
        data: created[0],
      });

      ctx.status = 201;
      ctx.body = { data: created[0] };
    } catch (error) {
      this.logger.error('Create error:', error);
      ctx.status = 400;
      ctx.body = { error: error.message };
    }
  }

  /**
   * Update entry
   */
  async update(ctx) {
    try {
      const { id } = ctx.params;
      const data = ctx.request.body;

      // Check if entry exists
      const db = getDatabase();
      const existing = await db.query(
        `SELECT * FROM ${this.tableName} WHERE id = ?`,
        [id]
      );

      if (existing.length === 0) {
        ctx.status = 404;
        ctx.body = { error: 'Not found' };
        return;
      }

      // Run beforeUpdate lifecycle
      await lifecycleHooks.trigger('beforeUpdate', {
        contentType: this.contentType,
        data,
        where: { id },
      });

      // Validate data
      const validatedData = this.validateData(data, false);

      // Update database
      const columns = Object.keys(validatedData);
      const values = Object.values(validatedData);
      const sets = columns.map(col => `${col} = ?`).join(', ');

      const sql = `UPDATE ${this.tableName} SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
      await db.execute(sql, [...values, id]);

      // Fetch updated entry
      const updated = await db.query(
        `SELECT * FROM ${this.tableName} WHERE id = ?`,
        [id]
      );

      // Run afterUpdate lifecycle
      await lifecycleHooks.trigger('afterUpdate', {
        contentType: this.contentType,
        data: updated[0],
      });

      ctx.body = { data: updated[0] };
    } catch (error) {
      this.logger.error('Update error:', error);
      ctx.status = 400;
      ctx.body = { error: error.message };
    }
  }

  /**
   * Delete entry
   */
  async delete(ctx) {
    try {
      const { id } = ctx.params;
      const db = getDatabase();

      // Check if entry exists
      const existing = await db.query(
        `SELECT * FROM ${this.tableName} WHERE id = ?`,
        [id]
      );

      if (existing.length === 0) {
        ctx.status = 404;
        ctx.body = { error: 'Not found' };
        return;
      }

      // Run beforeDelete lifecycle
      await lifecycleHooks.trigger('beforeDelete', {
        contentType: this.contentType,
        where: { id },
      });

      // Delete from database
      await db.execute(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);

      // Run afterDelete lifecycle
      await lifecycleHooks.trigger('afterDelete', {
        contentType: this.contentType,
        data: existing[0],
      });

      ctx.body = { data: existing[0] };
    } catch (error) {
      this.logger.error('Delete error:', error);
      ctx.status = 500;
      ctx.body = { error: 'Internal server error' };
    }
  }

  /**
   * Publish entry (draft & publish)
   */
  async publish(ctx) {
    try {
      if (!this.contentType.draftAndPublish) {
        ctx.status = 400;
        ctx.body = { error: 'Draft & Publish not enabled for this content type' };
        return;
      }

      const { id } = ctx.params;
      const db = getDatabase();

      await db.execute(
        `UPDATE ${this.tableName} SET published_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [id]
      );

      const updated = await db.query(
        `SELECT * FROM ${this.tableName} WHERE id = ?`,
        [id]
      );

      ctx.body = { data: updated[0] };
    } catch (error) {
      this.logger.error('Publish error:', error);
      ctx.status = 500;
      ctx.body = { error: 'Internal server error' };
    }
  }

  /**
   * Unpublish entry
   */
  async unpublish(ctx) {
    try {
      if (!this.contentType.draftAndPublish) {
        ctx.status = 400;
        ctx.body = { error: 'Draft & Publish not enabled for this content type' };
        return;
      }

      const { id } = ctx.params;
      const db = getDatabase();

      await db.execute(
        `UPDATE ${this.tableName} SET published_at = NULL WHERE id = ?`,
        [id]
      );

      const updated = await db.query(
        `SELECT * FROM ${this.tableName} WHERE id = ?`,
        [id]
      );

      ctx.body = { data: updated[0] };
    } catch (error) {
      this.logger.error('Unpublish error:', error);
      ctx.status = 500;
      ctx.body = { error: 'Internal server error' };
    }
  }

  /**
   * Validate entry data against content type schema
   */
  validateData(data, requireAll = false) {
    const validated = {};

    for (const [name, attribute] of Object.entries(this.contentType.attributes)) {
      const value = data[name];

      // Check required fields
      if (attribute.required && (value === undefined || value === null)) {
        if (requireAll) {
          throw new Error(`Field ${name} is required`);
        }
        continue;
      }

      // Skip if not provided and not required
      if (value === undefined) {
        continue;
      }

      // Validate and transform value
      validated[name] = this.validateField(name, value, attribute);
    }

    return validated;
  }

  validateField(name, value, attribute) {
    // Type validation would go here
    // For now, return value as-is
    return value;
  }

  /**
   * Populate relations
   */
  async populateRelations(entry, populate) {
    const db = getDatabase();

    for (const relation of populate) {
      if (relation === '*') {
        // Populate all relations
        for (const [name, attribute] of Object.entries(this.contentType.attributes)) {
          if (attribute.type === 'relation') {
            await this.populateRelation(entry, name, attribute, db);
          }
        }
      } else {
        const attribute = this.contentType.attributes[relation];
        if (attribute && attribute.type === 'relation') {
          await this.populateRelation(entry, relation, attribute, db);
        }
      }
    }
  }

  async populateRelation(entry, name, attribute, db) {
    const targetTable = `ct_${this.extractTableName(attribute.target)}`;

    switch (attribute.relation) {
      case 'oneToOne':
      case 'manyToOne':
        if (entry[`${name}_id`]) {
          const related = await db.query(
            `SELECT * FROM ${targetTable} WHERE id = ?`,
            [entry[`${name}_id`]]
          );
          entry[name] = related[0] || null;
        }
        break;

      case 'oneToMany':
      case 'manyToMany':
        // Query junction table
        const junctionTable = `${this.tableName}_${name}_links`;
        const related = await db.query(
          `SELECT t.* FROM ${targetTable} t
           JOIN ${junctionTable} j ON t.id = j.${targetTable}_id
           WHERE j.${this.tableName}_id = ?`,
          [entry.id]
        );
        entry[name] = related;
        break;
    }
  }

  extractTableName(target) {
    const parts = target.split('.');
    return parts[parts.length - 1].toLowerCase();
  }
}
