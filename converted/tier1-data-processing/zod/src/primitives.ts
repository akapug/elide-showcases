/**
 * Primitive types for Zod validation
 * Includes string, number, boolean, date, literal, enum, etc.
 */

import { ZodType, ZodTypeDef } from "./types.ts";
import {
  typeError,
  tooSmallError,
  tooBigError,
  invalidStringError,
  throwError,
  customError,
  getType,
} from "./errors.ts";

/**
 * String schema
 */
export interface ZodStringDef extends ZodTypeDef {
  typeName: "ZodString";
  checks: Array<
    | { kind: "min"; value: number; message?: string }
    | { kind: "max"; value: number; message?: string }
    | { kind: "length"; value: number; message?: string }
    | { kind: "email"; message?: string }
    | { kind: "url"; message?: string }
    | { kind: "uuid"; message?: string }
    | { kind: "regex"; regex: RegExp; message?: string }
  >;
}

export class ZodString extends ZodType<string, ZodStringDef, string> {
  _parse(value: unknown): string {
    if (typeof value !== "string") {
      throwError(typeError("string", value));
    }

    for (const check of this._def.checks) {
      if (check.kind === "min" && value.length < check.value) {
        throwError(tooSmallError("String", check.value, true, value.length));
      } else if (check.kind === "max" && value.length > check.value) {
        throwError(tooBigError("String", check.value, true, value.length));
      } else if (check.kind === "length" && value.length !== check.value) {
        throwError(customError(`String must be exactly ${check.value} characters`));
      } else if (check.kind === "email" && !isValidEmail(value)) {
        throwError(invalidStringError("email"));
      } else if (check.kind === "url" && !isValidUrl(value)) {
        throwError(invalidStringError("url"));
      } else if (check.kind === "uuid" && !isValidUuid(value)) {
        throwError(invalidStringError("uuid"));
      } else if (check.kind === "regex" && !check.regex.test(value)) {
        throwError(customError(check.message || "Invalid format"));
      }
    }

    return value;
  }

  min(value: number, message?: string): this {
    return this._addCheck({ kind: "min", value, message });
  }

  max(value: number, message?: string): this {
    return this._addCheck({ kind: "max", value, message });
  }

  length(value: number, message?: string): this {
    return this._addCheck({ kind: "length", value, message });
  }

  email(message?: string): this {
    return this._addCheck({ kind: "email", message });
  }

  url(message?: string): this {
    return this._addCheck({ kind: "url", message });
  }

  uuid(message?: string): this {
    return this._addCheck({ kind: "uuid", message });
  }

  regex(regex: RegExp, message?: string): this {
    return this._addCheck({ kind: "regex", regex, message });
  }

  private _addCheck(check: ZodStringDef["checks"][number]): this {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, check],
    }) as this;
  }
}

/**
 * Number schema
 */
export interface ZodNumberDef extends ZodTypeDef {
  typeName: "ZodNumber";
  checks: Array<
    | { kind: "min"; value: number; inclusive: boolean; message?: string }
    | { kind: "max"; value: number; inclusive: boolean; message?: string }
    | { kind: "int"; message?: string }
    | { kind: "multipleOf"; value: number; message?: string }
    | { kind: "finite"; message?: string }
  >;
}

export class ZodNumber extends ZodType<number, ZodNumberDef, number> {
  _parse(value: unknown): number {
    if (typeof value !== "number") {
      throwError(typeError("number", value));
    }

    for (const check of this._def.checks) {
      if (check.kind === "min" && value < check.value) {
        throwError(tooSmallError("Number", check.value, check.inclusive, value));
      } else if (check.kind === "max" && value > check.value) {
        throwError(tooBigError("Number", check.value, check.inclusive, value));
      } else if (check.kind === "int" && !Number.isInteger(value)) {
        throwError(customError("Expected integer, received float"));
      } else if (check.kind === "multipleOf" && value % check.value !== 0) {
        throwError(customError(`Number must be a multiple of ${check.value}`));
      } else if (check.kind === "finite" && !Number.isFinite(value)) {
        throwError(customError("Number must be finite"));
      }
    }

    return value;
  }

  min(value: number, message?: string): this {
    return this._addCheck({ kind: "min", value, inclusive: true, message });
  }

  max(value: number, message?: string): this {
    return this._addCheck({ kind: "max", value, inclusive: true, message });
  }

  gt(value: number, message?: string): this {
    return this._addCheck({ kind: "min", value, inclusive: false, message });
  }

  gte(value: number, message?: string): this {
    return this._addCheck({ kind: "min", value, inclusive: true, message });
  }

  lt(value: number, message?: string): this {
    return this._addCheck({ kind: "max", value, inclusive: false, message });
  }

  lte(value: number, message?: string): this {
    return this._addCheck({ kind: "max", value, inclusive: true, message });
  }

  int(message?: string): this {
    return this._addCheck({ kind: "int", message });
  }

  positive(message?: string): this {
    return this._addCheck({ kind: "min", value: 0, inclusive: false, message });
  }

  nonnegative(message?: string): this {
    return this._addCheck({ kind: "min", value: 0, inclusive: true, message });
  }

  negative(message?: string): this {
    return this._addCheck({ kind: "max", value: 0, inclusive: false, message });
  }

  nonpositive(message?: string): this {
    return this._addCheck({ kind: "max", value: 0, inclusive: true, message });
  }

  multipleOf(value: number, message?: string): this {
    return this._addCheck({ kind: "multipleOf", value, message });
  }

  finite(message?: string): this {
    return this._addCheck({ kind: "finite", message });
  }

  private _addCheck(check: ZodNumberDef["checks"][number]): this {
    return new ZodNumber({
      ...this._def,
      checks: [...this._def.checks, check],
    }) as this;
  }
}

/**
 * Boolean schema
 */
export interface ZodBooleanDef extends ZodTypeDef {
  typeName: "ZodBoolean";
}

export class ZodBoolean extends ZodType<boolean, ZodBooleanDef, boolean> {
  _parse(value: unknown): boolean {
    if (typeof value !== "boolean") {
      throwError(typeError("boolean", value));
    }
    return value;
  }
}

/**
 * Date schema
 */
export interface ZodDateDef extends ZodTypeDef {
  typeName: "ZodDate";
  checks: Array<
    | { kind: "min"; value: Date; message?: string }
    | { kind: "max"; value: Date; message?: string }
  >;
}

export class ZodDate extends ZodType<Date, ZodDateDef, Date> {
  _parse(value: unknown): Date {
    if (!(value instanceof Date)) {
      throwError(typeError("date", value));
    }

    if (isNaN(value.getTime())) {
      throwError(customError("Invalid date"));
    }

    for (const check of this._def.checks) {
      if (check.kind === "min" && value < check.value) {
        throwError(customError(`Date must be after ${check.value.toISOString()}`));
      } else if (check.kind === "max" && value > check.value) {
        throwError(customError(`Date must be before ${check.value.toISOString()}`));
      }
    }

    return value;
  }

  min(value: Date, message?: string): this {
    return new ZodDate({
      ...this._def,
      checks: [...this._def.checks, { kind: "min", value, message }],
    }) as this;
  }

  max(value: Date, message?: string): this {
    return new ZodDate({
      ...this._def,
      checks: [...this._def.checks, { kind: "max", value, message }],
    }) as this;
  }
}

/**
 * Literal schema
 */
export interface ZodLiteralDef<T> extends ZodTypeDef {
  typeName: "ZodLiteral";
  value: T;
}

export class ZodLiteral<T> extends ZodType<T, ZodLiteralDef<T>, T> {
  _parse(value: unknown): T {
    if (value !== this._def.value) {
      throwError(customError(`Expected literal ${JSON.stringify(this._def.value)}, received ${JSON.stringify(value)}`));
    }
    return value as T;
  }

  get value(): T {
    return this._def.value;
  }
}

/**
 * Enum schema
 */
export interface ZodEnumDef<T extends [string, ...string[]]> extends ZodTypeDef {
  typeName: "ZodEnum";
  values: T;
}

export class ZodEnum<T extends [string, ...string[]]> extends ZodType<T[number], ZodEnumDef<T>, T[number]> {
  _parse(value: unknown): T[number] {
    if (typeof value !== "string" || !this._def.values.includes(value as any)) {
      throwError(customError(`Expected one of [${this._def.values.join(', ')}], received ${JSON.stringify(value)}`));
    }
    return value as T[number];
  }

  get options(): T {
    return this._def.values;
  }

  get enum(): { [K in T[number]]: K } {
    const obj: any = {};
    for (const value of this._def.values) {
      obj[value] = value;
    }
    return obj;
  }
}

/**
 * Native enum schema
 */
export interface ZodNativeEnumDef<T extends Record<string, string | number>> extends ZodTypeDef {
  typeName: "ZodNativeEnum";
  values: T;
}

export class ZodNativeEnum<T extends Record<string, string | number>> extends ZodType<
  T[keyof T],
  ZodNativeEnumDef<T>,
  T[keyof T]
> {
  _parse(value: unknown): T[keyof T] {
    const values = Object.values(this._def.values);
    if (!values.includes(value as any)) {
      throwError(customError(`Invalid enum value. Expected ${values.join(' | ')}, received ${JSON.stringify(value)}`));
    }
    return value as T[keyof T];
  }
}

/**
 * Undefined schema
 */
export class ZodUndefined extends ZodType<undefined, ZodTypeDef, undefined> {
  _parse(value: unknown): undefined {
    if (value !== undefined) {
      throwError(typeError("undefined", value));
    }
    return undefined;
  }
}

/**
 * Null schema
 */
export class ZodNull extends ZodType<null, ZodTypeDef, null> {
  _parse(value: unknown): null {
    if (value !== null) {
      throwError(typeError("null", value));
    }
    return null;
  }
}

/**
 * Any schema
 */
export class ZodAny extends ZodType<any, ZodTypeDef, any> {
  _parse(value: unknown): any {
    return value;
  }
}

/**
 * Unknown schema
 */
export class ZodUnknown extends ZodType<unknown, ZodTypeDef, unknown> {
  _parse(value: unknown): unknown {
    return value;
  }
}

/**
 * Void schema
 */
export class ZodVoid extends ZodType<void, ZodTypeDef, void> {
  _parse(value: unknown): void {
    if (value !== undefined) {
      throwError(typeError("void", value));
    }
    return undefined;
  }
}

/**
 * Never schema
 */
export class ZodNever extends ZodType<never, ZodTypeDef, never> {
  _parse(value: unknown): never {
    throwError(customError("Value should never occur"));
  }
}

// Helper functions
function isValidEmail(value: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function isValidUuid(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}
