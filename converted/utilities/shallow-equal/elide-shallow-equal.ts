// shallow-equal - Shallow equality for Elide/TypeScript
// Original: https://github.com/dashed/shallowequal
// Zero dependencies - pure TypeScript!

/**
 * Shallow equality check - compares object keys and values with ===.
 * Does not recurse into nested objects.
 *
 * @param objA - First object
 * @param objB - Second object
 * @returns True if objects are shallowly equal
 *
 * @example
 * ```typescript
 * shallowEqual({a: 1}, {a: 1})              // true
 * shallowEqual({a: 1}, {a: 2})              // false
 * shallowEqual({a: {b: 1}}, {a: {b: 1}})    // false (different refs)
 * shallowEqual([1, 2], [1, 2])              // true
 * ```
 */
export default function shallowEqual(objA: any, objB: any): boolean {
  if (objA === objB) return true;

  if (typeof objA !== 'object' || objA === null ||
      typeof objB !== 'object' || objB === null) {
    return false;
  }

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) return false;

  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i];
    if (!Object.prototype.hasOwnProperty.call(objB, key) ||
        objA[key] !== objB[key]) {
      return false;
    }
  }

  return true;
}

// CLI usage
if (import.meta.url.includes("elide-shallow-equal.ts")) {
  console.log("〰️ shallow-equal - Shallow Equality on Elide\n");

  console.log("=== Shallow Equality ===");
  console.log(`shallowEqual({a: 1}, {a: 1})     = ${shallowEqual({ a: 1 }, { a: 1 })}`);
  console.log(`shallowEqual({a: 1}, {a: 2})     = ${shallowEqual({ a: 1 }, { a: 2 })}`);
  console.log(`shallowEqual({a: 1}, {b: 1})     = ${shallowEqual({ a: 1 }, { b: 1 })}`);
  console.log();

  console.log("=== Nested Objects (Different Refs) ===");
  const nested1 = { b: 1 };
  const nested2 = { b: 1 };
  console.log(`shallowEqual({a: ref1}, {a: ref2})   = ${shallowEqual({ a: nested1 }, { a: nested2 })}`);
  console.log(`shallowEqual({a: ref1}, {a: ref1})   = ${shallowEqual({ a: nested1 }, { a: nested1 })}`);
  console.log();

  console.log("=== Arrays ===");
  console.log(`shallowEqual([1, 2], [1, 2])     = ${shallowEqual([1, 2], [1, 2])}`);
  console.log(`shallowEqual([1, 2], [1, 3])     = ${shallowEqual([1, 2], [1, 3])}`);
  console.log();

  console.log("=== React Props Example ===");
  const props1 = { name: 'Alice', age: 30, onClick: () => {} };
  const props2 = { name: 'Alice', age: 30, onClick: props1.onClick };
  const props3 = { name: 'Alice', age: 31, onClick: props1.onClick };
  console.log(`shallowEqual(props1, props2)     = ${shallowEqual(props1, props2)}`);
  console.log(`shallowEqual(props1, props3)     = ${shallowEqual(props1, props3)}`);
  console.log();

  console.log("✅ 40M+ downloads/week on npm");
  console.log("✅ Used by React.memo for props comparison");
}
