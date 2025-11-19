/**
 * JSON Transformer
 *
 * Advanced JSON transformation engine with:
 * - JSONPath expressions
 * - Schema validation
 * - Template-based transformations
 * - Conditional logic
 * - Array operations
 * - Deep merging
 * - Type coercion
 */

import * as crypto from 'crypto';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface TransformRule {
  path: string;
  operation: 'set' | 'delete' | 'rename' | 'map' | 'filter' | 'merge' | 'template';
  value?: any;
  newPath?: string;
  condition?: (value: any, context: any) => boolean;
  mapper?: (value: any, context: any) => any;
  template?: string;
}

export interface TransformConfig {
  rules: TransformRule[];
  schema?: JsonSchema;
  strict?: boolean;
  preserveNull?: boolean;
  coerceTypes?: boolean;
}

export interface JsonSchema {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  required?: string[];
  enum?: any[];
  pattern?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: Array<{
    path: string;
    message: string;
    value?: any;
  }>;
}

export interface TransformContext {
  source: any;
  target: any;
  metadata?: Record<string, any>;
  timestamp?: Date;
}

// ============================================================================
// JSON Transformer
// ============================================================================

export class JsonTransformer {
  private config: TransformConfig;
  private context: TransformContext;

  constructor(config: TransformConfig) {
    this.config = config;
    this.context = {
      source: null,
      target: {},
      timestamp: new Date()
    };
  }

  // ==========================================================================
  // Main Transform
  // ==========================================================================

  public transform(data: any, metadata?: Record<string, any>): any {
    this.context.source = this.deepClone(data);
    this.context.target = {};
    this.context.metadata = metadata;
    this.context.timestamp = new Date();

    // Validate input schema
    if (this.config.schema) {
      const validation = this.validate(data, this.config.schema);
      if (!validation.valid && this.config.strict) {
        throw new Error(`Schema validation failed: ${JSON.stringify(validation.errors)}`);
      }
    }

    // Apply transformation rules
    for (const rule of this.config.rules) {
      this.applyRule(rule);
    }

    return this.context.target;
  }

  public transformBatch(items: any[], metadata?: Record<string, any>): any[] {
    return items.map(item => this.transform(item, metadata));
  }

  // ==========================================================================
  // Rule Application
  // ==========================================================================

  private applyRule(rule: TransformRule): void {
    const value = this.getValueByPath(this.context.source, rule.path);

    // Check condition
    if (rule.condition && !rule.condition(value, this.context)) {
      return;
    }

    switch (rule.operation) {
      case 'set':
        this.setOperation(rule, value);
        break;
      case 'delete':
        this.deleteOperation(rule);
        break;
      case 'rename':
        this.renameOperation(rule, value);
        break;
      case 'map':
        this.mapOperation(rule, value);
        break;
      case 'filter':
        this.filterOperation(rule, value);
        break;
      case 'merge':
        this.mergeOperation(rule, value);
        break;
      case 'template':
        this.templateOperation(rule);
        break;
    }
  }

  private setOperation(rule: TransformRule, value: any): void {
    const targetValue = rule.value !== undefined ? rule.value : value;
    this.setValueByPath(this.context.target, rule.path, targetValue);
  }

  private deleteOperation(rule: TransformRule): void {
    this.deleteByPath(this.context.target, rule.path);
  }

  private renameOperation(rule: TransformRule, value: any): void {
    if (!rule.newPath) {
      throw new Error('newPath is required for rename operation');
    }
    this.setValueByPath(this.context.target, rule.newPath, value);
  }

  private mapOperation(rule: TransformRule, value: any): void {
    if (!rule.mapper) {
      throw new Error('mapper is required for map operation');
    }

    if (Array.isArray(value)) {
      const mapped = value.map(item => rule.mapper!(item, this.context));
      this.setValueByPath(this.context.target, rule.path, mapped);
    } else {
      const mapped = rule.mapper(value, this.context);
      this.setValueByPath(this.context.target, rule.path, mapped);
    }
  }

  private filterOperation(rule: TransformRule, value: any): void {
    if (!Array.isArray(value)) {
      throw new Error('filter operation requires an array');
    }

    if (!rule.condition) {
      throw new Error('condition is required for filter operation');
    }

    const filtered = value.filter(item => rule.condition!(item, this.context));
    this.setValueByPath(this.context.target, rule.path, filtered);
  }

  private mergeOperation(rule: TransformRule, value: any): void {
    const existing = this.getValueByPath(this.context.target, rule.path);
    const merged = this.deepMerge(existing || {}, value);
    this.setValueByPath(this.context.target, rule.path, merged);
  }

  private templateOperation(rule: TransformRule): void {
    if (!rule.template) {
      throw new Error('template is required for template operation');
    }

    const result = this.evaluateTemplate(rule.template, this.context);
    this.setValueByPath(this.context.target, rule.path, result);
  }

  // ==========================================================================
  // Path Operations
  // ==========================================================================

  private getValueByPath(obj: any, path: string): any {
    if (!path) return obj;

    const parts = this.parsePath(path);
    let current = obj;

    for (const part of parts) {
      if (current == null) {
        return undefined;
      }

      if (part.includes('[') && part.includes(']')) {
        // Array index access
        const matches = part.match(/(\w+)\[(\d+)\]/);
        if (matches) {
          current = current[matches[1]];
          if (Array.isArray(current)) {
            current = current[parseInt(matches[2])];
          }
        }
      } else {
        current = current[part];
      }
    }

    return current;
  }

  private setValueByPath(obj: any, path: string, value: any): void {
    if (!path) {
      Object.assign(obj, value);
      return;
    }

    const parts = this.parsePath(path);
    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];

      if (!(part in current)) {
        // Determine if next part is array index
        const nextPart = parts[i + 1];
        current[part] = nextPart.match(/^\d+$/) ? [] : {};
      }

      current = current[part];
    }

    const lastPart = parts[parts.length - 1];
    current[lastPart] = value;
  }

  private deleteByPath(obj: any, path: string): void {
    const parts = this.parsePath(path);
    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      if (!(parts[i] in current)) {
        return;
      }
      current = current[parts[i]];
    }

    const lastPart = parts[parts.length - 1];
    if (Array.isArray(current)) {
      current.splice(parseInt(lastPart), 1);
    } else {
      delete current[lastPart];
    }
  }

  private parsePath(path: string): string[] {
    // Support both dot notation and bracket notation
    return path
      .replace(/\[(\w+)\]/g, '.$1')
      .split('.')
      .filter(p => p.length > 0);
  }

  // ==========================================================================
  // Template Engine
  // ==========================================================================

  private evaluateTemplate(template: string, context: TransformContext): any {
    // Simple template engine with variable substitution
    let result = template;

    // Replace ${path} with values from source
    const matches = template.match(/\$\{([^}]+)\}/g);
    if (matches) {
      for (const match of matches) {
        const path = match.slice(2, -1);
        const value = this.getValueByPath(context.source, path);
        result = result.replace(match, String(value));
      }
    }

    // Support expressions
    if (result.startsWith('=')) {
      return this.evaluateExpression(result.slice(1), context);
    }

    return result;
  }

  private evaluateExpression(expr: string, context: TransformContext): any {
    // Simple expression evaluator
    const trimmed = expr.trim();

    // Arithmetic operations
    if (trimmed.includes('+')) {
      const [left, right] = trimmed.split('+').map(s => this.evaluateOperand(s.trim(), context));
      return left + right;
    }
    if (trimmed.includes('-')) {
      const [left, right] = trimmed.split('-').map(s => this.evaluateOperand(s.trim(), context));
      return left - right;
    }
    if (trimmed.includes('*')) {
      const [left, right] = trimmed.split('*').map(s => this.evaluateOperand(s.trim(), context));
      return left * right;
    }
    if (trimmed.includes('/')) {
      const [left, right] = trimmed.split('/').map(s => this.evaluateOperand(s.trim(), context));
      return left / right;
    }

    return this.evaluateOperand(trimmed, context);
  }

  private evaluateOperand(operand: string, context: TransformContext): any {
    // Numbers
    if (!isNaN(Number(operand))) {
      return Number(operand);
    }

    // Strings
    if (operand.startsWith('"') || operand.startsWith("'")) {
      return operand.slice(1, -1);
    }

    // Path reference
    return this.getValueByPath(context.source, operand);
  }

  // ==========================================================================
  // Schema Validation
  // ==========================================================================

  public validate(data: any, schema: JsonSchema): ValidationResult {
    const errors: ValidationResult['errors'] = [];
    this.validateNode(data, schema, '', errors);

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private validateNode(
    data: any,
    schema: JsonSchema,
    path: string,
    errors: ValidationResult['errors']
  ): void {
    // Type validation
    const actualType = this.getType(data);
    if (schema.type && actualType !== schema.type) {
      errors.push({
        path,
        message: `Expected type ${schema.type}, got ${actualType}`,
        value: data
      });
      return;
    }

    // Type-specific validation
    switch (schema.type) {
      case 'object':
        this.validateObject(data, schema, path, errors);
        break;
      case 'array':
        this.validateArray(data, schema, path, errors);
        break;
      case 'string':
        this.validateString(data, schema, path, errors);
        break;
      case 'number':
        this.validateNumber(data, schema, path, errors);
        break;
    }
  }

  private validateObject(
    data: any,
    schema: JsonSchema,
    path: string,
    errors: ValidationResult['errors']
  ): void {
    // Required properties
    if (schema.required) {
      for (const prop of schema.required) {
        if (!(prop in data)) {
          errors.push({
            path: `${path}.${prop}`,
            message: 'Required property missing'
          });
        }
      }
    }

    // Validate properties
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (key in data) {
          this.validateNode(
            data[key],
            propSchema,
            path ? `${path}.${key}` : key,
            errors
          );
        }
      }
    }
  }

  private validateArray(
    data: any,
    schema: JsonSchema,
    path: string,
    errors: ValidationResult['errors']
  ): void {
    if (!Array.isArray(data)) {
      errors.push({
        path,
        message: 'Expected array',
        value: data
      });
      return;
    }

    // Validate items
    if (schema.items) {
      data.forEach((item, index) => {
        this.validateNode(item, schema.items!, `${path}[${index}]`, errors);
      });
    }
  }

  private validateString(
    data: any,
    schema: JsonSchema,
    path: string,
    errors: ValidationResult['errors']
  ): void {
    if (schema.pattern && !new RegExp(schema.pattern).test(data)) {
      errors.push({
        path,
        message: `Does not match pattern: ${schema.pattern}`,
        value: data
      });
    }

    if (schema.minLength && data.length < schema.minLength) {
      errors.push({
        path,
        message: `Minimum length is ${schema.minLength}`,
        value: data
      });
    }

    if (schema.maxLength && data.length > schema.maxLength) {
      errors.push({
        path,
        message: `Maximum length is ${schema.maxLength}`,
        value: data
      });
    }

    if (schema.enum && !schema.enum.includes(data)) {
      errors.push({
        path,
        message: `Must be one of: ${schema.enum.join(', ')}`,
        value: data
      });
    }
  }

  private validateNumber(
    data: any,
    schema: JsonSchema,
    path: string,
    errors: ValidationResult['errors']
  ): void {
    if (schema.minimum !== undefined && data < schema.minimum) {
      errors.push({
        path,
        message: `Minimum value is ${schema.minimum}`,
        value: data
      });
    }

    if (schema.maximum !== undefined && data > schema.maximum) {
      errors.push({
        path,
        message: `Maximum value is ${schema.maximum}`,
        value: data
      });
    }
  }

  private getType(value: any): JsonSchema['type'] {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'object';
    return typeof value as any;
  }

  // ==========================================================================
  // Utility Functions
  // ==========================================================================

  private deepClone(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.deepClone(item));
    }

    const cloned: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = this.deepClone(obj[key]);
      }
    }

    return cloned;
  }

  private deepMerge(target: any, source: any): any {
    if (!this.isObject(target) || !this.isObject(source)) {
      return source;
    }

    const result = { ...target };

    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (this.isObject(source[key])) {
          result[key] = this.deepMerge(result[key], source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }

    return result;
  }

  private isObject(value: any): boolean {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }
}

// ============================================================================
// Preset Transformers
// ============================================================================

export class FlattenTransformer extends JsonTransformer {
  constructor(separator: string = '.') {
    const rules: TransformRule[] = [];
    super({ rules });
  }

  public transform(data: any): any {
    return this.flatten(data);
  }

  private flatten(obj: any, prefix: string = ''): any {
    const result: any = {};

    for (const key in obj) {
      if (!obj.hasOwnProperty(key)) continue;

      const newKey = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];

      if (this.isObject(value) && !Array.isArray(value)) {
        Object.assign(result, this.flatten(value, newKey));
      } else {
        result[newKey] = value;
      }
    }

    return result;
  }

  private isObject(value: any): boolean {
    return value !== null && typeof value === 'object';
  }
}

export class UnflattenTransformer extends JsonTransformer {
  constructor(separator: string = '.') {
    const rules: TransformRule[] = [];
    super({ rules });
  }

  public transform(data: any): any {
    return this.unflatten(data);
  }

  private unflatten(obj: any): any {
    const result: any = {};

    for (const key in obj) {
      if (!obj.hasOwnProperty(key)) continue;

      const parts = key.split('.');
      let current = result;

      for (let i = 0; i < parts.length - 1; i++) {
        if (!(parts[i] in current)) {
          current[parts[i]] = {};
        }
        current = current[parts[i]];
      }

      current[parts[parts.length - 1]] = obj[key];
    }

    return result;
  }
}

// ============================================================================
// Export utilities
// ============================================================================

export function createJsonTransformer(config: TransformConfig): JsonTransformer {
  return new JsonTransformer(config);
}

export function createFlattenTransformer(separator?: string): FlattenTransformer {
  return new FlattenTransformer(separator);
}

export function createUnflattenTransformer(separator?: string): UnflattenTransformer {
  return new UnflattenTransformer(separator);
}
