/**
 * Request/Response Transformation Module
 *
 * Provides advanced transformation capabilities:
 * - Request body transformation
 * - Response body transformation
 * - Header manipulation
 * - Data validation and sanitization
 * - Format conversion (JSON, XML, CSV)
 * - Field mapping and filtering
 * - Data enrichment
 */

// ==================== Types & Interfaces ====================

export interface TransformConfig {
  request?: RequestTransformConfig;
  response?: ResponseTransformConfig;
}

export interface RequestTransformConfig {
  sanitize?: boolean;
  validate?: boolean;
  addTimestamp?: boolean;
  addMetadata?: Record<string, any>;
  fieldMapping?: Record<string, string>;
  removeFields?: string[];
  renameFields?: Record<string, string>;
  defaultValues?: Record<string, any>;
  customTransform?: (data: any) => any;
}

export interface ResponseTransformConfig {
  wrap?: boolean;
  wrapperKey?: string;
  addMetadata?: Record<string, any>;
  fieldMapping?: Record<string, string>;
  removeFields?: string[];
  renameFields?: Record<string, string>;
  formatAs?: 'json' | 'xml' | 'csv';
  customTransform?: (data: any) => any;
}

export interface ValidationRule {
  field: string;
  type: 'string' | 'number' | 'boolean' | 'email' | 'url' | 'uuid' | 'date';
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: any[];
  custom?: (value: any) => boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: Array<{ field: string; message: string }>;
}

// ==================== Request Transformer ====================

export class RequestTransformer {
  private validationRules: Map<string, ValidationRule[]> = new Map();

  /**
   * Transform request body
   */
  transform(data: any, config: RequestTransformConfig): any {
    let result = { ...data };

    // Sanitize input
    if (config.sanitize) {
      result = this.sanitize(result);
    }

    // Apply field mapping
    if (config.fieldMapping) {
      result = this.applyFieldMapping(result, config.fieldMapping);
    }

    // Rename fields
    if (config.renameFields) {
      result = this.renameFields(result, config.renameFields);
    }

    // Remove fields
    if (config.removeFields) {
      result = this.removeFields(result, config.removeFields);
    }

    // Apply default values
    if (config.defaultValues) {
      result = this.applyDefaults(result, config.defaultValues);
    }

    // Add timestamp
    if (config.addTimestamp) {
      result.timestamp = new Date().toISOString();
    }

    // Add metadata
    if (config.addMetadata) {
      result.metadata = {
        ...result.metadata,
        ...config.addMetadata
      };
    }

    // Custom transformation
    if (config.customTransform) {
      result = config.customTransform(result);
    }

    return result;
  }

  /**
   * Sanitize input to prevent injection attacks
   */
  sanitize(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitize(item));
    }

    const sanitized: any = {};

    for (const [key, value] of Object.entries(data)) {
      // Skip dangerous properties
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }

      // Recursively sanitize nested objects
      if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitize(value);
      } else if (typeof value === 'string') {
        // Basic XSS prevention
        sanitized[key] = value
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
          .replace(/\//g, '&#x2F;');
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Validate request data
   */
  validate(data: any, endpoint: string): ValidationResult {
    const rules = this.validationRules.get(endpoint);
    if (!rules) {
      return { valid: true, errors: [] };
    }

    const errors: Array<{ field: string; message: string }> = [];

    for (const rule of rules) {
      const value = this.getNestedValue(data, rule.field);

      // Required check
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push({ field: rule.field, message: `${rule.field} is required` });
        continue;
      }

      // Skip validation if field is optional and not provided
      if (!rule.required && (value === undefined || value === null)) {
        continue;
      }

      // Type validation
      if (!this.validateType(value, rule.type)) {
        errors.push({ field: rule.field, message: `${rule.field} must be of type ${rule.type}` });
        continue;
      }

      // Min/Max validation
      if (rule.min !== undefined && this.getLength(value) < rule.min) {
        errors.push({ field: rule.field, message: `${rule.field} must be at least ${rule.min}` });
      }

      if (rule.max !== undefined && this.getLength(value) > rule.max) {
        errors.push({ field: rule.field, message: `${rule.field} must be at most ${rule.max}` });
      }

      // Pattern validation
      if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
        errors.push({ field: rule.field, message: `${rule.field} does not match required pattern` });
      }

      // Enum validation
      if (rule.enum && !rule.enum.includes(value)) {
        errors.push({
          field: rule.field,
          message: `${rule.field} must be one of: ${rule.enum.join(', ')}`
        });
      }

      // Custom validation
      if (rule.custom && !rule.custom(value)) {
        errors.push({ field: rule.field, message: `${rule.field} failed custom validation` });
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Set validation rules for an endpoint
   */
  setValidationRules(endpoint: string, rules: ValidationRule[]): void {
    this.validationRules.set(endpoint, rules);
  }

  private applyFieldMapping(data: any, mapping: Record<string, string>): any {
    const result: any = {};

    for (const [targetField, sourceField] of Object.entries(mapping)) {
      const value = this.getNestedValue(data, sourceField);
      if (value !== undefined) {
        this.setNestedValue(result, targetField, value);
      }
    }

    // Include unmapped fields
    for (const [key, value] of Object.entries(data)) {
      if (!Object.values(mapping).includes(key)) {
        result[key] = value;
      }
    }

    return result;
  }

  private renameFields(data: any, mapping: Record<string, string>): any {
    const result: any = {};

    for (const [oldName, newName] of Object.entries(mapping)) {
      if (oldName in data) {
        result[newName] = data[oldName];
      }
    }

    // Include fields not being renamed
    for (const [key, value] of Object.entries(data)) {
      if (!(key in mapping)) {
        result[key] = value;
      }
    }

    return result;
  }

  private removeFields(data: any, fields: string[]): any {
    const result = { ...data };

    for (const field of fields) {
      const parts = field.split('.');
      if (parts.length === 1) {
        delete result[field];
      } else {
        this.deleteNestedValue(result, field);
      }
    }

    return result;
  }

  private applyDefaults(data: any, defaults: Record<string, any>): any {
    const result = { ...data };

    for (const [key, value] of Object.entries(defaults)) {
      if (!(key in result) || result[key] === undefined) {
        result[key] = value;
      }
    }

    return result;
  }

  private validateType(value: any, type: string): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';

      case 'number':
        return typeof value === 'number' && !isNaN(value);

      case 'boolean':
        return typeof value === 'boolean';

      case 'email':
        return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

      case 'url':
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }

      case 'uuid':
        return typeof value === 'string' &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

      case 'date':
        return !isNaN(Date.parse(value));

      default:
        return true;
    }
  }

  private getLength(value: any): number {
    if (typeof value === 'string' || Array.isArray(value)) {
      return value.length;
    }
    if (typeof value === 'number') {
      return value;
    }
    return 0;
  }

  private getNestedValue(obj: any, path: string): any {
    const parts = path.split('.');
    let current = obj;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[part];
    }

    return current;
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const parts = path.split('.');
    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part];
    }

    current[parts[parts.length - 1]] = value;
  }

  private deleteNestedValue(obj: any, path: string): void {
    const parts = path.split('.');
    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current)) {
        return;
      }
      current = current[part];
    }

    delete current[parts[parts.length - 1]];
  }
}

// ==================== Response Transformer ====================

export class ResponseTransformer {
  /**
   * Transform response body
   */
  transform(data: any, config: ResponseTransformConfig): any {
    let result = data;

    // Apply field mapping
    if (config.fieldMapping) {
      result = this.applyFieldMapping(result, config.fieldMapping);
    }

    // Rename fields
    if (config.renameFields) {
      result = this.renameFields(result, config.renameFields);
    }

    // Remove fields
    if (config.removeFields) {
      result = this.removeFields(result, config.removeFields);
    }

    // Add metadata
    if (config.addMetadata) {
      if (config.wrap) {
        result = {
          metadata: {
            timestamp: new Date().toISOString(),
            ...config.addMetadata
          },
          data: result
        };
      } else {
        result = {
          ...result,
          metadata: {
            timestamp: new Date().toISOString(),
            ...config.addMetadata
          }
        };
      }
    }

    // Wrap response
    if (config.wrap && !config.addMetadata) {
      const key = config.wrapperKey || 'data';
      result = {
        [key]: result,
        metadata: {
          timestamp: new Date().toISOString()
        }
      };
    }

    // Custom transformation
    if (config.customTransform) {
      result = config.customTransform(result);
    }

    return result;
  }

  /**
   * Format response as different content types
   */
  format(data: any, format: 'json' | 'xml' | 'csv'): string {
    switch (format) {
      case 'xml':
        return this.toXML(data);

      case 'csv':
        return this.toCSV(data);

      case 'json':
      default:
        return JSON.stringify(data, null, 2);
    }
  }

  /**
   * Convert to XML
   */
  private toXML(data: any, rootElement: string = 'response'): string {
    const buildXML = (obj: any, indent: string = ''): string => {
      if (typeof obj !== 'object' || obj === null) {
        return this.escapeXML(String(obj));
      }

      if (Array.isArray(obj)) {
        return obj.map(item => `${indent}<item>\n${buildXML(item, indent + '  ')}\n${indent}</item>`).join('\n');
      }

      let xml = '';
      for (const [key, value] of Object.entries(obj)) {
        const sanitizedKey = key.replace(/[^a-zA-Z0-9_]/g, '_');

        if (typeof value === 'object' && value !== null) {
          xml += `${indent}<${sanitizedKey}>\n${buildXML(value, indent + '  ')}\n${indent}</${sanitizedKey}>\n`;
        } else {
          xml += `${indent}<${sanitizedKey}>${this.escapeXML(String(value))}</${sanitizedKey}>\n`;
        }
      }

      return xml;
    };

    return `<?xml version="1.0" encoding="UTF-8"?>\n<${rootElement}>\n${buildXML(data, '  ')}</${rootElement}>`;
  }

  /**
   * Convert to CSV
   */
  private toCSV(data: any): string {
    if (!Array.isArray(data)) {
      data = [data];
    }

    if (data.length === 0) {
      return '';
    }

    // Get all unique keys
    const keys = new Set<string>();
    data.forEach((item: any) => {
      Object.keys(item).forEach(key => keys.add(key));
    });

    const headers = Array.from(keys);
    const rows = data.map((item: any) => {
      return headers.map(header => {
        const value = item[header];
        if (value === null || value === undefined) {
          return '';
        }
        const str = String(value);
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  private escapeXML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private applyFieldMapping(data: any, mapping: Record<string, string>): any {
    if (Array.isArray(data)) {
      return data.map(item => this.applyFieldMapping(item, mapping));
    }

    const result: any = {};

    for (const [targetField, sourceField] of Object.entries(mapping)) {
      if (sourceField in data) {
        result[targetField] = data[sourceField];
      }
    }

    // Include unmapped fields
    for (const [key, value] of Object.entries(data)) {
      if (!Object.values(mapping).includes(key)) {
        result[key] = value;
      }
    }

    return result;
  }

  private renameFields(data: any, mapping: Record<string, string>): any {
    if (Array.isArray(data)) {
      return data.map(item => this.renameFields(item, mapping));
    }

    const result: any = {};

    for (const [oldName, newName] of Object.entries(mapping)) {
      if (oldName in data) {
        result[newName] = data[oldName];
      }
    }

    // Include fields not being renamed
    for (const [key, value] of Object.entries(data)) {
      if (!(key in mapping)) {
        result[key] = value;
      }
    }

    return result;
  }

  private removeFields(data: any, fields: string[]): any {
    if (Array.isArray(data)) {
      return data.map(item => this.removeFields(item, fields));
    }

    const result = { ...data };

    for (const field of fields) {
      delete result[field];
    }

    return result;
  }
}

// ==================== Content Negotiation ====================

export class ContentNegotiator {
  private supportedFormats = ['application/json', 'application/xml', 'text/csv'];

  /**
   * Determine response format based on Accept header
   */
  negotiate(acceptHeader: string | null): 'json' | 'xml' | 'csv' {
    if (!acceptHeader) {
      return 'json';
    }

    const types = acceptHeader.split(',').map(t => t.trim().split(';')[0]);

    for (const type of types) {
      if (type === 'application/xml' || type === 'text/xml') {
        return 'xml';
      }
      if (type === 'text/csv' || type === 'application/csv') {
        return 'csv';
      }
      if (type === 'application/json' || type === '*/*') {
        return 'json';
      }
    }

    return 'json';
  }

  /**
   * Get content type for format
   */
  getContentType(format: 'json' | 'xml' | 'csv'): string {
    switch (format) {
      case 'xml':
        return 'application/xml';
      case 'csv':
        return 'text/csv';
      case 'json':
      default:
        return 'application/json';
    }
  }
}

// ==================== Transformation Pipeline ====================

export class TransformationPipeline {
  private requestTransformer: RequestTransformer;
  private responseTransformer: ResponseTransformer;
  private contentNegotiator: ContentNegotiator;

  constructor() {
    this.requestTransformer = new RequestTransformer();
    this.responseTransformer = new ResponseTransformer();
    this.contentNegotiator = new ContentNegotiator();
  }

  /**
   * Process incoming request
   */
  async processRequest(
    body: any,
    config: RequestTransformConfig,
    endpoint?: string
  ): Promise<{ data: any; valid: boolean; errors?: any[] }> {
    // Validate if configured
    if (config.validate && endpoint) {
      const validation = this.requestTransformer.validate(body, endpoint);
      if (!validation.valid) {
        return {
          data: body,
          valid: false,
          errors: validation.errors
        };
      }
    }

    // Transform
    const transformed = this.requestTransformer.transform(body, config);

    return {
      data: transformed,
      valid: true
    };
  }

  /**
   * Process outgoing response
   */
  async processResponse(
    data: any,
    config: ResponseTransformConfig,
    acceptHeader?: string | null
  ): Promise<{ data: string; contentType: string }> {
    // Transform
    let transformed = this.responseTransformer.transform(data, config);

    // Negotiate content type
    const format = config.formatAs || this.contentNegotiator.negotiate(acceptHeader);

    // Format output
    const formatted = this.responseTransformer.format(transformed, format);
    const contentType = this.contentNegotiator.getContentType(format);

    return {
      data: formatted,
      contentType
    };
  }

  getRequestTransformer(): RequestTransformer {
    return this.requestTransformer;
  }

  getResponseTransformer(): ResponseTransformer {
    return this.responseTransformer;
  }

  getContentNegotiator(): ContentNegotiator {
    return this.contentNegotiator;
  }
}
