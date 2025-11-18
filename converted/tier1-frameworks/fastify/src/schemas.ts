/**
 * JSON Schema Validation for Fastify on Elide
 *
 * High-performance schema validation system with support for:
 * - JSON Schema draft-07
 * - Custom validation functions
 * - Polyglot schema validators (TypeScript, Python, Ruby)
 * - Fast compilation and caching
 * - Detailed error reporting
 *
 * This module provides schema validation that can work across multiple
 * languages, enabling validation logic written in Python or Ruby to be
 * used seamlessly in TypeScript routes.
 */

/**
 * JSON Schema type definition
 */
export interface JSONSchema {
  type?: 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array' | 'null';
  properties?: Record<string, JSONSchema>;
  required?: string[];
  items?: JSONSchema;
  additionalProperties?: boolean | JSONSchema;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  pattern?: string;
  format?: string;
  enum?: any[];
  anyOf?: JSONSchema[];
  allOf?: JSONSchema[];
  oneOf?: JSONSchema[];
  not?: JSONSchema;
  const?: any;
  default?: any;
}

/**
 * Validation error details
 */
export interface ValidationErrorDetail {
  field: string;
  message: string;
  value?: any;
  constraint?: string;
}

/**
 * Custom validation error class
 */
export class ValidationError extends Error {
  public statusCode: number = 400;
  public errors: ValidationErrorDetail[];

  constructor(message: string, errors: ValidationErrorDetail[] = []) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Validator function type
 */
export type ValidatorFunction = (data: any) => boolean;

/**
 * Serializer function type
 */
export type SerializerFunction = (data: any) => string;

/**
 * Schema Compiler
 * Compiles JSON schemas into fast validation functions
 */
export class SchemaCompiler {
  private validatorCache: Map<string, ValidatorFunction> = new Map();
  private serializerCache: Map<string, SerializerFunction> = new Map();
  private lastErrors: ValidationErrorDetail[] = [];
  private customValidatorCompiler?: (schema: any) => ValidatorFunction;
  private customSerializerCompiler?: (schema: any) => SerializerFunction;

  /**
   * Set custom validator compiler (e.g., Ajv)
   */
  public setValidatorCompiler(compiler: (schema: any) => ValidatorFunction): void {
    this.customValidatorCompiler = compiler;
    this.validatorCache.clear();
  }

  /**
   * Set custom serializer compiler
   */
  public setSerializerCompiler(compiler: (schema: any) => SerializerFunction): void {
    this.customSerializerCompiler = compiler;
    this.serializerCache.clear();
  }

  /**
   * Validate data against schema
   */
  public validate(schema: JSONSchema, data: any): boolean {
    this.lastErrors = [];

    // Use custom validator if available
    if (this.customValidatorCompiler) {
      const validator = this.getOrCompileValidator(schema);
      return validator(data);
    }

    // Built-in validation
    return this.validateSchema(schema, data, '');
  }

  /**
   * Get validation errors from last validation
   */
  public getErrors(): ValidationErrorDetail[] {
    return this.lastErrors;
  }

  /**
   * Get or compile validator function
   */
  private getOrCompileValidator(schema: JSONSchema): ValidatorFunction {
    const schemaKey = JSON.stringify(schema);

    if (this.validatorCache.has(schemaKey)) {
      return this.validatorCache.get(schemaKey)!;
    }

    const validator = this.customValidatorCompiler!(schema);
    this.validatorCache.set(schemaKey, validator);
    return validator;
  }

  /**
   * Built-in schema validation
   */
  private validateSchema(schema: JSONSchema, data: any, path: string): boolean {
    let valid = true;

    // Type validation
    if (schema.type) {
      if (!this.validateType(schema.type, data)) {
        this.addError(path, `must be of type ${schema.type}`, data, 'type');
        return false;
      }
    }

    // Const validation
    if (schema.const !== undefined) {
      if (data !== schema.const) {
        this.addError(path, `must equal constant value`, data, 'const');
        return false;
      }
    }

    // Enum validation
    if (schema.enum) {
      if (!schema.enum.includes(data)) {
        this.addError(path, `must be one of: ${schema.enum.join(', ')}`, data, 'enum');
        return false;
      }
    }

    // String validations
    if (schema.type === 'string' && typeof data === 'string') {
      if (schema.minLength !== undefined && data.length < schema.minLength) {
        this.addError(path, `must be at least ${schema.minLength} characters`, data, 'minLength');
        valid = false;
      }
      if (schema.maxLength !== undefined && data.length > schema.maxLength) {
        this.addError(path, `must be at most ${schema.maxLength} characters`, data, 'maxLength');
        valid = false;
      }
      if (schema.pattern) {
        const regex = new RegExp(schema.pattern);
        if (!regex.test(data)) {
          this.addError(path, `must match pattern ${schema.pattern}`, data, 'pattern');
          valid = false;
        }
      }
      if (schema.format) {
        if (!this.validateFormat(schema.format, data)) {
          this.addError(path, `must be valid ${schema.format}`, data, 'format');
          valid = false;
        }
      }
    }

    // Number validations
    if ((schema.type === 'number' || schema.type === 'integer') && typeof data === 'number') {
      if (schema.minimum !== undefined && data < schema.minimum) {
        this.addError(path, `must be >= ${schema.minimum}`, data, 'minimum');
        valid = false;
      }
      if (schema.maximum !== undefined && data > schema.maximum) {
        this.addError(path, `must be <= ${schema.maximum}`, data, 'maximum');
        valid = false;
      }
      if (schema.type === 'integer' && !Number.isInteger(data)) {
        this.addError(path, 'must be an integer', data, 'integer');
        valid = false;
      }
    }

    // Object validations
    if (schema.type === 'object' && typeof data === 'object' && data !== null && !Array.isArray(data)) {
      // Required properties
      if (schema.required) {
        for (const prop of schema.required) {
          if (!(prop in data)) {
            this.addError(`${path}.${prop}`, 'is required', undefined, 'required');
            valid = false;
          }
        }
      }

      // Property validations
      if (schema.properties) {
        for (const [prop, propSchema] of Object.entries(schema.properties)) {
          if (prop in data) {
            const propPath = path ? `${path}.${prop}` : prop;
            if (!this.validateSchema(propSchema, data[prop], propPath)) {
              valid = false;
            }
          }
        }
      }

      // Additional properties
      if (schema.additionalProperties === false) {
        const allowedProps = new Set(Object.keys(schema.properties || {}));
        for (const prop of Object.keys(data)) {
          if (!allowedProps.has(prop)) {
            this.addError(`${path}.${prop}`, 'additional property not allowed', data[prop], 'additionalProperties');
            valid = false;
          }
        }
      }
    }

    // Array validations
    if (schema.type === 'array' && Array.isArray(data)) {
      if (schema.items) {
        for (let i = 0; i < data.length; i++) {
          const itemPath = `${path}[${i}]`;
          if (!this.validateSchema(schema.items, data[i], itemPath)) {
            valid = false;
          }
        }
      }
    }

    // Combinators
    if (schema.anyOf) {
      let anyValid = false;
      for (const subSchema of schema.anyOf) {
        const prevErrors = this.lastErrors.length;
        if (this.validateSchema(subSchema, data, path)) {
          anyValid = true;
          // Remove errors from this validation
          this.lastErrors = this.lastErrors.slice(0, prevErrors);
          break;
        }
      }
      if (!anyValid) {
        this.addError(path, 'must match at least one schema', data, 'anyOf');
        valid = false;
      }
    }

    if (schema.allOf) {
      for (const subSchema of schema.allOf) {
        if (!this.validateSchema(subSchema, data, path)) {
          valid = false;
        }
      }
    }

    if (schema.oneOf) {
      let matchCount = 0;
      const prevErrors = this.lastErrors.length;
      for (const subSchema of schema.oneOf) {
        const tempErrors = this.lastErrors.length;
        if (this.validateSchema(subSchema, data, path)) {
          matchCount++;
          // Remove errors from this validation
          this.lastErrors = this.lastErrors.slice(0, tempErrors);
        }
      }
      if (matchCount !== 1) {
        this.addError(path, 'must match exactly one schema', data, 'oneOf');
        valid = false;
      }
    }

    if (schema.not) {
      if (this.validateSchema(schema.not, data, path)) {
        this.addError(path, 'must not match schema', data, 'not');
        valid = false;
      }
    }

    return valid;
  }

  /**
   * Validate data type
   */
  private validateType(type: string, data: any): boolean {
    switch (type) {
      case 'string':
        return typeof data === 'string';
      case 'number':
        return typeof data === 'number' && !isNaN(data);
      case 'integer':
        return typeof data === 'number' && Number.isInteger(data);
      case 'boolean':
        return typeof data === 'boolean';
      case 'object':
        return typeof data === 'object' && data !== null && !Array.isArray(data);
      case 'array':
        return Array.isArray(data);
      case 'null':
        return data === null;
      default:
        return true;
    }
  }

  /**
   * Validate string format
   */
  private validateFormat(format: string, data: string): boolean {
    switch (format) {
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data);
      case 'uri':
      case 'url':
        try {
          new URL(data);
          return true;
        } catch {
          return false;
        }
      case 'uuid':
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data);
      case 'date':
        return !isNaN(Date.parse(data));
      case 'date-time':
        return !isNaN(Date.parse(data));
      case 'ipv4':
        return /^(\d{1,3}\.){3}\d{1,3}$/.test(data);
      case 'ipv6':
        return /^([0-9a-f]{0,4}:){7}[0-9a-f]{0,4}$/i.test(data);
      default:
        return true;
    }
  }

  /**
   * Add validation error
   */
  private addError(field: string, message: string, value: any, constraint: string): void {
    this.lastErrors.push({
      field: field || 'root',
      message,
      value,
      constraint,
    });
  }

  /**
   * Serialize data using schema
   */
  public serialize(schema: JSONSchema, data: any): string {
    if (this.customSerializerCompiler) {
      const serializer = this.getOrCompileSerializer(schema);
      return serializer(data);
    }

    // Default JSON serialization
    return JSON.stringify(data);
  }

  /**
   * Get or compile serializer function
   */
  private getOrCompileSerializer(schema: JSONSchema): SerializerFunction {
    const schemaKey = JSON.stringify(schema);

    if (this.serializerCache.has(schemaKey)) {
      return this.serializerCache.get(schemaKey)!;
    }

    const serializer = this.customSerializerCompiler!(schema);
    this.serializerCache.set(schemaKey, serializer);
    return serializer;
  }
}

/**
 * Polyglot Schema Validator
 * Allows schema validation logic to be written in Python or Ruby
 */
export class PolyglotSchemaValidator {
  /**
   * Create a validator from Python code
   *
   * Example:
   * ```typescript
   * const validator = PolyglotSchemaValidator.fromPython(`
   * def validate(data):
   *     return isinstance(data, dict) and 'email' in data
   * `);
   * ```
   */
  static fromPython(code: string): ValidatorFunction {
    // In production Elide runtime with polyglot support:
    /*
    const pythonValidator = Polyglot.eval('python', code);
    return (data: any) => {
      return pythonValidator.validate(data);
    };
    */

    // Mock implementation for demonstration
    return (data: any) => {
      console.log('[Polyglot] Python validator would execute:', code);
      return true;
    };
  }

  /**
   * Create a validator from Ruby code
   *
   * Example:
   * ```typescript
   * const validator = PolyglotSchemaValidator.fromRuby(`
   * lambda { |data| data.is_a?(Hash) && data.key?('email') }
   * `);
   * ```
   */
  static fromRuby(code: string): ValidatorFunction {
    // In production Elide runtime with polyglot support:
    /*
    const rubyValidator = Polyglot.eval('ruby', code);
    return (data: any) => {
      return rubyValidator.call(data);
    };
    */

    // Mock implementation for demonstration
    return (data: any) => {
      console.log('[Polyglot] Ruby validator would execute:', code);
      return true;
    };
  }

  /**
   * Import validator from Python file
   */
  static importPython(filepath: string): ValidatorFunction {
    // In production: Polyglot.import('python', filepath)
    return (data: any) => {
      console.log(`[Polyglot] Would import Python validator from: ${filepath}`);
      return true;
    };
  }

  /**
   * Import validator from Ruby file
   */
  static importRuby(filepath: string): ValidatorFunction {
    // In production: Polyglot.import('ruby', filepath)
    return (data: any) => {
      console.log(`[Polyglot] Would import Ruby validator from: ${filepath}`);
      return true;
    };
  }
}

/**
 * Common schema patterns for reuse
 */
export const CommonSchemas = {
  /**
   * Email schema
   */
  email: {
    type: 'string' as const,
    format: 'email',
  },

  /**
   * UUID schema
   */
  uuid: {
    type: 'string' as const,
    format: 'uuid',
  },

  /**
   * Positive integer schema
   */
  positiveInteger: {
    type: 'integer' as const,
    minimum: 1,
  },

  /**
   * Non-empty string schema
   */
  nonEmptyString: {
    type: 'string' as const,
    minLength: 1,
  },

  /**
   * Pagination schema
   */
  pagination: {
    type: 'object' as const,
    properties: {
      page: {
        type: 'integer' as const,
        minimum: 1,
        default: 1,
      },
      limit: {
        type: 'integer' as const,
        minimum: 1,
        maximum: 100,
        default: 10,
      },
    },
  },

  /**
   * Timestamp schema
   */
  timestamp: {
    type: 'string' as const,
    format: 'date-time',
  },
};
