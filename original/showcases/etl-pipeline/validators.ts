/**
 * Data Validation and Cleaning
 *
 * Production-grade validation and data cleaning:
 * - Schema validation with detailed error messages
 * - Data type coercion and normalization
 * - Data cleaning and sanitization
 * - Custom validation rules
 * - Validation result tracking
 * - Data profiling and statistics
 */

export interface ValidationRule {
  field: string;
  type: 'required' | 'type' | 'range' | 'pattern' | 'enum' | 'custom' | 'length' | 'email' | 'url' | 'date';
  params?: any;
  message?: string;
  severity?: 'error' | 'warning';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  cleaned?: any;
}

export interface ValidationError {
  field: string;
  rule: string;
  message: string;
  value?: any;
  severity: 'error' | 'warning';
}

export interface DataProfile {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  fieldStats: Map<string, FieldStats>;
}

export interface FieldStats {
  totalValues: number;
  nullCount: number;
  uniqueCount: number;
  dataTypes: Map<string, number>;
  minValue?: any;
  maxValue?: any;
  avgLength?: number;
}

// ==================== Schema Validator ====================

export class SchemaValidator {
  private rules: ValidationRule[];
  private strictMode: boolean;

  constructor(rules: ValidationRule[], strictMode = false) {
    this.rules = rules;
    this.strictMode = strictMode;
  }

  validate(record: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    for (const rule of this.rules) {
      const result = this.validateRule(record, rule);

      if (!result.valid) {
        if (rule.severity === 'warning') {
          warnings.push(...result.errors);
        } else {
          errors.push(...result.errors);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      cleaned: record
    };
  }

  private validateRule(record: any, rule: ValidationRule): ValidationResult {
    const errors: ValidationError[] = [];
    const value = record[rule.field];

    switch (rule.type) {
      case 'required':
        if (value === null || value === undefined || value === '') {
          errors.push({
            field: rule.field,
            rule: 'required',
            message: rule.message || `Field ${rule.field} is required`,
            value,
            severity: rule.severity || 'error'
          });
        }
        break;

      case 'type':
        if (value !== null && value !== undefined) {
          const expectedType = rule.params?.type;
          const actualType = typeof value;

          if (!this.checkType(value, expectedType)) {
            errors.push({
              field: rule.field,
              rule: 'type',
              message: rule.message || `Field ${rule.field} must be ${expectedType}, got ${actualType}`,
              value,
              severity: rule.severity || 'error'
            });
          }
        }
        break;

      case 'range':
        if (typeof value === 'number') {
          const { min, max } = rule.params || {};

          if (min !== undefined && value < min) {
            errors.push({
              field: rule.field,
              rule: 'range',
              message: rule.message || `Field ${rule.field} must be >= ${min}`,
              value,
              severity: rule.severity || 'error'
            });
          }

          if (max !== undefined && value > max) {
            errors.push({
              field: rule.field,
              rule: 'range',
              message: rule.message || `Field ${rule.field} must be <= ${max}`,
              value,
              severity: rule.severity || 'error'
            });
          }
        }
        break;

      case 'length':
        const length = String(value || '').length;
        const { min, max } = rule.params || {};

        if (min !== undefined && length < min) {
          errors.push({
            field: rule.field,
            rule: 'length',
            message: rule.message || `Field ${rule.field} must have length >= ${min}`,
            value,
            severity: rule.severity || 'error'
          });
        }

        if (max !== undefined && length > max) {
          errors.push({
            field: rule.field,
            rule: 'length',
            message: rule.message || `Field ${rule.field} must have length <= ${max}`,
            value,
            severity: rule.severity || 'error'
          });
        }
        break;

      case 'pattern':
        if (value !== null && value !== undefined) {
          const pattern = new RegExp(rule.params?.pattern);

          if (!pattern.test(String(value))) {
            errors.push({
              field: rule.field,
              rule: 'pattern',
              message: rule.message || `Field ${rule.field} does not match required pattern`,
              value,
              severity: rule.severity || 'error'
            });
          }
        }
        break;

      case 'enum':
        if (value !== null && value !== undefined) {
          const allowedValues = rule.params?.values || [];

          if (!allowedValues.includes(value)) {
            errors.push({
              field: rule.field,
              rule: 'enum',
              message: rule.message || `Field ${rule.field} must be one of: ${allowedValues.join(', ')}`,
              value,
              severity: rule.severity || 'error'
            });
          }
        }
        break;

      case 'email':
        if (value !== null && value !== undefined) {
          const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

          if (!emailPattern.test(String(value))) {
            errors.push({
              field: rule.field,
              rule: 'email',
              message: rule.message || `Field ${rule.field} must be a valid email address`,
              value,
              severity: rule.severity || 'error'
            });
          }
        }
        break;

      case 'url':
        if (value !== null && value !== undefined) {
          try {
            new URL(String(value));
          } catch {
            errors.push({
              field: rule.field,
              rule: 'url',
              message: rule.message || `Field ${rule.field} must be a valid URL`,
              value,
              severity: rule.severity || 'error'
            });
          }
        }
        break;

      case 'date':
        if (value !== null && value !== undefined) {
          const date = new Date(value);

          if (isNaN(date.getTime())) {
            errors.push({
              field: rule.field,
              rule: 'date',
              message: rule.message || `Field ${rule.field} must be a valid date`,
              value,
              severity: rule.severity || 'error'
            });
          }
        }
        break;

      case 'custom':
        if (rule.params?.validator) {
          const customResult = rule.params.validator(value, record);

          if (!customResult) {
            errors.push({
              field: rule.field,
              rule: 'custom',
              message: rule.message || `Field ${rule.field} failed custom validation`,
              value,
              severity: rule.severity || 'error'
            });
          }
        }
        break;
    }

    return { valid: errors.length === 0, errors, warnings: [] };
  }

  private checkType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && !Array.isArray(value);
      case 'date':
        return value instanceof Date || !isNaN(Date.parse(value));
      default:
        return true;
    }
  }
}

// ==================== Data Cleaner ====================

export class DataCleaner {
  static trim(value: any): any {
    return typeof value === 'string' ? value.trim() : value;
  }

  static toLowerCase(value: any): any {
    return typeof value === 'string' ? value.toLowerCase() : value;
  }

  static toUpperCase(value: any): any {
    return typeof value === 'string' ? value.toUpperCase() : value;
  }

  static removeNulls(record: any): any {
    const cleaned: any = {};

    for (const [key, value] of Object.entries(record)) {
      if (value !== null && value !== undefined) {
        cleaned[key] = value;
      }
    }

    return cleaned;
  }

  static replaceNulls(record: any, defaultValue: any = ''): any {
    const cleaned: any = {};

    for (const [key, value] of Object.entries(record)) {
      cleaned[key] = (value === null || value === undefined) ? defaultValue : value;
    }

    return cleaned;
  }

  static normalizeWhitespace(value: any): any {
    return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : value;
  }

  static removeSpecialChars(value: any, keep = ''): any {
    if (typeof value !== 'string') return value;

    const pattern = new RegExp(`[^a-zA-Z0-9${keep}]`, 'g');
    return value.replace(pattern, '');
  }

  static sanitizeHTML(value: any): any {
    if (typeof value !== 'string') return value;

    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  static parseNumber(value: any): number | null {
    if (typeof value === 'number') return value;

    const cleaned = String(value).replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleaned);

    return isNaN(parsed) ? null : parsed;
  }

  static parseDate(value: any): Date | null {
    if (value instanceof Date) return value;

    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  static parseBoolean(value: any): boolean | null {
    if (typeof value === 'boolean') return value;

    const str = String(value).toLowerCase().trim();

    if (['true', '1', 'yes', 'y', 'on'].includes(str)) return true;
    if (['false', '0', 'no', 'n', 'off'].includes(str)) return false;

    return null;
  }

  static standardizePhone(value: any): string | null {
    if (typeof value !== 'string') return null;

    const digits = value.replace(/\D/g, '');

    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length === 11 && digits[0] === '1') {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }

    return value;
  }

  static standardizeEmail(value: any): string | null {
    if (typeof value !== 'string') return null;

    return value.toLowerCase().trim();
  }

  static deduplicateArray(arr: any[]): any[] {
    return Array.from(new Set(arr));
  }

  static cleanRecord(record: any, cleaners: Map<string, (value: any) => any>): any {
    const cleaned: any = {};

    for (const [key, value] of Object.entries(record)) {
      const cleaner = cleaners.get(key);
      cleaned[key] = cleaner ? cleaner(value) : value;
    }

    return cleaned;
  }
}

// ==================== Data Type Coercion ====================

export class TypeCoercer {
  private schema: Map<string, string>;

  constructor(schema: Map<string, string>) {
    this.schema = schema;
  }

  coerce(record: any): any {
    const coerced: any = {};

    for (const [field, value] of Object.entries(record)) {
      const targetType = this.schema.get(field);

      if (!targetType) {
        coerced[field] = value;
        continue;
      }

      coerced[field] = this.coerceValue(value, targetType);
    }

    return coerced;
  }

  private coerceValue(value: any, targetType: string): any {
    if (value === null || value === undefined) return null;

    switch (targetType) {
      case 'string':
        return String(value);

      case 'number':
        return DataCleaner.parseNumber(value);

      case 'boolean':
        return DataCleaner.parseBoolean(value);

      case 'date':
        return DataCleaner.parseDate(value);

      case 'array':
        return Array.isArray(value) ? value : [value];

      case 'object':
        return typeof value === 'object' ? value : { value };

      default:
        return value;
    }
  }
}

// ==================== Data Profiler ====================

export class DataProfiler {
  profile(data: any[]): DataProfile {
    const fieldStats = new Map<string, FieldStats>();

    // Collect field names
    const fields = new Set<string>();
    data.forEach(record => {
      Object.keys(record).forEach(field => fields.add(field));
    });

    // Profile each field
    for (const field of fields) {
      fieldStats.set(field, this.profileField(data, field));
    }

    return {
      totalRecords: data.length,
      validRecords: data.length, // Updated by validation
      invalidRecords: 0,
      fieldStats
    };
  }

  private profileField(data: any[], field: string): FieldStats {
    const values = data.map(record => record[field]);
    const nonNullValues = values.filter(v => v !== null && v !== undefined);
    const uniqueValues = new Set(nonNullValues);

    const dataTypes = new Map<string, number>();
    let totalLength = 0;

    for (const value of nonNullValues) {
      const type = Array.isArray(value) ? 'array' :
                   value instanceof Date ? 'date' :
                   typeof value;

      dataTypes.set(type, (dataTypes.get(type) || 0) + 1);

      if (typeof value === 'string') {
        totalLength += value.length;
      }
    }

    // Calculate min/max for numbers
    let minValue: any = undefined;
    let maxValue: any = undefined;

    const numberValues = nonNullValues.filter(v => typeof v === 'number');
    if (numberValues.length > 0) {
      minValue = Math.min(...numberValues);
      maxValue = Math.max(...numberValues);
    }

    return {
      totalValues: values.length,
      nullCount: values.length - nonNullValues.length,
      uniqueCount: uniqueValues.size,
      dataTypes,
      minValue,
      maxValue,
      avgLength: nonNullValues.length > 0 ? totalLength / nonNullValues.length : 0
    };
  }

  printProfile(profile: DataProfile): void {
    console.log('\n=== Data Profile ===');
    console.log(`Total Records: ${profile.totalRecords}`);
    console.log(`Valid Records: ${profile.validRecords}`);
    console.log(`Invalid Records: ${profile.invalidRecords}`);
    console.log('\nField Statistics:');

    for (const [field, stats] of profile.fieldStats) {
      console.log(`\n  ${field}:`);
      console.log(`    Total Values: ${stats.totalValues}`);
      console.log(`    Null Count: ${stats.nullCount} (${(stats.nullCount / stats.totalValues * 100).toFixed(1)}%)`);
      console.log(`    Unique Count: ${stats.uniqueCount}`);
      console.log(`    Data Types: ${Array.from(stats.dataTypes.entries()).map(([k, v]) => `${k}(${v})`).join(', ')}`);

      if (stats.minValue !== undefined) {
        console.log(`    Range: ${stats.minValue} - ${stats.maxValue}`);
      }

      if (stats.avgLength > 0) {
        console.log(`    Avg Length: ${stats.avgLength.toFixed(1)}`);
      }
    }

    console.log('\n==================\n');
  }
}

// ==================== Batch Validator ====================

export class BatchValidator {
  private validator: SchemaValidator;
  private cleaner?: DataCleaner;
  private profiler: DataProfiler;

  constructor(rules: ValidationRule[], enableCleaning = false) {
    this.validator = new SchemaValidator(rules);
    this.profiler = new DataProfiler();

    if (enableCleaning) {
      this.cleaner = new DataCleaner();
    }
  }

  validateBatch(data: any[]): {
    valid: any[];
    invalid: any[];
    errors: Map<number, ValidationError[]>;
    warnings: Map<number, ValidationError[]>;
    profile: DataProfile;
  } {
    const valid: any[] = [];
    const invalid: any[] = [];
    const errors = new Map<number, ValidationError[]>();
    const warnings = new Map<number, ValidationError[]>();

    data.forEach((record, index) => {
      const result = this.validator.validate(record);

      if (result.valid) {
        valid.push(result.cleaned || record);
      } else {
        invalid.push(record);
        errors.set(index, result.errors);
      }

      if (result.warnings.length > 0) {
        warnings.set(index, result.warnings);
      }
    });

    const profile = this.profiler.profile(data);
    profile.validRecords = valid.length;
    profile.invalidRecords = invalid.length;

    return { valid, invalid, errors, warnings, profile };
  }

  async validateStream(
    stream: AsyncGenerator<any[], void>,
    onBatch?: (result: any) => void
  ): Promise<{
    totalValid: number;
    totalInvalid: number;
    totalErrors: number;
  }> {
    let totalValid = 0;
    let totalInvalid = 0;
    let totalErrors = 0;

    for await (const batch of stream) {
      const result = this.validateBatch(batch);

      totalValid += result.valid.length;
      totalInvalid += result.invalid.length;
      totalErrors += result.errors.size;

      if (onBatch) {
        onBatch(result);
      }
    }

    return { totalValid, totalInvalid, totalErrors };
  }
}

// ==================== Data Quality Rules ====================

export const CommonValidationRules = {
  notNull: (field: string): ValidationRule => ({
    field,
    type: 'required',
    message: `${field} cannot be null`
  }),

  positiveNumber: (field: string): ValidationRule => ({
    field,
    type: 'range',
    params: { min: 0 },
    message: `${field} must be positive`
  }),

  email: (field: string): ValidationRule => ({
    field,
    type: 'email',
    message: `${field} must be a valid email`
  }),

  url: (field: string): ValidationRule => ({
    field,
    type: 'url',
    message: `${field} must be a valid URL`
  }),

  phoneNumber: (field: string): ValidationRule => ({
    field,
    type: 'pattern',
    params: { pattern: '^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$' },
    message: `${field} must be a valid phone number`
  }),

  zipCode: (field: string): ValidationRule => ({
    field,
    type: 'pattern',
    params: { pattern: '^[0-9]{5}(?:-[0-9]{4})?$' },
    message: `${field} must be a valid ZIP code`
  }),

  alphanumeric: (field: string): ValidationRule => ({
    field,
    type: 'pattern',
    params: { pattern: '^[a-zA-Z0-9]+$' },
    message: `${field} must be alphanumeric`
  }),

  dateInPast: (field: string): ValidationRule => ({
    field,
    type: 'custom',
    params: {
      validator: (value: any) => {
        const date = new Date(value);
        return !isNaN(date.getTime()) && date < new Date();
      }
    },
    message: `${field} must be in the past`
  }),

  dateInFuture: (field: string): ValidationRule => ({
    field,
    type: 'custom',
    params: {
      validator: (value: any) => {
        const date = new Date(value);
        return !isNaN(date.getTime()) && date > new Date();
      }
    },
    message: `${field} must be in the future`
  })
};
