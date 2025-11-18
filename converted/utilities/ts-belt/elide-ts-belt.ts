/**
 * ts-belt - TypeScript Utility Belt
 *
 * Fast, modern, tree-shakeable utility library.
 * **POLYGLOT SHOWCASE**: Utility functions for ALL languages!
 *
 * Based on https://www.npmjs.com/package/@mobily/ts-belt (~30K+ downloads/week)
 *
 * Features:
 * - Functional utilities
 * - Pipe & composition
 * - Array utilities
 * - Object utilities
 * - Option/Result types
 * - Tree-shakeable
 *
 * Polyglot Benefits:
 * - Functional programming everywhere
 * - Share utilities across languages
 * - Type-safe operations
 * - One utility library for all
 *
 * Use cases:
 * - Functional programming
 * - Data transformation
 * - Type-safe operations
 * - Utility functions
 *
 * Package has ~30K+ downloads/week on npm!
 */

export const A = {
  map: <T, U>(arr: T[], fn: (x: T) => U): U[] => arr.map(fn),
  filter: <T>(arr: T[], fn: (x: T) => boolean): T[] => arr.filter(fn),
  reduce: <T, U>(arr: T[], fn: (acc: U, x: T) => U, init: U): U => arr.reduce(fn, init),
  head: <T>(arr: T[]): T | undefined => arr[0],
  tail: <T>(arr: T[]): T[] => arr.slice(1),
};

export const O = {
  keys: <T extends object>(obj: T): (keyof T)[] => Object.keys(obj) as (keyof T)[],
  values: <T extends object>(obj: T): T[keyof T][] => Object.values(obj) as T[keyof T][],
  entries: <T extends object>(obj: T): [keyof T, T[keyof T]][] => Object.entries(obj) as [keyof T, T[keyof T]][],
};

export const pipe = <T>(...fns: Array<(x: any) => any>) => (initial: T) =>
  fns.reduce((acc, fn) => fn(acc), initial);

export default { A, O, pipe };

// CLI Demo
if (import.meta.url.includes("elide-ts-belt.ts")) {
  console.log("🛠️  ts-belt - Utility Belt for Elide (POLYGLOT!)\n");
  
  const nums = [1, 2, 3, 4, 5];
  const doubled = A.map(nums, x => x * 2);
  console.log("Doubled:", doubled);
  
  const obj = { a: 1, b: 2, c: 3 };
  console.log("Keys:", O.keys(obj));
  
  console.log("\n🚀 Fast, modern utilities - ~30K+ downloads/week!");
}
