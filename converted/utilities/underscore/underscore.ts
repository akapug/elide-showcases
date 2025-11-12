/**
 * Underscore - Functional programming helper library
 * Based on https://www.npmjs.com/package/underscore (~7M downloads/week)
 */

export const map = <T, U>(arr: T[], fn: (item: T) => U): U[] => arr.map(fn);
export const filter = <T>(arr: T[], fn: (item: T) => boolean): T[] => arr.filter(fn);
export const reduce = <T, U>(arr: T[], fn: (acc: U, item: T) => U, init: U): U => arr.reduce(fn, init);
export const each = <T>(arr: T[], fn: (item: T) => void): void => arr.forEach(fn);
export const find = <T>(arr: T[], fn: (item: T) => boolean): T | undefined => arr.find(fn);
export const pluck = <T, K extends keyof T>(arr: T[], key: K): T[K][] => arr.map(x => x[key]);
export const uniq = <T>(arr: T[]): T[] => [...new Set(arr)];
export const groupBy = <T>(arr: T[], fn: (item: T) => string): Record<string, T[]> => {
  const result: Record<string, T[]> = {};
  arr.forEach(item => {
    const key = fn(item);
    if (!result[key]) result[key] = [];
    result[key].push(item);
  });
  return result;
};

const _ = { map, filter, reduce, each, find, pluck, uniq, groupBy };
export default _;

if (import.meta.url.includes("underscore.ts")) {
  console.log("🔧 Underscore - Functional utilities for Elide\n");
  console.log("map([1,2,3], x => x*2):", map([1,2,3], x => x*2));
  console.log("filter([1,2,3,4], x => x>2):", filter([1,2,3,4], x => x>2));
  console.log("\n~7M+ downloads/week on npm!");
}
