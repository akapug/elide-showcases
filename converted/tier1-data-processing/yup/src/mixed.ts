/**
 * Base Schema (Mixed) Implementation
 * Foundation for all Yup schema types
 */

import { ValidationError, ValidateOptions, TestContext, Message, SchemaDescription } from './errors';
import { Reference } from './ref';

export type TestFunction<T = any> = (
  value: T,
  context: TestContext
) => boolean | ValidationError | Promise<boolean | ValidationError>;

export interface TestOptions {
  name?: string;
  message?: Message;
  test: TestFunction;
  params?: Record<string, any>;
  exclusive?: boolean;
}

export interface WhenOptions<T = any> {
  is: any | ((value: any) => boolean);
  then?: (schema: Schema<T>) => Schema<T>;
  otherwise?: (schema: Schema<T>) => Schema<T>;
}

export class Schema<T = any> {
  protected _type: string = 'mixed';
  protected _whitelist: Set<any> = new Set();
  protected _blacklist: Set<any> = new Set();
  protected _tests: TestOptions[] = [];
  protected _nullable: boolean = false;
  protected _optional: boolean = false;
  protected _default?: any;
  protected _transform?: (value: any, originalValue: any, schema: Schema<T>) => any;
  protected _label?: string;
  protected _meta?: any;
  protected _conditions: Array<{ key: string | Reference; options: WhenOptions }> = [];

  constructor(type: string = 'mixed') {
    this._type = type;
  }

  // Core validation methods
  validate(value: any, options?: ValidateOptions): Promise<T> {
    return this.validateSync(value, { ...options, async: true });
  }

  validateSync(value: any, options: ValidateOptions & { async?: boolean } = {}): any {
    const opts = { abortEarly: true, ...options };

    try {
      // Apply conditions
      let schema: Schema<T> = this;
      for (const condition of this._conditions) {
        schema = schema.applyCondition(condition, value, opts);
      }

      // Cast value
      let output = schema._cast(value, opts);

      // Check whitelist/blacklist
      if (schema._whitelist.size > 0 && !schema._whitelist.has(output)) {
        throw new ValidationError(
          `Value must be one of: ${Array.from(schema._whitelist).join(', ')}`,
          value,
          opts.path,
          'oneOf'
        );
      }

      if (schema._blacklist.has(output)) {
        throw new ValidationError(
          `Value must not be one of: ${Array.from(schema._blacklist).join(', ')}`,
          value,
          opts.path,
          'notOneOf'
        );
      }

      // Run tests
      const errors: string[] = [];
      for (const test of schema._tests) {
        const result = test.test(output, schema.createTestContext(output, opts));

        if (result instanceof ValidationError) {
          if (opts.abortEarly) throw result;
          errors.push(result.message);
        } else if (result === false) {
          const message = typeof test.message === 'function'
            ? test.message({ ...test.params, value: output, path: opts.path })
            : test.message || 'Validation failed';

          if (opts.abortEarly) {
            throw new ValidationError(message, output, opts.path, test.name);
          }
          errors.push(message);
        }
      }

      if (errors.length > 0) {
        throw new ValidationError(errors, value, opts.path);
      }

      return opts.async ? Promise.resolve(output) : output;
    } catch (err) {
      if (opts.async) {
        return Promise.reject(err);
      }
      throw err;
    }
  }

  validateAt(path: string, value: any, options?: ValidateOptions): Promise<any> {
    const parts = path.split('.');
    let current = value;

    for (let i = 0; i < parts.length - 1; i++) {
      current = current?.[parts[i]];
    }

    const finalKey = parts[parts.length - 1];
    return this.validate(current?.[finalKey], { ...options, path });
  }

  isValid(value: any, options?: ValidateOptions): Promise<boolean> {
    return this.validate(value, options)
      .then(() => true)
      .catch(() => false);
  }

  isValidSync(value: any, options?: ValidateOptions): boolean {
    try {
      this.validateSync(value, options);
      return true;
    } catch {
      return false;
    }
  }

  cast(value: any, options?: ValidateOptions): T {
    return this._cast(value, options || {});
  }

  protected _cast(value: any, options: ValidateOptions): any {
    // Handle undefined/null
    if (value === undefined) {
      if (this._default !== undefined) {
        value = typeof this._default === 'function' ? this._default() : this._default;
      } else if (this._optional) {
        return undefined;
      }
    }

    if (value === null) {
      if (this._nullable) {
        return null;
      }
    }

    // Apply transform
    if (this._transform) {
      value = this._transform(value, value, this);
    }

    return value;
  }

  // Schema modifiers
  required(message?: Message): this {
    return this.test({
      name: 'required',
      message: message || '${path} is a required field',
      test: (value) => value !== undefined && value !== null && value !== '',
    });
  }

  optional(): this {
    const clone = this.clone();
    clone._optional = true;
    return clone;
  }

  nullable(): this {
    const clone = this.clone();
    clone._nullable = true;
    return clone;
  }

  default(value: any): this {
    const clone = this.clone();
    clone._default = value;
    return clone;
  }

  transform(fn: (value: any, originalValue: any, schema: Schema<T>) => any): this {
    const clone = this.clone();
    clone._transform = fn;
    return clone;
  }

  // Validation tests
  test(options: TestOptions | string, message?: Message, test?: TestFunction): this {
    const opts: TestOptions =
      typeof options === 'string'
        ? { name: options, message: message!, test: test! }
        : options;

    const clone = this.clone();
    clone._tests.push(opts);
    return clone;
  }

  oneOf(values: any[], message?: Message): this {
    const clone = this.clone();
    values.forEach((v) => clone._whitelist.add(v));
    return clone;
  }

  notOneOf(values: any[], message?: Message): this {
    const clone = this.clone();
    values.forEach((v) => clone._blacklist.add(v));
    return clone;
  }

  // Conditional validation
  when(key: string | Reference, options: WhenOptions<T>): this {
    const clone = this.clone();
    clone._conditions.push({ key, options });
    return clone;
  }

  protected applyCondition(
    condition: { key: string | Reference; options: WhenOptions },
    value: any,
    opts: ValidateOptions
  ): Schema<T> {
    const refValue =
      condition.key instanceof Reference
        ? condition.key.getValue(opts.parent, opts.context)
        : opts.parent?.[condition.key];

    const matches =
      typeof condition.options.is === 'function'
        ? condition.options.is(refValue)
        : refValue === condition.options.is;

    if (matches && condition.options.then) {
      return condition.options.then(this);
    } else if (!matches && condition.options.otherwise) {
      return condition.options.otherwise(this);
    }

    return this;
  }

  // Metadata
  label(label: string): this {
    const clone = this.clone();
    clone._label = label;
    return clone;
  }

  meta(meta: any): this {
    const clone = this.clone();
    clone._meta = meta;
    return clone;
  }

  describe(): SchemaDescription {
    return {
      type: this._type,
      label: this._label,
      meta: this._meta,
      oneOf: this._whitelist.size > 0 ? Array.from(this._whitelist) : undefined,
      notOneOf: this._blacklist.size > 0 ? Array.from(this._blacklist) : undefined,
      nullable: this._nullable,
      optional: this._optional,
      tests: this._tests.map((t) => ({ name: t.name, params: t.params })),
    };
  }

  // Helper methods
  protected clone(): this {
    const clone = Object.create(Object.getPrototypeOf(this));
    Object.assign(clone, this);
    clone._tests = [...this._tests];
    clone._whitelist = new Set(this._whitelist);
    clone._blacklist = new Set(this._blacklist);
    clone._conditions = [...this._conditions];
    return clone;
  }

  protected createTestContext(value: any, options: ValidateOptions): TestContext {
    return {
      path: options.path || '',
      parent: options.parent,
      schema: this,
      options,
      originalValue: value,
      createError: (params = {}) =>
        new ValidationError(
          params.message || 'Validation failed',
          value,
          params.path || options.path,
          params.type
        ),
    };
  }
}

export function mixed<T = any>(): Schema<T> {
  return new Schema<T>('mixed');
}
