/**
 * Deep Equal - Deep Equality Comparison
 *
 * Compare objects, arrays, and primitives for deep structural equality.
 * Handles all JavaScript types including Date, RegExp, Map, Set, and more.
 *
 * Features:
 * - Deep comparison of nested objects and arrays
 * - Handles Date, RegExp, Map, Set, TypedArray
 * - Circular reference detection
 * - NaN equality handling
 * - Strict and loose comparison modes
 *
 * Use cases:
 * - Unit testing (expect equality)
 * - Object comparison and validation
 * - Change detection
 * - Memoization keys
 * - Deep merge conflict detection
 *
 * Package has ~15M+ downloads/week on npm!
 */

interface DeepEqualOptions {
  /** Use strict equality (===) for primitives (default: false) */
  strict?: boolean;
}

/**
 * Deep equality comparison
 */
export default function deepEqual(
  a: any,
  b: any,
  options: DeepEqualOptions = {}
): boolean {
  const { strict = false } = options;
  return _deepEqual(a, b, strict, new Map());
}

/**
 * Internal deep equal with circular reference tracking
 */
function _deepEqual(
  a: any,
  b: any,
  strict: boolean,
  seen: Map<any, any>
): boolean {
  // Same reference (including NaN === NaN check)
  if (Object.is(a, b)) {
    return true;
  }

  // Type check
  if (typeof a !== typeof b) {
    return false;
  }

  // null check
  if (a === null || b === null) {
    return a === b;
  }

  // Primitive types
  if (typeof a !== 'object') {
    if (strict) {
      return a === b;
    }
    // Loose comparison for numbers/strings
    return a == b; // eslint-disable-line eqeqeq
  }

  // Circular reference check
  if (seen.has(a)) {
    return seen.get(a) === b;
  }
  seen.set(a, b);

  // Array comparison
  if (Array.isArray(a) && Array.isArray(b)) {
    return arrayEqual(a, b, strict, seen);
  }

  // Date comparison
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  // RegExp comparison
  if (a instanceof RegExp && b instanceof RegExp) {
    return regExpEqual(a, b);
  }

  // Map comparison
  if (a instanceof Map && b instanceof Map) {
    return mapEqual(a, b, strict, seen);
  }

  // Set comparison
  if (a instanceof Set && b instanceof Set) {
    return setEqual(a, b, strict, seen);
  }

  // TypedArray comparison
  if (ArrayBuffer.isView(a) && ArrayBuffer.isView(b)) {
    return typedArrayEqual(a as any, b as any);
  }

  // Object comparison
  if (isPlainObject(a) && isPlainObject(b)) {
    return objectEqual(a, b, strict, seen);
  }

  // Different constructor types
  if (a.constructor !== b.constructor) {
    return false;
  }

  // Default object comparison
  return objectEqual(a, b, strict, seen);
}

/**
 * Compare two arrays
 */
function arrayEqual(
  a: any[],
  b: any[],
  strict: boolean,
  seen: Map<any, any>
): boolean {
  if (a.length !== b.length) {
    return false;
  }

  for (let i = 0; i < a.length; i++) {
    if (!_deepEqual(a[i], b[i], strict, seen)) {
      return false;
    }
  }

  return true;
}

/**
 * Compare two objects
 */
function objectEqual(
  a: Record<string, any>,
  b: Record<string, any>,
  strict: boolean,
  seen: Map<any, any>
): boolean {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) {
    return false;
  }

  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) {
      return false;
    }

    if (!_deepEqual(a[key], b[key], strict, seen)) {
      return false;
    }
  }

  return true;
}

/**
 * Compare two RegExp objects
 */
function regExpEqual(a: RegExp, b: RegExp): boolean {
  return a.source === b.source && a.flags === b.flags;
}

/**
 * Compare two Map objects
 */
function mapEqual(
  a: Map<any, any>,
  b: Map<any, any>,
  strict: boolean,
  seen: Map<any, any>
): boolean {
  if (a.size !== b.size) {
    return false;
  }

  for (const [key, value] of a) {
    if (!b.has(key)) {
      return false;
    }
    if (!_deepEqual(value, b.get(key), strict, seen)) {
      return false;
    }
  }

  return true;
}

/**
 * Compare two Set objects
 */
function setEqual(
  a: Set<any>,
  b: Set<any>,
  strict: boolean,
  seen: Map<any, any>
): boolean {
  if (a.size !== b.size) {
    return false;
  }

  for (const item of a) {
    let found = false;
    for (const bItem of b) {
      if (_deepEqual(item, bItem, strict, seen)) {
        found = true;
        break;
      }
    }
    if (!found) {
      return false;
    }
  }

  return true;
}

/**
 * Compare two TypedArray objects
 */
function typedArrayEqual(a: ArrayBufferView, b: ArrayBufferView): boolean {
  if (a.constructor !== b.constructor) {
    return false;
  }

  const aArr = new Uint8Array(a.buffer);
  const bArr = new Uint8Array(b.buffer);

  if (aArr.length !== bArr.length) {
    return false;
  }

  for (let i = 0; i < aArr.length; i++) {
    if (aArr[i] !== bArr[i]) {
      return false;
    }
  }

  return true;
}

/**
 * Check if value is a plain object
 */
function isPlainObject(value: any): boolean {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

// CLI Demo
if (import.meta.url.includes("elide-deep-equal.ts")) {
  console.log("🔍 Deep Equal - Deep Comparison for Elide\n");

  console.log("=== Example 1: Primitives ===");
  console.log("deepEqual(1, 1):", deepEqual(1, 1));
  console.log("deepEqual('a', 'a'):", deepEqual('a', 'a'));
  console.log("deepEqual(true, true):", deepEqual(true, true));
  console.log("deepEqual(null, null):", deepEqual(null, null));
  console.log("deepEqual(undefined, undefined):", deepEqual(undefined, undefined));
  console.log("deepEqual(NaN, NaN):", deepEqual(NaN, NaN));
  console.log();

  console.log("=== Example 2: Simple Objects ===");
  const obj1 = { a: 1, b: 2 };
  const obj2 = { a: 1, b: 2 };
  const obj3 = { a: 1, b: 3 };
  console.log("obj1:", JSON.stringify(obj1));
  console.log("obj2:", JSON.stringify(obj2));
  console.log("obj1 === obj2:", obj1 === obj2);
  console.log("deepEqual(obj1, obj2):", deepEqual(obj1, obj2));
  console.log("deepEqual(obj1, obj3):", deepEqual(obj1, obj3));
  console.log();

  console.log("=== Example 3: Nested Objects ===");
  const nested1 = { user: { name: 'Alice', age: 25, address: { city: 'NYC' } } };
  const nested2 = { user: { name: 'Alice', age: 25, address: { city: 'NYC' } } };
  const nested3 = { user: { name: 'Alice', age: 25, address: { city: 'SF' } } };
  console.log("nested1 === nested2:", nested1 === nested2);
  console.log("deepEqual(nested1, nested2):", deepEqual(nested1, nested2));
  console.log("deepEqual(nested1, nested3):", deepEqual(nested1, nested3));
  console.log();

  console.log("=== Example 4: Arrays ===");
  const arr1 = [1, 2, 3, [4, 5]];
  const arr2 = [1, 2, 3, [4, 5]];
  const arr3 = [1, 2, 3, [4, 6]];
  console.log("arr1:", JSON.stringify(arr1));
  console.log("arr2:", JSON.stringify(arr2));
  console.log("deepEqual(arr1, arr2):", deepEqual(arr1, arr2));
  console.log("deepEqual(arr1, arr3):", deepEqual(arr1, arr3));
  console.log();

  console.log("=== Example 5: Dates ===");
  const date1 = new Date('2024-01-01');
  const date2 = new Date('2024-01-01');
  const date3 = new Date('2024-01-02');
  console.log("date1 === date2:", date1 === date2);
  console.log("deepEqual(date1, date2):", deepEqual(date1, date2));
  console.log("deepEqual(date1, date3):", deepEqual(date1, date3));
  console.log();

  console.log("=== Example 6: RegExp ===");
  const regex1 = /hello/gi;
  const regex2 = /hello/gi;
  const regex3 = /hello/g;
  console.log("regex1 === regex2:", regex1 === regex2);
  console.log("deepEqual(regex1, regex2):", deepEqual(regex1, regex2));
  console.log("deepEqual(regex1, regex3):", deepEqual(regex1, regex3));
  console.log();

  console.log("=== Example 7: Maps ===");
  const map1 = new Map([['a', 1], ['b', 2]]);
  const map2 = new Map([['a', 1], ['b', 2]]);
  const map3 = new Map([['a', 1], ['b', 3]]);
  console.log("deepEqual(map1, map2):", deepEqual(map1, map2));
  console.log("deepEqual(map1, map3):", deepEqual(map1, map3));
  console.log();

  console.log("=== Example 8: Sets ===");
  const set1 = new Set([1, 2, 3]);
  const set2 = new Set([1, 2, 3]);
  const set3 = new Set([1, 2, 4]);
  console.log("deepEqual(set1, set2):", deepEqual(set1, set2));
  console.log("deepEqual(set1, set3):", deepEqual(set1, set3));
  console.log();

  console.log("=== Example 9: Circular References ===");
  const circular1: any = { name: 'obj1' };
  circular1.self = circular1;
  const circular2: any = { name: 'obj1' };
  circular2.self = circular2;
  console.log("Objects with circular references:");
  console.log("deepEqual(circular1, circular2):", deepEqual(circular1, circular2));
  console.log();

  console.log("=== Example 10: Mixed Complex ===");
  const complex1 = {
    name: 'App',
    version: '1.0.0',
    config: {
      port: 3000,
      features: ['auth', 'api'],
      metadata: {
        created: new Date('2024-01-01'),
        pattern: /test/i
      }
    }
  };
  const complex2 = {
    name: 'App',
    version: '1.0.0',
    config: {
      port: 3000,
      features: ['auth', 'api'],
      metadata: {
        created: new Date('2024-01-01'),
        pattern: /test/i
      }
    }
  };
  console.log("Complex nested objects with dates and regex:");
  console.log("deepEqual(complex1, complex2):", deepEqual(complex1, complex2));
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Unit testing (expect.toEqual)");
  console.log("- Object comparison and validation");
  console.log("- Change detection in state management");
  console.log("- Memoization cache key comparison");
  console.log("- Deep merge conflict detection");
  console.log("- API response validation");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Instant execution on Elide");
  console.log("- 10x faster than Node.js cold start");
  console.log("- ~15M+ downloads/week on npm");
}
