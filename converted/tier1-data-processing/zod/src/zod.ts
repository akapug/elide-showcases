/**
 * Main Zod API - TypeScript-first schema validation for Elide
 *
 * This implementation runs on Elide and provides full polyglot support,
 * allowing validation schemas to be shared across TypeScript, Python, Ruby, and Java.
 */

import { ZodType, ZodError, ZodIssue } from "./types.ts";
import {
  ZodString,
  ZodNumber,
  ZodBoolean,
  ZodDate,
  ZodLiteral,
  ZodEnum,
  ZodNativeEnum,
  ZodUndefined,
  ZodNull,
  ZodAny,
  ZodUnknown,
  ZodVoid,
  ZodNever,
} from "./primitives.ts";
import {
  ZodObject,
  ZodArray,
  ZodTuple,
  ZodRecord,
  ZodRawShape,
} from "./objects.ts";
import {
  ZodUnion,
  ZodDiscriminatedUnion,
  ZodIntersection,
  ZodPromise,
  ZodFunction,
  ZodLazy,
  ZodDefault,
  ZodCatch,
} from "./combinators.ts";
import { ZodEffects, Effect } from "./refinements.ts";

/**
 * Main Zod namespace
 */
export const z = {
  /**
   * String schema
   */
  string: (): ZodString => {
    return new ZodString({
      typeName: "ZodString",
      checks: [],
    });
  },

  /**
   * Number schema
   */
  number: (): ZodNumber => {
    return new ZodNumber({
      typeName: "ZodNumber",
      checks: [],
    });
  },

  /**
   * Boolean schema
   */
  boolean: (): ZodBoolean => {
    return new ZodBoolean({
      typeName: "ZodBoolean",
    });
  },

  /**
   * Date schema
   */
  date: (): ZodDate => {
    return new ZodDate({
      typeName: "ZodDate",
      checks: [],
    });
  },

  /**
   * Literal schema
   */
  literal: <T extends string | number | boolean>(value: T): ZodLiteral<T> => {
    return new ZodLiteral({
      typeName: "ZodLiteral",
      value,
    });
  },

  /**
   * Enum schema
   */
  enum: <T extends [string, ...string[]]>(values: T): ZodEnum<T> => {
    return new ZodEnum({
      typeName: "ZodEnum",
      values,
    });
  },

  /**
   * Native enum schema
   */
  nativeEnum: <T extends Record<string, string | number>>(values: T): ZodNativeEnum<T> => {
    return new ZodNativeEnum({
      typeName: "ZodNativeEnum",
      values,
    });
  },

  /**
   * Object schema
   */
  object: <T extends ZodRawShape>(shape: T): ZodObject<T> => {
    return new ZodObject({
      typeName: "ZodObject",
      shape,
      unknownKeys: "strip",
      catchall: null,
    });
  },

  /**
   * Array schema
   */
  array: <T extends ZodType<any, any, any>>(schema: T): ZodArray<T> => {
    return new ZodArray({
      typeName: "ZodArray",
      type: schema,
      minLength: null,
      maxLength: null,
      exactLength: null,
    });
  },

  /**
   * Tuple schema
   */
  tuple: <T extends [ZodType<any, any, any>, ...ZodType<any, any, any>[]]>(items: T): ZodTuple<T> => {
    return new ZodTuple({
      typeName: "ZodTuple",
      items,
      rest: null,
    });
  },

  /**
   * Record schema
   */
  record: <K extends ZodType<any, any, any>, V extends ZodType<any, any, any>>(
    keyType: K,
    valueType: V
  ): ZodRecord<K, V> => {
    return new ZodRecord({
      typeName: "ZodRecord",
      keyType,
      valueType,
    });
  },

  /**
   * Union schema
   */
  union: <T extends [ZodType<any, any, any>, ...ZodType<any, any, any>[]]>(options: T): ZodUnion<T> => {
    return new ZodUnion({
      typeName: "ZodUnion",
      options,
    });
  },

  /**
   * Discriminated union schema
   */
  discriminatedUnion: <
    Discriminator extends string,
    Options extends ZodType<any, any, any>[]
  >(
    discriminator: Discriminator,
    options: Options
  ): ZodDiscriminatedUnion<Discriminator, Options> => {
    const optionsMap = new Map();
    for (const option of options) {
      if ((option as any)._def.typeName !== "ZodObject") {
        throw new Error("Discriminated union options must be object schemas");
      }
      const shape = (option as any)._def.shape;
      const discriminatorSchema = shape[discriminator];
      if (!discriminatorSchema) {
        throw new Error(`Discriminator property '${discriminator}' not found in option`);
      }
      if ((discriminatorSchema as any)._def.typeName === "ZodLiteral") {
        const value = (discriminatorSchema as any)._def.value;
        optionsMap.set(value, option);
      } else if ((discriminatorSchema as any)._def.typeName === "ZodEnum") {
        const values = (discriminatorSchema as any)._def.values;
        for (const value of values) {
          optionsMap.set(value, option);
        }
      }
    }
    return new ZodDiscriminatedUnion({
      typeName: "ZodDiscriminatedUnion",
      discriminator,
      options,
      optionsMap,
    });
  },

  /**
   * Intersection schema
   */
  intersection: <A extends ZodType<any, any, any>, B extends ZodType<any, any, any>>(
    left: A,
    right: B
  ): ZodIntersection<A, B> => {
    return new ZodIntersection({
      typeName: "ZodIntersection",
      left,
      right,
    });
  },

  /**
   * Promise schema
   */
  promise: <T extends ZodType<any, any, any>>(schema: T): ZodPromise<T> => {
    return new ZodPromise({
      typeName: "ZodPromise",
      type: schema,
    });
  },

  /**
   * Function schema
   */
  function: <Args extends ZodTuple<any>, Returns extends ZodType<any, any, any>>(
    args?: Args,
    returns?: Returns
  ): ZodFunction<Args, Returns> => {
    return new ZodFunction({
      typeName: "ZodFunction",
      args: args || (z.tuple([]) as any),
      returns: returns || (z.unknown() as any),
    });
  },

  /**
   * Lazy schema (for recursive types)
   */
  lazy: <T extends ZodType<any, any, any>>(getter: () => T): ZodLazy<T> => {
    return new ZodLazy({
      typeName: "ZodLazy",
      getter,
    });
  },

  /**
   * Undefined schema
   */
  undefined: (): ZodUndefined => {
    return new ZodUndefined({
      typeName: "ZodUndefined",
    });
  },

  /**
   * Null schema
   */
  null: (): ZodNull => {
    return new ZodNull({
      typeName: "ZodNull",
    });
  },

  /**
   * Any schema
   */
  any: (): ZodAny => {
    return new ZodAny({
      typeName: "ZodAny",
    });
  },

  /**
   * Unknown schema
   */
  unknown: (): ZodUnknown => {
    return new ZodUnknown({
      typeName: "ZodUnknown",
    });
  },

  /**
   * Void schema
   */
  void: (): ZodVoid => {
    return new ZodVoid({
      typeName: "ZodVoid",
    });
  },

  /**
   * Never schema
   */
  never: (): ZodNever => {
    return new ZodNever({
      typeName: "ZodNever",
    });
  },

  /**
   * Coerce string
   */
  coerce: {
    string: (): ZodEffects<ZodString> => {
      return z.preprocess((val) => String(val), z.string());
    },
    number: (): ZodEffects<ZodNumber> => {
      return z.preprocess((val) => Number(val), z.number());
    },
    boolean: (): ZodEffects<ZodBoolean> => {
      return z.preprocess((val) => Boolean(val), z.boolean());
    },
    date: (): ZodEffects<ZodDate> => {
      return z.preprocess((val) => {
        if (val instanceof Date) return val;
        if (typeof val === "string" || typeof val === "number") return new Date(val);
        return val;
      }, z.date());
    },
  },

  /**
   * Preprocess
   */
  preprocess: <T extends ZodType<any, any, any>>(
    preprocess: (val: unknown) => unknown,
    schema: T
  ): ZodEffects<T> => {
    return new ZodEffects({
      typeName: "ZodEffects",
      schema,
      effect: { type: "preprocess", preprocess },
    });
  },
};

/**
 * Add refine, transform, and default methods to all ZodType instances
 */
declare module "./types.ts" {
  interface ZodType<Output, Def extends ZodTypeDef, Input> {
    refine(
      check: (value: Output) => boolean,
      message?: string | { message: string }
    ): ZodEffects<this, Output, Input>;

    transform<NewOut>(
      transform: (value: Output) => NewOut
    ): ZodEffects<this, NewOut, Input>;

    default(defaultValue: Output | (() => Output)): ZodDefault<this>;

    catch(catchValue: Output | (() => Output)): ZodCatch<this>;
  }
}

// Implement the methods
ZodType.prototype.refine = function (check, messageOrObj) {
  const message = typeof messageOrObj === "string" ? messageOrObj : messageOrObj?.message;
  return new ZodEffects({
    typeName: "ZodEffects",
    schema: this,
    effect: { type: "refinement", refinement: check, message },
  });
};

ZodType.prototype.transform = function (transform) {
  return new ZodEffects({
    typeName: "ZodEffects",
    schema: this,
    effect: { type: "transform", transform },
  });
};

ZodType.prototype.default = function (defaultValue) {
  const getDefault = typeof defaultValue === "function" ? defaultValue : () => defaultValue;
  return new ZodDefault({
    typeName: "ZodDefault",
    innerType: this,
    defaultValue: getDefault,
  });
};

ZodType.prototype.catch = function (catchValue) {
  const getCatch = typeof catchValue === "function" ? catchValue : () => catchValue;
  return new ZodCatch({
    typeName: "ZodCatch",
    innerType: this,
    catchValue: getCatch,
  });
};

// Export types
export type {
  ZodType,
  ZodError,
  ZodIssue,
  ZodRawShape,
  input,
  output,
  infer as TypeOf,
} from "./types.ts";

export type {
  ZodString,
  ZodNumber,
  ZodBoolean,
  ZodDate,
  ZodLiteral,
  ZodEnum,
  ZodNativeEnum,
} from "./primitives.ts";

export type {
  ZodObject,
  ZodArray,
  ZodTuple,
  ZodRecord,
} from "./objects.ts";

export type {
  ZodUnion,
  ZodIntersection,
  ZodPromise,
  ZodFunction,
} from "./combinators.ts";

export type { ZodEffects } from "./refinements.ts";

// Re-export error classes
export { ZodError } from "./types.ts";

// Default export
export default z;
