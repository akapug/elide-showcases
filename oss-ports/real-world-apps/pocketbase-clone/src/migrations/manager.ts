/**
 * Migrations Manager
 * Handles database schema migrations and versioning
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { DatabaseConnection } from '../database/connection.js';
import { table } from '../database/query-builder.js';

export interface Migration {
  version: string;
  name: string;
  up: (db: DatabaseConnection) => Promise<void>;
  down: (db: DatabaseConnection) => Promise<void>;
  applied?: Date;
}

export class MigrationsManager {
  private db: DatabaseConnection;
  private migrationsPath: string;
  private migrations: Map<string, Migration> = new Map();

  constructor(db: DatabaseConnection, migrationsPath: string = './migrations') {
    this.db = db;
    this.migrationsPath = migrationsPath;
    this.initMigrationsTable();
  }

  /**
   * Initialize migrations tracking table
   */
  private initMigrationsTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS _migrations (
        version TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        applied TEXT NOT NULL
      )
    `);
  }

  /**
   * Load migrations from directory
   */
  async loadMigrations(): Promise<void> {
    if (!existsSync(this.migrationsPath)) {
      mkdirSync(this.migrationsPath, { recursive: true });
      return;
    }

    const files = readdirSync(this.migrationsPath)
      .filter(f => f.endsWith('.js') || f.endsWith('.ts'))
      .sort();

    for (const file of files) {
      try {
        const filePath = join(this.migrationsPath, file);
        const module = await import(filePath);
        const migration: Migration = module.default || module.migration;

        if (!migration.version || !migration.name || !migration.up || !migration.down) {
          console.warn(`Invalid migration file: ${file}`);
          continue;
        }

        // Check if already applied
        const applied = table('_migrations', this.db)
          .where('version', migration.version)
          .first();

        if (applied) {
          migration.applied = new Date(applied.applied);
        }

        this.migrations.set(migration.version, migration);
      } catch (error) {
        console.error(`Error loading migration ${file}:`, error);
      }
    }
  }

  /**
   * Register a migration programmatically
   */
  registerMigration(migration: Migration): void {
    this.migrations.set(migration.version, migration);
  }

  /**
   * Get all migrations
   */
  getMigrations(): Migration[] {
    return Array.from(this.migrations.values()).sort((a, b) => a.version.localeCompare(b.version));
  }

  /**
   * Get pending migrations
   */
  getPendingMigrations(): Migration[] {
    return this.getMigrations().filter(m => !m.applied);
  }

  /**
   * Get applied migrations
   */
  getAppliedMigrations(): Migration[] {
    return this.getMigrations().filter(m => m.applied);
  }

  /**
   * Run all pending migrations
   */
  async migrate(): Promise<number> {
    const pending = this.getPendingMigrations();

    if (pending.length === 0) {
      console.log('No pending migrations');
      return 0;
    }

    console.log(`Running ${pending.length} migrations...`);

    for (const migration of pending) {
      await this.runMigration(migration);
    }

    return pending.length;
  }

  /**
   * Run a specific migration
   */
  async runMigration(migration: Migration): Promise<void> {
    console.log(`Applying migration ${migration.version}: ${migration.name}`);

    try {
      await migration.up(this.db);

      // Mark as applied
      table('_migrations', this.db).insert({
        version: migration.version,
        name: migration.name,
        applied: new Date().toISOString(),
      });

      migration.applied = new Date();

      console.log(`✓ Migration ${migration.version} applied successfully`);
    } catch (error) {
      console.error(`✗ Migration ${migration.version} failed:`, error);
      throw error;
    }
  }

  /**
   * Rollback the last migration
   */
  async rollback(): Promise<void> {
    const applied = this.getAppliedMigrations();

    if (applied.length === 0) {
      console.log('No migrations to rollback');
      return;
    }

    const last = applied[applied.length - 1];
    await this.rollbackMigration(last);
  }

  /**
   * Rollback a specific migration
   */
  async rollbackMigration(migration: Migration): Promise<void> {
    console.log(`Rolling back migration ${migration.version}: ${migration.name}`);

    try {
      await migration.down(this.db);

      // Remove from applied
      table('_migrations', this.db).where('version', migration.version).delete();

      migration.applied = undefined;

      console.log(`✓ Migration ${migration.version} rolled back successfully`);
    } catch (error) {
      console.error(`✗ Migration ${migration.version} rollback failed:`, error);
      throw error;
    }
  }

  /**
   * Rollback all migrations
   */
  async rollbackAll(): Promise<void> {
    const applied = this.getAppliedMigrations().reverse();

    if (applied.length === 0) {
      console.log('No migrations to rollback');
      return;
    }

    console.log(`Rolling back ${applied.length} migrations...`);

    for (const migration of applied) {
      await this.rollbackMigration(migration);
    }
  }

  /**
   * Reset database (rollback all + migrate)
   */
  async reset(): Promise<void> {
    await this.rollbackAll();
    await this.migrate();
  }

  /**
   * Create a new migration file
   */
  createMigration(name: string): string {
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
    const version = timestamp;
    const filename = `${version}_${name}.ts`;
    const filePath = join(this.migrationsPath, filename);

    const template = `/**
 * Migration: ${name}
 * Version: ${version}
 */

import { DatabaseConnection } from '../src/database/connection.js';

export default {
  version: '${version}',
  name: '${name}',

  async up(db: DatabaseConnection): Promise<void> {
    // Add your migration code here
    // Example:
    // db.exec(\`
    //   CREATE TABLE example (
    //     id TEXT PRIMARY KEY,
    //     name TEXT NOT NULL,
    //     created TEXT NOT NULL
    //   )
    // \`);
  },

  async down(db: DatabaseConnection): Promise<void> {
    // Add your rollback code here
    // Example:
    // db.exec('DROP TABLE IF EXISTS example');
  },
};
`;

    if (!existsSync(this.migrationsPath)) {
      mkdirSync(this.migrationsPath, { recursive: true });
    }

    writeFileSync(filePath, template);
    console.log(`Created migration: ${filename}`);

    return filePath;
  }

  /**
   * Get migration status
   */
  getStatus(): {
    total: number;
    applied: number;
    pending: number;
    migrations: Array<{ version: string; name: string; applied: boolean; date?: Date }>;
  } {
    const migrations = this.getMigrations();

    return {
      total: migrations.length,
      applied: migrations.filter(m => m.applied).length,
      pending: migrations.filter(m => !m.applied).length,
      migrations: migrations.map(m => ({
        version: m.version,
        name: m.name,
        applied: Boolean(m.applied),
        date: m.applied,
      })),
    };
  }

  /**
   * Export database schema
   */
  exportSchema(): string {
    const tables = this.db.getTables();
    let schema = '-- Database Schema Export\n\n';

    for (const table of tables) {
      const info = this.db.all(`PRAGMA table_info(${table})`);
      schema += `-- Table: ${table}\n`;
      schema += this.db.get<{ sql: string }>(
        `SELECT sql FROM sqlite_master WHERE type='table' AND name=?`,
        [table]
      )?.sql || '';
      schema += ';\n\n';
    }

    return schema;
  }

  /**
   * Import database schema
   */
  importSchema(schema: string): void {
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    this.db.transaction(() => {
      for (const statement of statements) {
        this.db.exec(statement);
      }
    });
  }
}

/**
 * Example migrations
 */
export const exampleMigrations: Migration[] = [
  {
    version: '20240101000000',
    name: 'create_users',
    async up(db: DatabaseConnection) {
      db.exec(`
        CREATE TABLE users (
          id TEXT PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          verified INTEGER DEFAULT 0,
          created TEXT NOT NULL,
          updated TEXT NOT NULL
        )
      `);
    },
    async down(db: DatabaseConnection) {
      db.exec('DROP TABLE IF EXISTS users');
    },
  },
  {
    version: '20240101000001',
    name: 'create_posts',
    async up(db: DatabaseConnection) {
      db.exec(`
        CREATE TABLE posts (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          slug TEXT UNIQUE NOT NULL,
          content TEXT,
          author_id TEXT NOT NULL,
          published INTEGER DEFAULT 0,
          created TEXT NOT NULL,
          updated TEXT NOT NULL,
          FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      db.exec('CREATE INDEX idx_posts_author ON posts(author_id)');
      db.exec('CREATE INDEX idx_posts_published ON posts(published)');
    },
    async down(db: DatabaseConnection) {
      db.exec('DROP TABLE IF EXISTS posts');
    },
  },
  {
    version: '20240101000002',
    name: 'create_comments',
    async up(db: DatabaseConnection) {
      db.exec(`
        CREATE TABLE comments (
          id TEXT PRIMARY KEY,
          post_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          content TEXT NOT NULL,
          created TEXT NOT NULL,
          updated TEXT NOT NULL,
          FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      db.exec('CREATE INDEX idx_comments_post ON comments(post_id)');
      db.exec('CREATE INDEX idx_comments_user ON comments(user_id)');
    },
    async down(db: DatabaseConnection) {
      db.exec('DROP TABLE IF EXISTS comments');
    },
  },
];
