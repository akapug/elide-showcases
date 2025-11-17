/**
 * Database Manager
 *
 * Manages SQLite database connections, migrations, and provides
 * a clean interface for database operations.
 */

import { SQLite } from 'elide:sqlite';
import { readFile, readdir, exists } from 'elide:fs';
import { join } from 'elide:path';

export class DatabaseManager {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = null;
  }

  async initialize() {
    this.db = new SQLite(this.dbPath);

    // Enable foreign keys
    await this.execute('PRAGMA foreign_keys = ON');
    await this.execute('PRAGMA journal_mode = WAL');

    console.log(`📊 Database connected: ${this.dbPath}`);
  }

  async runMigrations() {
    console.log('🔄 Running migrations...');

    // Create migrations table if it doesn't exist
    await this.execute(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const migrationsPath = join(process.cwd(), 'migrations');
    const files = await readdir(migrationsPath);
    const migrationFiles = files
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      const name = file.replace('.sql', '');

      // Check if already applied
      const applied = await this.query(
        'SELECT * FROM migrations WHERE name = ?',
        [name]
      );

      if (applied.length > 0) {
        console.log(`  ✓ ${name} (already applied)`);
        continue;
      }

      // Apply migration
      const sql = await readFile(join(migrationsPath, file), 'utf8');

      try {
        await this.execute('BEGIN TRANSACTION');

        // Execute migration
        const statements = sql
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0);

        for (const statement of statements) {
          await this.execute(statement);
        }

        // Record migration
        await this.execute(
          'INSERT INTO migrations (name) VALUES (?)',
          [name]
        );

        await this.execute('COMMIT');

        console.log(`  ✓ ${name} (applied)`);
      } catch (error) {
        await this.execute('ROLLBACK');
        throw new Error(`Migration ${name} failed: ${error.message}`);
      }
    }

    console.log('✅ Migrations complete');
  }

  async execute(sql, params = []) {
    return this.db.run(sql, params);
  }

  async query(sql, params = []) {
    return this.db.all(sql, params);
  }

  async queryOne(sql, params = []) {
    return this.db.get(sql, params);
  }

  async insert(sql, params = []) {
    const result = await this.execute(sql, params);
    return result.lastInsertRowid;
  }

  async transaction(callback) {
    await this.execute('BEGIN TRANSACTION');
    try {
      const result = await callback(this);
      await this.execute('COMMIT');
      return result;
    } catch (error) {
      await this.execute('ROLLBACK');
      throw error;
    }
  }

  async close() {
    if (this.db) {
      await this.db.close();
      console.log('📊 Database connection closed');
    }
  }

  // Convenience methods for common operations

  async findById(table, id) {
    return this.queryOne(`SELECT * FROM ${table} WHERE id = ?`, [id]);
  }

  async findOne(table, conditions = {}, orderBy = null) {
    const { where, params } = this.buildWhere(conditions);
    let sql = `SELECT * FROM ${table}`;

    if (where) {
      sql += ` WHERE ${where}`;
    }

    if (orderBy) {
      sql += ` ORDER BY ${orderBy}`;
    }

    sql += ' LIMIT 1';

    return this.queryOne(sql, params);
  }

  async findAll(table, conditions = {}, options = {}) {
    const { where, params } = this.buildWhere(conditions);
    let sql = `SELECT * FROM ${table}`;

    if (where) {
      sql += ` WHERE ${where}`;
    }

    if (options.orderBy) {
      sql += ` ORDER BY ${options.orderBy}`;
    }

    if (options.limit) {
      sql += ` LIMIT ${options.limit}`;
      if (options.offset) {
        sql += ` OFFSET ${options.offset}`;
      }
    }

    return this.query(sql, params);
  }

  async count(table, conditions = {}) {
    const { where, params } = this.buildWhere(conditions);
    let sql = `SELECT COUNT(*) as count FROM ${table}`;

    if (where) {
      sql += ` WHERE ${where}`;
    }

    const result = await this.queryOne(sql, params);
    return result.count;
  }

  async create(table, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');

    const sql = `
      INSERT INTO ${table} (${keys.join(', ')})
      VALUES (${placeholders})
    `;

    return this.insert(sql, values);
  }

  async update(table, id, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const sets = keys.map(k => `${k} = ?`).join(', ');

    const sql = `
      UPDATE ${table}
      SET ${sets}
      WHERE id = ?
    `;

    return this.execute(sql, [...values, id]);
  }

  async delete(table, id) {
    return this.execute(`DELETE FROM ${table} WHERE id = ?`, [id]);
  }

  buildWhere(conditions) {
    const keys = Object.keys(conditions);

    if (keys.length === 0) {
      return { where: null, params: [] };
    }

    const where = keys.map(k => {
      const value = conditions[k];

      if (value === null) {
        return `${k} IS NULL`;
      }

      if (Array.isArray(value)) {
        return `${k} IN (${value.map(() => '?').join(', ')})`;
      }

      if (typeof value === 'object' && value.operator) {
        return `${k} ${value.operator} ?`;
      }

      return `${k} = ?`;
    }).join(' AND ');

    const params = keys.flatMap(k => {
      const value = conditions[k];

      if (value === null) {
        return [];
      }

      if (Array.isArray(value)) {
        return value;
      }

      if (typeof value === 'object' && value.operator) {
        return [value.value];
      }

      return [value];
    });

    return { where, params };
  }
}
