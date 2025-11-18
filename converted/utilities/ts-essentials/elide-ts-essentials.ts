/**
 * ts-essentials - TypeScript Essential Types
 *
 * Essential TypeScript utility types and helpers.
 * **POLYGLOT SHOWCASE**: Essential types for ALL languages!
 *
 * Based on https://www.npmjs.com/package/ts-essentials (~150K+ downloads/week)
 *
 * Features:
 * - DeepPartial & DeepRequired
 * - Opaque types
 * - Branded types
 * - MarkRequired & MarkOptional
 * - ValueOf & KeysOf
 * - Utility type helpers
 *
 * Polyglot Benefits:
 * - Essential types everywhere
 * - Share type utilities
 * - Type safety from any language
 * - One utility library for all
 *
 * Use cases:
 * - Type transformations
 * - Type safety
 * - Advanced typing
 * - Generic constraints
 *
 * Package has ~150K+ downloads/week on npm!
 */

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

export type MarkRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

export type MarkOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type ValueOf<T> = T[keyof T];

export type Opaque<T, K> = T & { readonly __TYPE__: K };

export type Newtype<T, K> = Opaque<T, K>;

export default {
  DeepPartial: {} as any,
  DeepRequired: {} as any,
  DeepReadonly: {} as any,
};

// CLI Demo
if (import.meta.url.includes("elide-ts-essentials.ts")) {
  console.log("🔧 ts-essentials - Essential Types for Elide (POLYGLOT!)\n");
  
  type User = { name: string; age: number; email?: string };
  type PartialUser = DeepPartial<User>;
  type RequiredUser = MarkRequired<User, 'email'>;
  
  console.log("Essential TypeScript utility types");
  console.log("\n🚀 Essential type utilities - ~150K+ downloads/week!");
}
