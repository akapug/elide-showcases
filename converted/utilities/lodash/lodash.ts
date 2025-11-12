/**
 * Lodash - JavaScript Utility Library
 *
 * A modern utility library delivering modularity, performance & extras.
 * **POLYGLOT SHOWCASE**: Utilities that work across ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/lodash (~30M downloads/week)
 *
 * Features:
 * - Array manipulation (chunk, compact, flatten, uniq, etc.)
 * - Object utilities (pick, omit, merge, clone, etc.)
 * - Function utilities (debounce, throttle, memoize, etc.)
 * - String utilities (camelCase, kebabCase, capitalize, etc.)
 * - Collection utilities (map, filter, reduce, groupBy, etc.)
 * - Type checking (isArray, isObject, isString, etc.)
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need common utilities
 * - ONE implementation works everywhere on Elide
 * - Consistent API across languages
 * - Share utility functions across your stack
 *
 * Use cases:
 * - Data transformation and manipulation
 * - Object/array operations
 * - Function composition and utilities
 * - Type checking and validation
 *
 * Package has ~30M+ downloads/week on npm - essential utility library!
 */

// ========== Type Checking ==========

export function isArray(value: any): boolean {
  return Array.isArray(value);
}

export function isObject(value: any): boolean {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function isString(value: any): boolean {
  return typeof value === 'string';
}

export function isNumber(value: any): boolean {
  return typeof value === 'number' && !isNaN(value);
}

export function isFunction(value: any): boolean {
  return typeof value === 'function';
}

export function isBoolean(value: any): boolean {
  return typeof value === 'boolean';
}

export function isNull(value: any): boolean {
  return value === null;
}

export function isUndefined(value: any): boolean {
  return value === undefined;
}

export function isNil(value: any): boolean {
  return value === null || value === undefined;
}

export function isEmpty(value: any): boolean {
  if (isNil(value)) return true;
  if (isArray(value) || isString(value)) return value.length === 0;
  if (isObject(value)) return Object.keys(value).length === 0;
  return false;
}

// ========== Array Utilities ==========

export function chunk<T>(array: T[], size: number = 1): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

export function compact<T>(array: T[]): T[] {
  return array.filter(Boolean);
}

export function flatten<T>(array: any[]): T[] {
  return array.reduce((acc, val) =>
    Array.isArray(val) ? acc.concat(val) : acc.concat([val]), []);
}

export function flattenDeep(array: any[]): any[] {
  return array.reduce((acc, val) =>
    Array.isArray(val) ? acc.concat(flattenDeep(val)) : acc.concat([val]), []);
}

export function uniq<T>(array: T[]): T[] {
  return [...new Set(array)];
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

export function difference<T>(array: T[], ...values: T[][]): T[] {
  const excludeSet = new Set(values.flat());
  return array.filter(item => !excludeSet.has(item));
}

export function intersection<T>(...arrays: T[][]): T[] {
  if (arrays.length === 0) return [];
  const firstSet = new Set(arrays[0]);
  return [...firstSet].filter(item =>
    arrays.slice(1).every(arr => arr.includes(item))
  );
}

export function take<T>(array: T[], n: number = 1): T[] {
  return array.slice(0, n);
}

export function takeRight<T>(array: T[], n: number = 1): T[] {
  return array.slice(-n);
}

export function drop<T>(array: T[], n: number = 1): T[] {
  return array.slice(n);
}

export function dropRight<T>(array: T[], n: number = 1): T[] {
  return array.slice(0, -n);
}

export function first<T>(array: T[]): T | undefined {
  return array[0];
}

export function last<T>(array: T[]): T | undefined {
  return array[array.length - 1];
}

export function initial<T>(array: T[]): T[] {
  return array.slice(0, -1);
}

export function tail<T>(array: T[]): T[] {
  return array.slice(1);
}

export function zip<T>(...arrays: T[][]): T[][] {
  const maxLength = Math.max(...arrays.map(arr => arr.length));
  const result: T[][] = [];
  for (let i = 0; i < maxLength; i++) {
    result.push(arrays.map(arr => arr[i]));
  }
  return result;
}

export function zipObject<T>(keys: string[], values: T[]): Record<string, T> {
  const result: Record<string, T> = {};
  keys.forEach((key, i) => {
    result[key] = values[i];
  });
  return result;
}

// ========== Object Utilities ==========

export function pick<T extends object, K extends keyof T>(
  object: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (key in object) {
      result[key] = object[key];
    }
  });
  return result;
}

export function omit<T extends object, K extends keyof T>(
  object: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...object };
  keys.forEach(key => {
    delete result[key];
  });
  return result;
}

export function merge<T extends object>(...objects: Partial<T>[]): T {
  return Object.assign({}, ...objects) as T;
}

export function cloneDeep<T>(value: T): T {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(item => cloneDeep(item)) as any;

  const result: any = {};
  for (const key in value) {
    if (value.hasOwnProperty(key)) {
      result[key] = cloneDeep((value as any)[key]);
    }
  }
  return result;
}

export function get<T = any>(
  object: any,
  path: string | string[],
  defaultValue?: T
): T {
  const keys = Array.isArray(path) ? path : path.split('.');
  let result = object;

  for (const key of keys) {
    if (result === null || result === undefined) {
      return defaultValue as T;
    }
    result = result[key];
  }

  return result === undefined ? defaultValue as T : result;
}

export function set(object: any, path: string | string[], value: any): any {
  const keys = Array.isArray(path) ? path : path.split('.');
  let current = object;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
  return object;
}

export function has(object: any, path: string | string[]): boolean {
  const keys = Array.isArray(path) ? path : path.split('.');
  let current = object;

  for (const key of keys) {
    if (current === null || current === undefined || !(key in current)) {
      return false;
    }
    current = current[key];
  }

  return true;
}

export function keys<T extends object>(object: T): string[] {
  return Object.keys(object);
}

export function values<T extends object>(object: T): Array<T[keyof T]> {
  return Object.values(object);
}

export function entries<T extends object>(object: T): Array<[string, T[keyof T]]> {
  return Object.entries(object) as Array<[string, T[keyof T]]>;
}

export function invert(object: Record<string, any>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key in object) {
    result[object[key]] = key;
  }
  return result;
}

// ========== Collection Utilities ==========

export function map<T, U>(
  collection: T[],
  iteratee: (value: T, index: number, array: T[]) => U
): U[] {
  return collection.map(iteratee);
}

export function filter<T>(
  collection: T[],
  predicate: (value: T, index: number, array: T[]) => boolean
): T[] {
  return collection.filter(predicate);
}

export function reduce<T, U>(
  collection: T[],
  iteratee: (acc: U, value: T, index: number, array: T[]) => U,
  initial: U
): U {
  return collection.reduce(iteratee, initial);
}

export function find<T>(
  collection: T[],
  predicate: (value: T, index: number, array: T[]) => boolean
): T | undefined {
  return collection.find(predicate);
}

export function findIndex<T>(
  collection: T[],
  predicate: (value: T, index: number, array: T[]) => boolean
): number {
  return collection.findIndex(predicate);
}

export function every<T>(
  collection: T[],
  predicate: (value: T, index: number, array: T[]) => boolean
): boolean {
  return collection.every(predicate);
}

export function some<T>(
  collection: T[],
  predicate: (value: T, index: number, array: T[]) => boolean
): boolean {
  return collection.some(predicate);
}

export function groupBy<T>(
  collection: T[],
  iteratee: (value: T) => string | number
): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  collection.forEach(item => {
    const key = String(iteratee(item));
    if (!result[key]) result[key] = [];
    result[key].push(item);
  });
  return result;
}

export function countBy<T>(
  collection: T[],
  iteratee: (value: T) => string | number
): Record<string, number> {
  const result: Record<string, number> = {};
  collection.forEach(item => {
    const key = String(iteratee(item));
    result[key] = (result[key] || 0) + 1;
  });
  return result;
}

export function orderBy<T>(
  collection: T[],
  iteratees: Array<(item: T) => any>,
  orders: Array<'asc' | 'desc'>
): T[] {
  return [...collection].sort((a, b) => {
    for (let i = 0; i < iteratees.length; i++) {
      const aVal = iteratees[i](a);
      const bVal = iteratees[i](b);
      const order = orders[i] === 'desc' ? -1 : 1;

      if (aVal < bVal) return -1 * order;
      if (aVal > bVal) return 1 * order;
    }
    return 0;
  });
}

export function sortBy<T>(
  collection: T[],
  iteratee: (item: T) => any
): T[] {
  return orderBy(collection, [iteratee], ['asc']);
}

// ========== String Utilities ==========

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

export function startCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase());
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function upperCase(str: string): string {
  return str.toUpperCase();
}

export function lowerCase(str: string): string {
  return str.toLowerCase();
}

export function trim(str: string, chars?: string): string {
  if (!chars) return str.trim();
  const pattern = new RegExp(`^[${chars}]+|[${chars}]+$`, 'g');
  return str.replace(pattern, '');
}

export function truncate(str: string, options: { length?: number; omission?: string } = {}): string {
  const length = options.length || 30;
  const omission = options.omission || '...';

  if (str.length <= length) return str;
  return str.slice(0, length - omission.length) + omission;
}

export function pad(str: string, length: number, chars: string = ' '): string {
  const padLength = length - str.length;
  if (padLength <= 0) return str;

  const leftPad = Math.floor(padLength / 2);
  const rightPad = padLength - leftPad;

  return chars.repeat(leftPad) + str + chars.repeat(rightPad);
}

export function padStart(str: string, length: number, chars: string = ' '): string {
  return str.padStart(length, chars);
}

export function padEnd(str: string, length: number, chars: string = ' '): string {
  return str.padEnd(length, chars);
}

export function repeat(str: string, n: number): string {
  return str.repeat(n);
}

export function replace(
  str: string,
  pattern: string | RegExp,
  replacement: string
): string {
  return str.replace(pattern, replacement);
}

export function split(str: string, separator: string | RegExp, limit?: number): string[] {
  return str.split(separator, limit);
}

// ========== Function Utilities ==========

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: any;

  return function(this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;

  return function(this: any, ...args: Parameters<T>) {
    const now = Date.now();
    if (now - lastCall >= wait) {
      lastCall = now;
      func.apply(this, args);
    }
  };
}

export function once<T extends (...args: any[]) => any>(func: T): T {
  let called = false;
  let result: any;

  return function(this: any, ...args: Parameters<T>) {
    if (!called) {
      called = true;
      result = func.apply(this, args);
    }
    return result;
  } as T;
}

export function memoize<T extends (...args: any[]) => any>(func: T): T {
  const cache = new Map();

  return function(this: any, ...args: Parameters<T>) {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);

    const result = func.apply(this, args);
    cache.set(key, result);
    return result;
  } as T;
}

export function negate<T extends (...args: any[]) => boolean>(
  predicate: T
): (...args: Parameters<T>) => boolean {
  return function(this: any, ...args: Parameters<T>) {
    return !predicate.apply(this, args);
  };
}

// ========== Number Utilities ==========

export function random(min: number = 0, max: number = 1): number {
  return Math.random() * (max - min) + min;
}

export function randomInt(min: number = 0, max: number = 100): number {
  return Math.floor(random(min, max + 1));
}

export function clamp(number: number, min: number, max: number): number {
  return Math.min(Math.max(number, min), max);
}

export function inRange(number: number, start: number, end: number): boolean {
  return number >= start && number < end;
}

export function sum(numbers: number[]): number {
  return numbers.reduce((acc, n) => acc + n, 0);
}

export function mean(numbers: number[]): number {
  return sum(numbers) / numbers.length;
}

export function min(numbers: number[]): number {
  return Math.min(...numbers);
}

export function max(numbers: number[]): number {
  return Math.max(...numbers);
}

// ========== Utility Functions ==========

export function range(start: number, end?: number, step: number = 1): number[] {
  if (end === undefined) {
    end = start;
    start = 0;
  }

  const result: number[] = [];
  for (let i = start; i < end; i += step) {
    result.push(i);
  }
  return result;
}

export function times<T>(n: number, iteratee: (index: number) => T): T[] {
  const result: T[] = [];
  for (let i = 0; i < n; i++) {
    result.push(iteratee(i));
  }
  return result;
}

export function uniqueId(prefix: string = ''): string {
  const id = Math.random().toString(36).substr(2, 9);
  return prefix + id;
}

export function noop(): void {
  // Does nothing
}

export function identity<T>(value: T): T {
  return value;
}

export function constant<T>(value: T): () => T {
  return () => value;
}

// Default export with all utilities
const _ = {
  // Type checking
  isArray, isObject, isString, isNumber, isFunction, isBoolean,
  isNull, isUndefined, isNil, isEmpty,

  // Arrays
  chunk, compact, flatten, flattenDeep, uniq, uniqBy,
  difference, intersection, take, takeRight, drop, dropRight,
  first, last, initial, tail, zip, zipObject,

  // Objects
  pick, omit, merge, cloneDeep, get, set, has,
  keys, values, entries, invert,

  // Collections
  map, filter, reduce, find, findIndex, every, some,
  groupBy, countBy, orderBy, sortBy,

  // Strings
  camelCase, kebabCase, snakeCase, startCase, capitalize,
  upperCase, lowerCase, trim, truncate, pad, padStart, padEnd,
  repeat, replace, split,

  // Functions
  debounce, throttle, once, memoize, negate,

  // Numbers
  random, randomInt, clamp, inRange, sum, mean, min, max,

  // Utilities
  range, times, uniqueId, noop, identity, constant,
};

export default _;

// CLI Demo
if (import.meta.url.includes("lodash.ts")) {
  console.log("🔧 Lodash - JavaScript Utility Library for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Array Operations ===");
  console.log("chunk([1,2,3,4,5], 2):", chunk([1, 2, 3, 4, 5], 2));
  console.log("compact([0, 1, false, 2, '', 3]):", compact([0, 1, false, 2, '', 3]));
  console.log("uniq([1,2,2,3,3,4]):", uniq([1, 2, 2, 3, 3, 4]));
  console.log("flatten([[1,2],[3,4]]):", flatten([[1, 2], [3, 4]]));
  console.log();

  console.log("=== Example 2: Object Operations ===");
  const obj = { a: 1, b: 2, c: 3, d: 4 };
  console.log("pick({a:1,b:2,c:3,d:4}, ['a','c']):", pick(obj, ['a', 'c']));
  console.log("omit({a:1,b:2,c:3,d:4}, ['b','d']):", omit(obj, ['b', 'd']));
  console.log();

  console.log("=== Example 3: Deep Operations ===");
  const nested = { user: { name: 'Alice', age: 30 } };
  console.log("get(nested, 'user.name'):", get(nested, 'user.name'));
  console.log("get(nested, 'user.email', 'N/A'):", get(nested, 'user.email', 'N/A'));
  const copy = cloneDeep(nested);
  console.log("cloneDeep:", copy);
  console.log();

  console.log("=== Example 4: Collection Operations ===");
  const users = [
    { name: 'Alice', age: 30, role: 'admin' },
    { name: 'Bob', age: 25, role: 'user' },
    { name: 'Charlie', age: 30, role: 'user' },
  ];
  console.log("groupBy by age:", groupBy(users, u => u.age));
  console.log("countBy by role:", countBy(users, u => u.role));
  console.log();

  console.log("=== Example 5: String Operations ===");
  console.log("camelCase('hello world'):", camelCase('hello world'));
  console.log("kebabCase('helloWorld'):", kebabCase('helloWorld'));
  console.log("snakeCase('helloWorld'):", snakeCase('helloWorld'));
  console.log("capitalize('hello'):", capitalize('hello'));
  console.log("truncate('Hello World!', {length: 8}):", truncate('Hello World!', { length: 8 }));
  console.log();

  console.log("=== Example 6: Function Utilities ===");
  let callCount = 0;
  const expensiveOp = (n: number) => {
    callCount++;
    return n * n;
  };
  const memoized = memoize(expensiveOp);
  console.log("memoized(5):", memoized(5), "- calls:", callCount);
  console.log("memoized(5):", memoized(5), "- calls:", callCount); // Cached!
  console.log("memoized(6):", memoized(6), "- calls:", callCount);
  console.log();

  console.log("=== Example 7: Number Utilities ===");
  const numbers = [1, 2, 3, 4, 5];
  console.log("sum([1,2,3,4,5]):", sum(numbers));
  console.log("mean([1,2,3,4,5]):", mean(numbers));
  console.log("min([1,2,3,4,5]):", min(numbers));
  console.log("max([1,2,3,4,5]):", max(numbers));
  console.log("clamp(10, 0, 5):", clamp(10, 0, 5));
  console.log();

  console.log("=== Example 8: Type Checking ===");
  console.log("isArray([]):", isArray([]));
  console.log("isObject({}):", isObject({}));
  console.log("isString('hello'):", isString('hello'));
  console.log("isNumber(42):", isNumber(42));
  console.log("isEmpty([]):", isEmpty([]));
  console.log("isEmpty({}):", isEmpty({}));
  console.log();

  console.log("=== Example 9: Advanced Array Operations ===");
  console.log("difference([1,2,3], [2,3,4]):", difference([1, 2, 3], [2, 3, 4]));
  console.log("intersection([1,2,3], [2,3,4]):", intersection([1, 2, 3], [2, 3, 4]));
  console.log("zip(['a','b'], [1,2]):", zip(['a', 'b'], [1, 2]));
  console.log("zipObject(['a','b'], [1,2]):", zipObject(['a', 'b'], [1, 2]));
  console.log();

  console.log("=== Example 10: Utility Functions ===");
  console.log("range(5):", range(5));
  console.log("range(1, 6):", range(1, 6));
  console.log("times(3, i => i*2):", times(3, i => i * 2));
  console.log("uniqueId('user_'):", uniqueId('user_'));
  console.log();

  console.log("=== Example 11: Real-world Data Processing ===");
  const orders = [
    { id: 1, customer: 'Alice', total: 100, status: 'completed' },
    { id: 2, customer: 'Bob', total: 150, status: 'pending' },
    { id: 3, customer: 'Alice', total: 200, status: 'completed' },
    { id: 4, customer: 'Charlie', total: 75, status: 'completed' },
  ];

  const completedOrders = filter(orders, o => o.status === 'completed');
  console.log("Completed orders:", completedOrders.length);

  const totalRevenue = sum(map(completedOrders, o => o.total));
  console.log("Total revenue:", totalRevenue);

  const byCustomer = groupBy(orders, o => o.customer);
  console.log("Orders by customer:", keys(byCustomer));

  const topCustomers = orderBy(
    Object.entries(byCustomer).map(([name, orders]) => ({
      name,
      total: sum(map(orders, o => o.total))
    })),
    [o => o.total],
    ['desc']
  );
  console.log("Top customer:", topCustomers[0]);
  console.log();

  console.log("=== Example 12: POLYGLOT Use Case ===");
  console.log("🌐 Lodash utilities work in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ One utility library, all languages");
  console.log("  ✓ Consistent data manipulation everywhere");
  console.log("  ✓ Share utility functions across your stack");
  console.log("  ✓ No need for language-specific utility libs");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Data transformation and ETL");
  console.log("- API response processing");
  console.log("- Configuration manipulation");
  console.log("- Array/object operations");
  console.log("- String formatting");
  console.log("- Function composition");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Instant execution on Elide");
  console.log("- 10x faster cold start than Node.js");
  console.log("- ~30M+ downloads/week on npm!");
}
