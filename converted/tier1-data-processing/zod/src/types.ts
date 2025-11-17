/**
 * Type definitions for Zod schema validation
 * Provides full TypeScript type inference
 */

export type ZodTypeDef = {
  typeName: string;
  description?: string;
};

export type Primitive = string | number | boolean | null | undefined;

// Extract input type from a schema
export type input<T extends ZodType<any, any, any>> = T["_input"];

// Extract output type from a schema
export type output<T extends ZodType<any, any, any>> = T["_output"];

// Infer type from a schema
export type infer<T extends ZodType<any, any, any>> = T["_output"];

// Type for refinement function
export type RefinementFunction<T> = (value: T) => boolean;

// Type for transformation function
export type TransformFunction<T, U> = (value: T) => U;

// Type for async refinement
export type AsyncRefinementFunction<T> = (value: T) => Promise<boolean>;

// Safe parse return types
export type SafeParseSuccess<Output> = {
  success: true;
  data: Output;
};

export type SafeParseError<Input> = {
  success: false;
  error: ZodError<Input>;
};

export type SafeParseReturnType<Input, Output> =
  | SafeParseSuccess<Output>
  | SafeParseError<Input>;

/**
 * Base class for all Zod types
 */
export abstract class ZodType<Output = any, Def extends ZodTypeDef = ZodTypeDef, Input = Output> {
  readonly _type!: Output;
  readonly _output!: Output;
  readonly _input!: Input;
  readonly _def: Def;

  constructor(def: Def) {
    this._def = def;
  }

  abstract _parse(value: unknown): Output;

  /**
   * Parse and validate a value, throwing on error
   */
  parse(value: unknown): Output {
    try {
      return this._parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        throw error;
      }
      throw new ZodError([{
        code: "custom",
        message: String(error),
        path: [],
      }]);
    }
  }

  /**
   * Parse and validate a value, returning a result object
   */
  safeParse(value: unknown): SafeParseReturnType<Input, Output> {
    try {
      const data = this._parse(value);
      return { success: true, data };
    } catch (error) {
      if (error instanceof ZodError) {
        return { success: false, error };
      }
      return {
        success: false,
        error: new ZodError([{
          code: "custom",
          message: String(error),
          path: [],
        }]),
      };
    }
  }

  /**
   * Parse and validate a value asynchronously
   */
  async parseAsync(value: unknown): Promise<Output> {
    return this.parse(value);
  }

  /**
   * Make this schema optional
   */
  optional(): ZodOptional<this> {
    return new ZodOptional({
      typeName: "ZodOptional",
      innerType: this,
    });
  }

  /**
   * Make this schema nullable
   */
  nullable(): ZodNullable<this> {
    return new ZodNullable({
      typeName: "ZodNullable",
      innerType: this,
    });
  }

  /**
   * Make this schema nullish (undefined or null)
   */
  nullish(): ZodNullable<ZodOptional<this>> {
    return this.optional().nullable();
  }

  /**
   * Add description to schema
   */
  describe(description: string): this {
    const clone = Object.create(Object.getPrototypeOf(this));
    Object.assign(clone, this);
    clone._def = { ...this._def, description };
    return clone;
  }
}

/**
 * Error issue type
 */
export type ZodIssue = {
  code: string;
  path: (string | number)[];
  message: string;
  expected?: string;
  received?: string;
};

/**
 * Zod validation error
 */
export class ZodError<T = any> extends Error {
  issues: ZodIssue[];

  constructor(issues: ZodIssue[]) {
    super(issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; '));
    this.name = "ZodError";
    this.issues = issues;
  }

  get errors(): ZodIssue[] {
    return this.issues;
  }

  format(): Record<string, any> {
    const formatted: Record<string, any> = {};
    for (const issue of this.issues) {
      let current = formatted;
      for (let i = 0; i < issue.path.length - 1; i++) {
        const key = issue.path[i];
        if (!current[key]) {
          current[key] = {};
        }
        current = current[key];
      }
      const lastKey = issue.path[issue.path.length - 1] || "_errors";
      if (!current[lastKey]) {
        current[lastKey] = [];
      }
      if (Array.isArray(current[lastKey])) {
        current[lastKey].push(issue.message);
      } else {
        current[lastKey] = { _errors: [issue.message] };
      }
    }
    return formatted;
  }

  toString(): string {
    return this.message;
  }
}

// Forward declarations for circular dependencies
export class ZodOptional<T extends ZodType<any, any, any>> extends ZodType<
  T["_output"] | undefined,
  { typeName: "ZodOptional"; innerType: T },
  T["_input"] | undefined
> {
  _parse(value: unknown): T["_output"] | undefined {
    if (value === undefined) {
      return undefined;
    }
    return this._def.innerType._parse(value);
  }

  unwrap(): T {
    return this._def.innerType;
  }
}

export class ZodNullable<T extends ZodType<any, any, any>> extends ZodType<
  T["_output"] | null,
  { typeName: "ZodNullable"; innerType: T },
  T["_input"] | null
> {
  _parse(value: unknown): T["_output"] | null {
    if (value === null) {
      return null;
    }
    return this._def.innerType._parse(value);
  }

  unwrap(): T {
    return this._def.innerType;
  }
}
