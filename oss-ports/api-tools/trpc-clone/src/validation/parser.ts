/**
 * tRPC Parser - Input/Output Validation
 *
 * Provides validation functionality similar to Zod.
 */

import { TRPCError } from '../server/init'

/**
 * Parser interface
 */
export interface Parser<T> {
  parse(value: unknown): Promise<T> | T
  parseAsync(value: unknown): Promise<T>
  safeParse(value: unknown): ParseResult<T>
}

export type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: ValidationError }

export class ValidationError extends Error {
  public issues: Issue[]

  constructor(issues: Issue[]) {
    super('Validation failed')
    this.name = 'ValidationError'
    this.issues = issues
  }
}

export interface Issue {
  path: (string | number)[]
  message: string
  code: string
}

/**
 * Base schema class
 */
export abstract class Schema<T> implements Parser<T> {
  abstract _parse(value: unknown): ParseResult<T>

  parse(value: unknown): T {
    const result = this._parse(value)

    if (!result.success) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Validation failed',
        cause: result.error
      })
    }

    return result.data
  }

  async parseAsync(value: unknown): Promise<T> {
    return this.parse(value)
  }

  safeParse(value: unknown): ParseResult<T> {
    return this._parse(value)
  }

  /**
   * Mark as optional
   */
  optional(): OptionalSchema<T> {
    return new OptionalSchema(this)
  }

  /**
   * Set default value
   */
  default(defaultValue: T): DefaultSchema<T> {
    return new DefaultSchema(this, defaultValue)
  }

  /**
   * Add custom refinement
   */
  refine(
    check: (value: T) => boolean,
    message: string = 'Invalid value'
  ): RefinedSchema<T> {
    return new RefinedSchema(this, check, message)
  }
}

/**
 * String schema
 */
export class StringSchema extends Schema<string> {
  private minLength?: number
  private maxLength?: number
  private pattern?: RegExp
  private emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  private urlRegex = /^https?:\/\/.+/
  private checks: Array<{ type: string; value?: any }> = []

  _parse(value: unknown): ParseResult<string> {
    if (typeof value !== 'string') {
      return {
        success: false,
        error: new ValidationError([
          { path: [], message: 'Expected string', code: 'invalid_type' }
        ])
      }
    }

    // Min length
    if (this.minLength !== undefined && value.length < this.minLength) {
      return {
        success: false,
        error: new ValidationError([
          {
            path: [],
            message: `String must be at least ${this.minLength} characters`,
            code: 'too_small'
          }
        ])
      }
    }

    // Max length
    if (this.maxLength !== undefined && value.length > this.maxLength) {
      return {
        success: false,
        error: new ValidationError([
          {
            path: [],
            message: `String must be at most ${this.maxLength} characters`,
            code: 'too_big'
          }
        ])
      }
    }

    // Pattern
    if (this.pattern && !this.pattern.test(value)) {
      return {
        success: false,
        error: new ValidationError([
          { path: [], message: 'String does not match pattern', code: 'invalid_string' }
        ])
      }
    }

    // Email
    if (this.checks.some(c => c.type === 'email') && !this.emailRegex.test(value)) {
      return {
        success: false,
        error: new ValidationError([
          { path: [], message: 'Invalid email address', code: 'invalid_string' }
        ])
      }
    }

    // URL
    if (this.checks.some(c => c.type === 'url') && !this.urlRegex.test(value)) {
      return {
        success: false,
        error: new ValidationError([
          { path: [], message: 'Invalid URL', code: 'invalid_string' }
        ])
      }
    }

    return { success: true, data: value }
  }

  min(length: number): this {
    this.minLength = length
    return this
  }

  max(length: number): this {
    this.maxLength = length
    return this
  }

  regex(pattern: RegExp): this {
    this.pattern = pattern
    return this
  }

  email(): this {
    this.checks.push({ type: 'email' })
    return this
  }

  url(): this {
    this.checks.push({ type: 'url' })
    return this
  }
}

/**
 * Number schema
 */
export class NumberSchema extends Schema<number> {
  private minValue?: number
  private maxValue?: number
  private isInteger = false

  _parse(value: unknown): ParseResult<number> {
    const num = typeof value === 'string' ? parseFloat(value) : value

    if (typeof num !== 'number' || isNaN(num)) {
      return {
        success: false,
        error: new ValidationError([
          { path: [], message: 'Expected number', code: 'invalid_type' }
        ])
      }
    }

    if (this.isInteger && !Number.isInteger(num)) {
      return {
        success: false,
        error: new ValidationError([
          { path: [], message: 'Expected integer', code: 'invalid_type' }
        ])
      }
    }

    if (this.minValue !== undefined && num < this.minValue) {
      return {
        success: false,
        error: new ValidationError([
          { path: [], message: `Number must be >= ${this.minValue}`, code: 'too_small' }
        ])
      }
    }

    if (this.maxValue !== undefined && num > this.maxValue) {
      return {
        success: false,
        error: new ValidationError([
          { path: [], message: `Number must be <= ${this.maxValue}`, code: 'too_big' }
        ])
      }
    }

    return { success: true, data: num }
  }

  min(value: number): this {
    this.minValue = value
    return this
  }

  max(value: number): this {
    this.maxValue = value
    return this
  }

  int(): this {
    this.isInteger = true
    return this
  }
}

/**
 * Boolean schema
 */
export class BooleanSchema extends Schema<boolean> {
  _parse(value: unknown): ParseResult<boolean> {
    if (typeof value !== 'boolean') {
      return {
        success: false,
        error: new ValidationError([
          { path: [], message: 'Expected boolean', code: 'invalid_type' }
        ])
      }
    }

    return { success: true, data: value }
  }
}

/**
 * Array schema
 */
export class ArraySchema<T> extends Schema<T[]> {
  private minLength?: number
  private maxLength?: number

  constructor(private itemSchema: Schema<T>) {
    super()
  }

  _parse(value: unknown): ParseResult<T[]> {
    if (!Array.isArray(value)) {
      return {
        success: false,
        error: new ValidationError([
          { path: [], message: 'Expected array', code: 'invalid_type' }
        ])
      }
    }

    if (this.minLength !== undefined && value.length < this.minLength) {
      return {
        success: false,
        error: new ValidationError([
          { path: [], message: `Array must have at least ${this.minLength} items`, code: 'too_small' }
        ])
      }
    }

    if (this.maxLength !== undefined && value.length > this.maxLength) {
      return {
        success: false,
        error: new ValidationError([
          { path: [], message: `Array must have at most ${this.maxLength} items`, code: 'too_big' }
        ])
      }
    }

    const parsed: T[] = []
    const issues: Issue[] = []

    for (let i = 0; i < value.length; i++) {
      const result = this.itemSchema._parse(value[i])

      if (!result.success) {
        for (const issue of result.error.issues) {
          issues.push({
            ...issue,
            path: [i, ...issue.path]
          })
        }
      } else {
        parsed.push(result.data)
      }
    }

    if (issues.length > 0) {
      return { success: false, error: new ValidationError(issues) }
    }

    return { success: true, data: parsed }
  }

  min(length: number): this {
    this.minLength = length
    return this
  }

  max(length: number): this {
    this.maxLength = length
    return this
  }
}

/**
 * Object schema
 */
export class ObjectSchema<T extends Record<string, any>> extends Schema<T> {
  constructor(private shape: { [K in keyof T]: Schema<T[K]> }) {
    super()
  }

  _parse(value: unknown): ParseResult<T> {
    if (typeof value !== 'object' || value === null) {
      return {
        success: false,
        error: new ValidationError([
          { path: [], message: 'Expected object', code: 'invalid_type' }
        ])
      }
    }

    const parsed: any = {}
    const issues: Issue[] = []

    for (const [key, schema] of Object.entries(this.shape)) {
      const result = (schema as Schema<any>)._parse((value as any)[key])

      if (!result.success) {
        for (const issue of result.error.issues) {
          issues.push({
            ...issue,
            path: [key, ...issue.path]
          })
        }
      } else {
        parsed[key] = result.data
      }
    }

    if (issues.length > 0) {
      return { success: false, error: new ValidationError(issues) }
    }

    return { success: true, data: parsed as T }
  }
}

/**
 * Optional schema
 */
export class OptionalSchema<T> extends Schema<T | undefined> {
  constructor(private innerSchema: Schema<T>) {
    super()
  }

  _parse(value: unknown): ParseResult<T | undefined> {
    if (value === undefined) {
      return { success: true, data: undefined }
    }

    return this.innerSchema._parse(value) as ParseResult<T | undefined>
  }
}

/**
 * Default schema
 */
export class DefaultSchema<T> extends Schema<T> {
  constructor(private innerSchema: Schema<T>, private defaultValue: T) {
    super()
  }

  _parse(value: unknown): ParseResult<T> {
    if (value === undefined) {
      return { success: true, data: this.defaultValue }
    }

    return this.innerSchema._parse(value)
  }
}

/**
 * Refined schema
 */
export class RefinedSchema<T> extends Schema<T> {
  constructor(
    private innerSchema: Schema<T>,
    private check: (value: T) => boolean,
    private message: string
  ) {
    super()
  }

  _parse(value: unknown): ParseResult<T> {
    const result = this.innerSchema._parse(value)

    if (!result.success) {
      return result
    }

    if (!this.check(result.data)) {
      return {
        success: false,
        error: new ValidationError([
          { path: [], message: this.message, code: 'custom' }
        ])
      }
    }

    return result
  }
}

/**
 * Schema builder (Zod-like API)
 */
export const z = {
  string: () => new StringSchema(),
  number: () => new NumberSchema(),
  boolean: () => new BooleanSchema(),
  array: <T>(schema: Schema<T>) => new ArraySchema(schema),
  object: <T extends Record<string, any>>(shape: {
    [K in keyof T]: Schema<T[K]>
  }) => new ObjectSchema(shape),
  literal: <T extends string | number | boolean>(value: T) =>
    new RefinedSchema(
      value === null
        ? (null as any)
        : typeof value === 'string'
        ? new StringSchema()
        : typeof value === 'number'
        ? new NumberSchema()
        : new BooleanSchema(),
      (v) => v === value,
      `Expected literal value: ${value}`
    ),
  any: () => ({
    parse: (v: unknown) => v,
    parseAsync: async (v: unknown) => v,
    safeParse: (v: unknown) => ({ success: true, data: v })
  })
}

/**
 * Infer type from schema
 */
export type infer<T extends Schema<any>> = T extends Schema<infer U> ? U : never
