/**
 * Migration System
 */

import { Schema, Migration, MigrationHistory } from './types';
import { QueryEngine } from './engine/query-engine';
import { parseSchema, validateSchema } from './schema-parser';
import { diffSchemas } from './schema-diff';

/**
 * Migration Manager
 */
export class MigrationManager {
  private migrationsPath: string;
  private appliedMigrations: MigrationHistory[] = [];

  constructor(
    private engine: QueryEngine,
    options: { migrationsPath?: string } = {}
  ) {
    this.migrationsPath = options.migrationsPath || './prisma/migrations';
  }

  /**
   * Create a new migration
   */
  async create(name: string): Promise<Migration> {
    const currentSchema = await this.getCurrentSchema();
    const targetSchema = await this.getTargetSchema();

    const errors = validateSchema(targetSchema);
    if (errors.length > 0) {
      throw new Error(`Schema validation failed:\n${errors.join('\n')}`);
    }

    const diff = diffSchemas(currentSchema, targetSchema);
    const { up, down } = generateMigrationSQL(diff);

    const migration: Migration = {
      id: this.generateMigrationId(),
      name,
      up,
      down,
      timestamp: new Date(),
      applied: false
    };

    await this.saveMigration(migration);
    return migration;
  }

  /**
   * Apply pending migrations
   */
  async migrate(): Promise<MigrationHistory[]> {
    await this.ensureMigrationsTable();

    const pending = await this.getPendingMigrations();
    const applied: MigrationHistory[] = [];

    for (const migration of pending) {
      try {
        await this.engine.beginTransaction();
        await this.applyMigration(migration);
        await this.recordMigration(migration);
        await this.engine.commitTransaction();

        const history: MigrationHistory = {
          id: migration.id,
          name: migration.name,
          appliedAt: new Date()
        };

        applied.push(history);
        console.log(`Applied migration: ${migration.name}`);
      } catch (error) {
        await this.engine.rollbackTransaction();
        console.error(`Failed to apply migration ${migration.name}:`, error);
        throw error;
      }
    }

    return applied;
  }

  /**
   * Rollback last migration
   */
  async rollback(): Promise<void> {
    const last = await this.getLastAppliedMigration();
    if (!last) {
      console.log('No migrations to rollback');
      return;
    }

    const migration = await this.loadMigration(last.id);

    try {
      await this.engine.beginTransaction();
      await this.engine.executeRaw(migration.down);
      await this.removeMigrationRecord(migration.id);
      await this.engine.commitTransaction();

      console.log(`Rolled back migration: ${migration.name}`);
    } catch (error) {
      await this.engine.rollbackTransaction();
      console.error(`Failed to rollback migration ${migration.name}:`, error);
      throw error;
    }
  }

  /**
   * Reset database
   */
  async reset(): Promise<void> {
    const migrations = await this.getAppliedMigrations();

    // Rollback all migrations in reverse order
    for (let i = migrations.length - 1; i >= 0; i--) {
      const migration = await this.loadMigration(migrations[i].id);
      await this.engine.executeRaw(migration.down);
    }

    // Clear migration history
    await this.engine.executeRaw('DELETE FROM "_prisma_migrations"');

    console.log('Database reset complete');
  }

  /**
   * Get migration status
   */
  async status(): Promise<{
    applied: MigrationHistory[];
    pending: Migration[];
  }> {
    const applied = await this.getAppliedMigrations();
    const pending = await this.getPendingMigrations();

    return { applied, pending };
  }

  /**
   * Ensure migrations table exists
   */
  private async ensureMigrationsTable(): Promise<void> {
    await this.engine.executeRaw(`
      CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
        id VARCHAR(255) PRIMARY KEY,
        checksum VARCHAR(64) NOT NULL,
        finished_at TIMESTAMP,
        migration_name VARCHAR(255) NOT NULL,
        logs TEXT,
        rolled_back_at TIMESTAMP,
        started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        applied_steps_count INTEGER NOT NULL DEFAULT 0
      )
    `);
  }

  /**
   * Apply migration
   */
  private async applyMigration(migration: Migration): Promise<void> {
    // Split migration into individual statements
    const statements = migration.up
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      await this.engine.executeRaw(statement);
    }
  }

  /**
   * Record migration as applied
   */
  private async recordMigration(migration: Migration): Promise<void> {
    const checksum = this.calculateChecksum(migration.up);

    await this.engine.executeRaw(`
      INSERT INTO "_prisma_migrations"
        (id, checksum, migration_name, finished_at, applied_steps_count)
      VALUES
        ($1, $2, $3, CURRENT_TIMESTAMP, 1)
    `, [migration.id, checksum, migration.name]);
  }

  /**
   * Remove migration record
   */
  private async removeMigrationRecord(id: string): Promise<void> {
    await this.engine.executeRaw(
      'DELETE FROM "_prisma_migrations" WHERE id = $1',
      [id]
    );
  }

  /**
   * Get applied migrations
   */
  private async getAppliedMigrations(): Promise<MigrationHistory[]> {
    const result = await this.engine.executeRaw(`
      SELECT id, migration_name as name, finished_at as "appliedAt"
      FROM "_prisma_migrations"
      WHERE finished_at IS NOT NULL
      ORDER BY started_at ASC
    `);

    return result.rows as MigrationHistory[];
  }

  /**
   * Get last applied migration
   */
  private async getLastAppliedMigration(): Promise<MigrationHistory | null> {
    const migrations = await this.getAppliedMigrations();
    return migrations[migrations.length - 1] || null;
  }

  /**
   * Get pending migrations
   */
  private async getPendingMigrations(): Promise<Migration[]> {
    const allMigrations = await this.getAllMigrations();
    const applied = await this.getAppliedMigrations();
    const appliedIds = new Set(applied.map(m => m.id));

    return allMigrations.filter(m => !appliedIds.has(m.id));
  }

  /**
   * Get all migrations from directory
   */
  private async getAllMigrations(): Promise<Migration[]> {
    // Implementation would read migration files from disk
    // For now, return empty array
    return [];
  }

  /**
   * Load migration by ID
   */
  private async loadMigration(id: string): Promise<Migration> {
    // Implementation would load migration file
    throw new Error('Not implemented');
  }

  /**
   * Save migration to disk
   */
  private async saveMigration(migration: Migration): Promise<void> {
    const dirName = `${this.formatTimestamp(migration.timestamp)}_${migration.name}`;
    const migrationPath = `${this.migrationsPath}/${dirName}`;

    // Create migration directory
    // Write migration.sql file
    // Write migration.json metadata
  }

  /**
   * Get current database schema
   */
  private async getCurrentSchema(): Promise<Schema> {
    // Implementation would introspect database
    return {
      datasources: [],
      generators: [],
      models: [],
      enums: [],
      types: []
    };
  }

  /**
   * Get target schema from schema file
   */
  private async getTargetSchema(): Promise<Schema> {
    // Implementation would read and parse schema.prisma
    return {
      datasources: [],
      generators: [],
      models: [],
      enums: [],
      types: []
    };
  }

  /**
   * Generate migration ID
   */
  private generateMigrationId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Format timestamp for directory name
   */
  private formatTimestamp(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  /**
   * Calculate checksum
   */
  private calculateChecksum(content: string): string {
    // Simple hash function (in production, use crypto)
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
}

/**
 * Schema Differ
 */
export interface SchemaDiff {
  addedModels: string[];
  removedModels: string[];
  modifiedModels: ModelDiff[];
  addedEnums: string[];
  removedEnums: string[];
}

export interface ModelDiff {
  name: string;
  addedFields: string[];
  removedFields: string[];
  modifiedFields: FieldDiff[];
  addedIndexes: string[];
  removedIndexes: string[];
}

export interface FieldDiff {
  name: string;
  changes: string[];
}

/**
 * Diff two schemas
 */
function diffSchemas(current: Schema, target: Schema): SchemaDiff {
  const diff: SchemaDiff = {
    addedModels: [],
    removedModels: [],
    modifiedModels: [],
    addedEnums: [],
    removedEnums: []
  };

  const currentModels = new Set(current.models.map(m => m.name));
  const targetModels = new Set(target.models.map(m => m.name));

  // Find added models
  for (const model of target.models) {
    if (!currentModels.has(model.name)) {
      diff.addedModels.push(model.name);
    }
  }

  // Find removed models
  for (const model of current.models) {
    if (!targetModels.has(model.name)) {
      diff.removedModels.push(model.name);
    }
  }

  // Find modified models
  for (const targetModel of target.models) {
    const currentModel = current.models.find(m => m.name === targetModel.name);
    if (currentModel) {
      const modelDiff = diffModels(currentModel, targetModel);
      if (modelDiff) {
        diff.modifiedModels.push(modelDiff);
      }
    }
  }

  return diff;
}

/**
 * Diff two models
 */
function diffModels(current: any, target: any): ModelDiff | null {
  const diff: ModelDiff = {
    name: current.name,
    addedFields: [],
    removedFields: [],
    modifiedFields: [],
    addedIndexes: [],
    removedIndexes: []
  };

  const currentFields = new Set(current.fields.map((f: any) => f.name));
  const targetFields = new Set(target.fields.map((f: any) => f.name));

  // Find added fields
  for (const field of target.fields) {
    if (!currentFields.has(field.name)) {
      diff.addedFields.push(field.name);
    }
  }

  // Find removed fields
  for (const field of current.fields) {
    if (!targetFields.has(field.name)) {
      diff.removedFields.push(field.name);
    }
  }

  // Check if there are any changes
  if (
    diff.addedFields.length === 0 &&
    diff.removedFields.length === 0 &&
    diff.modifiedFields.length === 0 &&
    diff.addedIndexes.length === 0 &&
    diff.removedIndexes.length === 0
  ) {
    return null;
  }

  return diff;
}

/**
 * Generate migration SQL
 */
function generateMigrationSQL(diff: SchemaDiff): { up: string; down: string } {
  const up: string[] = [];
  const down: string[] = [];

  // Create tables for added models
  for (const modelName of diff.addedModels) {
    up.push(`CREATE TABLE "${modelName}" (id SERIAL PRIMARY KEY);`);
    down.push(`DROP TABLE "${modelName}";`);
  }

  // Drop tables for removed models
  for (const modelName of diff.removedModels) {
    up.push(`DROP TABLE "${modelName}";`);
    down.push(`CREATE TABLE "${modelName}" (id SERIAL PRIMARY KEY);`);
  }

  // Modify existing tables
  for (const modelDiff of diff.modifiedModels) {
    // Add fields
    for (const fieldName of modelDiff.addedFields) {
      up.push(`ALTER TABLE "${modelDiff.name}" ADD COLUMN "${fieldName}" TEXT;`);
      down.push(`ALTER TABLE "${modelDiff.name}" DROP COLUMN "${fieldName}";`);
    }

    // Remove fields
    for (const fieldName of modelDiff.removedFields) {
      up.push(`ALTER TABLE "${modelDiff.name}" DROP COLUMN "${fieldName}";`);
      down.push(`ALTER TABLE "${modelDiff.name}" ADD COLUMN "${fieldName}" TEXT;`);
    }
  }

  return {
    up: up.join('\n'),
    down: down.join('\n')
  };
}

/**
 * Database Introspection
 */
export class DatabaseIntrospector {
  constructor(private engine: QueryEngine) {}

  /**
   * Introspect database schema
   */
  async introspect(): Promise<Schema> {
    const tables = await this.getTables();
    const models = await Promise.all(tables.map(t => this.introspectTable(t)));

    return {
      datasources: [],
      generators: [],
      models,
      enums: [],
      types: []
    };
  }

  /**
   * Get all tables
   */
  private async getTables(): Promise<string[]> {
    const result = await this.engine.executeRaw(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND table_name != '_prisma_migrations'
    `);

    return result.rows.map((r: any) => r.table_name);
  }

  /**
   * Introspect table structure
   */
  private async introspectTable(tableName: string): Promise<any> {
    const columns = await this.getColumns(tableName);
    const indexes = await this.getIndexes(tableName);

    return {
      name: this.toPascalCase(tableName),
      fields: columns,
      idFields: [],
      uniqueFields: [],
      indexes
    };
  }

  /**
   * Get table columns
   */
  private async getColumns(tableName: string): Promise<any[]> {
    const result = await this.engine.executeRaw(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);

    return result.rows.map((r: any) => ({
      name: r.column_name,
      type: this.mapSQLTypeToPrisma(r.data_type),
      isRequired: r.is_nullable === 'NO',
      isList: false,
      isId: false,
      isUnique: false,
      isUpdatedAt: false,
      default: r.column_default
    }));
  }

  /**
   * Get table indexes
   */
  private async getIndexes(tableName: string): Promise<any[]> {
    const result = await this.engine.executeRaw(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = $1
    `, [tableName]);

    return result.rows.map((r: any) => ({
      name: r.indexname,
      fields: [],
      isUnique: r.indexdef.includes('UNIQUE')
    }));
  }

  /**
   * Map SQL type to Prisma type
   */
  private mapSQLTypeToPrisma(sqlType: string): string {
    const typeMap: Record<string, string> = {
      'character varying': 'String',
      'varchar': 'String',
      'text': 'String',
      'integer': 'Int',
      'int': 'Int',
      'bigint': 'BigInt',
      'numeric': 'Decimal',
      'decimal': 'Decimal',
      'real': 'Float',
      'double precision': 'Float',
      'boolean': 'Boolean',
      'timestamp': 'DateTime',
      'timestamptz': 'DateTime',
      'date': 'DateTime',
      'json': 'Json',
      'jsonb': 'Json',
      'bytea': 'Bytes'
    };

    return typeMap[sqlType.toLowerCase()] || 'String';
  }

  /**
   * Convert to PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .split('_')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  }
}
