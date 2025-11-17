#!/usr/bin/env node

/**
 * CLI Tool
 * Command-line interface for managing PocketBase server
 */

import { existsSync } from 'fs';
import { join } from 'path';
import { PocketBaseServer } from '../src/server.js';
import { initDatabase } from '../src/database/connection.js';
import { CollectionManager } from '../src/collections/manager.js';
import { MigrationsManager } from '../src/migrations/manager.js';
import bcrypt from 'bcryptjs';
import { table } from '../src/database/query-builder.js';
import { nanoid } from 'nanoid';

const DEFAULT_CONFIG = {
  port: 8090,
  host: '0.0.0.0',
  dbPath: './pb_data/data.db',
  jwtSecret: process.env.JWT_SECRET || nanoid(32),
  storagePath: './pb_data/storage',
  migrationsPath: './migrations',
};

/**
 * Parse command-line arguments
 */
function parseArgs(): { command: string; args: Record<string, any> } {
  const [, , command = 'help', ...rest] = process.argv;
  const args: Record<string, any> = {};

  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const value = rest[i + 1] && !rest[i + 1].startsWith('--') ? rest[++i] : true;
      args[key] = value;
    }
  }

  return { command, args };
}

/**
 * Serve command - start the server
 */
async function serveCommand(args: Record<string, any>): Promise<void> {
  console.log('Starting PocketBase server...\n');

  const config = {
    ...DEFAULT_CONFIG,
    port: Number(args.port || DEFAULT_CONFIG.port),
    host: args.host || DEFAULT_CONFIG.host,
    dbPath: args.db || DEFAULT_CONFIG.dbPath,
    jwtSecret: args.secret || DEFAULT_CONFIG.jwtSecret,
    storagePath: args.storage || DEFAULT_CONFIG.storagePath,
  };

  const server = new PocketBaseServer(config);

  try {
    await server.init();
    await server.start();

    // Show info
    const info = server.getInfo();
    console.log('Server Info:');
    console.log(`  Collections: ${info.collections}`);
    console.log(`  Migrations: ${info.migrations.applied}/${info.migrations.total}`);
    console.log(`  Hooks: ${info.hooks.hooks} hooks, ${info.hooks.endpoints} endpoints`);
    console.log('');

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\nShutting down...');
      await server.stop();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

/**
 * Migrate command - run migrations
 */
async function migrateCommand(args: Record<string, any>): Promise<void> {
  const dbPath = args.db || DEFAULT_CONFIG.dbPath;

  console.log('Running migrations...\n');

  const db = initDatabase({ path: dbPath });
  const migrations = new MigrationsManager(db, args.path || DEFAULT_CONFIG.migrationsPath);

  try {
    await migrations.loadMigrations();

    if (args.down) {
      // Rollback
      if (args.all) {
        await migrations.rollbackAll();
      } else {
        await migrations.rollback();
      }
    } else if (args.reset) {
      // Reset
      await migrations.reset();
    } else if (args.status) {
      // Show status
      const status = migrations.getStatus();
      console.log(`Total migrations: ${status.total}`);
      console.log(`Applied: ${status.applied}`);
      console.log(`Pending: ${status.pending}\n`);

      console.log('Migrations:');
      for (const m of status.migrations) {
        const status = m.applied ? '✓' : '✗';
        const date = m.date ? ` (${m.date.toISOString()})` : '';
        console.log(`  ${status} ${m.version} - ${m.name}${date}`);
      }
    } else if (args.create) {
      // Create new migration
      const name = args.create;
      const filePath = migrations.createMigration(name);
      console.log(`\nMigration created: ${filePath}`);
    } else {
      // Run migrations
      const count = await migrations.migrate();
      console.log(`\nRan ${count} migrations`);
    }

    db.close();
  } catch (error) {
    console.error('Migration failed:', error);
    db.close();
    process.exit(1);
  }
}

/**
 * Admin command - manage admin users
 */
async function adminCommand(args: Record<string, any>): Promise<void> {
  const dbPath = args.db || DEFAULT_CONFIG.dbPath;

  if (!existsSync(dbPath)) {
    console.error(`Database not found: ${dbPath}`);
    process.exit(1);
  }

  const db = initDatabase({ path: dbPath });

  try {
    if (args.create) {
      // Create admin
      const email = args.email || prompt('Email: ');
      const password = args.password || prompt('Password: ');

      if (!email || !password) {
        console.error('Email and password are required');
        process.exit(1);
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const now = new Date().toISOString();

      table('_admins', db).insert({
        id: nanoid(15),
        email,
        password: hashedPassword,
        tokenKey: nanoid(32),
        avatar: 0,
        created: now,
        updated: now,
      });

      console.log(`✓ Admin created: ${email}`);
    } else if (args.list) {
      // List admins
      const admins = table('_admins', db).select('id', 'email', 'created').get();
      console.log('Admins:');
      for (const admin of admins) {
        console.log(`  ${admin.email} (${admin.id})`);
      }
    } else if (args.delete) {
      // Delete admin
      const email = args.delete;
      table('_admins', db).where('email', email).delete();
      console.log(`✓ Admin deleted: ${email}`);
    } else {
      console.log('Usage: admin [--create|--list|--delete email] [--email EMAIL] [--password PASSWORD]');
    }

    db.close();
  } catch (error) {
    console.error('Admin command failed:', error);
    db.close();
    process.exit(1);
  }
}

/**
 * Collection command - manage collections
 */
async function collectionCommand(args: Record<string, any>): Promise<void> {
  const dbPath = args.db || DEFAULT_CONFIG.dbPath;

  if (!existsSync(dbPath)) {
    console.error(`Database not found: ${dbPath}`);
    process.exit(1);
  }

  const db = initDatabase({ path: dbPath });
  const collections = new CollectionManager(db);

  try {
    if (args.list) {
      // List collections
      const allCollections = collections.getAllCollections();
      console.log('Collections:');
      for (const col of allCollections) {
        const fields = col.schema.length;
        console.log(`  ${col.name} (${col.type}, ${fields} fields)`);
      }
    } else if (args.show) {
      // Show collection details
      const collection = collections.getCollection(args.show);
      if (!collection) {
        console.error(`Collection not found: ${args.show}`);
        process.exit(1);
      }

      console.log(`Collection: ${collection.name}`);
      console.log(`Type: ${collection.type}`);
      console.log(`ID: ${collection.id}`);
      console.log(`\nFields:`);
      for (const field of collection.schema) {
        console.log(`  ${field.name} (${field.type})`);
      }
      console.log(`\nRules:`);
      console.log(`  List: ${collection.listRule || 'public'}`);
      console.log(`  View: ${collection.viewRule || 'public'}`);
      console.log(`  Create: ${collection.createRule || 'public'}`);
      console.log(`  Update: ${collection.updateRule || 'public'}`);
      console.log(`  Delete: ${collection.deleteRule || 'public'}`);
    } else {
      console.log('Usage: collection [--list|--show NAME]');
    }

    db.close();
  } catch (error) {
    console.error('Collection command failed:', error);
    db.close();
    process.exit(1);
  }
}

/**
 * Backup command - create database backup
 */
async function backupCommand(args: Record<string, any>): Promise<void> {
  const dbPath = args.db || DEFAULT_CONFIG.dbPath;

  if (!existsSync(dbPath)) {
    console.error(`Database not found: ${dbPath}`);
    process.exit(1);
  }

  const db = initDatabase({ path: dbPath });
  const backupPath = args.output || `./pb_data/backups/backup_${Date.now()}.db`;

  try {
    console.log('Creating backup...');
    await db.backup(backupPath);
    console.log(`✓ Backup created: ${backupPath}`);
    db.close();
  } catch (error) {
    console.error('Backup failed:', error);
    db.close();
    process.exit(1);
  }
}

/**
 * Info command - show server info
 */
async function infoCommand(args: Record<string, any>): Promise<void> {
  const dbPath = args.db || DEFAULT_CONFIG.dbPath;

  if (!existsSync(dbPath)) {
    console.error(`Database not found: ${dbPath}`);
    process.exit(1);
  }

  const db = initDatabase({ path: dbPath });
  const collections = new CollectionManager(db);
  const migrations = new MigrationsManager(db);

  await migrations.loadMigrations();

  const info = {
    database: {
      path: dbPath,
      size: db.getSize(),
      tables: db.getTables().length,
    },
    collections: {
      total: collections.getAllCollections().length,
      auth: collections.getAllCollections().filter(c => c.type === 'auth').length,
      base: collections.getAllCollections().filter(c => c.type === 'base').length,
    },
    migrations: migrations.getStatus(),
  };

  console.log('\nDatabase Info:');
  console.log(`  Path: ${info.database.path}`);
  console.log(`  Size: ${(info.database.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Tables: ${info.database.tables}`);

  console.log('\nCollections:');
  console.log(`  Total: ${info.collections.total}`);
  console.log(`  Auth: ${info.collections.auth}`);
  console.log(`  Base: ${info.collections.base}`);

  console.log('\nMigrations:');
  console.log(`  Total: ${info.migrations.total}`);
  console.log(`  Applied: ${info.migrations.applied}`);
  console.log(`  Pending: ${info.migrations.pending}`);

  db.close();
}

/**
 * Help command - show usage
 */
function helpCommand(): void {
  console.log(`
Elide PocketBase Clone - CLI Tool

Usage: elide-pocket <command> [options]

Commands:
  serve           Start the server
  migrate         Run database migrations
  admin           Manage admin users
  collection      Manage collections
  backup          Create database backup
  info            Show server information
  help            Show this help message

Options:
  --port PORT           Server port (default: 8090)
  --host HOST           Server host (default: 0.0.0.0)
  --db PATH             Database path (default: ./pb_data/data.db)
  --secret SECRET       JWT secret key
  --storage PATH        Storage path (default: ./pb_data/storage)

Migrate Options:
  --down               Rollback last migration
  --all                Apply to all migrations
  --reset              Rollback all and re-apply
  --status             Show migration status
  --create NAME        Create new migration
  --path PATH          Migrations directory path

Admin Options:
  --create             Create admin user
  --list               List admin users
  --delete EMAIL       Delete admin user
  --email EMAIL        Admin email
  --password PASS      Admin password

Collection Options:
  --list               List all collections
  --show NAME          Show collection details

Backup Options:
  --output PATH        Backup output path

Examples:
  elide-pocket serve --port 3000
  elide-pocket migrate --status
  elide-pocket migrate --create add_posts_table
  elide-pocket admin --create --email admin@example.com --password secret
  elide-pocket collection --list
  elide-pocket backup --output ./backup.db
  elide-pocket info
`);
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const { command, args } = parseArgs();

  try {
    switch (command) {
      case 'serve':
        await serveCommand(args);
        break;
      case 'migrate':
        await migrateCommand(args);
        break;
      case 'admin':
        await adminCommand(args);
        break;
      case 'collection':
        await collectionCommand(args);
        break;
      case 'backup':
        await backupCommand(args);
        break;
      case 'info':
        await infoCommand(args);
        break;
      case 'help':
      default:
        helpCommand();
        break;
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Polyfill for prompt (basic version)
function prompt(message: string): string {
  process.stdout.write(message);
  // In a real CLI, you'd use readline or a proper prompt library
  return '';
}

main();
