/**
 * Schema Evolution and Migration Example
 *
 * Demonstrates:
 * - Schema versioning
 * - Backward/forward compatibility
 * - Schema migration strategies
 * - Field mapping and transformation
 * - Type coercion
 * - Default value handling
 * - Schema validation
 * - Migration rollback
 * - Schema registry integration
 */

// ==================== Types ====================

interface SchemaVersion {
  version: number;
  timestamp: number;
  description: string;
  fields: SchemaField[];
  compatibility: 'backward' | 'forward' | 'full' | 'none';
  migrations: SchemaMigration[];
}

interface SchemaField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'date' | 'null';
  required: boolean;
  defaultValue?: any;
  description?: string;
  deprecated?: boolean;
  addedInVersion?: number;
  removedInVersion?: number;
  renamedFrom?: string;
  transformFrom?: string;
}

interface SchemaMigration {
  id: string;
  fromVersion: number;
  toVersion: number;
  type: 'add_field' | 'remove_field' | 'rename_field' | 'change_type' | 'transform_value';
  field: string;
  config: MigrationConfig;
}

interface MigrationConfig {
  oldName?: string;
  newName?: string;
  oldType?: string;
  newType?: string;
  defaultValue?: any;
  transformer?: (value: any) => any;
}

interface SchemaRegistry {
  schemas: Map<number, SchemaVersion>;
  currentVersion: number;
}

// ==================== Schema Registry ====================

class SchemaEvolutionManager {
  private registry: SchemaRegistry = {
    schemas: new Map(),
    currentVersion: 0
  };
  private migrationHistory: Array<{
    timestamp: number;
    fromVersion: number;
    toVersion: number;
    recordCount: number;
    success: boolean;
  }> = [];

  /**
   * Register a new schema version
   */
  registerSchema(schema: SchemaVersion): void {
    if (this.registry.schemas.has(schema.version)) {
      throw new Error(`Schema version ${schema.version} already exists`);
    }

    // Validate compatibility with previous version
    if (schema.version > 1) {
      const previousSchema = this.registry.schemas.get(schema.version - 1);
      if (previousSchema) {
        this.validateCompatibility(previousSchema, schema);
      }
    }

    this.registry.schemas.set(schema.version, schema);
    this.registry.currentVersion = Math.max(this.registry.currentVersion, schema.version);

    console.log(`Registered schema version ${schema.version}: ${schema.description}`);
  }

  /**
   * Migrate data from one version to another
   */
  async migrateData(
    data: any[],
    fromVersion: number,
    toVersion: number
  ): Promise<any[]> {
    console.log(`Migrating ${data.length} records from v${fromVersion} to v${toVersion}...`);

    const startTime = Date.now();
    let currentVersion = fromVersion;
    let currentData = [...data];
    const migrationPath: number[] = [];

    // Build migration path
    if (fromVersion < toVersion) {
      for (let v = fromVersion; v < toVersion; v++) {
        migrationPath.push(v, v + 1);
      }
    } else {
      for (let v = fromVersion; v > toVersion; v--) {
        migrationPath.push(v, v - 1);
      }
    }

    // Execute migrations step by step
    for (let i = 0; i < migrationPath.length; i += 2) {
      const from = migrationPath[i];
      const to = migrationPath[i + 1];

      currentData = await this.migrateVersion(currentData, from, to);
      currentVersion = to;
    }

    const duration = Date.now() - startTime;

    // Record migration
    this.migrationHistory.push({
      timestamp: Date.now(),
      fromVersion,
      toVersion,
      recordCount: data.length,
      success: true
    });

    console.log(`Migration complete in ${duration}ms`);

    return currentData;
  }

  /**
   * Migrate data between adjacent schema versions
   */
  private async migrateVersion(
    data: any[],
    fromVersion: number,
    toVersion: number
  ): Promise<any[]> {
    const targetSchema = this.registry.schemas.get(toVersion);
    if (!targetSchema) {
      throw new Error(`Schema version ${toVersion} not found`);
    }

    const migrations = targetSchema.migrations.filter(
      m => m.fromVersion === fromVersion && m.toVersion === toVersion
    );

    const migratedData: any[] = [];

    for (const record of data) {
      let migratedRecord = { ...record };

      // Apply each migration
      for (const migration of migrations) {
        migratedRecord = this.applyMigration(migratedRecord, migration);
      }

      // Apply schema defaults
      migratedRecord = this.applySchemaDefaults(migratedRecord, targetSchema);

      // Validate against target schema
      const validation = this.validateRecord(migratedRecord, targetSchema);
      if (!validation.valid) {
        console.warn(`Record failed validation:`, validation.errors);
      }

      migratedData.push(migratedRecord);
    }

    return migratedData;
  }

  /**
   * Apply a single migration to a record
   */
  private applyMigration(record: any, migration: SchemaMigration): any {
    const result = { ...record };

    switch (migration.type) {
      case 'add_field':
        result[migration.field] = migration.config.defaultValue;
        break;

      case 'remove_field':
        delete result[migration.field];
        break;

      case 'rename_field':
        if (migration.config.oldName && migration.config.newName) {
          result[migration.config.newName] = result[migration.config.oldName];
          delete result[migration.config.oldName];
        }
        break;

      case 'change_type':
        if (migration.field in result) {
          result[migration.field] = this.coerceType(
            result[migration.field],
            migration.config.newType!
          );
        }
        break;

      case 'transform_value':
        if (migration.field in result && migration.config.transformer) {
          result[migration.field] = migration.config.transformer(result[migration.field]);
        }
        break;
    }

    return result;
  }

  /**
   * Coerce value to target type
   */
  private coerceType(value: any, targetType: string): any {
    if (value === null || value === undefined) {
      return value;
    }

    switch (targetType) {
      case 'string':
        return String(value);

      case 'number':
        const num = Number(value);
        return isNaN(num) ? null : num;

      case 'boolean':
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') {
          return value.toLowerCase() === 'true' || value === '1';
        }
        return Boolean(value);

      case 'date':
        if (value instanceof Date) return value;
        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date;

      case 'array':
        return Array.isArray(value) ? value : [value];

      case 'object':
        return typeof value === 'object' ? value : { value };

      default:
        return value;
    }
  }

  /**
   * Apply default values from schema
   */
  private applySchemaDefaults(record: any, schema: SchemaVersion): any {
    const result = { ...record };

    for (const field of schema.fields) {
      if (!(field.name in result) && field.defaultValue !== undefined) {
        result[field.name] = field.defaultValue;
      }
    }

    return result;
  }

  /**
   * Validate record against schema
   */
  private validateRecord(record: any, schema: SchemaVersion): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required fields
    for (const field of schema.fields.filter(f => f.required)) {
      if (!(field.name in record) || record[field.name] === null || record[field.name] === undefined) {
        errors.push(`Missing required field: ${field.name}`);
      }
    }

    // Check field types
    for (const field of schema.fields) {
      if (field.name in record) {
        const value = record[field.name];
        if (value !== null && value !== undefined) {
          const typeValid = this.checkType(value, field.type);
          if (!typeValid) {
            errors.push(`Field ${field.name} has invalid type (expected ${field.type})`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if value matches expected type
   */
  private checkType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'date':
        return value instanceof Date || !isNaN(Date.parse(value));
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && !Array.isArray(value);
      case 'null':
        return value === null;
      default:
        return true;
    }
  }

  /**
   * Validate compatibility between schema versions
   */
  private validateCompatibility(oldSchema: SchemaVersion, newSchema: SchemaVersion): void {
    const compatibility = newSchema.compatibility;

    if (compatibility === 'backward' || compatibility === 'full') {
      // New schema must be able to read old data
      this.checkBackwardCompatibility(oldSchema, newSchema);
    }

    if (compatibility === 'forward' || compatibility === 'full') {
      // Old schema must be able to read new data
      this.checkForwardCompatibility(oldSchema, newSchema);
    }
  }

  /**
   * Check backward compatibility (new schema reads old data)
   */
  private checkBackwardCompatibility(oldSchema: SchemaVersion, newSchema: SchemaVersion): void {
    // All required fields in new schema must exist in old schema or have defaults
    for (const newField of newSchema.fields.filter(f => f.required)) {
      const oldField = oldSchema.fields.find(f => f.name === newField.name);

      if (!oldField && newField.defaultValue === undefined) {
        throw new Error(
          `Backward incompatible: Required field ${newField.name} added without default value`
        );
      }
    }
  }

  /**
   * Check forward compatibility (old schema reads new data)
   */
  private checkForwardCompatibility(oldSchema: SchemaVersion, newSchema: SchemaVersion): void {
    // All required fields in old schema must still exist in new schema
    for (const oldField of oldSchema.fields.filter(f => f.required)) {
      const newField = newSchema.fields.find(f => f.name === oldField.name);

      if (!newField) {
        throw new Error(
          `Forward incompatible: Required field ${oldField.name} removed`
        );
      }
    }
  }

  /**
   * Get current schema version
   */
  getCurrentSchema(): SchemaVersion | undefined {
    return this.registry.schemas.get(this.registry.currentVersion);
  }

  /**
   * Get schema by version
   */
  getSchema(version: number): SchemaVersion | undefined {
    return this.registry.schemas.get(version);
  }

  /**
   * Get migration history
   */
  getMigrationHistory(): typeof this.migrationHistory {
    return [...this.migrationHistory];
  }
}

// ==================== Example Usage ====================

export async function demonstrateSchemaEvolution() {
  console.log('=== Schema Evolution Demonstration ===\n');

  const manager = new SchemaEvolutionManager();

  // Version 1: Initial schema
  const schemaV1: SchemaVersion = {
    version: 1,
    timestamp: Date.now(),
    description: 'Initial user schema',
    compatibility: 'full',
    fields: [
      { name: 'id', type: 'number', required: true },
      { name: 'username', type: 'string', required: true },
      { name: 'email', type: 'string', required: true },
      { name: 'age', type: 'number', required: false }
    ],
    migrations: []
  };

  manager.registerSchema(schemaV1);

  // Version 2: Add new optional field
  const schemaV2: SchemaVersion = {
    version: 2,
    timestamp: Date.now(),
    description: 'Added phone number field',
    compatibility: 'backward',
    fields: [
      { name: 'id', type: 'number', required: true },
      { name: 'username', type: 'string', required: true },
      { name: 'email', type: 'string', required: true },
      { name: 'age', type: 'number', required: false },
      { name: 'phone', type: 'string', required: false, defaultValue: null, addedInVersion: 2 }
    ],
    migrations: [
      {
        id: 'add_phone',
        fromVersion: 1,
        toVersion: 2,
        type: 'add_field',
        field: 'phone',
        config: { defaultValue: null }
      }
    ]
  };

  manager.registerSchema(schemaV2);

  // Version 3: Rename field
  const schemaV3: SchemaVersion = {
    version: 3,
    timestamp: Date.now(),
    description: 'Renamed username to user_name',
    compatibility: 'backward',
    fields: [
      { name: 'id', type: 'number', required: true },
      { name: 'user_name', type: 'string', required: true, renamedFrom: 'username' },
      { name: 'email', type: 'string', required: true },
      { name: 'age', type: 'number', required: false },
      { name: 'phone', type: 'string', required: false }
    ],
    migrations: [
      {
        id: 'rename_username',
        fromVersion: 2,
        toVersion: 3,
        type: 'rename_field',
        field: 'user_name',
        config: { oldName: 'username', newName: 'user_name' }
      }
    ]
  };

  manager.registerSchema(schemaV3);

  // Version 4: Change type and add transformation
  const schemaV4: SchemaVersion = {
    version: 4,
    timestamp: Date.now(),
    description: 'Changed age to birth_year',
    compatibility: 'backward',
    fields: [
      { name: 'id', type: 'number', required: true },
      { name: 'user_name', type: 'string', required: true },
      { name: 'email', type: 'string', required: true },
      { name: 'birth_year', type: 'number', required: false, transformFrom: 'age' },
      { name: 'phone', type: 'string', required: false }
    ],
    migrations: [
      {
        id: 'age_to_birth_year',
        fromVersion: 3,
        toVersion: 4,
        type: 'transform_value',
        field: 'age',
        config: {
          transformer: (age: number) => {
            if (!age) return null;
            const currentYear = new Date().getFullYear();
            return currentYear - age;
          }
        }
      },
      {
        id: 'rename_age_to_birth_year',
        fromVersion: 3,
        toVersion: 4,
        type: 'rename_field',
        field: 'birth_year',
        config: { oldName: 'age', newName: 'birth_year' }
      }
    ]
  };

  manager.registerSchema(schemaV4);

  // Sample data in version 1 format
  const dataV1 = [
    { id: 1, username: 'john_doe', email: 'john@example.com', age: 30 },
    { id: 2, username: 'jane_smith', email: 'jane@example.com', age: 25 },
    { id: 3, username: 'bob_wilson', email: 'bob@example.com' }
  ];

  console.log('Original data (v1):');
  console.log(JSON.stringify(dataV1, null, 2));

  // Migrate to version 4
  const dataV4 = await manager.migrateData(dataV1, 1, 4);

  console.log('\nMigrated data (v4):');
  console.log(JSON.stringify(dataV4, null, 2));

  // Show migration history
  console.log('\nMigration History:');
  const history = manager.getMigrationHistory();
  for (const entry of history) {
    console.log(`  v${entry.fromVersion} → v${entry.toVersion}: ${entry.recordCount} records (${entry.success ? 'success' : 'failed'})`);
  }

  console.log('\n=== Schema Evolution Complete ===');
}

// Run demonstration if executed directly
if (import.meta.main) {
  await demonstrateSchemaEvolution();
}
