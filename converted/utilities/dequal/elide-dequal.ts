// dequal - Deep equality for Elide/TypeScript
// Original: https://github.com/lukeed/dequal
// Author: Luke Edwards
// Zero dependencies - pure TypeScript!

/**
 * Deep equality check - lightweight alternative to fast-deep-equal.
 * Faster than deep-equal, slightly less comprehensive than fast-deep-equal.
 *
 * @param a - First value
 * @param b - Second value
 * @returns True if values are deeply equal
 *
 * @example
 * ```typescript
 * dequal({a: 1}, {a: 1})              // true
 * dequal([1, 2, 3], [1, 2, 3])        // true
 * dequal({a: 1}, {a: 2})              // false
 * ```
 */
export default function dequal(a: any, b: any): boolean {
  if (a === b) return true;

  let arrA = Array.isArray(a);
  let arrB = Array.isArray(b);

  if (arrA !== arrB) return false;

  if (arrA && arrB) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!dequal(a[i], b[i])) return false;
    }
    return true;
  }

  if (a && b && typeof a === 'object' && typeof b === 'object') {
    if (a.constructor !== b.constructor) return false;

    let length, i;

    if (a instanceof Date) {
      return a.getTime() === b.getTime();
    }

    if (a instanceof RegExp) {
      return a.toString() === b.toString();
    }

    const keys = Object.keys(a);
    length = keys.length;

    if (length !== Object.keys(b).length) {
      return false;
    }

    for (i = 0; i < length; i++) {
      if (!Object.prototype.hasOwnProperty.call(b, keys[i])) {
        return false;
      }
    }

    for (i = 0; i < length; i++) {
      if (!dequal(a[keys[i]], b[keys[i]])) {
        return false;
      }
    }

    return true;
  }

  return a !== a && b !== b;  // NaN === NaN
}

// CLI usage
if (import.meta.url.includes("elide-dequal.ts")) {
  console.log("⚖️ dequal - Deep Equality on Elide\n");

  console.log("=== Objects ===");
  console.log(`dequal({a: 1}, {a: 1})       = ${dequal({ a: 1 }, { a: 1 })}`);
  console.log(`dequal({a: 1}, {a: 2})       = ${dequal({ a: 1 }, { a: 2 })}`);
  console.log();

  console.log("=== Arrays ===");
  console.log(`dequal([1, 2], [1, 2])       = ${dequal([1, 2], [1, 2])}`);
  console.log(`dequal([1, 2], [1, 3])       = ${dequal([1, 2], [1, 3])}`);
  console.log();

  console.log("=== Nested ===");
  console.log(`dequal({a: {b: 1}}, {a: {b: 1}})  = ${dequal({ a: { b: 1 } }, { a: { b: 1 } })}`);
  console.log();

  console.log("=== Special ===");
  console.log(`dequal(NaN, NaN)             = ${dequal(NaN, NaN)}`);
  console.log(`dequal(new Date(0), new Date(0))  = ${dequal(new Date(0), new Date(0))}`);
  console.log();

  console.log("✅ 80M+ downloads/week on npm");
  console.log("✅ Lightweight and fast");
}
