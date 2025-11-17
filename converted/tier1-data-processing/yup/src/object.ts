/**
 * Object Schema Implementation
 * Object validation with shape checking and field validation
 */

import { Schema } from './mixed';
import { Message, ValidationError, ValidateOptions } from './errors';

export type ObjectShape = Record<string, Schema<any>>;

export class ObjectSchema<T extends Record<string, any> = any> extends Schema<T> {
  private _shape: ObjectShape = {};

  constructor(shape?: ObjectShape) {
    super('object');
    if (shape) {
      this._shape = shape;
    }
  }

  protected _cast(value: any, options: any): any {
    value = super._cast(value, options);

    if (value === null && this._nullable) return null;
    if (value === undefined && this._optional) return undefined;

    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return value;
    }

    const output: any = {};

    // Cast each field according to shape
    for (const [key, schema] of Object.entries(this._shape)) {
      output[key] = schema.cast(value[key], {
        ...options,
        path: options.path ? `${options.path}.${key}` : key,
        parent: value,
      });
    }

    // Include fields not in shape if stripUnknown is false
    if (!options.stripUnknown) {
      for (const key of Object.keys(value)) {
        if (!(key in this._shape)) {
          output[key] = value[key];
        }
      }
    }

    return output;
  }

  validate(value: any, options?: ValidateOptions): Promise<T> {
    return this.validateSync(value, { ...options, async: true });
  }

  validateSync(value: any, options: ValidateOptions & { async?: boolean } = {}): any {
    // First validate the object itself
    const validated = super.validateSync(value, options);

    if (validated == null) {
      return options.async ? Promise.resolve(validated) : validated;
    }

    // Then validate each field
    if (typeof validated === 'object' && validated !== null && !Array.isArray(validated)) {
      const errors: ValidationError[] = [];
      const output: any = {};

      for (const [key, schema] of Object.entries(this._shape)) {
        try {
          output[key] = schema.validateSync(validated[key], {
            ...options,
            path: options.path ? `${options.path}.${key}` : key,
            parent: validated,
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

      // Include unknown fields if stripUnknown is false
      if (!options.stripUnknown) {
        for (const key of Object.keys(validated)) {
          if (!(key in this._shape)) {
            output[key] = validated[key];
          }
        }
      }

      if (errors.length > 0) {
        const error = new ValidationError(
          errors.map((e) => e.message).flat(),
          value,
          options.path,
          'object'
        );
        error.inner = errors;

        if (options.async) {
          return Promise.reject(error);
        }
        throw error;
      }

      return options.async ? Promise.resolve(output) : output;
    }

    return options.async ? Promise.resolve(validated) : validated;
  }

  // Shape definition
  shape(shape: ObjectShape): this {
    const clone = this.clone();
    clone._shape = { ...this._shape, ...shape };
    return clone;
  }

  // Field manipulation
  pick(keys: string[]): ObjectSchema {
    const newShape: ObjectShape = {};
    for (const key of keys) {
      if (key in this._shape) {
        newShape[key] = this._shape[key];
      }
    }
    return new ObjectSchema(newShape);
  }

  omit(keys: string[]): ObjectSchema {
    const newShape: ObjectShape = {};
    for (const [key, schema] of Object.entries(this._shape)) {
      if (!keys.includes(key)) {
        newShape[key] = schema;
      }
    }
    return new ObjectSchema(newShape);
  }

  // Validation options
  noUnknown(message?: Message): this {
    return this.test({
      name: 'noUnknown',
      message: message || '${path} has unknown keys: ${unknown}',
      test: (value, context) => {
        if (!value || typeof value !== 'object') return true;

        const knownKeys = Object.keys(this._shape);
        const valueKeys = Object.keys(value);
        const unknown = valueKeys.filter((key) => !knownKeys.includes(key));

        if (unknown.length > 0) {
          return context.createError({
            message: `${context.path} has unknown keys: ${unknown.join(', ')}`,
          });
        }

        return true;
      },
    });
  }

  // Get specific field schema
  getField(key: string): Schema<any> | undefined {
    return this._shape[key];
  }

  protected clone(): this {
    const clone = super.clone();
    clone._shape = { ...this._shape };
    return clone;
  }
}

export function object<T extends Record<string, any> = any>(shape?: ObjectShape): ObjectSchema<T> {
  return new ObjectSchema<T>(shape);
}
