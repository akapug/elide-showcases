/**
 * ElideBase - Database Migrations
 *
 * Provides version control for database schema changes with
 * up/down migrations and rollback support.
 */

import { SQLiteDatabase } from './sqlite';
import * as fs from 'fs';
import * as path from 'path';

export interface Migration {
  id: string;
  name: string;
  up: (db: SQLiteDatabase) => Promise<void> | void;
  down: (db: SQLiteDatabase) => Promise<void> | void;
  timestamp: number;
}

export interface MigrationRecord {
  id: string;
  name: string;
  applied_at: string;
  batch: number;
}

export class MigrationManager {
  private db: SQLiteDatabase;
  private migrations: Migration[];
  private migrationsDir: string;

  constructor(db: SQLiteDatabase, migrationsDir?: string) {
    this.db = db;
    this.migrations = [];
    this.migrationsDir = migrationsDir || './migrations';
    this.initialize();
  }

  /**
   * Initialize migrations table
   */
  private initialize(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        batch INTEGER NOT NULL
      )
    `);

    console.log('Migrations table initialized');
  }

  /**
   * Register a migration
   */
  register(migration: Migration): void {
    // Validate migration
    if (!migration.id || !migration.name) {
      throw new Error('Migration must have id and name');
    }

    if (!migration.up) {
      throw new Error(`Migration ${migration.name} must have an up function`);
    }

    this.migrations.push(migration);
  }

  /**
   * Load migrations from directory
   */
  async loadFromDirectory(): Promise<void> {
    if (!fs.existsSync(this.migrationsDir)) {
      console.log(`Migrations directory not found: ${this.migrationsDir}`);
      return;
    }

    const files = fs.readdirSync(this.migrationsDir)
      .filter(f => f.endsWith('.js') || f.endsWith('.ts'))
      .sort();

    for (const file of files) {
      const filePath = path.join(this.migrationsDir, file);
      try {
        const module = await import(filePath);
        if (module.default) {
          this.register(module.default);
        }
      } catch (error) {
        console.error(`Failed to load migration ${file}:`, error);
      }
    }

    console.log(`Loaded ${this.migrations.length} migrations`);
  }

  /**
   * Get pending migrations
   */
  private async getPendingMigrations(): Promise<Migration[]> {
    const applied = this.db.query('SELECT id FROM _migrations').rows;
    const appliedIds = new Set(applied.map(r => r.id));

    return this.migrations
      .filter(m => !appliedIds.has(m.id))
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Get current batch number
   */
  private getCurrentBatch(): number {
    const result = this.db.queryOne(
      'SELECT MAX(batch) as batch FROM _migrations'
    );
    return result?.batch || 0;
  }

  /**
   * Run pending migrations
   */
  async migrate(): Promise<void> {
    const pending = await this.getPendingMigrations();

    if (pending.length === 0) {
      console.log('No pending migrations');
      return;
    }

    const batch = this.getCurrentBatch() + 1;
    console.log(`Running ${pending.length} migrations in batch ${batch}`);

    for (const migration of pending) {
      try {
        console.log(`Migrating: ${migration.name}`);

        await this.db.transaction(async () => {
          await migration.up(this.db);

          this.db.execute(
            'INSERT INTO _migrations (id, name, batch) VALUES (?, ?, ?)',
            [migration.id, migration.name, batch]
          );
        });

        console.log(`Migrated: ${migration.name}`);
      } catch (error) {
        console.error(`Migration failed: ${migration.name}`, error);
        throw error;
      }
    }

    console.log(`Successfully ran ${pending.length} migrations`);
  }

  /**
   * Rollback last batch of migrations
   */
  async rollback(): Promise<void> {
    const batch = this.getCurrentBatch();

    if (batch === 0) {
      console.log('Nothing to rollback');
      return;
    }

    const toRollback = this.db.query(
      'SELECT * FROM _migrations WHERE batch = ? ORDER BY applied_at DESC',
      [batch]
    ).rows;

    if (toRollback.length === 0) {
      console.log('Nothing to rollback');
      return;
    }

    console.log(`Rolling back batch ${batch} (${toRollback.length} migrations)`);

    for (const record of toRollback) {
      const migration = this.migrations.find(m => m.id === record.id);

      if (!migration) {
        console.warn(`Migration not found: ${record.name}`);
        continue;
      }

      if (!migration.down) {
        console.warn(`Migration ${record.name} has no down function`);
        continue;
      }

      try {
        console.log(`Rolling back: ${migration.name}`);

        await this.db.transaction(async () => {
          await migration.down!(this.db);

          this.db.execute('DELETE FROM _migrations WHERE id = ?', [migration.id]);
        });

        console.log(`Rolled back: ${migration.name}`);
      } catch (error) {
        console.error(`Rollback failed: ${migration.name}`, error);
        throw error;
      }
    }

    console.log(`Successfully rolled back ${toRollback.length} migrations`);
  }

  /**
   * Reset all migrations
   */
  async reset(): Promise<void> {
    const allMigrations = this.db.query(
      'SELECT * FROM _migrations ORDER BY batch DESC, applied_at DESC'
    ).rows;

    console.log(`Resetting ${allMigrations.length} migrations`);

    for (const record of allMigrations) {
      const migration = this.migrations.find(m => m.id === record.id);

      if (migration && migration.down) {
        try {
          await migration.down(this.db);
        } catch (error) {
          console.error(`Failed to rollback ${migration.name}:`, error);
        }
      }
    }

    this.db.exec('DELETE FROM _migrations');
    console.log('All migrations reset');
  }

  /**
   * Get migration status
   */
  status(): MigrationRecord[] {
    return this.db.query(
      'SELECT * FROM _migrations ORDER BY batch, applied_at'
    ).rows;
  }

  /**
   * Create a new migration file
   */
  create(name: string): string {
    const timestamp = Date.now();
    const id = `${timestamp}_${name}`;
    const filename = `${id}.ts`;
    const filepath = path.join(this.migrationsDir, filename);

    const template = `/**
 * Migration: ${name}
 */

import { SQLiteDatabase } from '../database/sqlite';

export default {
  id: '${id}',
  name: '${name}',
  timestamp: ${timestamp},

  async up(db: SQLiteDatabase): Promise<void> {
    // Add your migration logic here
    db.exec(\`
      -- Your SQL here
    \`);
  },

  async down(db: SQLiteDatabase): Promise<void> {
    // Add your rollback logic here
    db.exec(\`
      -- Your rollback SQL here
    \`);
  }
};
`;

    if (!fs.existsSync(this.migrationsDir)) {
      fs.mkdirSync(this.migrationsDir, { recursive: true });
    }

    fs.writeFileSync(filepath, template);
    console.log(`Created migration: ${filepath}`);

    return filepath;
  }
}

/**
 * Built-in migrations for system tables
 */
export const systemMigrations: Migration[] = [
  {
    id: '000000000001_create_users',
    name: 'Create users table',
    timestamp: 1,
    up: (db: SQLiteDatabase) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          email TEXT NOT NULL UNIQUE,
          username TEXT UNIQUE,
          password_hash TEXT NOT NULL,
          verified INTEGER DEFAULT 0,
          avatar TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX idx_users_email ON users(email);
        CREATE INDEX idx_users_username ON users(username);
      `);
    },
    down: (db: SQLiteDatabase) => {
      db.exec('DROP TABLE IF EXISTS users');
    }
  },
  {
    id: '000000000002_create_sessions',
    name: 'Create sessions table',
    timestamp: 2,
    up: (db: SQLiteDatabase) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          user_id TEXT NOT NULL,
          token TEXT NOT NULL UNIQUE,
          expires_at DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE INDEX idx_sessions_token ON sessions(token);
        CREATE INDEX idx_sessions_user_id ON sessions(user_id);
      `);
    },
    down: (db: SQLiteDatabase) => {
      db.exec('DROP TABLE IF EXISTS sessions');
    }
  },
  {
    id: '000000000003_create_files',
    name: 'Create files table',
    timestamp: 3,
    up: (db: SQLiteDatabase) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS files (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          filename TEXT NOT NULL,
          original_name TEXT NOT NULL,
          mime_type TEXT NOT NULL,
          size INTEGER NOT NULL,
          path TEXT NOT NULL,
          user_id TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        );

        CREATE INDEX idx_files_user_id ON files(user_id);
      `);
    },
    down: (db: SQLiteDatabase) => {
      db.exec('DROP TABLE IF EXISTS files');
    }
  }
];
