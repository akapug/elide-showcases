/**
 * Collection Schema
 * Defines the structure and types for collections (tables)
 */

export type FieldType =
  | 'text'
  | 'number'
  | 'bool'
  | 'email'
  | 'url'
  | 'date'
  | 'select'
  | 'json'
  | 'file'
  | 'relation'
  | 'user';

export interface FieldOptions {
  // Common options
  required?: boolean;
  unique?: boolean;
  min?: number;
  max?: number;
  pattern?: string;

  // Select options
  values?: string[];
  maxSelect?: number;

  // Relation options
  collectionId?: string;
  cascadeDelete?: boolean;
  minSelect?: number;

  // File options
  maxSize?: number;
  mimeTypes?: string[];
  thumbs?: string[]; // e.g., ['100x100', '200x200']
  protected?: boolean;

  // Number options
  onlyInt?: boolean;

  // Computed field
  computed?: string; // JavaScript expression
}

export interface SchemaField {
  id: string;
  name: string;
  type: FieldType;
  system?: boolean;
  required?: boolean;
  unique?: boolean;
  options?: FieldOptions;
}

export interface CollectionRule {
  listRule?: string | null; // JS expression or null for no access
  viewRule?: string | null;
  createRule?: string | null;
  updateRule?: string | null;
  deleteRule?: string | null;
}

export interface Collection {
  id: string;
  name: string;
  type: 'base' | 'auth' | 'view';
  system?: boolean;
  schema: SchemaField[];
  indexes?: string[];
  listRule?: string | null;
  viewRule?: string | null;
  createRule?: string | null;
  updateRule?: string | null;
  deleteRule?: string | null;
  options?: {
    // Auth collection options
    allowEmailAuth?: boolean;
    allowOAuth2Auth?: boolean;
    allowUsernameAuth?: boolean;
    requireEmail?: boolean;
    minPasswordLength?: number;
    onlyEmailDomains?: string[];
    exceptEmailDomains?: string[];

    // View collection options
    query?: string;
  };
  created?: string;
  updated?: string;
}

/**
 * System fields that every collection has
 */
export const SYSTEM_FIELDS: SchemaField[] = [
  {
    id: 'id',
    name: 'id',
    type: 'text',
    system: true,
    required: true,
    unique: true,
  },
  {
    id: 'created',
    name: 'created',
    type: 'date',
    system: true,
    required: true,
  },
  {
    id: 'updated',
    name: 'updated',
    type: 'date',
    system: true,
    required: true,
  },
];

/**
 * Auth collection system fields
 */
export const AUTH_FIELDS: SchemaField[] = [
  {
    id: 'username',
    name: 'username',
    type: 'text',
    system: true,
    unique: true,
  },
  {
    id: 'email',
    name: 'email',
    type: 'email',
    system: true,
    required: true,
    unique: true,
  },
  {
    id: 'emailVisibility',
    name: 'emailVisibility',
    type: 'bool',
    system: true,
  },
  {
    id: 'verified',
    name: 'verified',
    type: 'bool',
    system: true,
  },
  {
    id: 'password',
    name: 'password',
    type: 'text',
    system: true,
    required: true,
  },
  {
    id: 'tokenKey',
    name: 'tokenKey',
    type: 'text',
    system: true,
  },
];

/**
 * Get SQL type for a schema field
 */
export function getSQLType(field: SchemaField): string {
  switch (field.type) {
    case 'text':
    case 'email':
    case 'url':
    case 'select':
    case 'user':
      return 'TEXT';
    case 'number':
      return field.options?.onlyInt ? 'INTEGER' : 'REAL';
    case 'bool':
      return 'INTEGER'; // SQLite uses 0/1 for boolean
    case 'date':
      return 'TEXT'; // ISO 8601 format
    case 'json':
    case 'file':
    case 'relation':
      return 'TEXT'; // JSON serialized
    default:
      return 'TEXT';
  }
}

/**
 * Get column definition for a schema field
 */
export function getColumnDefinition(field: SchemaField): string {
  const parts: string[] = [field.name, getSQLType(field)];

  if (field.required) {
    parts.push('NOT NULL');
  }

  if (field.unique) {
    parts.push('UNIQUE');
  }

  // Default values
  if (field.type === 'bool' && !field.required) {
    parts.push('DEFAULT 0');
  }

  return parts.join(' ');
}

/**
 * Validate a value against a field schema
 */
export function validateField(value: any, field: SchemaField): string | null {
  // Check required
  if (field.required && (value === null || value === undefined || value === '')) {
    return `${field.name} is required`;
  }

  // Skip validation if value is null/undefined and not required
  if (value === null || value === undefined) {
    return null;
  }

  const options = field.options || {};

  switch (field.type) {
    case 'text':
      if (typeof value !== 'string') {
        return `${field.name} must be a string`;
      }
      if (options.min && value.length < options.min) {
        return `${field.name} must be at least ${options.min} characters`;
      }
      if (options.max && value.length > options.max) {
        return `${field.name} must be at most ${options.max} characters`;
      }
      if (options.pattern && !new RegExp(options.pattern).test(value)) {
        return `${field.name} does not match required pattern`;
      }
      break;

    case 'email':
      if (typeof value !== 'string') {
        return `${field.name} must be a string`;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return `${field.name} must be a valid email`;
      }
      break;

    case 'url':
      if (typeof value !== 'string') {
        return `${field.name} must be a string`;
      }
      try {
        new URL(value);
      } catch {
        return `${field.name} must be a valid URL`;
      }
      break;

    case 'number':
      if (typeof value !== 'number') {
        return `${field.name} must be a number`;
      }
      if (options.onlyInt && !Number.isInteger(value)) {
        return `${field.name} must be an integer`;
      }
      if (options.min !== undefined && value < options.min) {
        return `${field.name} must be at least ${options.min}`;
      }
      if (options.max !== undefined && value > options.max) {
        return `${field.name} must be at most ${options.max}`;
      }
      break;

    case 'bool':
      if (typeof value !== 'boolean') {
        return `${field.name} must be a boolean`;
      }
      break;

    case 'date':
      if (typeof value !== 'string') {
        return `${field.name} must be a date string`;
      }
      if (isNaN(Date.parse(value))) {
        return `${field.name} must be a valid ISO 8601 date`;
      }
      break;

    case 'select':
      if (options.maxSelect && options.maxSelect > 1) {
        // Multiple select
        if (!Array.isArray(value)) {
          return `${field.name} must be an array`;
        }
        if (options.maxSelect && value.length > options.maxSelect) {
          return `${field.name} can have at most ${options.maxSelect} items`;
        }
        if (options.values) {
          for (const v of value) {
            if (!options.values.includes(v)) {
              return `${field.name} contains invalid value: ${v}`;
            }
          }
        }
      } else {
        // Single select
        if (options.values && !options.values.includes(value)) {
          return `${field.name} must be one of: ${options.values.join(', ')}`;
        }
      }
      break;

    case 'json':
      if (typeof value !== 'object') {
        return `${field.name} must be a valid JSON object`;
      }
      break;

    case 'relation':
      if (options.maxSelect && options.maxSelect > 1) {
        // Multiple relations
        if (!Array.isArray(value)) {
          return `${field.name} must be an array`;
        }
        if (options.minSelect && value.length < options.minSelect) {
          return `${field.name} must have at least ${options.minSelect} items`;
        }
        if (options.maxSelect && value.length > options.maxSelect) {
          return `${field.name} can have at most ${options.maxSelect} items`;
        }
      }
      break;
  }

  return null;
}

/**
 * Serialize a value for storage in SQLite
 */
export function serializeValue(value: any, field: SchemaField): any {
  if (value === null || value === undefined) {
    return null;
  }

  switch (field.type) {
    case 'bool':
      return value ? 1 : 0;
    case 'json':
    case 'file':
    case 'relation':
      return JSON.stringify(value);
    case 'date':
      return new Date(value).toISOString();
    case 'select':
      if (Array.isArray(value)) {
        return JSON.stringify(value);
      }
      return value;
    default:
      return value;
  }
}

/**
 * Deserialize a value from SQLite
 */
export function deserializeValue(value: any, field: SchemaField): any {
  if (value === null || value === undefined) {
    return null;
  }

  switch (field.type) {
    case 'bool':
      return Boolean(value);
    case 'json':
    case 'file':
    case 'relation':
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    case 'number':
      return Number(value);
    case 'select':
      if (field.options?.maxSelect && field.options.maxSelect > 1) {
        try {
          return JSON.parse(value);
        } catch {
          return [];
        }
      }
      return value;
    default:
      return value;
  }
}
