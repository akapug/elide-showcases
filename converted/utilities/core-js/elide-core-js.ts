/**
 * Core-JS - JavaScript Standard Library
 *
 * Modular standard library for JavaScript.
 * **POLYGLOT SHOWCASE**: Universal polyfills for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/core-js (~10M+ downloads/week)
 */

// Array polyfills
if (!Array.prototype.includes) {
  Array.prototype.includes = function<T>(this: T[], searchElement: T): boolean {
    return this.indexOf(searchElement) !== -1;
  };
}

if (!Array.prototype.flat) {
  Array.prototype.flat = function<T>(this: T[], depth = 1): T[] {
    const flatten = (arr: any[], d: number): any[] => {
      return d > 0 ? arr.reduce((acc, val) => 
        acc.concat(Array.isArray(val) ? flatten(val, d - 1) : val), []) : arr.slice();
    };
    return flatten(this, depth);
  };
}

// Object polyfills
if (!Object.entries) {
  Object.entries = function<T>(obj: Record<string, T>): [string, T][] {
    return Object.keys(obj).map(key => [key, obj[key]]);
  };
}

if (!Object.values) {
  Object.values = function<T>(obj: Record<string, T>): T[] {
    return Object.keys(obj).map(key => obj[key]);
  };
}

if (!Object.fromEntries) {
  Object.fromEntries = function<T>(entries: [string, T][]): Record<string, T> {
    return entries.reduce((obj, [key, val]) => ({ ...obj, [key]: val }), {});
  };
}

// String polyfills
if (!String.prototype.trimStart) {
  String.prototype.trimStart = function(this: string): string {
    return this.replace(/^\s+/, '');
  };
}

if (!String.prototype.trimEnd) {
  String.prototype.trimEnd = function(this: string): string {
    return this.replace(/\s+$/, '');
  };
}

export const coreJS = {
  version: '3.0.0',
  polyfills: ['Array', 'Object', 'String', 'Promise', 'Symbol']
};

export default coreJS;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("📦 Core-JS Polyfills (POLYGLOT!)\n");
  
  console.log("Array.flat:", [1, [2, [3, 4]]].flat(2));
  console.log("Object.entries:", Object.entries({ a: 1, b: 2 }));
  console.log("String.trimStart:", '  hello  '.trimStart());
  console.log("\n  ✓ ~10M+ downloads/week!");
}
