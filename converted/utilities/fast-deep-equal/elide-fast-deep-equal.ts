// fast-deep-equal - Fast deep equality for Elide/TypeScript
// Original: https://github.com/epoberezkin/fast-deep-equal
// Author: Evgeny Poberezkin
// Zero dependencies - pure TypeScript!

/**
 * Fast deep equality check with support for all JavaScript types.
 * Handles arrays, objects, dates, regexps, and more.
 *
 * @param a - First value
 * @param b - Second value
 * @returns True if values are deeply equal
 *
 * @example
 * ```typescript
 * equal({a: 1}, {a: 1})              // true
 * equal([1, 2, 3], [1, 2, 3])        // true
 * equal(new Date(0), new Date(0))    // true
 * equal(/test/i, /test/i)            // true
 * equal({a: 1}, {a: 2})              // false
 * equal([1, 2], [1, 2, 3])           // false
 * ```
 */
export default function equal(a: any, b: any): boolean {
  if (a === b) return true;

  if (a && b && typeof a === 'object' && typeof b === 'object') {
    if (a.constructor !== b.constructor) return false;

    // Array
    if (Array.isArray(a)) {
      const length = a.length;
      if (length !== b.length) return false;
      for (let i = 0; i < length; i++) {
        if (!equal(a[i], b[i])) return false;
      }
      return true;
    }

    // Date
    if (a instanceof Date) return a.getTime() === b.getTime();

    // RegExp
    if (a instanceof RegExp) {
      return a.source === b.source &&
        a.flags === b.flags;
    }

    // Map
    if (a instanceof Map) {
      if (a.size !== b.size) return false;
      for (const [key, val] of a) {
        if (!b.has(key) || !equal(val, b.get(key))) return false;
      }
      return true;
    }

    // Set
    if (a instanceof Set) {
      if (a.size !== b.size) return false;
      for (const val of a) {
        if (!b.has(val)) return false;
      }
      return true;
    }

    // ArrayBuffer
    if (ArrayBuffer.isView(a) && ArrayBuffer.isView(b)) {
      const length = (a as any).length;
      if (length !== (b as any).length) return false;
      for (let i = 0; i < length; i++) {
        if ((a as any)[i] !== (b as any)[i]) return false;
      }
      return true;
    }

    // Object
    const keys = Object.keys(a);
    const length = keys.length;

    if (length !== Object.keys(b).length) return false;

    for (let i = 0; i < length; i++) {
      const key = keys[i];
      if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
      if (!equal(a[key], b[key])) return false;
    }

    return true;
  }

  // NaN === NaN
  return a !== a && b !== b;
}

// CLI usage and demonstrations
if (import.meta.url.includes("elide-fast-deep-equal.ts")) {
  console.log("⚡ fast-deep-equal - Fast Deep Equality on Elide\n");

  console.log("=== Primitives ===");
  console.log(`equal(42, 42)             = ${equal(42, 42)}`);
  console.log(`equal(42, 43)             = ${equal(42, 43)}`);
  console.log(`equal('a', 'a')           = ${equal('a', 'a')}`);
  console.log(`equal(NaN, NaN)           = ${equal(NaN, NaN)}`);
  console.log(`equal(null, null)         = ${equal(null, null)}`);
  console.log(`equal(null, undefined)    = ${equal(null, undefined)}`);
  console.log();

  console.log("=== Objects ===");
  console.log(`equal({a: 1}, {a: 1})     = ${equal({ a: 1 }, { a: 1 })}`);
  console.log(`equal({a: 1}, {a: 2})     = ${equal({ a: 1 }, { a: 2 })}`);
  console.log(`equal({a: 1}, {b: 1})     = ${equal({ a: 1 }, { b: 1 })}`);
  console.log(`equal({}, {})             = ${equal({}, {})}`);
  console.log();

  console.log("=== Arrays ===");
  console.log(`equal([1, 2], [1, 2])     = ${equal([1, 2], [1, 2])}`);
  console.log(`equal([1, 2], [1, 3])     = ${equal([1, 2], [1, 3])}`);
  console.log(`equal([1, 2], [1, 2, 3])  = ${equal([1, 2], [1, 2, 3])}`);
  console.log(`equal([], [])             = ${equal([], [])}`);
  console.log();

  console.log("=== Nested Structures ===");
  console.log(`equal({a: {b: 1}}, {a: {b: 1}})   = ${equal({ a: { b: 1 } }, { a: { b: 1 } })}`);
  console.log(`equal({a: {b: 1}}, {a: {b: 2}})   = ${equal({ a: { b: 1 } }, { a: { b: 2 } })}`);
  console.log(`equal([{a: 1}], [{a: 1}])         = ${equal([{ a: 1 }], [{ a: 1 }])}`);
  console.log();

  console.log("=== Dates ===");
  const date1 = new Date(2023, 0, 1);
  const date2 = new Date(2023, 0, 1);
  const date3 = new Date(2023, 0, 2);
  console.log(`equal(Date(2023,0,1), Date(2023,0,1))  = ${equal(date1, date2)}`);
  console.log(`equal(Date(2023,0,1), Date(2023,0,2))  = ${equal(date1, date3)}`);
  console.log();

  console.log("=== RegExp ===");
  console.log(`equal(/test/i, /test/i)   = ${equal(/test/i, /test/i)}`);
  console.log(`equal(/test/i, /test/g)   = ${equal(/test/i, /test/g)}`);
  console.log(`equal(/test/, /TEST/)     = ${equal(/test/, /TEST/)}`);
  console.log();

  console.log("=== Maps and Sets ===");
  const map1 = new Map([['a', 1], ['b', 2]]);
  const map2 = new Map([['a', 1], ['b', 2]]);
  const set1 = new Set([1, 2, 3]);
  const set2 = new Set([1, 2, 3]);
  console.log(`equal(Map([a:1,b:2]), Map([a:1,b:2]))  = ${equal(map1, map2)}`);
  console.log(`equal(Set([1,2,3]), Set([1,2,3]))      = ${equal(set1, set2)}`);
  console.log();

  console.log("=== Real-World Example ===");
  const user1 = {
    id: 1,
    name: 'Alice',
    tags: ['admin', 'user'],
    settings: { theme: 'dark', notifications: true }
  };
  const user2 = {
    id: 1,
    name: 'Alice',
    tags: ['admin', 'user'],
    settings: { theme: 'dark', notifications: true }
  };
  const user3 = {
    id: 1,
    name: 'Alice',
    tags: ['admin', 'user'],
    settings: { theme: 'light', notifications: true }
  };
  console.log(`equal(user1, user2)  = ${equal(user1, user2)}`);
  console.log(`equal(user1, user3)  = ${equal(user1, user3)}`);
  console.log();

  console.log("=== Performance Note ===");
  console.log("✅ 120M+ downloads/week on npm");
  console.log("✅ Extremely fast deep comparison");
  console.log("✅ Supports all JavaScript types");
  console.log("✅ Zero dependencies");
}
