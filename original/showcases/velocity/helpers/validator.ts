/**
 * Validator Helpers
 * Simple validation utilities
 */

export interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  enum?: any[];
  custom?: (value: any) => boolean | string;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validate data against a schema
 */
export function validate(data: any, schema: ValidationSchema): ValidationResult {
  const errors: ValidationError[] = [];

  for (const [field, rule] of Object.entries(schema)) {
    const value = data[field];

    // Required check
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push({
        field,
        message: `${field} is required`,
      });
      continue;
    }

    // Skip validation if not required and value is empty
    if (!rule.required && (value === undefined || value === null || value === '')) {
      continue;
    }

    // Type check
    if (rule.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== rule.type) {
        errors.push({
          field,
          message: `${field} must be of type ${rule.type}`,
        });
        continue;
      }
    }

    // Min/Max for numbers
    if (rule.type === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        errors.push({
          field,
          message: `${field} must be at least ${rule.min}`,
        });
      }
      if (rule.max !== undefined && value > rule.max) {
        errors.push({
          field,
          message: `${field} must be at most ${rule.max}`,
        });
      }
    }

    // MinLength/MaxLength for strings and arrays
    if (rule.type === 'string' || rule.type === 'array') {
      const length = value.length;
      if (rule.minLength !== undefined && length < rule.minLength) {
        errors.push({
          field,
          message: `${field} must have at least ${rule.minLength} characters`,
        });
      }
      if (rule.maxLength !== undefined && length > rule.maxLength) {
        errors.push({
          field,
          message: `${field} must have at most ${rule.maxLength} characters`,
        });
      }
    }

    // Pattern for strings
    if (rule.pattern && rule.type === 'string') {
      if (!rule.pattern.test(value)) {
        errors.push({
          field,
          message: `${field} has invalid format`,
        });
      }
    }

    // Enum check
    if (rule.enum && !rule.enum.includes(value)) {
      errors.push({
        field,
        message: `${field} must be one of: ${rule.enum.join(', ')}`,
      });
    }

    // Custom validation
    if (rule.custom) {
      const result = rule.custom(value);
      if (result !== true) {
        errors.push({
          field,
          message: typeof result === 'string' ? result : `${field} is invalid`,
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Common validation patterns
 */
export const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url: /^https?:\/\/.+/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  ipv4: /^(\d{1,3}\.){3}\d{1,3}$/,
  ipv6: /^([0-9a-f]{0,4}:){7}[0-9a-f]{0,4}$/i,
  phone: /^\+?[\d\s-()]+$/,
  creditCard: /^\d{13,19}$/,
  date: /^\d{4}-\d{2}-\d{2}$/,
  time: /^\d{2}:\d{2}(:\d{2})?$/,
  alphanumeric: /^[a-z0-9]+$/i,
  alpha: /^[a-z]+$/i,
  numeric: /^\d+$/,
};

/**
 * Sanitize string input
 */
export function sanitize(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

/**
 * Escape HTML
 */
export function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Validate email
 */
export function isEmail(email: string): boolean {
  return patterns.email.test(email);
}

/**
 * Validate URL
 */
export function isUrl(url: string): boolean {
  return patterns.url.test(url);
}

/**
 * Validate UUID
 */
export function isUuid(uuid: string): boolean {
  return patterns.uuid.test(uuid);
}

/**
 * Validate IP address
 */
export function isIp(ip: string): boolean {
  return patterns.ipv4.test(ip) || patterns.ipv6.test(ip);
}

/**
 * Create validation middleware
 */
export function validateBody(schema: ValidationSchema) {
  return async (ctx: any, next: () => Promise<any>) => {
    const body = await ctx.json();
    const result = validate(body, schema);

    if (!result.valid) {
      return ctx.status(400).jsonResponse({
        error: 'Validation failed',
        errors: result.errors,
      });
    }

    // Attach validated body to context
    ctx.validatedBody = body;

    return await next();
  };
}

/**
 * Create query validation middleware
 */
export function validateQuery(schema: ValidationSchema) {
  return async (ctx: any, next: () => Promise<any>) => {
    const query: any = {};
    for (const [key, value] of ctx.query.entries()) {
      query[key] = value;
    }

    const result = validate(query, schema);

    if (!result.valid) {
      return ctx.status(400).jsonResponse({
        error: 'Validation failed',
        errors: result.errors,
      });
    }

    // Attach validated query to context
    ctx.validatedQuery = query;

    return await next();
  };
}
