/**
 * Array Schema Implementation
 * Array validation with element type checking
 */

import { Schema } from './mixed';
import { Message, ValidationError, ValidateOptions } from './errors';

export class ArraySchema<T = any> extends Schema<T[]> {
  private _innerType?: Schema<T>;

  constructor() {
    super('array');
  }

  protected _cast(value: any, options: any): any {
    value = super._cast(value, options);

    if (value === null && this._nullable) return null;
    if (value === undefined && this._optional) return undefined;

    if (!Array.isArray(value)) {
      return value;
    }

    if (this._innerType) {
      return value.map((item, index) =>
        this._innerType!.cast(item, { ...options, path: `${options.path || ''}[${index}]` })
      );
    }

    return value;
  }

  validate(value: any, options?: ValidateOptions): Promise<T[]> {
    return this.validateSync(value, { ...options, async: true });
  }

  validateSync(value: any, options: ValidateOptions & { async?: boolean } = {}): any {
    // First validate the array itself
    const validated = super.validateSync(value, options);

    if (validated == null) {
      return options.async ? Promise.resolve(validated) : validated;
    }

    // Then validate each element
    if (this._innerType && Array.isArray(validated)) {
      const errors: ValidationError[] = [];

      for (let i = 0; i < validated.length; i++) {
        try {
          validated[i] = this._innerType.validateSync(validated[i], {
            ...options,
            path: `${options.path || ''}[${i}]`,
            parent: value,
          });
        } catch (err) {
          if (ValidationError.isError(err)) {
            if (options.abortEarly) {
              throw err;
            }
            errors.push(err);
          } else {
            throw err;
          }
        }
      }

      if (errors.length > 0) {
        const error = new ValidationError(
          errors.map((e) => e.message).flat(),
          value,
          options.path,
          'array'
        );
        error.inner = errors;

        if (options.async) {
          return Promise.reject(error);
        }
        throw error;
      }
    }

    return options.async ? Promise.resolve(validated) : validated;
  }

  // Element type validation
  of<U>(type: Schema<U>): ArraySchema<U> {
    const clone = this.clone() as any;
    clone._innerType = type;
    return clone;
  }

  // Length validation
  min(min: number, message?: Message): this {
    return this.test({
      name: 'min',
      message: message || '${path} must have at least ${min} items',
      params: { min },
      test: (value) => !value || value.length >= min,
    });
  }

  max(max: number, message?: Message): this {
    return this.test({
      name: 'max',
      message: message || '${path} must have at most ${max} items',
      params: { max },
      test: (value) => !value || value.length <= max,
    });
  }

  length(length: number, message?: Message): this {
    return this.test({
      name: 'length',
      message: message || '${path} must have exactly ${length} items',
      params: { length },
      test: (value) => !value || value.length === length,
    });
  }

  // Content validation
  ensure(): this {
    return this.default([]).transform((value) => (value === null ? [] : value));
  }

  compact(rejector?: (value: any) => boolean): this {
    const reject = rejector || ((v: any) => !v);
    return this.transform((value) => (Array.isArray(value) ? value.filter((v) => !reject(v)) : value));
  }
}

export function array<T = any>(type?: Schema<T>): ArraySchema<T> {
  const schema = new ArraySchema<T>();
  return type ? schema.of(type) : schema;
}
