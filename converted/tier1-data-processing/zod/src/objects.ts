/**
 * Object, array, tuple, and record types for Zod validation
 */

import { ZodType, ZodTypeDef, ZodError } from "./types.ts";
import { typeError, throwError, customError, makeIssue } from "./errors.ts";

/**
 * Object schema
 */
export type ZodRawShape = { [key: string]: ZodType<any, any, any> };

export interface ZodObjectDef<T extends ZodRawShape = ZodRawShape> extends ZodTypeDef {
  typeName: "ZodObject";
  shape: T;
  unknownKeys: "strip" | "strict" | "passthrough";
  catchall: ZodType<any, any, any> | null;
}

export type objectOutputType<T extends ZodRawShape> = {
  [K in keyof T]: T[K]["_output"];
};

export type objectInputType<T extends ZodRawShape> = {
  [K in keyof T]: T[K]["_input"];
};

export class ZodObject<T extends ZodRawShape> extends ZodType<
  objectOutputType<T>,
  ZodObjectDef<T>,
  objectInputType<T>
> {
  _parse(value: unknown): objectOutputType<T> {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      throwError(typeError("object", value));
    }

    const result: any = {};
    const issues: any[] = [];
    const shape = this._def.shape;
    const inputObj = value as Record<string, unknown>;

    // Validate known keys
    for (const key in shape) {
      try {
        result[key] = shape[key]._parse(inputObj[key]);
      } catch (error) {
        if (error instanceof ZodError) {
          for (const issue of error.issues) {
            issues.push({
              ...issue,
              path: [key, ...issue.path],
            });
          }
        } else {
          issues.push(makeIssue({
            code: "custom",
            path: [key],
            message: String(error),
          }));
        }
      }
    }

    // Handle unknown keys
    const knownKeys = new Set(Object.keys(shape));
    const unknownKeys = Object.keys(inputObj).filter(k => !knownKeys.has(k));

    if (unknownKeys.length > 0) {
      if (this._def.unknownKeys === "strict") {
        issues.push(makeIssue({
          code: "unrecognized_keys",
          message: `Unrecognized key(s): ${unknownKeys.join(', ')}`,
        }));
      } else if (this._def.unknownKeys === "passthrough") {
        for (const key of unknownKeys) {
          result[key] = inputObj[key];
        }
      }
      // "strip" mode: do nothing, just ignore unknown keys
    }

    if (issues.length > 0) {
      throw new ZodError(issues);
    }

    return result;
  }

  /**
   * Get the shape of the object
   */
  get shape(): T {
    return this._def.shape;
  }

  /**
   * Make all fields optional
   */
  partial(): ZodObject<{ [K in keyof T]: ZodType<T[K]["_output"] | undefined> }> {
    const newShape: any = {};
    for (const key in this._def.shape) {
      newShape[key] = this._def.shape[key].optional();
    }
    return new ZodObject({
      ...this._def,
      shape: newShape,
    }) as any;
  }

  /**
   * Make all fields required
   */
  required(): ZodObject<{ [K in keyof T]: ZodType<Exclude<T[K]["_output"], undefined>> }> {
    const newShape: any = {};
    for (const key in this._def.shape) {
      const field = this._def.shape[key];
      // Unwrap optional
      if ((field as any)._def?.typeName === "ZodOptional") {
        newShape[key] = (field as any)._def.innerType;
      } else {
        newShape[key] = field;
      }
    }
    return new ZodObject({
      ...this._def,
      shape: newShape,
    }) as any;
  }

  /**
   * Pick specific keys
   */
  pick<Mask extends { [K in keyof T]?: true }>(mask: Mask): ZodObject<{
    [K in keyof Mask]: K extends keyof T ? T[K] : never;
  }> {
    const newShape: any = {};
    for (const key in mask) {
      if (key in this._def.shape) {
        newShape[key] = this._def.shape[key];
      }
    }
    return new ZodObject({
      ...this._def,
      shape: newShape,
    }) as any;
  }

  /**
   * Omit specific keys
   */
  omit<Mask extends { [K in keyof T]?: true }>(mask: Mask): ZodObject<{
    [K in keyof T as K extends keyof Mask ? never : K]: T[K];
  }> {
    const newShape: any = {};
    for (const key in this._def.shape) {
      if (!(key in mask)) {
        newShape[key] = this._def.shape[key];
      }
    }
    return new ZodObject({
      ...this._def,
      shape: newShape,
    }) as any;
  }

  /**
   * Extend with additional fields
   */
  extend<Additional extends ZodRawShape>(
    additional: Additional
  ): ZodObject<T & Additional> {
    return new ZodObject({
      ...this._def,
      shape: { ...this._def.shape, ...additional },
    }) as any;
  }

  /**
   * Merge with another object schema
   */
  merge<Other extends ZodRawShape>(
    other: ZodObject<Other>
  ): ZodObject<T & Other> {
    return this.extend(other._def.shape);
  }

  /**
   * Allow unknown keys (passthrough mode)
   */
  passthrough(): ZodObject<T> {
    return new ZodObject({
      ...this._def,
      unknownKeys: "passthrough",
    });
  }

  /**
   * Disallow unknown keys (strict mode)
   */
  strict(): ZodObject<T> {
    return new ZodObject({
      ...this._def,
      unknownKeys: "strict",
    });
  }

  /**
   * Strip unknown keys (default mode)
   */
  strip(): ZodObject<T> {
    return new ZodObject({
      ...this._def,
      unknownKeys: "strip",
    });
  }

  /**
   * Set a catchall schema for unknown keys
   */
  catchall<C extends ZodType<any, any, any>>(catchall: C): ZodObject<T> {
    return new ZodObject({
      ...this._def,
      catchall,
    });
  }

  /**
   * Get keys of the object
   */
  keyof(): ZodEnum<[keyof T & string, ...(keyof T & string)[]]> {
    const keys = Object.keys(this._def.shape) as [keyof T & string, ...(keyof T & string)[]];
    return new ZodEnum({ typeName: "ZodEnum", values: keys });
  }
}

/**
 * Array schema
 */
export interface ZodArrayDef<T extends ZodType<any, any, any>> extends ZodTypeDef {
  typeName: "ZodArray";
  type: T;
  minLength: { value: number; message?: string } | null;
  maxLength: { value: number; message?: string } | null;
  exactLength: { value: number; message?: string } | null;
}

export class ZodArray<T extends ZodType<any, any, any>> extends ZodType<
  T["_output"][],
  ZodArrayDef<T>,
  T["_input"][]
> {
  _parse(value: unknown): T["_output"][] {
    if (!Array.isArray(value)) {
      throwError(typeError("array", value));
    }

    const { minLength, maxLength, exactLength } = this._def;

    if (exactLength && value.length !== exactLength.value) {
      throwError(customError(exactLength.message || `Array must have exactly ${exactLength.value} elements`));
    }

    if (minLength && value.length < minLength.value) {
      throwError(customError(minLength.message || `Array must have at least ${minLength.value} elements`));
    }

    if (maxLength && value.length > maxLength.value) {
      throwError(customError(maxLength.message || `Array must have at most ${maxLength.value} elements`));
    }

    const result: T["_output"][] = [];
    const issues: any[] = [];

    for (let i = 0; i < value.length; i++) {
      try {
        result.push(this._def.type._parse(value[i]));
      } catch (error) {
        if (error instanceof ZodError) {
          for (const issue of error.issues) {
            issues.push({
              ...issue,
              path: [i, ...issue.path],
            });
          }
        } else {
          issues.push(makeIssue({
            code: "custom",
            path: [i],
            message: String(error),
          }));
        }
      }
    }

    if (issues.length > 0) {
      throw new ZodError(issues);
    }

    return result;
  }

  get element(): T {
    return this._def.type;
  }

  min(value: number, message?: string): this {
    return new ZodArray({
      ...this._def,
      minLength: { value, message },
    }) as this;
  }

  max(value: number, message?: string): this {
    return new ZodArray({
      ...this._def,
      maxLength: { value, message },
    }) as this;
  }

  length(value: number, message?: string): this {
    return new ZodArray({
      ...this._def,
      exactLength: { value, message },
    }) as this;
  }

  nonempty(message?: string): this {
    return this.min(1, message);
  }
}

/**
 * Tuple schema
 */
export interface ZodTupleDef<T extends [ZodType<any, any, any>, ...ZodType<any, any, any>[]]> extends ZodTypeDef {
  typeName: "ZodTuple";
  items: T;
  rest: ZodType<any, any, any> | null;
}

export type tupleOutputType<T extends [ZodType<any, any, any>, ...ZodType<any, any, any>[]]> = {
  [K in keyof T]: T[K] extends ZodType<any, any, any> ? T[K]["_output"] : never;
};

export type tupleInputType<T extends [ZodType<any, any, any>, ...ZodType<any, any, any>[]]> = {
  [K in keyof T]: T[K] extends ZodType<any, any, any> ? T[K]["_input"] : never;
};

export class ZodTuple<T extends [ZodType<any, any, any>, ...ZodType<any, any, any>[]]> extends ZodType<
  tupleOutputType<T>,
  ZodTupleDef<T>,
  tupleInputType<T>
> {
  _parse(value: unknown): tupleOutputType<T> {
    if (!Array.isArray(value)) {
      throwError(typeError("array", value));
    }

    if (value.length < this._def.items.length) {
      throwError(customError(`Expected tuple of length ${this._def.items.length}, got ${value.length}`));
    }

    if (value.length > this._def.items.length && !this._def.rest) {
      throwError(customError(`Expected tuple of length ${this._def.items.length}, got ${value.length}`));
    }

    const result: any[] = [];
    const issues: any[] = [];

    for (let i = 0; i < this._def.items.length; i++) {
      try {
        result.push(this._def.items[i]._parse(value[i]));
      } catch (error) {
        if (error instanceof ZodError) {
          for (const issue of error.issues) {
            issues.push({
              ...issue,
              path: [i, ...issue.path],
            });
          }
        } else {
          issues.push(makeIssue({
            code: "custom",
            path: [i],
            message: String(error),
          }));
        }
      }
    }

    // Handle rest elements
    if (this._def.rest) {
      for (let i = this._def.items.length; i < value.length; i++) {
        try {
          result.push(this._def.rest._parse(value[i]));
        } catch (error) {
          if (error instanceof ZodError) {
            for (const issue of error.issues) {
              issues.push({
                ...issue,
                path: [i, ...issue.path],
              });
            }
          } else {
            issues.push(makeIssue({
              code: "custom",
              path: [i],
              message: String(error),
            }));
          }
        }
      }
    }

    if (issues.length > 0) {
      throw new ZodError(issues);
    }

    return result as tupleOutputType<T>;
  }

  rest<Rest extends ZodType<any, any, any>>(rest: Rest): ZodTuple<T> {
    return new ZodTuple({
      ...this._def,
      rest,
    });
  }
}

/**
 * Record schema
 */
export interface ZodRecordDef<K extends ZodType<any, any, any>, V extends ZodType<any, any, any>> extends ZodTypeDef {
  typeName: "ZodRecord";
  keyType: K;
  valueType: V;
}

export class ZodRecord<K extends ZodType<any, any, any>, V extends ZodType<any, any, any>> extends ZodType<
  Record<K["_output"], V["_output"]>,
  ZodRecordDef<K, V>,
  Record<K["_input"], V["_input"]>
> {
  _parse(value: unknown): Record<K["_output"], V["_output"]> {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      throwError(typeError("object", value));
    }

    const result: any = {};
    const issues: any[] = [];

    for (const key in value as Record<string, unknown>) {
      try {
        const parsedKey = this._def.keyType._parse(key);
        const parsedValue = this._def.valueType._parse((value as any)[key]);
        result[parsedKey] = parsedValue;
      } catch (error) {
        if (error instanceof ZodError) {
          for (const issue of error.issues) {
            issues.push({
              ...issue,
              path: [key, ...issue.path],
            });
          }
        } else {
          issues.push(makeIssue({
            code: "custom",
            path: [key],
            message: String(error),
          }));
        }
      }
    }

    if (issues.length > 0) {
      throw new ZodError(issues);
    }

    return result;
  }
}

// Import ZodEnum from primitives
import { ZodEnum } from "./primitives.ts";
