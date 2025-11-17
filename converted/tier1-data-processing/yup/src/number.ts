/**
 * Number Schema Implementation
 * Complete number validation with all Yup methods
 */

import { Schema } from './mixed';
import { Message } from './errors';

export class NumberSchema extends Schema<number> {
  constructor() {
    super('number');
  }

  protected _cast(value: any, options: any): any {
    value = super._cast(value, options);

    if (value === null && this._nullable) return null;
    if (value === undefined && this._optional) return undefined;

    if (typeof value === 'number') return value;

    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? value : parsed;
    }

    return value;
  }

  // Range validation
  min(min: number, message?: Message): this {
    return this.test({
      name: 'min',
      message: message || '${path} must be greater than or equal to ${min}',
      params: { min },
      test: (value) => value == null || value >= min,
    });
  }

  max(max: number, message?: Message): this {
    return this.test({
      name: 'max',
      message: message || '${path} must be less than or equal to ${max}',
      params: { max },
      test: (value) => value == null || value <= max,
    });
  }

  lessThan(max: number, message?: Message): this {
    return this.test({
      name: 'lessThan',
      message: message || '${path} must be less than ${max}',
      params: { max },
      test: (value) => value == null || value < max,
    });
  }

  moreThan(min: number, message?: Message): this {
    return this.test({
      name: 'moreThan',
      message: message || '${path} must be greater than ${min}',
      params: { min },
      test: (value) => value == null || value > min,
    });
  }

  // Type validation
  positive(message?: Message): this {
    return this.moreThan(0, message || '${path} must be a positive number');
  }

  negative(message?: Message): this {
    return this.lessThan(0, message || '${path} must be a negative number');
  }

  integer(message?: Message): this {
    return this.test({
      name: 'integer',
      message: message || '${path} must be an integer',
      test: (value) => value == null || Number.isInteger(value),
    });
  }

  // Rounding
  round(method: 'floor' | 'ceil' | 'round' | 'trunc' = 'round'): this {
    return this.transform((value) => {
      if (typeof value !== 'number') return value;
      return Math[method](value);
    });
  }

  truncate(): this {
    return this.round('trunc');
  }
}

export function number(): NumberSchema {
  return new NumberSchema();
}
