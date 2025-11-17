/**
 * Validator
 *
 * Simple validation library with chainable rules
 */

export type ValidationRule<T = any> = {
  validate: (value: T) => boolean;
  message: string;
};

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class Validator<T = any> {
  private rules: ValidationRule<T>[] = [];

  /**
   * Add custom validation rule
   */
  addRule(rule: ValidationRule<T>): this {
    this.rules.push(rule);
    return this;
  }

  /**
   * Require value to be present
   */
  required(message = 'Value is required'): this {
    return this.addRule({
      validate: (value) => value !== null && value !== undefined && value !== '',
      message,
    });
  }

  /**
   * Require minimum length
   */
  minLength(min: number, message?: string): this {
    return this.addRule({
      validate: (value) => {
        if (typeof value === 'string' || Array.isArray(value)) {
          return value.length >= min;
        }
        return true;
      },
      message: message || `Minimum length is ${min}`,
    });
  }

  /**
   * Require maximum length
   */
  maxLength(max: number, message?: string): this {
    return this.addRule({
      validate: (value) => {
        if (typeof value === 'string' || Array.isArray(value)) {
          return value.length <= max;
        }
        return true;
      },
      message: message || `Maximum length is ${max}`,
    });
  }

  /**
   * Require value to match pattern
   */
  pattern(regex: RegExp, message = 'Invalid format'): this {
    return this.addRule({
      validate: (value) => {
        if (typeof value === 'string') {
          return regex.test(value);
        }
        return true;
      },
      message,
    });
  }

  /**
   * Require email format
   */
  email(message = 'Invalid email address'): this {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return this.pattern(emailRegex, message);
  }

  /**
   * Require URL format
   */
  url(message = 'Invalid URL'): this {
    const urlRegex = /^https?:\/\/.+/;
    return this.pattern(urlRegex, message);
  }

  /**
   * Require minimum value
   */
  min(min: number, message?: string): this {
    return this.addRule({
      validate: (value) => {
        if (typeof value === 'number') {
          return value >= min;
        }
        return true;
      },
      message: message || `Minimum value is ${min}`,
    });
  }

  /**
   * Require maximum value
   */
  max(max: number, message?: string): this {
    return this.addRule({
      validate: (value) => {
        if (typeof value === 'number') {
          return value <= max;
        }
        return true;
      },
      message: message || `Maximum value is ${max}`,
    });
  }

  /**
   * Require value to be in array
   */
  oneOf(values: T[], message?: string): this {
    return this.addRule({
      validate: (value) => values.includes(value),
      message: message || `Value must be one of: ${values.join(', ')}`,
    });
  }

  /**
   * Validate value
   */
  validate(value: T): ValidationResult {
    const errors: string[] = [];

    for (const rule of this.rules) {
      if (!rule.validate(value)) {
        errors.push(rule.message);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate and throw on error
   */
  validateOrThrow(value: T): void {
    const result = this.validate(value);

    if (!result.valid) {
      throw new ValidationError(result.errors);
    }
  }
}

/**
 * Validation error
 */
export class ValidationError extends Error {
  constructor(public errors: string[]) {
    super(errors.join(', '));
    this.name = 'ValidationError';
  }
}

/**
 * Create validator
 */
export function validator<T = any>(): Validator<T> {
  return new Validator<T>();
}
