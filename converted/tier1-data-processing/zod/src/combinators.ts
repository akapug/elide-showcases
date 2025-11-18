/**
 * Union, intersection, and other combinators for Zod validation
 */

import { ZodType, ZodTypeDef, ZodError } from "./types.ts";
import { throwError, makeIssue, customError, typeError } from "./errors.ts";

/**
 * Union schema
 */
export interface ZodUnionDef<T extends [ZodType<any, any, any>, ...ZodType<any, any, any>[]]> extends ZodTypeDef {
  typeName: "ZodUnion";
  options: T;
}

export type unionOutputType<T extends [ZodType<any, any, any>, ...ZodType<any, any, any>[]]> = T[number]["_output"];
export type unionInputType<T extends [ZodType<any, any, any>, ...ZodType<any, any, any>[]]> = T[number]["_input"];

export class ZodUnion<T extends [ZodType<any, any, any>, ...ZodType<any, any, any>[]]> extends ZodType<
  unionOutputType<T>,
  ZodUnionDef<T>,
  unionInputType<T>
> {
  _parse(value: unknown): unionOutputType<T> {
    const errors: ZodError[] = [];

    for (const option of this._def.options) {
      try {
        return option._parse(value);
      } catch (error) {
        if (error instanceof ZodError) {
          errors.push(error);
        }
      }
    }

    // All options failed
    throwError(makeIssue({
      code: "invalid_union",
      message: `Invalid union value. Tried ${this._def.options.length} options, all failed.`,
    }));
  }

  get options(): T {
    return this._def.options;
  }
}

/**
 * Discriminated union schema
 */
export interface ZodDiscriminatedUnionDef<
  Discriminator extends string,
  Options extends ZodType<any, any, any>[]
> extends ZodTypeDef {
  typeName: "ZodDiscriminatedUnion";
  discriminator: Discriminator;
  options: Options;
  optionsMap: Map<any, ZodType<any, any, any>>;
}

export class ZodDiscriminatedUnion<
  Discriminator extends string,
  Options extends ZodType<any, any, any>[]
> extends ZodType<
  Options[number]["_output"],
  ZodDiscriminatedUnionDef<Discriminator, Options>,
  Options[number]["_input"]
> {
  _parse(value: unknown): Options[number]["_output"] {
    if (typeof value !== "object" || value === null) {
      throwError(typeError("object", value));
    }

    const discriminatorValue = (value as any)[this._def.discriminator];

    if (discriminatorValue === undefined) {
      throwError(makeIssue({
        code: "invalid_union_discriminator",
        message: `Discriminator property '${this._def.discriminator}' is required`,
      }));
    }

    const option = this._def.optionsMap.get(discriminatorValue);

    if (!option) {
      throwError(makeIssue({
        code: "invalid_union_discriminator",
        message: `Invalid discriminator value '${discriminatorValue}'`,
      }));
    }

    return option._parse(value);
  }

  get discriminator(): Discriminator {
    return this._def.discriminator;
  }

  get options(): Options {
    return this._def.options;
  }
}

/**
 * Intersection schema
 */
export interface ZodIntersectionDef<
  Left extends ZodType<any, any, any>,
  Right extends ZodType<any, any, any>
> extends ZodTypeDef {
  typeName: "ZodIntersection";
  left: Left;
  right: Right;
}

export class ZodIntersection<
  Left extends ZodType<any, any, any>,
  Right extends ZodType<any, any, any>
> extends ZodType<
  Left["_output"] & Right["_output"],
  ZodIntersectionDef<Left, Right>,
  Left["_input"] & Right["_input"]
> {
  _parse(value: unknown): Left["_output"] & Right["_output"] {
    const leftResult = this._def.left._parse(value);
    const rightResult = this._def.right._parse(value);

    // Merge results
    if (typeof leftResult === "object" && typeof rightResult === "object") {
      return { ...leftResult, ...rightResult };
    }

    // For non-objects, the right side wins (though this is unusual)
    return rightResult as any;
  }
}

/**
 * Promise schema
 */
export interface ZodPromiseDef<T extends ZodType<any, any, any>> extends ZodTypeDef {
  typeName: "ZodPromise";
  type: T;
}

export class ZodPromise<T extends ZodType<any, any, any>> extends ZodType<
  Promise<T["_output"]>,
  ZodPromiseDef<T>,
  Promise<T["_input"]>
> {
  _parse(value: unknown): Promise<T["_output"]> {
    if (!(value instanceof Promise)) {
      throwError(typeError("promise", value));
    }

    return value.then((val) => this._def.type._parse(val));
  }
}

/**
 * Function schema
 */
export interface ZodFunctionDef<
  Args extends ZodTuple<any> = ZodTuple<any>,
  Returns extends ZodType<any, any, any> = ZodType<any, any, any>
> extends ZodTypeDef {
  typeName: "ZodFunction";
  args: Args;
  returns: Returns;
}

export class ZodFunction<
  Args extends ZodTuple<any>,
  Returns extends ZodType<any, any, any>
> extends ZodType<
  (...args: Args["_input"]) => Returns["_output"],
  ZodFunctionDef<Args, Returns>,
  (...args: Args["_input"]) => Returns["_output"]
> {
  _parse(value: unknown): (...args: Args["_input"]) => Returns["_output"] {
    if (typeof value !== "function") {
      throwError(typeError("function", value));
    }

    const self = this;

    return function (this: any, ...args: any[]) {
      const parsedArgs = self._def.args._parse(args);
      const result = (value as any).apply(this, parsedArgs);
      return self._def.returns._parse(result);
    } as any;
  }

  args<NewArgs extends ZodTuple<any>>(args: NewArgs): ZodFunction<NewArgs, Returns> {
    return new ZodFunction({
      ...this._def,
      args,
    });
  }

  returns<NewReturns extends ZodType<any, any, any>>(returns: NewReturns): ZodFunction<Args, NewReturns> {
    return new ZodFunction({
      ...this._def,
      returns,
    });
  }

  implement<F extends (...args: Args["_input"]) => Returns["_input"]>(func: F): F {
    return this._parse(func) as any;
  }

  validate(func: (...args: any[]) => any): (...args: Args["_input"]) => Returns["_output"] {
    return this._parse(func);
  }
}

/**
 * Lazy schema (for recursive types)
 */
export interface ZodLazyDef<T extends ZodType<any, any, any>> extends ZodTypeDef {
  typeName: "ZodLazy";
  getter: () => T;
}

export class ZodLazy<T extends ZodType<any, any, any>> extends ZodType<
  T["_output"],
  ZodLazyDef<T>,
  T["_input"]
> {
  private _schema?: T;

  _parse(value: unknown): T["_output"] {
    if (!this._schema) {
      this._schema = this._def.getter();
    }
    return this._schema._parse(value);
  }

  get schema(): T {
    if (!this._schema) {
      this._schema = this._def.getter();
    }
    return this._schema;
  }
}

/**
 * Default schema
 */
export interface ZodDefaultDef<T extends ZodType<any, any, any>> extends ZodTypeDef {
  typeName: "ZodDefault";
  innerType: T;
  defaultValue: () => T["_output"];
}

export class ZodDefault<T extends ZodType<any, any, any>> extends ZodType<
  T["_output"],
  ZodDefaultDef<T>,
  T["_input"] | undefined
> {
  _parse(value: unknown): T["_output"] {
    if (value === undefined) {
      return this._def.defaultValue();
    }
    return this._def.innerType._parse(value);
  }

  removeDefault(): T {
    return this._def.innerType;
  }
}

/**
 * Catch schema (for handling errors with default values)
 */
export interface ZodCatchDef<T extends ZodType<any, any, any>> extends ZodTypeDef {
  typeName: "ZodCatch";
  innerType: T;
  catchValue: () => T["_output"];
}

export class ZodCatch<T extends ZodType<any, any, any>> extends ZodType<
  T["_output"],
  ZodCatchDef<T>,
  T["_input"]
> {
  _parse(value: unknown): T["_output"] {
    try {
      return this._def.innerType._parse(value);
    } catch {
      return this._def.catchValue();
    }
  }

  removeCatch(): T {
    return this._def.innerType;
  }
}

// Import ZodTuple from objects
import { ZodTuple } from "./objects.ts";
