/**
 * Data Validator Transformer
 *
 * Validates and cleans data using elide-examples/validator.
 */

import { PipelineContext } from '../orchestrator/pipeline';

// Validation rule types
export type ValidationRule =
  | { type: 'required'; message?: string }
  | { type: 'type'; dataType: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object'; message?: string }
  | { type: 'min'; value: number; message?: string }
  | { type: 'max'; value: number; message?: string }
  | { type: 'minLength'; value: number; message?: string }
  | { type: 'maxLength'; value: number; message?: string }
  | { type: 'pattern'; pattern: string | RegExp; message?: string }
  | { type: 'email'; message?: string }
  | { type: 'url'; message?: string }
  | { type: 'enum'; values: any[]; message?: string }
  | { type: 'custom'; validator: (value: any, record: any) => boolean; message?: string };

// Schema definition
export interface ValidationSchema {
  [field: string]: ValidationRule[];
}

// Validation result
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  rule: string;
  message: string;
  value?: any;
}

// Validator configuration
export interface ValidatorConfig {
  schema: ValidationSchema;
  strict?: boolean; // Reject records with validation errors
  removeInvalid?: boolean; // Remove invalid records instead of keeping them
  addValidationField?: boolean; // Add _validation field to records
}

/**
 * Data Validator
 */
export class DataValidator {
  /**
   * Transform and validate data
   */
  async transform(
    data: any[],
    config: ValidatorConfig,
    context: PipelineContext
  ): Promise<any[]> {
    console.log(`[${context.runId}] Validating ${data.length} records`);

    const validatedData: any[] = [];
    let validCount = 0;
    let invalidCount = 0;

    for (const record of data) {
      const result = this.validateRecord(record, config.schema);

      if (result.valid) {
        validCount++;
        validatedData.push(record);
      } else {
        invalidCount++;

        if (config.strict) {
          throw new Error(
            `Validation failed for record: ${JSON.stringify(result.errors)}`
          );
        }

        if (config.removeInvalid) {
          // Skip invalid record
          continue;
        }

        // Keep invalid record but add validation info
        if (config.addValidationField) {
          record._validation = {
            valid: false,
            errors: result.errors
          };
        }

        validatedData.push(record);
      }
    }

    console.log(
      `[${context.runId}] Validation complete: ${validCount} valid, ${invalidCount} invalid`
    );

    return validatedData;
  }

  /**
   * Validate a single record
   */
  validateRecord(record: any, schema: ValidationSchema): ValidationResult {
    const errors: ValidationError[] = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = this.getFieldValue(record, field);

      for (const rule of rules) {
        const error = this.validateRule(field, value, rule, record);
        if (error) {
          errors.push(error);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate a single rule
   */
  private validateRule(
    field: string,
    value: any,
    rule: ValidationRule,
    record: any
  ): ValidationError | null {
    switch (rule.type) {
      case 'required':
        if (value === undefined || value === null || value === '') {
          return {
            field,
            rule: 'required',
            message: rule.message || `${field} is required`,
            value
          };
        }
        break;

      case 'type':
        if (!this.checkType(value, rule.dataType)) {
          return {
            field,
            rule: 'type',
            message: rule.message || `${field} must be of type ${rule.dataType}`,
            value
          };
        }
        break;

      case 'min':
        if (typeof value === 'number' && value < rule.value) {
          return {
            field,
            rule: 'min',
            message: rule.message || `${field} must be at least ${rule.value}`,
            value
          };
        }
        break;

      case 'max':
        if (typeof value === 'number' && value > rule.value) {
          return {
            field,
            rule: 'max',
            message: rule.message || `${field} must be at most ${rule.value}`,
            value
          };
        }
        break;

      case 'minLength':
        if (typeof value === 'string' && value.length < rule.value) {
          return {
            field,
            rule: 'minLength',
            message: rule.message || `${field} must be at least ${rule.value} characters`,
            value
          };
        }
        break;

      case 'maxLength':
        if (typeof value === 'string' && value.length > rule.value) {
          return {
            field,
            rule: 'maxLength',
            message: rule.message || `${field} must be at most ${rule.value} characters`,
            value
          };
        }
        break;

      case 'pattern':
        if (typeof value === 'string') {
          const pattern = typeof rule.pattern === 'string'
            ? new RegExp(rule.pattern)
            : rule.pattern;

          if (!pattern.test(value)) {
            return {
              field,
              rule: 'pattern',
              message: rule.message || `${field} does not match required pattern`,
              value
            };
          }
        }
        break;

      case 'email':
        if (typeof value === 'string') {
          const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailPattern.test(value)) {
            return {
              field,
              rule: 'email',
              message: rule.message || `${field} must be a valid email address`,
              value
            };
          }
        }
        break;

      case 'url':
        if (typeof value === 'string') {
          try {
            new URL(value);
          } catch {
            return {
              field,
              rule: 'url',
              message: rule.message || `${field} must be a valid URL`,
              value
            };
          }
        }
        break;

      case 'enum':
        if (!rule.values.includes(value)) {
          return {
            field,
            rule: 'enum',
            message: rule.message || `${field} must be one of: ${rule.values.join(', ')}`,
            value
          };
        }
        break;

      case 'custom':
        if (!rule.validator(value, record)) {
          return {
            field,
            rule: 'custom',
            message: rule.message || `${field} failed custom validation`,
            value
          };
        }
        break;
    }

    return null;
  }

  /**
   * Check if value matches expected type
   */
  private checkType(value: any, expectedType: string): boolean {
    if (value === null || value === undefined) {
      return false;
    }

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

      default:
        return false;
    }
  }

  /**
   * Get field value (supports nested fields with dot notation)
   */
  private getFieldValue(record: any, field: string): any {
    const parts = field.split('.');
    let value = record;

    for (const part of parts) {
      if (value === undefined || value === null) {
        return undefined;
      }
      value = value[part];
    }

    return value;
  }

  /**
   * Get validation statistics
   */
  getValidationStats(
    data: any[],
    schema: ValidationSchema
  ): {
    totalRecords: number;
    validRecords: number;
    invalidRecords: number;
    fieldErrors: Record<string, number>;
  } {
    let validRecords = 0;
    let invalidRecords = 0;
    const fieldErrors: Record<string, number> = {};

    for (const record of data) {
      const result = this.validateRecord(record, schema);

      if (result.valid) {
        validRecords++;
      } else {
        invalidRecords++;

        for (const error of result.errors) {
          fieldErrors[error.field] = (fieldErrors[error.field] || 0) + 1;
        }
      }
    }

    return {
      totalRecords: data.length,
      validRecords,
      invalidRecords,
      fieldErrors
    };
  }
}

/**
 * Common validation schemas
 */
export const CommonSchemas = {
  /**
   * User schema
   */
  user: {
    id: [{ type: 'required' }],
    email: [
      { type: 'required' },
      { type: 'email' }
    ],
    name: [
      { type: 'required' },
      { type: 'minLength', value: 2 },
      { type: 'maxLength', value: 100 }
    ],
    age: [
      { type: 'type', dataType: 'number' },
      { type: 'min', value: 0 },
      { type: 'max', value: 150 }
    ]
  } as ValidationSchema,

  /**
   * Product schema
   */
  product: {
    sku: [
      { type: 'required' },
      { type: 'pattern', pattern: /^[A-Z0-9-]+$/ }
    ],
    name: [
      { type: 'required' },
      { type: 'minLength', value: 3 }
    ],
    price: [
      { type: 'required' },
      { type: 'type', dataType: 'number' },
      { type: 'min', value: 0 }
    ],
    category: [
      { type: 'required' }
    ]
  } as ValidationSchema,

  /**
   * Order schema
   */
  order: {
    orderId: [{ type: 'required' }],
    customerId: [{ type: 'required' }],
    total: [
      { type: 'required' },
      { type: 'type', dataType: 'number' },
      { type: 'min', value: 0 }
    ],
    status: [
      { type: 'required' },
      { type: 'enum', values: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] }
    ],
    orderDate: [
      { type: 'required' },
      { type: 'type', dataType: 'date' }
    ]
  } as ValidationSchema
};
