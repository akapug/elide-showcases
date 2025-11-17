/**
 * Python Bridge for Yup
 * Enables using Yup schemas from Python code
 */

import * as yup from '../src/yup';

declare const Python: any;

export class PythonBridge {
  /**
   * Validate data from Python using a Yup schema
   */
  static async validateFromPython(schemaConfig: any, data: any, options?: any): Promise<any> {
    const schema = this.buildSchema(schemaConfig);
    return await schema.validate(data, options);
  }

  /**
   * Synchronously validate data from Python
   */
  static validateSyncFromPython(schemaConfig: any, data: any, options?: any): any {
    const schema = this.buildSchema(schemaConfig);
    return schema.validateSync(data, options);
  }

  /**
   * Check if data is valid
   */
  static async isValidFromPython(schemaConfig: any, data: any, options?: any): Promise<boolean> {
    const schema = this.buildSchema(schemaConfig);
    return await schema.isValid(data, options);
  }

  /**
   * Build a Yup schema from Python configuration
   */
  private static buildSchema(config: any): yup.Schema {
    const { type, ...options } = config;

    let schema: yup.Schema;

    switch (type) {
      case 'string':
        schema = this.buildStringSchema(options);
        break;
      case 'number':
        schema = this.buildNumberSchema(options);
        break;
      case 'boolean':
        schema = yup.boolean();
        break;
      case 'date':
        schema = this.buildDateSchema(options);
        break;
      case 'array':
        schema = this.buildArraySchema(options);
        break;
      case 'object':
        schema = this.buildObjectSchema(options);
        break;
      default:
        schema = yup.mixed();
    }

    // Apply common modifiers
    if (options.required) schema = schema.required(options.requiredMessage);
    if (options.nullable) schema = schema.nullable();
    if (options.optional) schema = schema.optional();
    if (options.default !== undefined) schema = schema.default(options.default);
    if (options.oneOf) schema = schema.oneOf(options.oneOf, options.oneOfMessage);
    if (options.notOneOf) schema = schema.notOneOf(options.notOneOf, options.notOneOfMessage);
    if (options.label) schema = schema.label(options.label);

    return schema;
  }

  private static buildStringSchema(options: any): yup.StringSchema {
    let schema = yup.string();

    if (options.min !== undefined) schema = schema.min(options.min, options.minMessage);
    if (options.max !== undefined) schema = schema.max(options.max, options.maxMessage);
    if (options.length !== undefined) schema = schema.length(options.length, options.lengthMessage);
    if (options.email) schema = schema.email(options.emailMessage);
    if (options.url) schema = schema.url(options.urlMessage);
    if (options.uuid) schema = schema.uuid(options.uuidMessage);
    if (options.matches) schema = schema.matches(new RegExp(options.matches), options.matchesMessage);
    if (options.lowercase) schema = schema.lowercase();
    if (options.uppercase) schema = schema.uppercase();
    if (options.trim) schema = schema.trim();

    return schema;
  }

  private static buildNumberSchema(options: any): yup.NumberSchema {
    let schema = yup.number();

    if (options.min !== undefined) schema = schema.min(options.min, options.minMessage);
    if (options.max !== undefined) schema = schema.max(options.max, options.maxMessage);
    if (options.lessThan !== undefined) schema = schema.lessThan(options.lessThan, options.lessThanMessage);
    if (options.moreThan !== undefined) schema = schema.moreThan(options.moreThan, options.moreThanMessage);
    if (options.positive) schema = schema.positive(options.positiveMessage);
    if (options.negative) schema = schema.negative(options.negativeMessage);
    if (options.integer) schema = schema.integer(options.integerMessage);

    return schema;
  }

  private static buildDateSchema(options: any): yup.DateSchema {
    let schema = yup.date();

    if (options.min !== undefined) schema = schema.min(new Date(options.min), options.minMessage);
    if (options.max !== undefined) schema = schema.max(new Date(options.max), options.maxMessage);

    return schema;
  }

  private static buildArraySchema(options: any): yup.ArraySchema {
    let schema = yup.array();

    if (options.of) {
      const innerSchema = this.buildSchema(options.of);
      schema = schema.of(innerSchema);
    }

    if (options.min !== undefined) schema = schema.min(options.min, options.minMessage);
    if (options.max !== undefined) schema = schema.max(options.max, options.maxMessage);
    if (options.length !== undefined) schema = schema.length(options.length, options.lengthMessage);

    return schema;
  }

  private static buildObjectSchema(options: any): yup.ObjectSchema {
    let schema = yup.object();

    if (options.shape) {
      const shape: any = {};
      for (const [key, fieldConfig] of Object.entries(options.shape)) {
        shape[key] = this.buildSchema(fieldConfig);
      }
      schema = schema.shape(shape);
    }

    if (options.noUnknown) schema = schema.noUnknown(options.noUnknownMessage);

    return schema;
  }
}

// Export for Python interop
if (typeof globalThis !== 'undefined') {
  (globalThis as any).YupBridge = PythonBridge;
}
