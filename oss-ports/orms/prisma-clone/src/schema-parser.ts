/**
 * Schema Parser - Parse Prisma schema files
 */

import {
  Schema,
  DatasourceConfig,
  GeneratorConfig,
  ModelSchema,
  FieldSchema,
  EnumSchema,
  TypeSchema,
  RelationSchema,
  IndexSchema
} from './types';

/**
 * Parse Prisma schema
 */
export function parseSchema(schemaContent: string): Schema {
  const lines = schemaContent.split('\n');
  const schema: Schema = {
    datasources: [],
    generators: [],
    models: [],
    enums: [],
    types: []
  };

  let currentBlock: any = null;
  let blockType: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines and comments
    if (!line || line.startsWith('//') || line.startsWith('///')) {
      continue;
    }

    // Start of block
    if (line.startsWith('datasource ')) {
      blockType = 'datasource';
      const name = line.match(/datasource\s+(\w+)/)?.[1] || '';
      currentBlock = { name, config: {} };
    } else if (line.startsWith('generator ')) {
      blockType = 'generator';
      const name = line.match(/generator\s+(\w+)/)?.[1] || '';
      currentBlock = { name, config: {} };
    } else if (line.startsWith('model ')) {
      blockType = 'model';
      const name = line.match(/model\s+(\w+)/)?.[1] || '';
      currentBlock = { name, fields: [], idFields: [], uniqueFields: [], indexes: [] };
    } else if (line.startsWith('enum ')) {
      blockType = 'enum';
      const name = line.match(/enum\s+(\w+)/)?.[1] || '';
      currentBlock = { name, values: [] };
    } else if (line.startsWith('type ')) {
      blockType = 'type';
      const name = line.match(/type\s+(\w+)/)?.[1] || '';
      currentBlock = { name, fields: [] };
    }

    // End of block
    if (line === '}' && currentBlock) {
      switch (blockType) {
        case 'datasource':
          schema.datasources.push(parseDatasource(currentBlock));
          break;
        case 'generator':
          schema.generators.push(parseGenerator(currentBlock));
          break;
        case 'model':
          schema.models.push(parseModel(currentBlock));
          break;
        case 'enum':
          schema.enums.push(currentBlock as EnumSchema);
          break;
        case 'type':
          schema.types.push(currentBlock as TypeSchema);
          break;
      }
      currentBlock = null;
      blockType = null;
      continue;
    }

    // Inside block
    if (currentBlock && line !== '{' && line !== '}') {
      if (blockType === 'datasource' || blockType === 'generator') {
        const [key, ...valueParts] = line.split('=').map(s => s.trim());
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        currentBlock.config[key] = value;
      } else if (blockType === 'model' || blockType === 'type') {
        if (line.startsWith('@@')) {
          // Model-level attribute
          parseModelAttribute(line, currentBlock);
        } else {
          // Field definition
          const field = parseField(line);
          if (field) {
            currentBlock.fields.push(field);
          }
        }
      } else if (blockType === 'enum') {
        currentBlock.values.push(line);
      }
    }
  }

  return schema;
}

/**
 * Parse datasource block
 */
function parseDatasource(block: any): DatasourceConfig {
  return {
    name: block.name,
    provider: block.config.provider as any,
    url: block.config.url.replace(/^env\("(.+)"\)$/, (_, envVar) => process.env[envVar] || '')
  };
}

/**
 * Parse generator block
 */
function parseGenerator(block: any): GeneratorConfig {
  return {
    name: block.name,
    provider: block.config.provider,
    output: block.config.output
  };
}

/**
 * Parse model block
 */
function parseModel(block: any): ModelSchema {
  return {
    name: block.name,
    fields: block.fields,
    idFields: block.idFields || [],
    uniqueFields: block.uniqueFields || [],
    indexes: block.indexes || []
  };
}

/**
 * Parse field definition
 */
function parseField(line: string): FieldSchema | null {
  const match = line.match(/^(\w+)\s+(\w+)(\[\])?(\?)?\s*(.*)?$/);
  if (!match) return null;

  const [, name, type, isList, isOptional, attributes] = match;

  const field: FieldSchema = {
    name,
    type,
    isRequired: !isOptional,
    isList: !!isList,
    isId: false,
    isUnique: false,
    isUpdatedAt: false
  };

  if (attributes) {
    parseFieldAttributes(attributes, field);
  }

  return field;
}

/**
 * Parse field attributes
 */
function parseFieldAttributes(attributes: string, field: FieldSchema): void {
  const attrRegex = /@(\w+)(?:\(([^)]*)\))?/g;
  let match;

  while ((match = attrRegex.exec(attributes)) !== null) {
    const [, attrName, attrArgs] = match;

    switch (attrName) {
      case 'id':
        field.isId = true;
        break;
      case 'unique':
        field.isUnique = true;
        break;
      case 'updatedAt':
        field.isUpdatedAt = true;
        break;
      case 'default':
        field.default = parseDefaultValue(attrArgs);
        break;
      case 'relation':
        field.relation = parseRelation(attrArgs);
        break;
      case 'map':
        // Handle column name mapping
        break;
    }
  }
}

/**
 * Parse default value
 */
function parseDefaultValue(value: string): any {
  if (!value) return undefined;

  if (value === 'autoincrement()') return 'autoincrement()';
  if (value === 'now()') return 'now()';
  if (value === 'uuid()') return 'uuid()';
  if (value === 'cuid()') return 'cuid()';

  if (value === 'true') return true;
  if (value === 'false') return false;

  if (/^['"]/.test(value)) {
    return value.replace(/^['"]|['"]$/g, '');
  }

  if (/^\d+$/.test(value)) {
    return parseInt(value, 10);
  }

  if (/^\d+\.\d+$/.test(value)) {
    return parseFloat(value);
  }

  return value;
}

/**
 * Parse relation attribute
 */
function parseRelation(args: string): RelationSchema {
  const relation: RelationSchema = {
    name: '',
    fields: [],
    references: [],
    onDelete: undefined,
    onUpdate: undefined
  };

  if (!args) return relation;

  const argsMatch = args.match(/fields:\s*\[([^\]]+)\],\s*references:\s*\[([^\]]+)\]/);
  if (argsMatch) {
    relation.fields = argsMatch[1].split(',').map(s => s.trim());
    relation.references = argsMatch[2].split(',').map(s => s.trim());
  }

  const onDeleteMatch = args.match(/onDelete:\s*(\w+)/);
  if (onDeleteMatch) {
    relation.onDelete = onDeleteMatch[1] as any;
  }

  const onUpdateMatch = args.match(/onUpdate:\s*(\w+)/);
  if (onUpdateMatch) {
    relation.onUpdate = onUpdateMatch[1] as any;
  }

  return relation;
}

/**
 * Parse model-level attribute
 */
function parseModelAttribute(line: string, model: any): void {
  if (line.startsWith('@@id')) {
    const match = line.match(/@@id\(\[([^\]]+)\]\)/);
    if (match) {
      model.idFields = match[1].split(',').map(s => s.trim());
    }
  } else if (line.startsWith('@@unique')) {
    const match = line.match(/@@unique\(\[([^\]]+)\]\)/);
    if (match) {
      model.uniqueFields.push(match[1].split(',').map(s => s.trim()));
    }
  } else if (line.startsWith('@@index')) {
    const match = line.match(/@@index\(\[([^\]]+)\](?:,\s*name:\s*"([^"]+)")?\)/);
    if (match) {
      model.indexes.push({
        fields: match[1].split(',').map(s => s.trim()),
        name: match[2],
        isUnique: false
      });
    }
  }
}

/**
 * Generate TypeScript types from schema
 */
export function generateTypes(schema: Schema): string {
  let output = '// Generated by Prisma Client\n\n';

  // Generate model types
  for (const model of schema.models) {
    output += generateModelType(model);
    output += '\n\n';
  }

  // Generate enum types
  for (const enumSchema of schema.enums) {
    output += generateEnumType(enumSchema);
    output += '\n\n';
  }

  return output;
}

/**
 * Generate model type
 */
function generateModelType(model: ModelSchema): string {
  let output = `export interface ${model.name} {\n`;

  for (const field of model.fields) {
    const optional = !field.isRequired ? '?' : '';
    const typeStr = mapPrismaTypeToTS(field.type, field.isList);
    output += `  ${field.name}${optional}: ${typeStr};\n`;
  }

  output += '}';
  return output;
}

/**
 * Generate enum type
 */
function generateEnumType(enumSchema: EnumSchema): string {
  let output = `export enum ${enumSchema.name} {\n`;

  for (const value of enumSchema.values) {
    output += `  ${value} = '${value}',\n`;
  }

  output += '}';
  return output;
}

/**
 * Map Prisma type to TypeScript type
 */
function mapPrismaTypeToTS(prismaType: string, isList: boolean): string {
  const typeMap: Record<string, string> = {
    String: 'string',
    Int: 'number',
    BigInt: 'bigint',
    Float: 'number',
    Decimal: 'Prisma.Decimal',
    Boolean: 'boolean',
    DateTime: 'Date',
    Json: 'Prisma.JsonValue',
    Bytes: 'Buffer'
  };

  const tsType = typeMap[prismaType] || prismaType;
  return isList ? `${tsType}[]` : tsType;
}

/**
 * Validate schema
 */
export function validateSchema(schema: Schema): string[] {
  const errors: string[] = [];

  // Validate datasources
  if (schema.datasources.length === 0) {
    errors.push('Schema must have at least one datasource');
  }

  // Validate models
  for (const model of schema.models) {
    // Check for ID field
    const hasId = model.fields.some(f => f.isId) || model.idFields.length > 0;
    if (!hasId) {
      errors.push(`Model ${model.name} must have an ID field`);
    }

    // Validate relations
    for (const field of model.fields) {
      if (field.relation) {
        const relatedModel = schema.models.find(m => m.name === field.type);
        if (!relatedModel) {
          errors.push(`Model ${model.name}: relation field ${field.name} references unknown model ${field.type}`);
        }
      }
    }
  }

  return errors;
}

/**
 * Format schema
 */
export function formatSchema(schema: Schema): string {
  let output = '';

  // Format datasources
  for (const ds of schema.datasources) {
    output += `datasource ${ds.name} {\n`;
    output += `  provider = "${ds.provider}"\n`;
    output += `  url      = "${ds.url}"\n`;
    output += '}\n\n';
  }

  // Format generators
  for (const gen of schema.generators) {
    output += `generator ${gen.name} {\n`;
    output += `  provider = "${gen.provider}"\n`;
    if (gen.output) {
      output += `  output   = "${gen.output}"\n`;
    }
    output += '}\n\n';
  }

  // Format models
  for (const model of schema.models) {
    output += formatModel(model);
    output += '\n\n';
  }

  // Format enums
  for (const enumSchema of schema.enums) {
    output += `enum ${enumSchema.name} {\n`;
    for (const value of enumSchema.values) {
      output += `  ${value}\n`;
    }
    output += '}\n\n';
  }

  return output;
}

/**
 * Format model
 */
function formatModel(model: ModelSchema): string {
  let output = `model ${model.name} {\n`;

  // Find max field name length for alignment
  const maxNameLength = Math.max(...model.fields.map(f => f.name.length));
  const maxTypeLength = Math.max(...model.fields.map(f => {
    let type = f.type;
    if (f.isList) type += '[]';
    if (!f.isRequired) type += '?';
    return type.length;
  }));

  for (const field of model.fields) {
    let fieldStr = `  ${field.name.padEnd(maxNameLength)} `;

    let type = field.type;
    if (f.isList) type += '[]';
    if (!field.isRequired) type += '?';
    fieldStr += type.padEnd(maxTypeLength);

    const attrs: string[] = [];
    if (field.isId) attrs.push('@id');
    if (field.isUnique) attrs.push('@unique');
    if (field.isUpdatedAt) attrs.push('@updatedAt');
    if (field.default !== undefined) {
      attrs.push(`@default(${formatDefaultValue(field.default)})`);
    }
    if (field.relation) {
      attrs.push(formatRelation(field.relation));
    }

    if (attrs.length > 0) {
      fieldStr += ' ' + attrs.join(' ');
    }

    output += fieldStr + '\n';
  }

  // Model-level attributes
  if (model.idFields.length > 0) {
    output += `\n  @@id([${model.idFields.join(', ')}])\n`;
  }

  for (const unique of model.uniqueFields) {
    output += `  @@unique([${unique.join(', ')}])\n`;
  }

  for (const index of model.indexes) {
    const name = index.name ? `, name: "${index.name}"` : '';
    output += `  @@index([${index.fields.join(', ')}]${name})\n`;
  }

  output += '}';
  return output;
}

/**
 * Format default value
 */
function formatDefaultValue(value: any): string {
  if (typeof value === 'string') {
    if (['autoincrement()', 'now()', 'uuid()', 'cuid()'].includes(value)) {
      return value;
    }
    return `"${value}"`;
  }

  if (typeof value === 'boolean' || typeof value === 'number') {
    return String(value);
  }

  return JSON.stringify(value);
}

/**
 * Format relation
 */
function formatRelation(relation: RelationSchema): string {
  let parts: string[] = [];

  if (relation.fields.length > 0) {
    parts.push(`fields: [${relation.fields.join(', ')}]`);
    parts.push(`references: [${relation.references.join(', ')}]`);
  }

  if (relation.onDelete) {
    parts.push(`onDelete: ${relation.onDelete}`);
  }

  if (relation.onUpdate) {
    parts.push(`onUpdate: ${relation.onUpdate}`);
  }

  return `@relation(${parts.join(', ')})`;
}
