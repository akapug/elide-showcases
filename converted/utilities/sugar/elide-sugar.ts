/**
 * Sugar - Sweet Extensions for JavaScript for Elide
 * NPM: 200K+ downloads/week
 */

// Array extensions
export const arrayMap = <T, U>(arr: T[], fn: (item: T, index: number) => U): U[] => arr.map(fn);
export const arrayFilter = <T>(arr: T[], fn: (item: T) => boolean): T[] => arr.filter(fn);
export const arrayFind = <T>(arr: T[], fn: (item: T) => boolean): T | undefined => arr.find(fn);
export const arrayFirst = <T>(arr: T[]): T | undefined => arr[0];
export const arrayLast = <T>(arr: T[]): T | undefined => arr[arr.length - 1];
export const arrayUnique = <T>(arr: T[]): T[] => Array.from(new Set(arr));
export const arrayCompact = <T>(arr: (T | null | undefined)[]): T[] => arr.filter(x => x != null) as T[];
export const arrayFlatten = (arr: any[]): any[] => arr.flat(Infinity);

// String extensions
export const capitalize = (str: string): string => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
export const camelize = (str: string): string => str.replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
export const dasherize = (str: string): string => str.replace(/[A-Z]/g, (c, i) => (i > 0 ? '-' : '') + c.toLowerCase());
export const truncate = (str: string, length: number, suffix = '...'): string =>
  str.length > length ? str.slice(0, length - suffix.length) + suffix : str;

// Number extensions
export const times = <T>(n: number, fn: (i: number) => T): T[] => Array.from({ length: n }, (_, i) => fn(i));
export const clamp = (num: number, min: number, max: number): number => Math.min(Math.max(num, min), max);

// Object extensions
export const objectKeys = <T extends object>(obj: T): (keyof T)[] => Object.keys(obj) as (keyof T)[];
export const objectValues = <T extends object>(obj: T): T[keyof T][] => Object.values(obj);
export const objectMerge = <T extends object>(...objects: Partial<T>[]): T => Object.assign({}, ...objects) as T;

if (import.meta.url.includes("sugar")) {
  console.log("🎯 Sugar for Elide - JavaScript Extensions\n");
  console.log("arrayUnique([1,2,2,3]):", arrayUnique([1,2,2,3]));
  console.log("capitalize('hello'):", capitalize('hello'));
  console.log("times(3, i => i * 2):", times(3, i => i * 2));
}

export default { arrayMap, arrayFilter, arrayUnique, capitalize, camelize, times, clamp };
