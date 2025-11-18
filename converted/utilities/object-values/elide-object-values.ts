// object-values - Object.values polyfill for Elide/TypeScript
// Original: https://github.com/es-shims/Object.values
// Zero dependencies - pure TypeScript!

/**
 * Get an array of an object's own enumerable property values.
 * This is a polyfill for Object.values, but we just use the native version.
 *
 * @param obj - Object to get values from
 * @returns Array of property values
 *
 * @example
 * ```typescript
 * objectValues({a: 1, b: 2})    // [1, 2]
 * objectValues([1, 2, 3])       // [1, 2, 3]
 * objectValues({})              // []
 * ```
 */
export default function objectValues(obj: any): any[] {
  return Object.values(obj);
}

// CLI usage
if (import.meta.url.includes("elide-object-values.ts")) {
  console.log("💎 object-values - Object.values on Elide\n");

  console.log("=== Basic Usage ===");
  console.log(`objectValues({a: 1, b: 2}):`, objectValues({ a: 1, b: 2 }));
  console.log(`objectValues([1, 2, 3]):`, objectValues([1, 2, 3]));
  console.log(`objectValues({}):`, objectValues({}));
  console.log(`objectValues({x: 'hello', y: 'world'}):`, objectValues({ x: 'hello', y: 'world' }));
  console.log();

  console.log("✅ 40M+ downloads/week on npm");
  console.log("✅ Uses native Object.values");
}
