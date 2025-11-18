/**
 * FastAPI Pydantic Models Module
 *
 * Provides TypeScript integration with Pydantic models for validation.
 * Supports polyglot Python + TypeScript model definitions.
 */

export interface FieldDefinition {
  type: string;
  required?: boolean;
  default?: any;
  description?: string;
  example?: any;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  enum?: any[];
}

export interface ModelSchema {
  title?: string;
  description?: string;
  fields: Record<string, FieldDefinition>;
}

export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

/**
 * BaseModel class - similar to Pydantic's BaseModel
 */
export class BaseModel {
  private static schema: ModelSchema;

  constructor(data: any = {}) {
    const schema = (this.constructor as any).getSchema();

    for (const [fieldName, fieldDef] of Object.entries(schema.fields)) {
      const value = data[fieldName];

      // Check required fields
      if (fieldDef.required && value === undefined) {
        if (fieldDef.default !== undefined) {
          (this as any)[fieldName] = fieldDef.default;
        } else {
          throw new ValidationError([
            {
              loc: [fieldName],
              msg: 'field required',
              type: 'value_error.missing',
            },
          ]);
        }
      } else if (value !== undefined) {
        (this as any)[fieldName] = this.validateField(fieldName, value, fieldDef);
      } else if (fieldDef.default !== undefined) {
        (this as any)[fieldName] = fieldDef.default;
      }
    }
  }

  /**
   * Validate a single field
   */
  private validateField(fieldName: string, value: any, fieldDef: FieldDefinition): any {
    const errors: ValidationError[] = [];

    // Type validation
    const expectedType = fieldDef.type;
    const actualType = typeof value;

    if (expectedType === 'string' && actualType !== 'string') {
      errors.push({
        loc: [fieldName],
        msg: `value is not a valid string`,
        type: 'type_error.str',
      });
    } else if (expectedType === 'number' && actualType !== 'number') {
      errors.push({
        loc: [fieldName],
        msg: `value is not a valid number`,
        type: 'type_error.number',
      });
    } else if (expectedType === 'boolean' && actualType !== 'boolean') {
      errors.push({
        loc: [fieldName],
        msg: `value is not a valid boolean`,
        type: 'type_error.bool',
      });
    } else if (expectedType === 'array' && !Array.isArray(value)) {
      errors.push({
        loc: [fieldName],
        msg: `value is not a valid array`,
        type: 'type_error.list',
      });
    }

    // String constraints
    if (expectedType === 'string' && typeof value === 'string') {
      if (fieldDef.minLength !== undefined && value.length < fieldDef.minLength) {
        errors.push({
          loc: [fieldName],
          msg: `ensure this value has at least ${fieldDef.minLength} characters`,
          type: 'value_error.any_str.min_length',
        });
      }

      if (fieldDef.maxLength !== undefined && value.length > fieldDef.maxLength) {
        errors.push({
          loc: [fieldName],
          msg: `ensure this value has at most ${fieldDef.maxLength} characters`,
          type: 'value_error.any_str.max_length',
        });
      }

      if (fieldDef.pattern && !new RegExp(fieldDef.pattern).test(value)) {
        errors.push({
          loc: [fieldName],
          msg: `string does not match regex "${fieldDef.pattern}"`,
          type: 'value_error.str.regex',
        });
      }
    }

    // Number constraints
    if (expectedType === 'number' && typeof value === 'number') {
      if (fieldDef.min !== undefined && value < fieldDef.min) {
        errors.push({
          loc: [fieldName],
          msg: `ensure this value is greater than or equal to ${fieldDef.min}`,
          type: 'value_error.number.not_ge',
        });
      }

      if (fieldDef.max !== undefined && value > fieldDef.max) {
        errors.push({
          loc: [fieldName],
          msg: `ensure this value is less than or equal to ${fieldDef.max}`,
          type: 'value_error.number.not_le',
        });
      }
    }

    // Enum validation
    if (fieldDef.enum && !fieldDef.enum.includes(value)) {
      errors.push({
        loc: [fieldName],
        msg: `value is not a valid enumeration member`,
        type: 'type_error.enum',
      });
    }

    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    return value;
  }

  /**
   * Get model schema
   */
  static getSchema(): ModelSchema {
    return this.schema || { fields: {} };
  }

  /**
   * Define model schema
   */
  static defineSchema(schema: ModelSchema): void {
    this.schema = schema;
  }

  /**
   * Convert to JSON
   */
  public dict(): Record<string, any> {
    const schema = (this.constructor as any).getSchema();
    const result: Record<string, any> = {};

    for (const fieldName of Object.keys(schema.fields)) {
      if ((this as any)[fieldName] !== undefined) {
        result[fieldName] = (this as any)[fieldName];
      }
    }

    return result;
  }

  /**
   * Convert to JSON string
   */
  public json(): string {
    return JSON.stringify(this.dict());
  }

  /**
   * Parse from JSON
   */
  static parse_obj(data: any): BaseModel {
    return new this(data);
  }

  /**
   * Parse from JSON string
   */
  static parse_raw(json: string): BaseModel {
    return new this(JSON.parse(json));
  }

  /**
   * Get OpenAPI schema for model
   */
  static schema(): any {
    const modelSchema = this.getSchema();
    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const [fieldName, fieldDef] of Object.entries(modelSchema.fields)) {
      properties[fieldName] = {
        type: fieldDef.type === 'array' ? 'array' : fieldDef.type,
        description: fieldDef.description,
        example: fieldDef.example,
      };

      if (fieldDef.enum) {
        properties[fieldName].enum = fieldDef.enum;
      }

      if (fieldDef.min !== undefined) {
        properties[fieldName].minimum = fieldDef.min;
      }

      if (fieldDef.max !== undefined) {
        properties[fieldName].maximum = fieldDef.max;
      }

      if (fieldDef.minLength !== undefined) {
        properties[fieldName].minLength = fieldDef.minLength;
      }

      if (fieldDef.maxLength !== undefined) {
        properties[fieldName].maxLength = fieldDef.maxLength;
      }

      if (fieldDef.pattern) {
        properties[fieldName].pattern = fieldDef.pattern;
      }

      if (fieldDef.required) {
        required.push(fieldName);
      }
    }

    return {
      title: modelSchema.title || this.name,
      description: modelSchema.description,
      type: 'object',
      properties,
      required,
    };
  }
}

/**
 * ValidationError class
 */
export class ValidationError extends Error {
  public errors: ValidationError[];

  constructor(errors: ValidationError[]) {
    super('Validation Error');
    this.errors = errors;
  }

  public detail(): ValidationError[] {
    return this.errors;
  }
}

/**
 * Field factory function
 */
export function Field(options: Partial<FieldDefinition> = {}): FieldDefinition {
  return {
    type: options.type || 'string',
    required: options.required !== false,
    default: options.default,
    description: options.description,
    example: options.example,
    min: options.min,
    max: options.max,
    minLength: options.minLength,
    maxLength: options.maxLength,
    pattern: options.pattern,
    enum: options.enum,
  };
}

/**
 * Query parameter helper
 */
export function Query(
  default_value?: any,
  options: Partial<FieldDefinition> = {}
): FieldDefinition {
  return {
    ...options,
    type: options.type || 'string',
    default: default_value,
    required: default_value === undefined && options.required !== false,
  };
}

/**
 * Path parameter helper
 */
export function Path(options: Partial<FieldDefinition> = {}): FieldDefinition {
  return {
    ...options,
    type: options.type || 'string',
    required: true,
  };
}

/**
 * Body parameter helper
 */
export function Body(options: Partial<FieldDefinition> = {}): FieldDefinition {
  return {
    ...options,
    type: options.type || 'object',
    required: options.required !== false,
  };
}

/**
 * Header parameter helper
 */
export function Header(
  default_value?: any,
  options: Partial<FieldDefinition> = {}
): FieldDefinition {
  return {
    ...options,
    type: options.type || 'string',
    default: default_value,
    required: default_value === undefined && options.required !== false,
  };
}

/**
 * Create a model class from schema
 */
export function createModel(name: string, schema: ModelSchema): typeof BaseModel {
  class DynamicModel extends BaseModel {}
  Object.defineProperty(DynamicModel, 'name', { value: name });
  DynamicModel.defineSchema(schema);
  return DynamicModel;
}

/**
 * Polyglot Python model wrapper
 * Allows calling Python Pydantic models from TypeScript
 */
export class PythonModel {
  private pythonClass: any;
  private pythonModule: any;

  constructor(modulePath: string, className: string) {
    // This would use Elide's Python interop
    // For now, this is a placeholder showing the API
    // In real implementation: this.pythonModule = Python.import(modulePath);
    // this.pythonClass = this.pythonModule[className];
  }

  /**
   * Create instance from data
   */
  public create(data: any): any {
    // return this.pythonClass(data);
    return data;
  }

  /**
   * Validate data
   */
  public validate(data: any): any {
    // return this.pythonClass.parse_obj(data);
    return data;
  }

  /**
   * Get schema
   */
  public schema(): any {
    // return this.pythonClass.schema();
    return {};
  }
}

export default BaseModel;
