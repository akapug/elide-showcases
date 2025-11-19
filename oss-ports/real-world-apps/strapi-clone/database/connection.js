/**
 * Database Connection Manager
 * Supports PostgreSQL, MySQL, SQLite with Elide SQL
 */

import { SQL, Database } from '@elide/sql';
import { logger } from '../core/logger.js';

let db = null;
let queryBuilder = null;

export async function initializeDatabase(config) {
  const dbLogger = logger.child('Database');

  try {
    // Create database connection
    db = await createConnection(config);
    dbLogger.info(`Connected to ${config.client} database`);

    // Create query builder
    queryBuilder = new QueryBuilder(db);

    // Run migrations
    await runMigrations(db, config);
    dbLogger.info('Database migrations completed');

    return db;
  } catch (error) {
    dbLogger.error('Failed to initialize database:', error);
    throw error;
  }
}

async function createConnection(config) {
  const { client, connection, pool } = config;

  let database;

  switch (client) {
    case 'postgresql':
    case 'postgres':
      database = await Database.connect({
        driver: 'postgresql',
        host: connection.host || 'localhost',
        port: connection.port || 5432,
        database: connection.database,
        user: connection.user,
        password: connection.password,
        ssl: connection.ssl,
        pool: pool || { min: 2, max: 10 },
      });
      break;

    case 'mysql':
    case 'mysql2':
      database = await Database.connect({
        driver: 'mysql',
        host: connection.host || 'localhost',
        port: connection.port || 3306,
        database: connection.database,
        user: connection.user,
        password: connection.password,
        ssl: connection.ssl,
        pool: pool || { min: 2, max: 10 },
      });
      break;

    case 'sqlite':
    case 'sqlite3':
      database = await Database.connect({
        driver: 'sqlite',
        filename: connection.filename || ':memory:',
      });
      break;

    default:
      throw new Error(`Unsupported database client: ${client}`);
  }

  return database;
}

async function runMigrations(db, config) {
  // Create migrations table if it doesn't exist
  await db.execute(`
    CREATE TABLE IF NOT EXISTS cms_migrations (
      id INTEGER PRIMARY KEY ${config.client === 'sqlite' ? 'AUTOINCREMENT' : 'AUTO_INCREMENT'},
      name VARCHAR(255) NOT NULL,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Core schema migrations
  const migrations = [
    createContentTypesMigration,
    createUsersMigration,
    createRolesMigration,
    createPermissionsMigration,
    createMediaMigration,
    createWebhooksMigration,
    createApiTokensMigration,
  ];

  for (const migration of migrations) {
    const migrationName = migration.name;

    // Check if migration already ran
    const result = await db.query(
      'SELECT * FROM cms_migrations WHERE name = ?',
      [migrationName]
    );

    if (result.length === 0) {
      await migration(db, config);
      await db.execute(
        'INSERT INTO cms_migrations (name) VALUES (?)',
        [migrationName]
      );
      logger.info(`Migration ${migrationName} completed`);
    }
  }
}

async function createContentTypesMigration(db, config) {
  const autoIncrement = config.client === 'sqlite' ? 'AUTOINCREMENT' : 'AUTO_INCREMENT';

  await db.execute(`
    CREATE TABLE IF NOT EXISTS cms_content_types (
      id INTEGER PRIMARY KEY ${autoIncrement},
      uid VARCHAR(255) UNIQUE NOT NULL,
      display_name VARCHAR(255) NOT NULL,
      singular_name VARCHAR(255) NOT NULL,
      plural_name VARCHAR(255) NOT NULL,
      description TEXT,
      kind VARCHAR(50) DEFAULT 'collectionType',
      draft_and_publish BOOLEAN DEFAULT true,
      attributes JSON NOT NULL,
      options JSON,
      plugin_options JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function createUsersMigration(db, config) {
  const autoIncrement = config.client === 'sqlite' ? 'AUTOINCREMENT' : 'AUTO_INCREMENT';

  await db.execute(`
    CREATE TABLE IF NOT EXISTS cms_users (
      id INTEGER PRIMARY KEY ${autoIncrement},
      username VARCHAR(255) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      first_name VARCHAR(255),
      last_name VARCHAR(255),
      is_active BOOLEAN DEFAULT true,
      blocked BOOLEAN DEFAULT false,
      confirmed BOOLEAN DEFAULT false,
      role_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES cms_roles(id)
    )
  `);
}

async function createRolesMigration(db, config) {
  const autoIncrement = config.client === 'sqlite' ? 'AUTOINCREMENT' : 'AUTO_INCREMENT';

  await db.execute(`
    CREATE TABLE IF NOT EXISTS cms_roles (
      id INTEGER PRIMARY KEY ${autoIncrement},
      name VARCHAR(255) UNIQUE NOT NULL,
      description TEXT,
      type VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert default roles
  const defaultRoles = [
    { name: 'Public', description: 'Default role for unauthenticated users', type: 'public' },
    { name: 'Authenticated', description: 'Default role for authenticated users', type: 'authenticated' },
    { name: 'Admin', description: 'Administrator role', type: 'admin' },
    { name: 'Super Admin', description: 'Super administrator role', type: 'super-admin' },
  ];

  for (const role of defaultRoles) {
    await db.execute(
      'INSERT OR IGNORE INTO cms_roles (name, description, type) VALUES (?, ?, ?)',
      [role.name, role.description, role.type]
    );
  }
}

async function createPermissionsMigration(db, config) {
  const autoIncrement = config.client === 'sqlite' ? 'AUTOINCREMENT' : 'AUTO_INCREMENT';

  await db.execute(`
    CREATE TABLE IF NOT EXISTS cms_permissions (
      id INTEGER PRIMARY KEY ${autoIncrement},
      role_id INTEGER NOT NULL,
      action VARCHAR(255) NOT NULL,
      subject VARCHAR(255),
      fields JSON,
      conditions JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES cms_roles(id)
    )
  `);
}

async function createMediaMigration(db, config) {
  const autoIncrement = config.client === 'sqlite' ? 'AUTOINCREMENT' : 'AUTO_INCREMENT';

  await db.execute(`
    CREATE TABLE IF NOT EXISTS cms_media (
      id INTEGER PRIMARY KEY ${autoIncrement},
      name VARCHAR(255) NOT NULL,
      alternative_text VARCHAR(255),
      caption TEXT,
      width INTEGER,
      height INTEGER,
      formats JSON,
      hash VARCHAR(255) NOT NULL,
      ext VARCHAR(10),
      mime VARCHAR(255) NOT NULL,
      size DECIMAL(10, 2) NOT NULL,
      url VARCHAR(500) NOT NULL,
      preview_url VARCHAR(500),
      provider VARCHAR(50) NOT NULL DEFAULT 'local',
      provider_metadata JSON,
      folder_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function createWebhooksMigration(db, config) {
  const autoIncrement = config.client === 'sqlite' ? 'AUTOINCREMENT' : 'AUTO_INCREMENT';

  await db.execute(`
    CREATE TABLE IF NOT EXISTS cms_webhooks (
      id INTEGER PRIMARY KEY ${autoIncrement},
      name VARCHAR(255) NOT NULL,
      url VARCHAR(500) NOT NULL,
      headers JSON,
      events JSON NOT NULL,
      enabled BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function createApiTokensMigration(db, config) {
  const autoIncrement = config.client === 'sqlite' ? 'AUTOINCREMENT' : 'AUTO_INCREMENT';

  await db.execute(`
    CREATE TABLE IF NOT EXISTS cms_api_tokens (
      id INTEGER PRIMARY KEY ${autoIncrement},
      name VARCHAR(255) NOT NULL,
      description TEXT,
      type VARCHAR(50) NOT NULL,
      access_key VARCHAR(255) UNIQUE NOT NULL,
      last_used_at TIMESTAMP,
      expires_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase first.');
  }
  return db;
}

export function getQueryBuilder() {
  if (!queryBuilder) {
    throw new Error('Query builder not initialized.');
  }
  return queryBuilder;
}

export class QueryBuilder {
  constructor(db) {
    this.db = db;
    this.query = {
      table: null,
      select: ['*'],
      where: [],
      joins: [],
      orderBy: [],
      limit: null,
      offset: null,
    };
  }

  table(tableName) {
    this.query.table = tableName;
    return this;
  }

  select(...columns) {
    this.query.select = columns;
    return this;
  }

  where(column, operator, value) {
    if (arguments.length === 2) {
      value = operator;
      operator = '=';
    }
    this.query.where.push({ column, operator, value });
    return this;
  }

  join(table, column1, operator, column2) {
    this.query.joins.push({ table, column1, operator, column2 });
    return this;
  }

  orderBy(column, direction = 'ASC') {
    this.query.orderBy.push({ column, direction });
    return this;
  }

  limit(count) {
    this.query.limit = count;
    return this;
  }

  offset(count) {
    this.query.offset = count;
    return this;
  }

  async get() {
    const sql = this.buildSelect();
    const params = this.query.where.map(w => w.value);
    return await this.db.query(sql, params);
  }

  async first() {
    this.limit(1);
    const results = await this.get();
    return results[0] || null;
  }

  async insert(data) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map(() => '?').join(', ');

    const sql = `INSERT INTO ${this.query.table} (${columns.join(', ')}) VALUES (${placeholders})`;
    return await this.db.execute(sql, values);
  }

  async update(data) {
    const sets = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = Object.values(data);
    const whereClause = this.buildWhere();
    const whereValues = this.query.where.map(w => w.value);

    const sql = `UPDATE ${this.query.table} SET ${sets}${whereClause}`;
    return await this.db.execute(sql, [...values, ...whereValues]);
  }

  async delete() {
    const whereClause = this.buildWhere();
    const whereValues = this.query.where.map(w => w.value);

    const sql = `DELETE FROM ${this.query.table}${whereClause}`;
    return await this.db.execute(sql, whereValues);
  }

  buildSelect() {
    let sql = `SELECT ${this.query.select.join(', ')} FROM ${this.query.table}`;

    if (this.query.joins.length > 0) {
      sql += ' ' + this.query.joins
        .map(j => `JOIN ${j.table} ON ${j.column1} ${j.operator} ${j.column2}`)
        .join(' ');
    }

    sql += this.buildWhere();

    if (this.query.orderBy.length > 0) {
      sql += ' ORDER BY ' + this.query.orderBy
        .map(o => `${o.column} ${o.direction}`)
        .join(', ');
    }

    if (this.query.limit) {
      sql += ` LIMIT ${this.query.limit}`;
    }

    if (this.query.offset) {
      sql += ` OFFSET ${this.query.offset}`;
    }

    return sql;
  }

  buildWhere() {
    if (this.query.where.length === 0) return '';

    const conditions = this.query.where
      .map(w => `${w.column} ${w.operator} ?`)
      .join(' AND ');

    return ` WHERE ${conditions}`;
  }
}
