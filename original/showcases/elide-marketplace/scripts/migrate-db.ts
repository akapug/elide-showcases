#!/usr/bin/env elide

/**
 * Database Migration Script
 *
 * Handles database schema migrations
 */

import { Database } from "@elide/db";

interface Migration {
  version: number;
  name: string;
  up: string;
  down?: string;
}

const migrations: Migration[] = [
  {
    version: 1,
    name: "initial_schema",
    up: `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `
  },
  {
    version: 2,
    name: "add_user_profiles",
    up: `
      CREATE TABLE IF NOT EXISTS user_profiles (
        user_id TEXT PRIMARY KEY,
        avatar_url TEXT,
        bio TEXT,
        website TEXT,
        twitter TEXT,
        github TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `
  },
  {
    version: 3,
    name: "add_package_tags",
    up: `
      CREATE TABLE IF NOT EXISTS package_tags (
        id TEXT PRIMARY KEY,
        package_id TEXT NOT NULL,
        tag TEXT NOT NULL,
        FOREIGN KEY (package_id) REFERENCES packages(id),
        UNIQUE(package_id, tag)
      );

      CREATE INDEX IF NOT EXISTS idx_package_tags_tag ON package_tags(tag);
    `
  },
  {
    version: 4,
    name: "add_service_logs",
    up: `
      CREATE TABLE IF NOT EXISTS deployment_logs (
        id TEXT PRIMARY KEY,
        deployment_id TEXT NOT NULL,
        level TEXT NOT NULL,
        message TEXT NOT NULL,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (deployment_id) REFERENCES deployments(id)
      );

      CREATE INDEX IF NOT EXISTS idx_deployment_logs_deployment
        ON deployment_logs(deployment_id);
      CREATE INDEX IF NOT EXISTS idx_deployment_logs_created
        ON deployment_logs(created_at);
    `
  },
  {
    version: 5,
    name: "add_api_usage_tracking",
    up: `
      CREATE TABLE IF NOT EXISTS api_usage (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        endpoint TEXT NOT NULL,
        method TEXT NOT NULL,
        status_code INTEGER,
        response_time INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_api_usage_user ON api_usage(user_id);
      CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint ON api_usage(endpoint);
      CREATE INDEX IF NOT EXISTS idx_api_usage_created ON api_usage(created_at);
    `
  }
];

class MigrationRunner {
  private db: Database;

  constructor(dbPath: string = "marketplace.db") {
    this.db = new Database(dbPath);
  }

  private getCurrentVersion(): number {
    try {
      const result = this.db.prepare(`
        SELECT MAX(version) as version FROM schema_migrations
      `).get();

      return result?.version || 0;
    } catch {
      // Migrations table doesn't exist yet
      return 0;
    }
  }

  private recordMigration(migration: Migration): void {
    this.db.prepare(`
      INSERT INTO schema_migrations (version, name)
      VALUES (?, ?)
    `).run(migration.version, migration.name);
  }

  async migrate(): Promise<void> {
    const currentVersion = this.getCurrentVersion();

    console.log(`Current schema version: ${currentVersion}`);

    const pendingMigrations = migrations.filter(
      m => m.version > currentVersion
    ).sort((a, b) => a.version - b.version);

    if (pendingMigrations.length === 0) {
      console.log("No pending migrations");
      return;
    }

    console.log(`Found ${pendingMigrations.length} pending migration(s)\n`);

    for (const migration of pendingMigrations) {
      try {
        console.log(`Running migration ${migration.version}: ${migration.name}...`);

        // Run migration
        this.db.exec(migration.up);

        // Record migration
        this.recordMigration(migration);

        console.log(`✓ Migration ${migration.version} completed\n`);

      } catch (error) {
        console.error(`✗ Migration ${migration.version} failed:`, error);
        throw error;
      }
    }

    console.log("All migrations completed successfully!");
  }

  async rollback(steps: number = 1): Promise<void> {
    const currentVersion = this.getCurrentVersion();

    if (currentVersion === 0) {
      console.log("No migrations to rollback");
      return;
    }

    const migrationsToRollback = migrations
      .filter(m => m.version <= currentVersion && m.version > currentVersion - steps)
      .sort((a, b) => b.version - a.version);

    console.log(`Rolling back ${migrationsToRollback.length} migration(s)\n`);

    for (const migration of migrationsToRollback) {
      try {
        if (!migration.down) {
          console.warn(`⚠ Migration ${migration.version} has no down script, skipping...`);
          continue;
        }

        console.log(`Rolling back migration ${migration.version}: ${migration.name}...`);

        // Run rollback
        this.db.exec(migration.down);

        // Remove migration record
        this.db.prepare(`
          DELETE FROM schema_migrations WHERE version = ?
        `).run(migration.version);

        console.log(`✓ Migration ${migration.version} rolled back\n`);

      } catch (error) {
        console.error(`✗ Rollback of migration ${migration.version} failed:`, error);
        throw error;
      }
    }

    console.log("Rollback completed successfully!");
  }

  async status(): Promise<void> {
    const currentVersion = this.getCurrentVersion();

    console.log("Migration Status\n");
    console.log(`Current version: ${currentVersion}\n`);

    console.log("Available migrations:");
    migrations.forEach(m => {
      const status = m.version <= currentVersion ? "✓ Applied" : "○ Pending";
      console.log(`  ${status}  v${m.version}: ${m.name}`);
    });
  }
}

// CLI
if (import.meta.main) {
  const command = Deno.args[0] || "migrate";
  const runner = new MigrationRunner();

  try {
    switch (command) {
      case "migrate":
      case "up":
        await runner.migrate();
        break;

      case "rollback":
      case "down":
        const steps = parseInt(Deno.args[1] || "1");
        await runner.rollback(steps);
        break;

      case "status":
        await runner.status();
        break;

      default:
        console.error(`Unknown command: ${command}`);
        console.error("Usage: migrate-db.ts [migrate|rollback|status]");
        Deno.exit(1);
    }
  } catch (error) {
    console.error("Migration error:", error);
    Deno.exit(1);
  }
}
