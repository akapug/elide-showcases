/**
 * Schema Generator
 * Generates database schemas from content type definitions
 */

export function generateSchema(contentType) {
  const tableName = `ct_${contentType.singularName.toLowerCase()}`;
  const columns = [];
  const indexes = [];
  const foreignKeys = [];

  // Add standard columns
  columns.push('id INTEGER PRIMARY KEY AUTOINCREMENT');

  if (contentType.draftAndPublish) {
    columns.push('published_at TIMESTAMP NULL');
  }

  // Add attribute columns
  for (const [name, attribute] of Object.entries(contentType.attributes)) {
    const column = generateColumn(name, attribute);
    if (column) {
      columns.push(column);

      // Add indexes for certain types
      if (attribute.unique) {
        indexes.push(`CREATE UNIQUE INDEX idx_${tableName}_${name} ON ${tableName}(${name})`);
      } else if (attribute.index || attribute.type === 'email' || attribute.type === 'uid') {
        indexes.push(`CREATE INDEX idx_${tableName}_${name} ON ${tableName}(${name})`);
      }

      // Add foreign keys for relations
      if (attribute.type === 'relation' && attribute.relation === 'manyToOne') {
        const targetTable = `ct_${extractTableName(attribute.target)}`;
        foreignKeys.push(
          `ALTER TABLE ${tableName} ADD FOREIGN KEY (${name}_id) REFERENCES ${targetTable}(id)`
        );
      }
    }
  }

  // Add timestamps
  columns.push('created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
  columns.push('updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

  // Add creator tracking
  columns.push('created_by_id INTEGER NULL');
  columns.push('updated_by_id INTEGER NULL');

  // Generate CREATE TABLE statement
  const createTable = `CREATE TABLE ${tableName} (\n  ${columns.join(',\n  ')}\n)`;

  return {
    tableName,
    createTable,
    indexes,
    foreignKeys,
  };
}

function generateColumn(name, attribute) {
  const columnName = name.toLowerCase();

  switch (attribute.type) {
    case 'string':
    case 'email':
    case 'uid':
      return `${columnName} VARCHAR(${attribute.maxLength || 255})${attribute.required ? ' NOT NULL' : ''}${attribute.unique ? ' UNIQUE' : ''}`;

    case 'text':
      return `${columnName} TEXT${attribute.required ? ' NOT NULL' : ''}`;

    case 'richtext':
      return `${columnName} TEXT${attribute.required ? ' NOT NULL' : ''}`;

    case 'password':
      return `${columnName} VARCHAR(255)${attribute.required ? ' NOT NULL' : ''}`;

    case 'integer':
      return `${columnName} INTEGER${attribute.required ? ' NOT NULL' : ''}${attribute.default !== undefined ? ` DEFAULT ${attribute.default}` : ''}`;

    case 'biginteger':
      return `${columnName} BIGINT${attribute.required ? ' NOT NULL' : ''}${attribute.default !== undefined ? ` DEFAULT ${attribute.default}` : ''}`;

    case 'float':
      return `${columnName} REAL${attribute.required ? ' NOT NULL' : ''}${attribute.default !== undefined ? ` DEFAULT ${attribute.default}` : ''}`;

    case 'decimal':
      const precision = attribute.precision || 10;
      const scale = attribute.scale || 2;
      return `${columnName} DECIMAL(${precision}, ${scale})${attribute.required ? ' NOT NULL' : ''}${attribute.default !== undefined ? ` DEFAULT ${attribute.default}` : ''}`;

    case 'date':
      return `${columnName} DATE${attribute.required ? ' NOT NULL' : ''}`;

    case 'time':
      return `${columnName} TIME${attribute.required ? ' NOT NULL' : ''}`;

    case 'datetime':
    case 'timestamp':
      return `${columnName} TIMESTAMP${attribute.required ? ' NOT NULL' : ''}`;

    case 'boolean':
      return `${columnName} BOOLEAN${attribute.required ? ' NOT NULL' : ''} DEFAULT ${attribute.default !== undefined ? attribute.default : 'false'}`;

    case 'enumeration':
      return `${columnName} VARCHAR(255)${attribute.required ? ' NOT NULL' : ''}`;

    case 'json':
      return `${columnName} JSON${attribute.required ? ' NOT NULL' : ''}`;

    case 'media':
      // Media is stored as relation
      if (attribute.multiple) {
        return null; // Handle in junction table
      } else {
        return `${columnName}_id INTEGER${attribute.required ? ' NOT NULL' : ''}`;
      }

    case 'relation':
      return generateRelationColumn(columnName, attribute);

    case 'component':
      // Components are stored in separate tables
      return null;

    case 'dynamiczone':
      // Dynamic zones are stored in separate tables
      return null;

    default:
      console.warn(`Unknown attribute type: ${attribute.type}`);
      return null;
  }
}

function generateRelationColumn(name, attribute) {
  switch (attribute.relation) {
    case 'oneToOne':
    case 'manyToOne':
      return `${name}_id INTEGER${attribute.required ? ' NOT NULL' : ''}`;

    case 'oneToMany':
    case 'manyToMany':
      // These are handled in junction tables
      return null;

    default:
      return null;
  }
}

function extractTableName(target) {
  // Extract table name from UID like "api::article.article"
  const parts = target.split('.');
  return parts[parts.length - 1].toLowerCase();
}

/**
 * Generate junction table for many-to-many relations
 */
export function generateJunctionTable(contentType, attribute, attributeName) {
  const table1 = `ct_${contentType.singularName.toLowerCase()}`;
  const table2 = `ct_${extractTableName(attribute.target)}`;
  const junctionTable = `${table1}_${attributeName}_links`;

  const createTable = `
    CREATE TABLE ${junctionTable} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ${table1}_id INTEGER NOT NULL,
      ${table2}_id INTEGER NOT NULL,
      ${attributeName}_order INTEGER,
      FOREIGN KEY (${table1}_id) REFERENCES ${table1}(id) ON DELETE CASCADE,
      FOREIGN KEY (${table2}_id) REFERENCES ${table2}(id) ON DELETE CASCADE,
      UNIQUE(${table1}_id, ${table2}_id)
    )
  `;

  const indexes = [
    `CREATE INDEX idx_${junctionTable}_${table1} ON ${junctionTable}(${table1}_id)`,
    `CREATE INDEX idx_${junctionTable}_${table2} ON ${junctionTable}(${table2}_id)`,
  ];

  return {
    tableName: junctionTable,
    createTable,
    indexes,
  };
}

/**
 * Generate component table
 */
export function generateComponentTable(component) {
  const tableName = `comp_${component.singularName.toLowerCase()}`;
  const columns = [];
  const indexes = [];

  columns.push('id INTEGER PRIMARY KEY AUTOINCREMENT');
  columns.push('field VARCHAR(255) NOT NULL');
  columns.push('component_type VARCHAR(255) NOT NULL');
  columns.push('entity_id INTEGER NOT NULL');
  columns.push('component_order INTEGER');

  // Add component attributes
  for (const [name, attribute] of Object.entries(component.attributes)) {
    const column = generateColumn(name, attribute);
    if (column) {
      columns.push(column);
    }
  }

  const createTable = `CREATE TABLE ${tableName} (\n  ${columns.join(',\n  ')}\n)`;

  indexes.push(`CREATE INDEX idx_${tableName}_entity ON ${tableName}(entity_id, field)`);

  return {
    tableName,
    createTable,
    indexes,
  };
}

/**
 * Generate migration SQL for schema changes
 */
export function generateMigration(oldSchema, newSchema) {
  const migrations = [];

  // Find new columns
  const oldColumns = parseColumns(oldSchema.createTable);
  const newColumns = parseColumns(newSchema.createTable);

  for (const column of newColumns) {
    if (!oldColumns.find(c => c.name === column.name)) {
      migrations.push(`ALTER TABLE ${newSchema.tableName} ADD COLUMN ${column.definition}`);
    }
  }

  // Find removed columns
  for (const column of oldColumns) {
    if (!newColumns.find(c => c.name === column.name)) {
      migrations.push(`ALTER TABLE ${newSchema.tableName} DROP COLUMN ${column.name}`);
    }
  }

  return migrations;
}

function parseColumns(createTableSQL) {
  // Simple column parser - in production use proper SQL parser
  const columns = [];
  const lines = createTableSQL.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('CREATE') && !trimmed.startsWith(')')) {
      const parts = trimmed.split(' ');
      if (parts.length >= 2) {
        columns.push({
          name: parts[0],
          definition: trimmed.replace(/,$/, ''),
        });
      }
    }
  }

  return columns;
}
