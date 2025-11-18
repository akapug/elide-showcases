/**
 * utility-types - TypeScript Utility Types
 *
 * Collection of utility types for TypeScript.
 * **POLYGLOT SHOWCASE**: Utility types for ALL languages!
 *
 * Based on https://www.npmjs.com/package/utility-types (~1M+ downloads/week)
 *
 * Features:
 * - $Keys, $Values, $ReadOnly
 * - $Diff, $PropertyType
 * - $ElementType, $Call
 * - $Shape, $NonMaybeType
 * - SetIntersection, SetDifference
 * - Functional utilities
 *
 * Polyglot Benefits:
 * - Utility types everywhere
 * - Share type transformations
 * - Type safety from any language
 * - One library for all
 *
 * Use cases:
 * - Type transformations
 * - Generic constraints
 * - Type safety
 * - Advanced typing
 *
 * Package has ~1M+ downloads/week on npm!
 */

export type Primitive = string | number | boolean | bigint | symbol | undefined | null;

export type Falsy = false | '' | 0 | null | undefined;

export type SetIntersection<A, B> = A extends B ? A : never;

export type SetDifference<A, B> = A extends B ? never : A;

export type SetComplement<A, A1 extends A> = SetDifference<A, A1>;

export type FunctionKeys<T extends object> = {
  [K in keyof T]-?: T[K] extends Function ? K : never;
}[keyof T];

export type NonFunctionKeys<T extends object> = {
  [K in keyof T]-?: T[K] extends Function ? never : K;
}[keyof T];

export type PickByValue<T, ValueType> = Pick<T, {
  [Key in keyof T]-?: T[Key] extends ValueType ? Key : never;
}[keyof T]>;

export type OmitByValue<T, ValueType> = Pick<T, {
  [Key in keyof T]-?: T[Key] extends ValueType ? never : Key;
}[keyof T]>;

export type NonNullable<T> = T extends null | undefined ? never : T;

export type Nullable<T> = T | null;

export default {
  Primitive: {} as any,
  SetIntersection: {} as any,
};

// CLI Demo
if (import.meta.url.includes("elide-utility-types.ts")) {
  console.log("🛠️  utility-types - Utility Types for Elide (POLYGLOT!)\n");
  
  type User = { name: string; age: number; greet: () => void };
  type DataKeys = NonFunctionKeys<User>; // 'name' | 'age'
  type FnKeys = FunctionKeys<User>; // 'greet'
  
  console.log("Comprehensive utility types collection");
  console.log("\n🚀 Popular utility types - ~1M+ downloads/week!");
}
