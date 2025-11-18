/**
 * Refinements, transformations, and preprocessing for Zod validation
 */

import { ZodType, ZodTypeDef, RefinementFunction, TransformFunction } from "./types.ts";
import { throwError, customError } from "./errors.ts";

/**
 * Effect types
 */
export type Effect =
  | { type: "refinement"; refinement: RefinementFunction<any>; message?: string }
  | { type: "transform"; transform: TransformFunction<any, any> }
  | { type: "preprocess"; preprocess: (value: unknown) => unknown };

/**
 * Effects schema (for refinements and transformations)
 */
export interface ZodEffectsDef<T extends ZodType<any, any, any>> extends ZodTypeDef {
  typeName: "ZodEffects";
  schema: T;
  effect: Effect;
}

export class ZodEffects<
  T extends ZodType<any, any, any>,
  Output = T["_output"],
  Input = T["_input"]
> extends ZodType<Output, ZodEffectsDef<T>, Input> {
  _parse(value: unknown): Output {
    const effect = this._def.effect;

    if (effect.type === "preprocess") {
      value = effect.preprocess(value);
    }

    const result = this._def.schema._parse(value);

    if (effect.type === "refinement") {
      if (!effect.refinement(result)) {
        throwError(customError(effect.message || "Invalid value"));
      }
      return result as Output;
    }

    if (effect.type === "transform") {
      return effect.transform(result) as Output;
    }

    return result as Output;
  }

  sourceType(): T {
    return this._def.schema;
  }
}

// Type aliases for better naming
export type ZodTransformer<
  T extends ZodType<any, any, any>,
  Output = T["_output"],
  Input = T["_input"]
> = ZodEffects<T, Output, Input>;

export type ZodRefinement<T extends ZodType<any, any, any>> = ZodEffects<T, T["_output"], T["_input"]>;
