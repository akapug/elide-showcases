/**
 * Lodash Utility Library for Elide
 *
 * Core utility functions:
 * - Array manipulation (chunk, flatten, uniq, etc.)
 * - Object utilities (merge, pick, omit, etc.)
 * - Collection methods (map, filter, reduce, etc.)
 * - Function utilities (debounce, throttle, memoize)
 * - String manipulation (camelCase, kebabCase, etc.)
 * - Type checking (isArray, isObject, etc.)
 *
 * Pure TypeScript, zero dependencies, polyglot-ready
 * NPM: 150M+ downloads/week
 */

// Array utilities
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function flatten<T>(array: any[]): T[] {
  return array.reduce((acc, val) =>
    Array.isArray(val) ? acc.concat(flatten(val)) : acc.concat(val),
  []);
}

export function uniq<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

export function uniqBy<T>(array: T[], iteratee: (item: T) => any): T[] {
  const seen = new Set();
  return array.filter(item => {
    const key = iteratee(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function compact<T>(array: (T | null | undefined | false | 0 | '')[]): T[] {
  return array.filter(Boolean) as T[];
}

export function difference<T>(array: T[], ...values: T[][]): T[] {
  const exclude = new Set(values.flat());
  return array.filter(item => !exclude.has(item));
}

export function intersection<T>(...arrays: T[][]): T[] {
  if (arrays.length === 0) return [];
  const [first, ...rest] = arrays;
  return uniq(first).filter(item =>
    rest.every(arr => arr.includes(item))
  );
}

// Object utilities
export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (key in obj) result[key] = obj[key];
  });
  return result;
}

export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result as Omit<T, K>;
}

export function merge<T extends object>(...objects: Partial<T>[]): T {
  return Object.assign({}, ...objects) as T;
}

export function cloneDeep<T>(value: T): T {
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof Date) return new Date(value.getTime()) as any;
  if (Array.isArray(value)) return value.map(item => cloneDeep(item)) as any;

  const clone = {} as T;
  for (const key in value) {
    if (value.hasOwnProperty(key)) {
      clone[key] = cloneDeep(value[key]);
    }
  }
  return clone;
}

export function get<T = any>(
  obj: any,
  path: string | string[],
  defaultValue?: T
): T {
  const keys = Array.isArray(path) ? path : path.split('.');
  let result = obj;

  for (const key of keys) {
    if (result == null) return defaultValue as T;
    result = result[key];
  }

  return result === undefined ? defaultValue as T : result;
}

export function set(obj: any, path: string | string[], value: any): any {
  const keys = Array.isArray(path) ? path : path.split('.');
  const lastKey = keys.pop()!;

  let current = obj;
  for (const key of keys) {
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }

  current[lastKey] = value;
  return obj;
}

// Collection utilities
export function groupBy<T>(
  array: T[],
  iteratee: (item: T) => string | number
): Record<string, T[]> {
  return array.reduce((acc, item) => {
    const key = String(iteratee(item));
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

export function keyBy<T>(
  array: T[],
  iteratee: (item: T) => string | number
): Record<string, T> {
  return array.reduce((acc, item) => {
    const key = String(iteratee(item));
    acc[key] = item;
    return acc;
  }, {} as Record<string, T>);
}

export function sortBy<T>(
  array: T[],
  iteratee: (item: T) => any
): T[] {
  return [...array].sort((a, b) => {
    const aVal = iteratee(a);
    const bVal = iteratee(b);
    if (aVal < bVal) return -1;
    if (aVal > bVal) return 1;
    return 0;
  });
}

// Function utilities
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: any;
  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, wait);
    }
  };
}

export function memoize<T extends (...args: any[]) => any>(
  func: T
): T {
  const cache = new Map();
  return function (this: any, ...args: Parameters<T>) {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = func.apply(this, args);
    cache.set(key, result);
    return result;
  } as T;
}

// String utilities
export function camelCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
}

export function kebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

export function snakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase();
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function truncate(str: string, length: number, omission = '...'): string {
  if (str.length <= length) return str;
  return str.slice(0, length - omission.length) + omission;
}

// Type checking
export function isArray(value: any): value is any[] {
  return Array.isArray(value);
}

export function isObject(value: any): value is object {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function isString(value: any): value is string {
  return typeof value === 'string';
}

export function isNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isFunction(value: any): value is Function {
  return typeof value === 'function';
}

export function isEmpty(value: any): boolean {
  if (value == null) return true;
  if (Array.isArray(value) || typeof value === 'string') return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

// CLI Demo
if (import.meta.url.includes("lodash")) {
  console.log("🎯 Lodash for Elide - Complete Utility Library\n");

  console.log("=== Array Operations ===");
  console.log("chunk([1,2,3,4,5], 2):", chunk([1,2,3,4,5], 2));
  console.log("flatten([1, [2, [3, 4]]]):", flatten([1, [2, [3, 4]]]));
  console.log("uniq([1,2,2,3,3,3]):", uniq([1,2,2,3,3,3]));
  console.log();

  console.log("=== Object Operations ===");
  const obj = { a: 1, b: 2, c: 3 };
  console.log("pick({a:1,b:2,c:3}, ['a','c']):", pick(obj, ['a', 'c']));
  console.log("omit({a:1,b:2,c:3}, ['b']):", omit(obj, ['b']));
  console.log("get({a:{b:{c:1}}}, 'a.b.c'):", get({a:{b:{c:1}}}, 'a.b.c'));
  console.log();

  console.log("=== Collection Operations ===");
  const users = [
    { name: 'Alice', age: 25, role: 'dev' },
    { name: 'Bob', age: 30, role: 'dev' },
    { name: 'Charlie', age: 25, role: 'designer' }
  ];
  console.log("groupBy(users, 'role'):", groupBy(users, u => u.role));
  console.log("sortBy(users, 'age'):", sortBy(users, u => u.age));
  console.log();

  console.log("=== String Operations ===");
  console.log("camelCase('hello world'):", camelCase('hello world'));
  console.log("kebabCase('helloWorld'):", kebabCase('helloWorld'));
  console.log("snakeCase('helloWorld'):", snakeCase('helloWorld'));
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Data transformation");
  console.log("- Object manipulation");
  console.log("- Array operations");
  console.log("- Function utilities");
  console.log("- String formatting");
  console.log();

  console.log("🚀 Polyglot Benefits:");
  console.log("- 150M+ npm downloads/week");
  console.log("- Zero dependencies");
  console.log("- Works in TypeScript, Python, Ruby, Java");
  console.log("- Instant startup on Elide");
}

export default {
  chunk, flatten, uniq, uniqBy, compact, difference, intersection,
  pick, omit, merge, cloneDeep, get, set,
  groupBy, keyBy, sortBy,
  debounce, throttle, memoize,
  camelCase, kebabCase, snakeCase, capitalize, truncate,
  isArray, isObject, isString, isNumber, isFunction, isEmpty
};
