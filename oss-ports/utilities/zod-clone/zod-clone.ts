/**
 * Zod Clone for Elide
 * TypeScript-first schema validation library
 *
 * @module zod-clone
 * @version 1.0.0
 */

// ============================================================================
// Core Types
// ============================================================================

export type ZodRawShape = { [k: string]: ZodTypeAny }
export type ZodTypeAny = ZodType<any, any, any>
export type TypeOf<T extends ZodType<any, any, any>> = T['_output']
export type input<T extends ZodType<any, any, any>> = T['_input']
export type output<T extends ZodType<any, any, any>> = T['_output']
export type infer<T extends ZodType<any, any, any>> = T['_output']

export interface ParseContext {
  path: (string | number)[]
  issues: ZodIssue[]
}

export interface ParseParams {
  path?: (string | number)[]
  async?: boolean
}

export type SafeParseSuccess<Output> = { success: true; data: Output }
export type SafeParseError<Input> = { success: false; error: ZodError<Input> }
export type SafeParseReturnType<Input, Output> = SafeParseSuccess<Output> | SafeParseError<Input>

// ============================================================================
// Error Types
// ============================================================================

export enum ZodIssueCode {
  invalid_type = 'invalid_type',
  invalid_literal = 'invalid_literal',
  custom = 'custom',
  invalid_union = 'invalid_union',
  invalid_union_discriminator = 'invalid_union_discriminator',
  invalid_enum_value = 'invalid_enum_value',
  unrecognized_keys = 'unrecognized_keys',
  invalid_arguments = 'invalid_arguments',
  invalid_return_type = 'invalid_return_type',
  invalid_date = 'invalid_date',
  invalid_string = 'invalid_string',
  too_small = 'too_small',
  too_big = 'too_big',
  invalid_intersection_types = 'invalid_intersection_types',
  not_multiple_of = 'not_multiple_of',
  not_finite = 'not_finite',
}

export type ZodIssue = {
  code: ZodIssueCode
  path: (string | number)[]
  message?: string
} & (
  | { code: ZodIssueCode.invalid_type; expected: string; received: string }
  | { code: ZodIssueCode.invalid_literal; expected: unknown }
  | { code: ZodIssueCode.custom }
  | { code: ZodIssueCode.invalid_union }
  | { code: ZodIssueCode.invalid_enum_value; options: unknown[] }
  | { code: ZodIssueCode.unrecognized_keys; keys: string[] }
  | { code: ZodIssueCode.too_small; minimum: number; inclusive: boolean; type: string }
  | { code: ZodIssueCode.too_big; maximum: number; inclusive: boolean; type: string }
  | { code: ZodIssueCode.invalid_string; validation: string }
)

export class ZodError<T = any> extends Error {
  issues: ZodIssue[] = []

  constructor(issues: ZodIssue[]) {
    super()
    this.issues = issues
    this.name = 'ZodError'
  }

  get errors() {
    return this.issues
  }

  format(): any {
    const fieldErrors: any = { _errors: [] }

    for (const issue of this.issues) {
      if (issue.path.length === 0) {
        fieldErrors._errors.push(issue.message)
      } else {
        let curr = fieldErrors
        for (let i = 0; i < issue.path.length; i++) {
          const key = issue.path[i]
          if (i === issue.path.length - 1) {
            curr[key] = curr[key] || { _errors: [] }
            curr[key]._errors.push(issue.message)
          } else {
            curr[key] = curr[key] || { _errors: [] }
            curr = curr[key]
          }
        }
      }
    }

    return fieldErrors
  }

  flatten(): { formErrors: string[]; fieldErrors: Record<string, string[]> } {
    const formErrors: string[] = []
    const fieldErrors: Record<string, string[]> = {}

    for (const issue of this.issues) {
      if (issue.path.length === 0) {
        formErrors.push(issue.message || '')
      } else {
        const key = issue.path.join('.')
        fieldErrors[key] = fieldErrors[key] || []
        fieldErrors[key].push(issue.message || '')
      }
    }

    return { formErrors, fieldErrors }
  }

  toString(): string {
    return this.issues.map((issue) => {
      const path = issue.path.join('.')
      return `${path ? `${path}: ` : ''}${issue.message}`
    }).join('\n')
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

function getType(value: unknown): string {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (Array.isArray(value)) return 'array'
  if (value instanceof Date) return 'date'
  if (value instanceof Map) return 'map'
  if (value instanceof Set) return 'set'
  return typeof value
}

function addIssue(ctx: ParseContext, issue: Omit<ZodIssue, 'path'>): void {
  ctx.issues.push({ ...issue, path: ctx.path } as ZodIssue)
}

// ============================================================================
// Base Type
// ============================================================================

export abstract class ZodType<Output = any, Def extends ZodTypeDef = ZodTypeDef, Input = Output> {
  readonly _type!: Output
  readonly _output!: Output
  readonly _input!: Input
  readonly _def!: Def

  constructor(def: Def) {
    this._def = def
  }

  abstract _parse(input: unknown, ctx: ParseContext): Output

  parse(data: unknown, params?: Partial<ParseParams>): Output {
    const ctx: ParseContext = {
      path: params?.path || [],
      issues: [],
    }

    const result = this._parse(data, ctx)

    if (ctx.issues.length > 0) {
      throw new ZodError(ctx.issues)
    }

    return result
  }

  safeParse(data: unknown, params?: Partial<ParseParams>): SafeParseReturnType<Input, Output> {
    try {
      const result = this.parse(data, params)
      return { success: true, data: result }
    } catch (error) {
      if (error instanceof ZodError) {
        return { success: false, error }
      }
      throw error
    }
  }

  async parseAsync(data: unknown, params?: Partial<ParseParams>): Promise<Output> {
    return this.parse(data, { ...params, async: true })
  }

  async safeParseAsync(data: unknown, params?: Partial<ParseParams>): Promise<SafeParseReturnType<Input, Output>> {
    try {
      const result = await this.parseAsync(data, params)
      return { success: true, data: result }
    } catch (error) {
      if (error instanceof ZodError) {
        return { success: false, error }
      }
      throw error
    }
  }

  optional(): ZodOptional<this> {
    return ZodOptional.create(this)
  }

  nullable(): ZodNullable<this> {
    return ZodNullable.create(this)
  }

  nullish(): ZodNullable<ZodOptional<this>> {
    return this.optional().nullable()
  }

  array(): ZodArray<this> {
    return ZodArray.create(this)
  }

  or<T extends ZodTypeAny>(option: T): ZodUnion<[this, T]> {
    return ZodUnion.create([this, option])
  }

  and<T extends ZodTypeAny>(incoming: T): ZodIntersection<this, T> {
    return ZodIntersection.create(this, incoming)
  }

  transform<NewOut>(transform: (arg: Output) => NewOut | Promise<NewOut>): ZodEffects<this, NewOut> {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: 'transform', transform },
    })
  }

  default(def: Output): ZodDefault<this> {
    return ZodDefault.create(this, def)
  }

  refine(check: (arg: Output) => boolean, message?: string | { message?: string }): ZodEffects<this, Output> {
    return this._refinement({
      refinement: check,
      message: typeof message === 'string' ? message : message?.message,
    })
  }

  superRefine(refinement: (arg: Output, ctx: RefinementCtx) => void): ZodEffects<this, Output> {
    return this._refinement({ refinement })
  }

  private _refinement(refinement: {
    refinement: (arg: Output, ctx?: RefinementCtx) => boolean | void
    message?: string
  }): ZodEffects<this, Output> {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: 'refinement', refinement: refinement.refinement, message: refinement.message },
    })
  }

  brand<B extends string | number | symbol>(): ZodBranded<this, B> {
    return new ZodBranded({ ...this._def, typeName: this._def.typeName })
  }

  pipe<T extends ZodTypeAny>(target: T): ZodPipeline<this, T> {
    return ZodPipeline.create(this, target)
  }
}

export interface ZodTypeDef {
  typeName: ZodFirstPartyTypeKind
  description?: string
}

export interface RefinementCtx {
  addIssue: (issue: Omit<ZodIssue, 'path'>) => void
  path: (string | number)[]
}

// ============================================================================
// Type Names
// ============================================================================

export enum ZodFirstPartyTypeKind {
  ZodString = 'ZodString',
  ZodNumber = 'ZodNumber',
  ZodBigInt = 'ZodBigInt',
  ZodBoolean = 'ZodBoolean',
  ZodDate = 'ZodDate',
  ZodSymbol = 'ZodSymbol',
  ZodUndefined = 'ZodUndefined',
  ZodNull = 'ZodNull',
  ZodAny = 'ZodAny',
  ZodUnknown = 'ZodUnknown',
  ZodNever = 'ZodNever',
  ZodVoid = 'ZodVoid',
  ZodArray = 'ZodArray',
  ZodObject = 'ZodObject',
  ZodUnion = 'ZodUnion',
  ZodDiscriminatedUnion = 'ZodDiscriminatedUnion',
  ZodIntersection = 'ZodIntersection',
  ZodTuple = 'ZodTuple',
  ZodRecord = 'ZodRecord',
  ZodMap = 'ZodMap',
  ZodSet = 'ZodSet',
  ZodFunction = 'ZodFunction',
  ZodLazy = 'ZodLazy',
  ZodLiteral = 'ZodLiteral',
  ZodEnum = 'ZodEnum',
  ZodEffects = 'ZodEffects',
  ZodNativeEnum = 'ZodNativeEnum',
  ZodOptional = 'ZodOptional',
  ZodNullable = 'ZodNullable',
  ZodDefault = 'ZodDefault',
  ZodPromise = 'ZodPromise',
  ZodBranded = 'ZodBranded',
  ZodPipeline = 'ZodPipeline',
}

// ============================================================================
// String Type
// ============================================================================

export interface ZodStringDef extends ZodTypeDef {
  typeName: ZodFirstPartyTypeKind.ZodString
  checks: StringCheck[]
}

export type StringCheck =
  | { kind: 'min'; value: number; message?: string }
  | { kind: 'max'; value: number; message?: string }
  | { kind: 'length'; value: number; message?: string }
  | { kind: 'email'; message?: string }
  | { kind: 'url'; message?: string }
  | { kind: 'uuid'; message?: string }
  | { kind: 'regex'; regex: RegExp; message?: string }
  | { kind: 'startsWith'; value: string; message?: string }
  | { kind: 'endsWith'; value: string; message?: string }

export class ZodString extends ZodType<string, ZodStringDef> {
  _parse(input: unknown, ctx: ParseContext): string {
    if (typeof input !== 'string') {
      addIssue(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: 'string',
        received: getType(input),
        message: 'Expected string',
      })
      return input as string
    }

    for (const check of this._def.checks) {
      if (check.kind === 'min' && input.length < check.value) {
        addIssue(ctx, {
          code: ZodIssueCode.too_small,
          minimum: check.value,
          type: 'string',
          inclusive: true,
          message: check.message || `String must contain at least ${check.value} character(s)`,
        })
      } else if (check.kind === 'max' && input.length > check.value) {
        addIssue(ctx, {
          code: ZodIssueCode.too_big,
          maximum: check.value,
          type: 'string',
          inclusive: true,
          message: check.message || `String must contain at most ${check.value} character(s)`,
        })
      } else if (check.kind === 'length' && input.length !== check.value) {
        addIssue(ctx, {
          code: ZodIssueCode.invalid_string,
          validation: 'length',
          message: check.message || `String must be exactly ${check.value} characters`,
        })
      } else if (check.kind === 'email' && !input.includes('@')) {
        addIssue(ctx, {
          code: ZodIssueCode.invalid_string,
          validation: 'email',
          message: check.message || 'Invalid email',
        })
      } else if (check.kind === 'url') {
        try {
          new URL(input)
        } catch {
          addIssue(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: 'url',
            message: check.message || 'Invalid url',
          })
        }
      } else if (check.kind === 'uuid' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input)) {
        addIssue(ctx, {
          code: ZodIssueCode.invalid_string,
          validation: 'uuid',
          message: check.message || 'Invalid uuid',
        })
      } else if (check.kind === 'regex' && !check.regex.test(input)) {
        addIssue(ctx, {
          code: ZodIssueCode.invalid_string,
          validation: 'regex',
          message: check.message || 'Invalid',
        })
      } else if (check.kind === 'startsWith' && !input.startsWith(check.value)) {
        addIssue(ctx, {
          code: ZodIssueCode.invalid_string,
          validation: 'startsWith',
          message: check.message || `String must start with "${check.value}"`,
        })
      } else if (check.kind === 'endsWith' && !input.endsWith(check.value)) {
        addIssue(ctx, {
          code: ZodIssueCode.invalid_string,
          validation: 'endsWith',
          message: check.message || `String must end with "${check.value}"`,
        })
      }
    }

    return input
  }

  min(minLength: number, message?: string): this {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: 'min', value: minLength, message }],
    }) as this
  }

  max(maxLength: number, message?: string): this {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: 'max', value: maxLength, message }],
    }) as this
  }

  length(len: number, message?: string): this {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: 'length', value: len, message }],
    }) as this
  }

  email(message?: string): this {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: 'email', message }],
    }) as this
  }

  url(message?: string): this {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: 'url', message }],
    }) as this
  }

  uuid(message?: string): this {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: 'uuid', message }],
    }) as this
  }

  regex(regex: RegExp, message?: string): this {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: 'regex', regex, message }],
    }) as this
  }

  startsWith(value: string, message?: string): this {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: 'startsWith', value, message }],
    }) as this
  }

  endsWith(value: string, message?: string): this {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: 'endsWith', value, message }],
    }) as this
  }

  static create(): ZodString {
    return new ZodString({
      typeName: ZodFirstPartyTypeKind.ZodString,
      checks: [],
    })
  }
}

// ============================================================================
// Number Type
// ============================================================================

export interface ZodNumberDef extends ZodTypeDef {
  typeName: ZodFirstPartyTypeKind.ZodNumber
  checks: NumberCheck[]
}

export type NumberCheck =
  | { kind: 'min'; value: number; inclusive: boolean; message?: string }
  | { kind: 'max'; value: number; inclusive: boolean; message?: string }
  | { kind: 'int'; message?: string }
  | { kind: 'multipleOf'; value: number; message?: string }
  | { kind: 'finite'; message?: string }

export class ZodNumber extends ZodType<number, ZodNumberDef> {
  _parse(input: unknown, ctx: ParseContext): number {
    if (typeof input !== 'number') {
      addIssue(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: 'number',
        received: getType(input),
        message: 'Expected number',
      })
      return input as number
    }

    if (isNaN(input)) {
      addIssue(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: 'number',
        received: 'nan',
        message: 'Expected number, received nan',
      })
      return input
    }

    for (const check of this._def.checks) {
      if (check.kind === 'min') {
        const tooSmall = check.inclusive ? input < check.value : input <= check.value
        if (tooSmall) {
          addIssue(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: 'number',
            inclusive: check.inclusive,
            message: check.message || `Number must be ${check.inclusive ? '>=' : '>'} ${check.value}`,
          })
        }
      } else if (check.kind === 'max') {
        const tooBig = check.inclusive ? input > check.value : input >= check.value
        if (tooBig) {
          addIssue(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: 'number',
            inclusive: check.inclusive,
            message: check.message || `Number must be ${check.inclusive ? '<=' : '<'} ${check.value}`,
          })
        }
      } else if (check.kind === 'int' && !Number.isInteger(input)) {
        addIssue(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: 'integer',
          received: 'float',
          message: check.message || 'Expected integer, received float',
        })
      } else if (check.kind === 'multipleOf' && input % check.value !== 0) {
        addIssue(ctx, {
          code: ZodIssueCode.not_multiple_of,
          message: check.message || `Number must be multiple of ${check.value}`,
        })
      } else if (check.kind === 'finite' && !Number.isFinite(input)) {
        addIssue(ctx, {
          code: ZodIssueCode.not_finite,
          message: check.message || 'Number must be finite',
        })
      }
    }

    return input
  }

  min(min: number, message?: string): this {
    return new ZodNumber({
      ...this._def,
      checks: [...this._def.checks, { kind: 'min', value: min, inclusive: true, message }],
    }) as this
  }

  max(max: number, message?: string): this {
    return new ZodNumber({
      ...this._def,
      checks: [...this._def.checks, { kind: 'max', value: max, inclusive: true, message }],
    }) as this
  }

  int(message?: string): this {
    return new ZodNumber({
      ...this._def,
      checks: [...this._def.checks, { kind: 'int', message }],
    }) as this
  }

  positive(message?: string): this {
    return this.min(0, message)
  }

  negative(message?: string): this {
    return this.max(0, message)
  }

  nonnegative(message?: string): this {
    return this.min(0, message)
  }

  nonpositive(message?: string): this {
    return this.max(0, message)
  }

  multipleOf(value: number, message?: string): this {
    return new ZodNumber({
      ...this._def,
      checks: [...this._def.checks, { kind: 'multipleOf', value, message }],
    }) as this
  }

  finite(message?: string): this {
    return new ZodNumber({
      ...this._def,
      checks: [...this._def.checks, { kind: 'finite', message }],
    }) as this
  }

  static create(): ZodNumber {
    return new ZodNumber({
      typeName: ZodFirstPartyTypeKind.ZodNumber,
      checks: [],
    })
  }
}

// ============================================================================
// Boolean Type
// ============================================================================

export interface ZodBooleanDef extends ZodTypeDef {
  typeName: ZodFirstPartyTypeKind.ZodBoolean
}

export class ZodBoolean extends ZodType<boolean, ZodBooleanDef> {
  _parse(input: unknown, ctx: ParseContext): boolean {
    if (typeof input !== 'boolean') {
      addIssue(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: 'boolean',
        received: getType(input),
        message: 'Expected boolean',
      })
      return input as boolean
    }
    return input
  }

  static create(): ZodBoolean {
    return new ZodBoolean({
      typeName: ZodFirstPartyTypeKind.ZodBoolean,
    })
  }
}

// ============================================================================
// Date Type
// ============================================================================

export interface ZodDateDef extends ZodTypeDef {
  typeName: ZodFirstPartyTypeKind.ZodDate
  checks: DateCheck[]
}

export type DateCheck =
  | { kind: 'min'; value: number; message?: string }
  | { kind: 'max'; value: number; message?: string }

export class ZodDate extends ZodType<Date, ZodDateDef> {
  _parse(input: unknown, ctx: ParseContext): Date {
    if (!(input instanceof Date)) {
      addIssue(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: 'date',
        received: getType(input),
        message: 'Expected date',
      })
      return input as Date
    }

    if (isNaN(input.getTime())) {
      addIssue(ctx, {
        code: ZodIssueCode.invalid_date,
        message: 'Invalid date',
      })
      return input
    }

    for (const check of this._def.checks) {
      if (check.kind === 'min' && input.getTime() < check.value) {
        addIssue(ctx, {
          code: ZodIssueCode.too_small,
          minimum: check.value,
          type: 'date',
          inclusive: true,
          message: check.message || `Date must be after ${new Date(check.value).toISOString()}`,
        })
      } else if (check.kind === 'max' && input.getTime() > check.value) {
        addIssue(ctx, {
          code: ZodIssueCode.too_big,
          maximum: check.value,
          type: 'date',
          inclusive: true,
          message: check.message || `Date must be before ${new Date(check.value).toISOString()}`,
        })
      }
    }

    return input
  }

  min(minDate: Date, message?: string): this {
    return new ZodDate({
      ...this._def,
      checks: [...this._def.checks, { kind: 'min', value: minDate.getTime(), message }],
    }) as this
  }

  max(maxDate: Date, message?: string): this {
    return new ZodDate({
      ...this._def,
      checks: [...this._def.checks, { kind: 'max', value: maxDate.getTime(), message }],
    }) as this
  }

  static create(): ZodDate {
    return new ZodDate({
      typeName: ZodFirstPartyTypeKind.ZodDate,
      checks: [],
    })
  }
}

// ============================================================================
// Simple Types
// ============================================================================

export class ZodBigInt extends ZodType<bigint> {
  _parse(input: unknown, ctx: ParseContext): bigint {
    if (typeof input !== 'bigint') {
      addIssue(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: 'bigint',
        received: getType(input),
        message: 'Expected bigint',
      })
    }
    return input as bigint
  }

  static create() {
    return new ZodBigInt({ typeName: ZodFirstPartyTypeKind.ZodBigInt })
  }
}

export class ZodSymbol extends ZodType<symbol> {
  _parse(input: unknown, ctx: ParseContext): symbol {
    if (typeof input !== 'symbol') {
      addIssue(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: 'symbol',
        received: getType(input),
        message: 'Expected symbol',
      })
    }
    return input as symbol
  }

  static create() {
    return new ZodSymbol({ typeName: ZodFirstPartyTypeKind.ZodSymbol })
  }
}

export class ZodUndefined extends ZodType<undefined> {
  _parse(input: unknown, ctx: ParseContext): undefined {
    if (input !== undefined) {
      addIssue(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: 'undefined',
        received: getType(input),
        message: 'Expected undefined',
      })
    }
    return input as undefined
  }

  static create() {
    return new ZodUndefined({ typeName: ZodFirstPartyTypeKind.ZodUndefined })
  }
}

export class ZodNull extends ZodType<null> {
  _parse(input: unknown, ctx: ParseContext): null {
    if (input !== null) {
      addIssue(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: 'null',
        received: getType(input),
        message: 'Expected null',
      })
    }
    return input as null
  }

  static create() {
    return new ZodNull({ typeName: ZodFirstPartyTypeKind.ZodNull })
  }
}

export class ZodAny extends ZodType<any> {
  _parse(input: unknown): any {
    return input
  }

  static create() {
    return new ZodAny({ typeName: ZodFirstPartyTypeKind.ZodAny })
  }
}

export class ZodUnknown extends ZodType<unknown> {
  _parse(input: unknown): unknown {
    return input
  }

  static create() {
    return new ZodUnknown({ typeName: ZodFirstPartyTypeKind.ZodUnknown })
  }
}

export class ZodNever extends ZodType<never> {
  _parse(input: unknown, ctx: ParseContext): never {
    addIssue(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: 'never',
      received: getType(input),
      message: 'Expected never',
    })
    return input as never
  }

  static create() {
    return new ZodNever({ typeName: ZodFirstPartyTypeKind.ZodNever })
  }
}

export class ZodVoid extends ZodType<void> {
  _parse(input: unknown, ctx: ParseContext): void {
    if (input !== undefined) {
      addIssue(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: 'void',
        received: getType(input),
        message: 'Expected void',
      })
    }
    return input as void
  }

  static create() {
    return new ZodVoid({ typeName: ZodFirstPartyTypeKind.ZodVoid })
  }
}

// ============================================================================
// Array Type
// ============================================================================

export interface ZodArrayDef<T extends ZodTypeAny = ZodTypeAny> extends ZodTypeDef {
  typeName: ZodFirstPartyTypeKind.ZodArray
  type: T
  minLength?: { value: number; message?: string }
  maxLength?: { value: number; message?: string }
}

export class ZodArray<T extends ZodTypeAny> extends ZodType<Array<T['_output']>, ZodArrayDef<T>, Array<T['_input']>> {
  _parse(input: unknown, ctx: ParseContext): Array<T['_output']> {
    if (!Array.isArray(input)) {
      addIssue(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: 'array',
        received: getType(input),
        message: 'Expected array',
      })
      return input as Array<T['_output']>
    }

    if (this._def.minLength && input.length < this._def.minLength.value) {
      addIssue(ctx, {
        code: ZodIssueCode.too_small,
        minimum: this._def.minLength.value,
        type: 'array',
        inclusive: true,
        message: this._def.minLength.message || `Array must contain at least ${this._def.minLength.value} element(s)`,
      })
    }

    if (this._def.maxLength && input.length > this._def.maxLength.value) {
      addIssue(ctx, {
        code: ZodIssueCode.too_big,
        maximum: this._def.maxLength.value,
        type: 'array',
        inclusive: true,
        message: this._def.maxLength.message || `Array must contain at most ${this._def.maxLength.value} element(s)`,
      })
    }

    const result: Array<T['_output']> = []
    for (let i = 0; i < input.length; i++) {
      const itemCtx: ParseContext = {
        path: [...ctx.path, i],
        issues: ctx.issues,
      }
      result.push(this._def.type._parse(input[i], itemCtx))
    }

    return result
  }

  min(minLength: number, message?: string): this {
    return new ZodArray({
      ...this._def,
      minLength: { value: minLength, message },
    }) as this
  }

  max(maxLength: number, message?: string): this {
    return new ZodArray({
      ...this._def,
      maxLength: { value: maxLength, message },
    }) as this
  }

  length(len: number, message?: string): this {
    return this.min(len).max(len) as this
  }

  nonempty(message?: string): this {
    return this.min(1, message)
  }

  static create<T extends ZodTypeAny>(type: T): ZodArray<T> {
    return new ZodArray({
      typeName: ZodFirstPartyTypeKind.ZodArray,
      type,
    })
  }
}

// ============================================================================
// Object Type
// ============================================================================

export interface ZodObjectDef<T extends ZodRawShape = ZodRawShape> extends ZodTypeDef {
  typeName: ZodFirstPartyTypeKind.ZodObject
  shape: () => T
  unknownKeys: 'strip' | 'strict' | 'passthrough'
  catchall: ZodTypeAny
}

export type objectOutputType<Shape extends ZodRawShape> = {
  [k in keyof Shape]: Shape[k]['_output']
}

export type objectInputType<Shape extends ZodRawShape> = {
  [k in keyof Shape]: Shape[k]['_input']
}

export class ZodObject<T extends ZodRawShape> extends ZodType<
  objectOutputType<T>,
  ZodObjectDef<T>,
  objectInputType<T>
> {
  _parse(input: unknown, ctx: ParseContext): objectOutputType<T> {
    if (typeof input !== 'object' || input === null || Array.isArray(input)) {
      addIssue(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: 'object',
        received: getType(input),
        message: 'Expected object',
      })
      return input as objectOutputType<T>
    }

    const shape = this._def.shape()
    const result: any = {}
    const inputKeys = Object.keys(input)

    for (const key in shape) {
      const fieldCtx: ParseContext = {
        path: [...ctx.path, key],
        issues: ctx.issues,
      }
      result[key] = shape[key]._parse((input as any)[key], fieldCtx)
    }

    if (this._def.unknownKeys === 'strict') {
      const knownKeys = Object.keys(shape)
      const unknownKeys = inputKeys.filter((k) => !knownKeys.includes(k))
      if (unknownKeys.length > 0) {
        addIssue(ctx, {
          code: ZodIssueCode.unrecognized_keys,
          keys: unknownKeys,
          message: `Unrecognized key(s) in object: ${unknownKeys.join(', ')}`,
        })
      }
    } else if (this._def.unknownKeys === 'passthrough') {
      for (const key of inputKeys) {
        if (!(key in shape)) {
          result[key] = (input as any)[key]
        }
      }
    }

    return result
  }

  extend<Augmentation extends ZodRawShape>(augmentation: Augmentation): ZodObject<T & Augmentation> {
    return new ZodObject({
      ...this._def,
      shape: () => ({ ...this._def.shape(), ...augmentation }),
    }) as any
  }

  merge<Incoming extends ZodRawShape>(merging: ZodObject<Incoming>): ZodObject<T & Incoming> {
    return new ZodObject({
      ...this._def,
      shape: () => ({ ...this._def.shape(), ...merging._def.shape() }),
    }) as any
  }

  pick<Mask extends { [k in keyof T]?: true }>(mask: Mask): ZodObject<Pick<T, Extract<keyof Mask, keyof T>>> {
    const shape = this._def.shape()
    const pickedShape: any = {}
    for (const key in mask) {
      if (mask[key] === true && key in shape) {
        pickedShape[key] = shape[key]
      }
    }
    return new ZodObject({
      ...this._def,
      shape: () => pickedShape,
    }) as any
  }

  omit<Mask extends { [k in keyof T]?: true }>(mask: Mask): ZodObject<Omit<T, keyof Mask>> {
    const shape = this._def.shape()
    const omittedShape: any = {}
    for (const key in shape) {
      if (!(key in mask)) {
        omittedShape[key] = shape[key]
      }
    }
    return new ZodObject({
      ...this._def,
      shape: () => omittedShape,
    }) as any
  }

  partial(): ZodObject<{ [k in keyof T]: ZodOptional<T[k]> }> {
    const shape = this._def.shape()
    const partialShape: any = {}
    for (const key in shape) {
      partialShape[key] = shape[key].optional()
    }
    return new ZodObject({
      ...this._def,
      shape: () => partialShape,
    }) as any
  }

  required(): ZodObject<{ [k in keyof T]: T[k] extends ZodOptional<infer U> ? U : T[k] }> {
    const shape = this._def.shape()
    const requiredShape: any = {}
    for (const key in shape) {
      const field = shape[key]
      if (field instanceof ZodOptional) {
        requiredShape[key] = field.unwrap()
      } else {
        requiredShape[key] = field
      }
    }
    return new ZodObject({
      ...this._def,
      shape: () => requiredShape,
    }) as any
  }

  deepPartial(): ZodObject<any> {
    return this.partial() as any
  }

  passthrough(): this {
    return new ZodObject({
      ...this._def,
      unknownKeys: 'passthrough',
    }) as this
  }

  strict(): this {
    return new ZodObject({
      ...this._def,
      unknownKeys: 'strict',
    }) as this
  }

  strip(): this {
    return new ZodObject({
      ...this._def,
      unknownKeys: 'strip',
    }) as this
  }

  catchall<T extends ZodTypeAny>(catchall: T): ZodObject<any> {
    return new ZodObject({
      ...this._def,
      catchall,
    }) as any
  }

  static create<T extends ZodRawShape>(shape: T): ZodObject<T> {
    return new ZodObject({
      typeName: ZodFirstPartyTypeKind.ZodObject,
      shape: () => shape,
      unknownKeys: 'strip',
      catchall: ZodNever.create(),
    })
  }
}

// Continue in next part...
// ============================================================================
// Union, Literal, Enum, and other complex types
// ============================================================================

export class ZodUnion<T extends readonly [ZodTypeAny, ...ZodTypeAny[]]> extends ZodType<
  T[number]['_output'],
  any,
  T[number]['_input']
> {
  _parse(input: unknown, ctx: ParseContext): T[number]['_output'] {
    const options = (this._def as any).options as T

    for (const option of options) {
      const optionCtx: ParseContext = {
        path: ctx.path,
        issues: [],
      }

      const result = option._parse(input, optionCtx)

      if (optionCtx.issues.length === 0) {
        return result
      }
    }

    addIssue(ctx, {
      code: ZodIssueCode.invalid_union,
      message: 'Invalid input',
    })

    return input as T[number]['_output']
  }

  static create<T extends readonly [ZodTypeAny, ...ZodTypeAny[]]>(types: T): ZodUnion<T> {
    return new ZodUnion({
      typeName: ZodFirstPartyTypeKind.ZodUnion,
      options: types,
    } as any)
  }
}

export class ZodLiteral<T extends any> extends ZodType<T> {
  _parse(input: unknown, ctx: ParseContext): T {
    if (input !== (this._def as any).value) {
      addIssue(ctx, {
        code: ZodIssueCode.invalid_literal,
        expected: (this._def as any).value,
        message: `Expected ${JSON.stringify((this._def as any).value)}`,
      })
    }
    return input as T
  }

  static create<T extends any>(value: T): ZodLiteral<T> {
    return new ZodLiteral({
      typeName: ZodFirstPartyTypeKind.ZodLiteral,
      value,
    } as any)
  }
}

export class ZodEnum<T extends [string, ...string[]]> extends ZodType<T[number]> {
  _parse(input: unknown, ctx: ParseContext): T[number] {
    const options = (this._def as any).values as T

    if (!options.includes(input as any)) {
      addIssue(ctx, {
        code: ZodIssueCode.invalid_enum_value,
        options,
        message: `Invalid enum value. Expected ${options.join(' | ')}, received '${input}'`,
      })
    }

    return input as T[number]
  }

  get options() {
    return (this._def as any).values as T
  }

  static create<T extends [string, ...string[]]>(values: T): ZodEnum<T> {
    return new ZodEnum({
      typeName: ZodFirstPartyTypeKind.ZodEnum,
      values,
    } as any)
  }
}

// ============================================================================
// Wrapper Types
// ============================================================================

export class ZodOptional<T extends ZodTypeAny> extends ZodType<T['_output'] | undefined, any, T['_input'] | undefined> {
  _parse(input: unknown, ctx: ParseContext): T['_output'] | undefined {
    if (input === undefined) {
      return undefined
    }
    return (this._def as any).innerType._parse(input, ctx)
  }

  unwrap(): T {
    return (this._def as any).innerType
  }

  static create<T extends ZodTypeAny>(type: T): ZodOptional<T> {
    return new ZodOptional({
      typeName: ZodFirstPartyTypeKind.ZodOptional,
      innerType: type,
    } as any)
  }
}

export class ZodNullable<T extends ZodTypeAny> extends ZodType<T['_output'] | null, any, T['_input'] | null> {
  _parse(input: unknown, ctx: ParseContext): T['_output'] | null {
    if (input === null) {
      return null
    }
    return (this._def as any).innerType._parse(input, ctx)
  }

  unwrap(): T {
    return (this._def as any).innerType
  }

  static create<T extends ZodTypeAny>(type: T): ZodNullable<T> {
    return new ZodNullable({
      typeName: ZodFirstPartyTypeKind.ZodNullable,
      innerType: type,
    } as any)
  }
}

export class ZodDefault<T extends ZodTypeAny> extends ZodType<T['_output'], any, T['_input'] | undefined> {
  _parse(input: unknown, ctx: ParseContext): T['_output'] {
    if (input === undefined) {
      return (this._def as any).defaultValue()
    }
    return (this._def as any).innerType._parse(input, ctx)
  }

  static create<T extends ZodTypeAny>(type: T, defaultValue: T['_output']): ZodDefault<T> {
    return new ZodDefault({
      typeName: ZodFirstPartyTypeKind.ZodDefault,
      innerType: type,
      defaultValue: typeof defaultValue === 'function' ? defaultValue : () => defaultValue,
    } as any)
  }
}

// ============================================================================
// Effects (Transformations and Refinements)
// ============================================================================

export type Effect =
  | { type: 'refinement'; refinement: (arg: any, ctx?: RefinementCtx) => boolean | void; message?: string }
  | { type: 'transform'; transform: (arg: any) => any }

export class ZodEffects<T extends ZodTypeAny, Output = T['_output']> extends ZodType<Output, any, T['_input']> {
  _parse(input: unknown, ctx: ParseContext): Output {
    const effect = (this._def as any).effect as Effect
    const base = (this._def as any).schema._parse(input, ctx)

    if (ctx.issues.length > 0) {
      return base
    }

    if (effect.type === 'refinement') {
      const refinementCtx: RefinementCtx = {
        addIssue: (issue) => addIssue(ctx, issue),
        path: ctx.path,
      }

      const result = effect.refinement(base, refinementCtx)

      if (result === false || ctx.issues.length > 0) {
        if (effect.message && ctx.issues.length === 0) {
          addIssue(ctx, {
            code: ZodIssueCode.custom,
            message: effect.message,
          })
        }
      }

      return base as Output
    } else if (effect.type === 'transform') {
      return effect.transform(base)
    }

    return base as Output
  }

  static create<T extends ZodTypeAny, Output = T['_output']>(
    schema: T,
    effect: Effect
  ): ZodEffects<T, Output> {
    return new ZodEffects({
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      schema,
      effect,
    } as any)
  }
}

// ============================================================================
// Additional Complex Types
// ============================================================================

export class ZodIntersection<T extends ZodTypeAny, U extends ZodTypeAny> extends ZodType<
  T['_output'] & U['_output'],
  any,
  T['_input'] & U['_input']
> {
  _parse(input: unknown, ctx: ParseContext): T['_output'] & U['_output'] {
    const left = (this._def as any).left._parse(input, ctx)
    const right = (this._def as any).right._parse(input, ctx)
    return { ...left, ...right }
  }

  static create<T extends ZodTypeAny, U extends ZodTypeAny>(left: T, right: U): ZodIntersection<T, U> {
    return new ZodIntersection({
      typeName: ZodFirstPartyTypeKind.ZodIntersection,
      left,
      right,
    } as any)
  }
}

export class ZodTuple<T extends [ZodTypeAny, ...ZodTypeAny[]]> extends ZodType<
  { [k in keyof T]: T[k] extends ZodType<any, any> ? T[k]['_output'] : never },
  any,
  { [k in keyof T]: T[k] extends ZodType<any, any> ? T[k]['_input'] : never }
> {
  _parse(input: unknown, ctx: ParseContext): any {
    if (!Array.isArray(input)) {
      addIssue(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: 'array',
        received: getType(input),
        message: 'Expected array',
      })
      return input
    }

    const items = (this._def as any).items as T

    if (input.length !== items.length) {
      addIssue(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: 'array',
        received: 'array',
        message: `Expected array of length ${items.length}, received array of length ${input.length}`,
      })
    }

    const result: any = []
    for (let i = 0; i < items.length; i++) {
      const itemCtx: ParseContext = {
        path: [...ctx.path, i],
        issues: ctx.issues,
      }
      result.push(items[i]._parse(input[i], itemCtx))
    }

    return result
  }

  static create<T extends [ZodTypeAny, ...ZodTypeAny[]]>(items: T): ZodTuple<T> {
    return new ZodTuple({
      typeName: ZodFirstPartyTypeKind.ZodTuple,
      items,
    } as any)
  }
}

export class ZodRecord<V extends ZodTypeAny = ZodTypeAny> extends ZodType<Record<string, V['_output']>, any, Record<string, V['_input']>> {
  _parse(input: unknown, ctx: ParseContext): Record<string, V['_output']> {
    if (typeof input !== 'object' || input === null || Array.isArray(input)) {
      addIssue(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: 'object',
        received: getType(input),
        message: 'Expected object',
      })
      return input as Record<string, V['_output']>
    }

    const result: Record<string, V['_output']> = {}
    const valueType = (this._def as any).valueType

    for (const key in input) {
      const valueCtx: ParseContext = {
        path: [...ctx.path, key],
        issues: ctx.issues,
      }
      result[key] = valueType._parse((input as any)[key], valueCtx)
    }

    return result
  }

  static create<V extends ZodTypeAny>(valueType: V): ZodRecord<V> {
    return new ZodRecord({
      typeName: ZodFirstPartyTypeKind.ZodRecord,
      valueType,
    } as any)
  }
}

export class ZodMap<K extends ZodTypeAny, V extends ZodTypeAny> extends ZodType<
  Map<K['_output'], V['_output']>,
  any,
  Map<K['_input'], V['_input']>
> {
  _parse(input: unknown, ctx: ParseContext): Map<K['_output'], V['_output']> {
    if (!(input instanceof Map)) {
      addIssue(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: 'map',
        received: getType(input),
        message: 'Expected map',
      })
      return input as Map<K['_output'], V['_output']>
    }

    const keyType = (this._def as any).keyType
    const valueType = (this._def as any).valueType
    const result = new Map<K['_output'], V['_output']>()

    let i = 0
    for (const [key, value] of input.entries()) {
      const keyCtx: ParseContext = {
        path: [...ctx.path, i, 'key'],
        issues: ctx.issues,
      }
      const valueCtx: ParseContext = {
        path: [...ctx.path, i, 'value'],
        issues: ctx.issues,
      }

      const parsedKey = keyType._parse(key, keyCtx)
      const parsedValue = valueType._parse(value, valueCtx)

      result.set(parsedKey, parsedValue)
      i++
    }

    return result
  }

  static create<K extends ZodTypeAny, V extends ZodTypeAny>(keyType: K, valueType: V): ZodMap<K, V> {
    return new ZodMap({
      typeName: ZodFirstPartyTypeKind.ZodMap,
      keyType,
      valueType,
    } as any)
  }
}

export class ZodSet<T extends ZodTypeAny> extends ZodType<Set<T['_output']>, any, Set<T['_input']>> {
  _parse(input: unknown, ctx: ParseContext): Set<T['_output']> {
    if (!(input instanceof Set)) {
      addIssue(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: 'set',
        received: getType(input),
        message: 'Expected set',
      })
      return input as Set<T['_output']>
    }

    const valueType = (this._def as any).valueType
    const result = new Set<T['_output']>()

    let i = 0
    for (const value of input) {
      const valueCtx: ParseContext = {
        path: [...ctx.path, i],
        issues: ctx.issues,
      }
      result.add(valueType._parse(value, valueCtx))
      i++
    }

    return result
  }

  min(minSize: number, message?: string): this {
    return new ZodSet({
      ...(this._def as any),
      minSize: { value: minSize, message },
    }) as this
  }

  max(maxSize: number, message?: string): this {
    return new ZodSet({
      ...(this._def as any),
      maxSize: { value: maxSize, message },
    }) as this
  }

  static create<T extends ZodTypeAny>(valueType: T): ZodSet<T> {
    return new ZodSet({
      typeName: ZodFirstPartyTypeKind.ZodSet,
      valueType,
    } as any)
  }
}

export class ZodLazy<T extends ZodTypeAny> extends ZodType<T['_output'], any, T['_input']> {
  _parse(input: unknown, ctx: ParseContext): T['_output'] {
    const schema = (this._def as any).getter()
    return schema._parse(input, ctx)
  }

  static create<T extends ZodTypeAny>(getter: () => T): ZodLazy<T> {
    return new ZodLazy({
      typeName: ZodFirstPartyTypeKind.ZodLazy,
      getter,
    } as any)
  }
}

export class ZodPromise<T extends ZodTypeAny> extends ZodType<Promise<T['_output']>, any, Promise<T['_input']>> {
  _parse(input: unknown, ctx: ParseContext): Promise<T['_output']> {
    if (!(input instanceof Promise)) {
      addIssue(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: 'promise',
        received: getType(input),
        message: 'Expected promise',
      })
      return input as Promise<T['_output']>
    }

    return input.then((data) => (this._def as any).type.parse(data))
  }

  static create<T extends ZodTypeAny>(type: T): ZodPromise<T> {
    return new ZodPromise({
      typeName: ZodFirstPartyTypeKind.ZodPromise,
      type,
    } as any)
  }
}

export class ZodBranded<T extends ZodTypeAny, Brand extends string | number | symbol> extends ZodType<
  T['_output'] & { __brand: Brand },
  any,
  T['_input']
> {
  _parse(input: unknown, ctx: ParseContext): T['_output'] & { __brand: Brand } {
    return (this._def as any).schema._parse(input, ctx)
  }
}

export class ZodPipeline<A extends ZodTypeAny, B extends ZodTypeAny> extends ZodType<B['_output'], any, A['_input']> {
  _parse(input: unknown, ctx: ParseContext): B['_output'] {
    const in_result = (this._def as any).in._parse(input, ctx)
    if (ctx.issues.length > 0) {
      return in_result
    }
    return (this._def as any).out._parse(in_result, ctx)
  }

  static create<A extends ZodTypeAny, B extends ZodTypeAny>(a: A, b: B): ZodPipeline<A, B> {
    return new ZodPipeline({
      typeName: ZodFirstPartyTypeKind.ZodPipeline,
      in: a,
      out: b,
    } as any)
  }
}

// ============================================================================
// Discriminated Union
// ============================================================================

export class ZodDiscriminatedUnion<
  Discriminator extends string,
  Options extends ZodObject<any>[]
> extends ZodType<Options[number]['_output'], any, Options[number]['_input']> {
  _parse(input: unknown, ctx: ParseContext): Options[number]['_output'] {
    if (typeof input !== 'object' || input === null) {
      addIssue(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: 'object',
        received: getType(input),
        message: 'Expected object',
      })
      return input as Options[number]['_output']
    }

    const discriminator = (this._def as any).discriminator as Discriminator
    const discriminatorValue = (input as any)[discriminator]

    const options = (this._def as any).options as Options
    for (const option of options) {
      const optionCtx: ParseContext = {
        path: ctx.path,
        issues: [],
      }

      const result = option._parse(input, optionCtx)

      if (optionCtx.issues.length === 0) {
        return result
      }
    }

    addIssue(ctx, {
      code: ZodIssueCode.invalid_union_discriminator,
      message: `Invalid discriminator value. Expected one of the union types`,
    })

    return input as Options[number]['_output']
  }

  static create<Discriminator extends string, Options extends ZodObject<any>[]>(
    discriminator: Discriminator,
    options: Options
  ): ZodDiscriminatedUnion<Discriminator, Options> {
    return new ZodDiscriminatedUnion({
      typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
      discriminator,
      options,
    } as any)
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function custom<T>(check?: (data: unknown) => boolean): ZodType<T> {
  return new ZodAny({} as any) as any
}

function preprocess<T extends ZodTypeAny>(
  preprocess: (arg: unknown) => unknown,
  schema: T
): ZodEffects<T> {
  return new ZodEffects({
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    schema,
    effect: {
      type: 'transform',
      transform: (val) => {
        const processed = preprocess(val)
        return schema.parse(processed)
      },
    },
  })
}

function lazy<T extends ZodTypeAny>(getter: () => T): ZodLazy<T> {
  return ZodLazy.create(getter)
}

// ============================================================================
// Coercion
// ============================================================================

const coerce = {
  string: () => z.preprocess((val) => String(val), z.string()),
  number: () => z.preprocess((val) => Number(val), z.number()),
  boolean: () => z.preprocess((val) => Boolean(val), z.boolean()),
  bigint: () => z.preprocess((val) => BigInt(val as any), z.bigint()),
  date: () => z.preprocess((val) => new Date(val as any), z.date()),
}

// ============================================================================
// Main Export Object
// ============================================================================

export const z = {
  string: () => ZodString.create(),
  number: () => ZodNumber.create(),
  bigint: () => ZodBigInt.create(),
  boolean: () => ZodBoolean.create(),
  date: () => ZodDate.create(),
  symbol: () => ZodSymbol.create(),
  undefined: () => ZodUndefined.create(),
  null: () => ZodNull.create(),
  any: () => ZodAny.create(),
  unknown: () => ZodUnknown.create(),
  never: () => ZodNever.create(),
  void: () => ZodVoid.create(),
  array: <T extends ZodTypeAny>(type: T) => ZodArray.create(type),
  object: <T extends ZodRawShape>(shape: T) => ZodObject.create(shape),
  union: <T extends readonly [ZodTypeAny, ...ZodTypeAny[]]>(types: T) => ZodUnion.create(types),
  discriminatedUnion: <D extends string, O extends ZodObject<any>[]>(discriminator: D, options: O) =>
    ZodDiscriminatedUnion.create(discriminator, options),
  intersection: <T extends ZodTypeAny, U extends ZodTypeAny>(left: T, right: U) =>
    ZodIntersection.create(left, right),
  tuple: <T extends [ZodTypeAny, ...ZodTypeAny[]]>(items: T) => ZodTuple.create(items),
  record: <V extends ZodTypeAny>(valueType: V) => ZodRecord.create(valueType),
  map: <K extends ZodTypeAny, V extends ZodTypeAny>(keyType: K, valueType: V) =>
    ZodMap.create(keyType, valueType),
  set: <T extends ZodTypeAny>(valueType: T) => ZodSet.create(valueType),
  function: () => ({ args: (...args: any[]) => ({ returns: (ret: any) => ({}) }) }),
  lazy: <T extends ZodTypeAny>(getter: () => T) => lazy(getter),
  literal: <T extends any>(value: T) => ZodLiteral.create(value),
  enum: <T extends [string, ...string[]]>(values: T) => ZodEnum.create(values),
  nativeEnum: <T extends Record<string, string | number>>(values: T) => ZodEnum.create(Object.values(values) as any),
  promise: <T extends ZodTypeAny>(type: T) => ZodPromise.create(type),
  optional: <T extends ZodTypeAny>(type: T) => ZodOptional.create(type),
  nullable: <T extends ZodTypeAny>(type: T) => ZodNullable.create(type),
  preprocess,
  custom,
  coerce,
  ZodIssueCode,
  ZodError,
}

export default z
