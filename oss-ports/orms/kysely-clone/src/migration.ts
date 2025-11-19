/**
 * Migration system
 */

import { Kysely } from './kysely';

export interface MigrationProvider {
  getMigrations(): Promise<Record<string, Migration>>;
}

export interface Migration {
  up(db: Kysely<any>): Promise<void>;
  down?(db: Kysely<any>): Promise<void>;
}

export class Migrator {
  constructor(private config: {
    db: Kysely<any>;
    provider: MigrationProvider;
  }) {}

  async migrateToLatest() {
    const migrations = await this.config.provider.getMigrations();
    const results: any[] = [];

    for (const [name, migration] of Object.entries(migrations)) {
      try {
        await migration.up(this.config.db);
        results.push({ migrationName: name, status: 'Success' });
      } catch (error) {
        results.push({ migrationName: name, status: 'Error', error });
        return { error, results };
      }
    }

    return { results };
  }

  async migrateDown() {
    const migrations = await this.config.provider.getMigrations();
    const entries = Object.entries(migrations).reverse();

    for (const [name, migration] of entries) {
      if (migration.down) {
        await migration.down(this.config.db);
      }
    }
  }
}

export class FileMigrationProvider implements MigrationProvider {
  constructor(private config: {
    fs: any;
    path: any;
    migrationFolder: string;
  }) {}

  async getMigrations(): Promise<Record<string, Migration>> {
    const files = await this.config.fs.readdir(this.config.migrationFolder);
    const migrations: Record<string, Migration> = {};

    for (const file of files) {
      if (file.endsWith('.ts') || file.endsWith('.js')) {
        const filePath = this.config.path.join(this.config.migrationFolder, file);
        const module = await import(filePath);
        migrations[file] = module;
      }
    }

    return migrations;
  }
}
