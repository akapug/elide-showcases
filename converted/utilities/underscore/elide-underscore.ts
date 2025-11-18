/**
 * Underscore.js for Elide
 *
 * Functional programming utilities:
 * - Collection methods (each, map, reduce, filter, etc.)
 * - Array functions (first, last, compact, flatten, etc.)
 * - Function utilities (bind, partial, memoize, etc.)
 * - Object utilities (keys, values, extend, etc.)
 *
 * Pure TypeScript, zero dependencies, polyglot-ready
 * NPM: 10M+ downloads/week
 */

// Collection functions
export function each<T>(
  list: T[],
  iteratee: (value: T, index: number, list: T[]) => void
): T[] {
  for (let i = 0; i < list.length; i++) {
    iteratee(list[i], i, list);
  }
  return list;
}

export function map<T, U>(
  list: T[],
  iteratee: (value: T, index: number, list: T[]) => U
): U[] {
  return list.map((val, idx) => iteratee(val, idx, list));
}

export function reduce<T, U>(
  list: T[],
  iteratee: (memo: U, value: T, index: number, list: T[]) => U,
  memo: U
): U {
  return list.reduce((acc, val, idx) => iteratee(acc, val, idx, list), memo);
}

export function filter<T>(
  list: T[],
  predicate: (value: T, index: number, list: T[]) => boolean
): T[] {
  return list.filter((val, idx) => predicate(val, idx, list));
}

export function find<T>(
  list: T[],
  predicate: (value: T, index: number, list: T[]) => boolean
): T | undefined {
  return list.find((val, idx) => predicate(val, idx, list));
}

export function reject<T>(
  list: T[],
  predicate: (value: T, index: number, list: T[]) => boolean
): T[] {
  return list.filter((val, idx) => !predicate(val, idx, list));
}

export function every<T>(
  list: T[],
  predicate: (value: T, index: number, list: T[]) => boolean
): boolean {
  return list.every((val, idx) => predicate(val, idx, list));
}

export function some<T>(
  list: T[],
  predicate: (value: T, index: number, list: T[]) => boolean
): boolean {
  return list.some((val, idx) => predicate(val, idx, list));
}

export function contains<T>(list: T[], value: T): boolean {
  return list.includes(value);
}

export function pluck<T, K extends keyof T>(list: T[], key: K): T[K][] {
  return list.map(item => item[key]);
}

// Array functions
export function first<T>(array: T[], n?: number): T | T[] | undefined {
  if (n === undefined) return array[0];
  return array.slice(0, n);
}

export function last<T>(array: T[], n?: number): T | T[] | undefined {
  if (n === undefined) return array[array.length - 1];
  return array.slice(-n);
}

export function initial<T>(array: T[], n = 1): T[] {
  return array.slice(0, -n);
}

export function rest<T>(array: T[], n = 1): T[] {
  return array.slice(n);
}

export function compact<T>(array: (T | null | undefined | false | 0 | '')[]): T[] {
  return array.filter(Boolean) as T[];
}

export function flatten(array: any[], shallow = false): any[] {
  if (shallow) return array.flat(1);
  return array.flat(Infinity);
}

export function without<T>(array: T[], ...values: T[]): T[] {
  return array.filter(item => !values.includes(item));
}

export function union<T>(...arrays: T[][]): T[] {
  return Array.from(new Set(arrays.flat()));
}

export function intersection<T>(...arrays: T[][]): T[] {
  if (arrays.length === 0) return [];
  const [first, ...rest] = arrays;
  return Array.from(new Set(first)).filter(item =>
    rest.every(arr => arr.includes(item))
  );
}

export function difference<T>(array: T[], ...others: T[][]): T[] {
  const exclude = new Set(others.flat());
  return array.filter(item => !exclude.has(item));
}

export function uniq<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

export function zip<T>(...arrays: T[][]): T[][] {
  const length = Math.max(...arrays.map(arr => arr.length));
  const result: T[][] = [];
  for (let i = 0; i < length; i++) {
    result.push(arrays.map(arr => arr[i]));
  }
  return result;
}

// Object functions
export function keys<T extends object>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}

export function values<T extends object>(obj: T): T[keyof T][] {
  return Object.values(obj);
}

export function pairs<T extends object>(obj: T): [keyof T, T[keyof T]][] {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
}

export function extend<T extends object>(...objects: Partial<T>[]): T {
  return Object.assign({}, ...objects) as T;
}

export function pick<T extends object, K extends keyof T>(
  obj: T,
  ...keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (key in obj) result[key] = obj[key];
  });
  return result;
}

export function omit<T extends object, K extends keyof T>(
  obj: T,
  ...keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result as Omit<T, K>;
}

export function defaults<T extends object>(...objects: Partial<T>[]): T {
  const result = {} as T;
  objects.reverse().forEach(obj => Object.assign(result, obj));
  return result;
}

export function has<T extends object>(obj: T, key: keyof T): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

// Function utilities
export function bind<T extends (...args: any[]) => any>(
  func: T,
  context: any,
  ...args: any[]
): T {
  return function (this: any, ...moreArgs: any[]) {
    return func.apply(context, [...args, ...moreArgs]);
  } as T;
}

export function partial<T extends (...args: any[]) => any>(
  func: T,
  ...args: any[]
): T {
  return function (this: any, ...moreArgs: any[]) {
    return func.apply(this, [...args, ...moreArgs]);
  } as T;
}

export function memoize<T extends (...args: any[]) => any>(
  func: T,
  hasher?: (...args: any[]) => string
): T {
  const cache = new Map();
  return function (this: any, ...args: any[]) {
    const key = hasher ? hasher(...args) : JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = func.apply(this, args);
    cache.set(key, result);
    return result;
  } as T;
}

export function delay(func: Function, wait: number, ...args: any[]): void {
  setTimeout(() => func(...args), wait);
}

export function defer(func: Function, ...args: any[]): void {
  setTimeout(() => func(...args), 0);
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T {
  let inThrottle = false;
  return function (this: any, ...args: any[]) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, wait);
    }
  } as T;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T {
  let timeout: any;
  return function (this: any, ...args: any[]) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  } as T;
}

export function once<T extends (...args: any[]) => any>(func: T): T {
  let called = false;
  let result: any;
  return function (this: any, ...args: any[]) {
    if (!called) {
      called = true;
      result = func.apply(this, args);
    }
    return result;
  } as T;
}

// Utility functions
export function identity<T>(value: T): T {
  return value;
}

export function noop(): void {
  // Do nothing
}

export function times<T>(n: number, iteratee: (i: number) => T): T[] {
  const result: T[] = [];
  for (let i = 0; i < n; i++) {
    result.push(iteratee(i));
  }
  return result;
}

export function random(min: number, max?: number): number {
  if (max === undefined) {
    max = min;
    min = 0;
  }
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// CLI Demo
if (import.meta.url.includes("underscore")) {
  console.log("🎯 Underscore.js for Elide - Functional Programming Utilities\n");

  console.log("=== Collection Operations ===");
  const numbers = [1, 2, 3, 4, 5];
  console.log("map([1,2,3,4,5], n => n * 2):", map(numbers, n => n * 2));
  console.log("filter([1,2,3,4,5], n => n % 2 === 0):", filter(numbers, n => n % 2 === 0));
  console.log("reduce([1,2,3,4,5], (sum, n) => sum + n, 0):", reduce(numbers, (sum, n) => sum + n, 0));
  console.log();

  console.log("=== Array Operations ===");
  console.log("first([1,2,3,4,5]):", first(numbers));
  console.log("last([1,2,3,4,5]):", last(numbers));
  console.log("compact([0, 1, false, 2, '', 3]):", compact([0, 1, false, 2, '', 3]));
  console.log("uniq([1,2,2,3,3,3]):", uniq([1,2,2,3,3,3]));
  console.log();

  console.log("=== Object Operations ===");
  const obj = { a: 1, b: 2, c: 3 };
  console.log("keys({a:1,b:2,c:3}):", keys(obj));
  console.log("values({a:1,b:2,c:3}):", values(obj));
  console.log("pick({a:1,b:2,c:3}, 'a', 'c'):", pick(obj, 'a', 'c'));
  console.log();

  console.log("=== Function Utilities ===");
  const add = (a: number, b: number) => a + b;
  const add5 = partial(add, 5);
  console.log("partial(add, 5)(10):", add5(10));
  const factorial = memoize((n: number): number => n <= 1 ? 1 : n * factorial(n - 1));
  console.log("memoize(factorial)(5):", factorial(5));
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Functional programming");
  console.log("- Collection transformations");
  console.log("- Array manipulation");
  console.log("- Function composition");
  console.log();

  console.log("🚀 Polyglot Benefits:");
  console.log("- 10M+ npm downloads/week");
  console.log("- Zero dependencies");
  console.log("- Works in TypeScript, Python, Ruby, Java");
  console.log("- Instant startup on Elide");
}

export default {
  each, map, reduce, filter, find, reject, every, some, contains, pluck,
  first, last, initial, rest, compact, flatten, without, union, intersection, difference, uniq, zip,
  keys, values, pairs, extend, pick, omit, defaults, has,
  bind, partial, memoize, delay, defer, throttle, debounce, once,
  identity, noop, times, random
};
