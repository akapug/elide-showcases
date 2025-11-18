// object-keys - Object.keys polyfill for Elide/TypeScript
// Original: https://github.com/ljharb/object-keys
// Zero dependencies - pure TypeScript!

/**
 * Get an array of an object's own enumerable property names.
 * This is a polyfill for Object.keys, but we just use the native version.
 *
 * @param obj - Object to get keys from
 * @returns Array of property names
 *
 * @example
 * ```typescript
 * objectKeys({a: 1, b: 2})    // ['a', 'b']
 * objectKeys([1, 2, 3])       // ['0', '1', '2']
 * objectKeys('hello')         // ['0', '1', '2', '3', '4']
 * ```
 */
export default function objectKeys(obj: any): string[] {
  return Object.keys(obj);
}

// CLI usage
if (import.meta.url.includes("elide-object-keys.ts")) {
  console.log("🔑 object-keys - Object.keys on Elide\n");

  console.log("=== Basic Usage ===");
  console.log(`objectKeys({a: 1, b: 2}):`, objectKeys({ a: 1, b: 2 }));
  console.log(`objectKeys([1, 2, 3]):`, objectKeys([1, 2, 3]));
  console.log(`objectKeys('hello'):`, objectKeys('hello'));
  console.log(`objectKeys({}):`, objectKeys({}));
  console.log();

  console.log("✅ 150M+ downloads/week on npm");
  console.log("✅ Uses native Object.keys");
}
