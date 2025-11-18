/**
 * String Schema Implementation
 * Complete string validation with all Yup methods
 */

import { Schema } from './mixed';
import { Message } from './errors';

export class StringSchema extends Schema<string> {
  constructor() {
    super('string');
  }

  protected _cast(value: any, options: any): any {
    value = super._cast(value, options);

    if (value === null && this._nullable) return null;
    if (value === undefined && this._optional) return undefined;

    if (typeof value !== 'string') {
      if (value === null || value === undefined) {
        return value;
      }
      return String(value);
    }

    return value;
  }

  // Length validation
  min(min: number, message?: Message): this {
    return this.test({
      name: 'min',
      message: message || '${path} must be at least ${min} characters',
      params: { min },
      test: (value) => !value || value.length >= min,
    });
  }

  max(max: number, message?: Message): this {
    return this.test({
      name: 'max',
      message: message || '${path} must be at most ${max} characters',
      params: { max },
      test: (value) => !value || value.length <= max,
    });
  }

  length(length: number, message?: Message): this {
    return this.test({
      name: 'length',
      message: message || '${path} must be exactly ${length} characters',
      params: { length },
      test: (value) => !value || value.length === length,
    });
  }

  // Pattern matching
  matches(regex: RegExp, message?: Message | { message?: Message; excludeEmptyString?: boolean }): this {
    const opts = typeof message === 'object' ? message : { message };
    const excludeEmptyString = opts.excludeEmptyString || false;

    return this.test({
      name: 'matches',
      message: opts.message || '${path} must match pattern ${regex}',
      params: { regex },
      test: (value) => {
        if (!value) return excludeEmptyString ? true : !value;
        return regex.test(value);
      },
    });
  }

  // Format validation
  email(message?: Message): this {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return this.matches(emailRegex, {
      message: message || '${path} must be a valid email',
      excludeEmptyString: true,
    });
  }

  url(message?: Message): this {
    const urlRegex = /^https?:\/\/.+/;
    return this.matches(urlRegex, {
      message: message || '${path} must be a valid URL',
      excludeEmptyString: true,
    });
  }

  uuid(message?: Message): this {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return this.matches(uuidRegex, {
      message: message || '${path} must be a valid UUID',
      excludeEmptyString: true,
    });
  }

  // String transformations
  lowercase(message?: Message): this {
    return this.transform((value) => (typeof value === 'string' ? value.toLowerCase() : value));
  }

  uppercase(message?: Message): this {
    return this.transform((value) => (typeof value === 'string' ? value.toUpperCase() : value));
  }

  trim(message?: Message): this {
    return this.transform((value) => (typeof value === 'string' ? value.trim() : value));
  }

  // Content validation
  ensure(): this {
    return this.default('').transform((value) => (value === null ? '' : value));
  }

  defined(message?: Message): this {
    return this.test({
      name: 'defined',
      message: message || '${path} must be defined',
      test: (value) => value !== undefined,
    });
  }
}

export function string(): StringSchema {
  return new StringSchema();
}
