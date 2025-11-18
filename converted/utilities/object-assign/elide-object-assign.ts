// object-assign - Object.assign polyfill for Elide/TypeScript
// Original: https://github.com/sindresorhus/object-assign
// Zero dependencies - pure TypeScript!

/**
 * Copy properties from source objects to target object.
 * This is a polyfill for Object.assign, but we just use the native version.
 *
 * @param target - Target object
 * @param sources - Source objects
 * @returns Target object with properties copied
 *
 * @example
 * ```typescript
 * objectAssign({}, {a: 1}, {b: 2})    // {a: 1, b: 2}
 * objectAssign({a: 1}, {a: 2})        // {a: 2} (overwrites)
 * ```
 */
export default function objectAssign<T>(target: T, ...sources: any[]): T {
  return Object.assign(target, ...sources);
}

// CLI usage
if (import.meta.url.includes("elide-object-assign.ts")) {
  console.log("📋 object-assign - Object.assign on Elide\n");

  console.log("=== Basic Usage ===");
  console.log(`objectAssign({}, {a: 1}, {b: 2}):`, objectAssign({}, { a: 1 }, { b: 2 }));
  console.log(`objectAssign({a: 1}, {a: 2}):`, objectAssign({ a: 1 }, { a: 2 }));
  console.log(`objectAssign({a: 1}, {b: 2}, {c: 3}):`, objectAssign({ a: 1 }, { b: 2 }, { c: 3 }));
  console.log();

  console.log("✅ 80M+ downloads/week on npm");
  console.log("✅ Uses native Object.assign");
}
