/**
 * Error handling and issue types for Zod
 */

import { ZodIssue, ZodError } from "./types.ts";

export { ZodError, ZodIssue };

/**
 * Error codes
 */
export const ZodIssueCode = {
  invalid_type: "invalid_type",
  invalid_literal: "invalid_literal",
  custom: "custom",
  invalid_union: "invalid_union",
  invalid_union_discriminator: "invalid_union_discriminator",
  invalid_enum_value: "invalid_enum_value",
  unrecognized_keys: "unrecognized_keys",
  invalid_arguments: "invalid_arguments",
  invalid_return_type: "invalid_return_type",
  invalid_date: "invalid_date",
  invalid_string: "invalid_string",
  too_small: "too_small",
  too_big: "too_big",
  invalid_intersection_types: "invalid_intersection_types",
  not_multiple_of: "not_multiple_of",
  not_finite: "not_finite",
} as const;

export type ZodIssueCode = keyof typeof ZodIssueCode;

/**
 * Create a type error issue
 */
export function makeIssue(params: {
  code: string;
  path?: (string | number)[];
  message?: string;
  expected?: string;
  received?: string;
}): ZodIssue {
  return {
    code: params.code,
    path: params.path || [],
    message: params.message || `Validation error at ${params.path?.join('.') || 'root'}`,
    expected: params.expected,
    received: params.received,
  };
}

/**
 * Create a type mismatch error
 */
export function typeError(
  expected: string,
  received: unknown,
  path: (string | number)[] = []
): ZodIssue {
  const receivedType = typeof received;
  return makeIssue({
    code: ZodIssueCode.invalid_type,
    path,
    message: `Expected ${expected}, received ${receivedType}`,
    expected,
    received: receivedType,
  });
}

/**
 * Create a too small error
 */
export function tooSmallError(
  type: string,
  minimum: number,
  inclusive: boolean,
  actual: number,
  path: (string | number)[] = []
): ZodIssue {
  const comparison = inclusive ? "at least" : "more than";
  return makeIssue({
    code: ZodIssueCode.too_small,
    path,
    message: `${type} must be ${comparison} ${minimum}, got ${actual}`,
  });
}

/**
 * Create a too big error
 */
export function tooBigError(
  type: string,
  maximum: number,
  inclusive: boolean,
  actual: number,
  path: (string | number)[] = []
): ZodIssue {
  const comparison = inclusive ? "at most" : "less than";
  return makeIssue({
    code: ZodIssueCode.too_big,
    path,
    message: `${type} must be ${comparison} ${maximum}, got ${actual}`,
  });
}

/**
 * Create an invalid string error
 */
export function invalidStringError(
  validation: string,
  path: (string | number)[] = []
): ZodIssue {
  return makeIssue({
    code: ZodIssueCode.invalid_string,
    path,
    message: `Invalid ${validation}`,
  });
}

/**
 * Create a custom error
 */
export function customError(
  message: string,
  path: (string | number)[] = []
): ZodIssue {
  return makeIssue({
    code: ZodIssueCode.custom,
    path,
    message,
  });
}

/**
 * Throw a Zod error
 */
export function throwError(issues: ZodIssue | ZodIssue[]): never {
  throw new ZodError(Array.isArray(issues) ? issues : [issues]);
}

/**
 * Get type of value
 */
export function getType(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (Array.isArray(value)) return "array";
  if (value instanceof Date) return "date";
  return typeof value;
}
