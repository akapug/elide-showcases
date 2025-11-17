/**
 * Boolean Schema Implementation
 * Boolean validation with type coercion
 */

import { Schema } from './mixed';

export class BooleanSchema extends Schema<boolean> {
  constructor() {
    super('boolean');
  }

  protected _cast(value: any, options: any): any {
    value = super._cast(value, options);

    if (value === null && this._nullable) return null;
    if (value === undefined && this._optional) return undefined;

    if (typeof value === 'boolean') return value;

    // Common boolean-like values
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      if (lower === 'true' || lower === '1' || lower === 'yes') return true;
      if (lower === 'false' || lower === '0' || lower === 'no') return false;
    }

    if (typeof value === 'number') {
      if (value === 1) return true;
      if (value === 0) return false;
    }

    return value;
  }

  isTrue(message?: string): this {
    return this.test({
      name: 'isTrue',
      message: message || '${path} must be true',
      test: (value) => value === true,
    });
  }

  isFalse(message?: string): this {
    return this.test({
      name: 'isFalse',
      message: message || '${path} must be false',
      test: (value) => value === false,
    });
  }
}

export function boolean(): BooleanSchema {
  return new BooleanSchema();
}
