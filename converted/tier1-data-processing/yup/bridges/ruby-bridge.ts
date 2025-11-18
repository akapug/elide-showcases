/**
 * Ruby Bridge for Yup
 * Enables using Yup schemas from Ruby code
 */

import * as yup from '../src/yup';

declare const Ruby: any;

export class RubyBridge {
  /**
   * Validate data from Ruby using a Yup schema
   */
  static async validateFromRuby(schemaConfig: any, data: any, options?: any): Promise<any> {
    const schema = this.buildSchema(schemaConfig);
    return await schema.validate(data, options);
  }

  /**
   * Synchronously validate data from Ruby
   */
  static validateSyncFromRuby(schemaConfig: any, data: any, options?: any): any {
    const schema = this.buildSchema(schemaConfig);
    return schema.validateSync(data, options);
  }

  /**
   * Check if data is valid
   */
  static async isValidFromRuby(schemaConfig: any, data: any, options?: any): Promise<boolean> {
    const schema = this.buildSchema(schemaConfig);
    return await schema.isValid(data, options);
  }

  /**
   * Build a Yup schema from Ruby configuration
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
    if (options.required) schema = schema.required(options.required_message);
    if (options.nullable) schema = schema.nullable();
    if (options.optional) schema = schema.optional();
    if (options.default !== undefined) schema = schema.default(options.default);
    if (options.one_of) schema = schema.oneOf(options.one_of, options.one_of_message);
    if (options.not_one_of) schema = schema.notOneOf(options.not_one_of, options.not_one_of_message);
    if (options.label) schema = schema.label(options.label);

    return schema;
  }

  private static buildStringSchema(options: any): yup.StringSchema {
    let schema = yup.string();

    if (options.min !== undefined) schema = schema.min(options.min, options.min_message);
    if (options.max !== undefined) schema = schema.max(options.max, options.max_message);
    if (options.length !== undefined) schema = schema.length(options.length, options.length_message);
    if (options.email) schema = schema.email(options.email_message);
    if (options.url) schema = schema.url(options.url_message);
    if (options.uuid) schema = schema.uuid(options.uuid_message);
    if (options.matches) schema = schema.matches(new RegExp(options.matches), options.matches_message);
    if (options.lowercase) schema = schema.lowercase();
    if (options.uppercase) schema = schema.uppercase();
    if (options.trim) schema = schema.trim();

    return schema;
  }

  private static buildNumberSchema(options: any): yup.NumberSchema {
    let schema = yup.number();

    if (options.min !== undefined) schema = schema.min(options.min, options.min_message);
    if (options.max !== undefined) schema = schema.max(options.max, options.max_message);
    if (options.less_than !== undefined) schema = schema.lessThan(options.less_than, options.less_than_message);
    if (options.more_than !== undefined) schema = schema.moreThan(options.more_than, options.more_than_message);
    if (options.positive) schema = schema.positive(options.positive_message);
    if (options.negative) schema = schema.negative(options.negative_message);
    if (options.integer) schema = schema.integer(options.integer_message);

    return schema;
  }

  private static buildDateSchema(options: any): yup.DateSchema {
    let schema = yup.date();

    if (options.min !== undefined) schema = schema.min(new Date(options.min), options.min_message);
    if (options.max !== undefined) schema = schema.max(new Date(options.max), options.max_message);

    return schema;
  }

  private static buildArraySchema(options: any): yup.ArraySchema {
    let schema = yup.array();

    if (options.of) {
      const innerSchema = this.buildSchema(options.of);
      schema = schema.of(innerSchema);
    }

    if (options.min !== undefined) schema = schema.min(options.min, options.min_message);
    if (options.max !== undefined) schema = schema.max(options.max, options.max_message);
    if (options.length !== undefined) schema = schema.length(options.length, options.length_message);

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

    if (options.no_unknown) schema = schema.noUnknown(options.no_unknown_message);

    return schema;
  }
}

// Export for Ruby interop
if (typeof globalThis !== 'undefined') {
  (globalThis as any).YupRubyBridge = RubyBridge;
}
