// object-entries - Object.entries polyfill for Elide/TypeScript
// Original: https://github.com/es-shims/Object.entries
// Zero dependencies - pure TypeScript!

/**
 * Get an array of an object's own enumerable property [key, value] pairs.
 * This is a polyfill for Object.entries, but we just use the native version.
 *
 * @param obj - Object to get entries from
 * @returns Array of [key, value] pairs
 *
 * @example
 * ```typescript
 * objectEntries({a: 1, b: 2})    // [['a', 1], ['b', 2]]
 * objectEntries([1, 2])          // [['0', 1], ['1', 2]]
 * objectEntries({})              // []
 * ```
 */
export default function objectEntries(obj: any): Array<[string, any]> {
  return Object.entries(obj);
}

// CLI usage
if (import.meta.url.includes("elide-object-entries.ts")) {
  console.log("📑 object-entries - Object.entries on Elide\n");

  console.log("=== Basic Usage ===");
  console.log(`objectEntries({a: 1, b: 2}):`, objectEntries({ a: 1, b: 2 }));
  console.log(`objectEntries([1, 2, 3]):`, objectEntries([1, 2, 3]));
  console.log(`objectEntries({}):`, objectEntries({}));
  console.log(`objectEntries({x: 'hello', y: 'world'}):`, objectEntries({ x: 'hello', y: 'world' }));
  console.log();

  console.log("=== Real-World Example ===");
  const config = { host: 'localhost', port: 3000, ssl: false };
  console.log("Iterating over config:");
  for (const [key, value] of objectEntries(config)) {
    console.log(`  ${key}: ${value}`);
  }
  console.log();

  console.log("✅ 30M+ downloads/week on npm");
  console.log("✅ Uses native Object.entries");
}
