// has-own - Own property check for Elide/TypeScript
// Zero dependencies - pure TypeScript!

/**
 * Check if an object has its own property (not inherited).
 * Uses Object.prototype.hasOwnProperty.
 *
 * @param obj - Object to check
 * @param prop - Property name
 * @returns True if object has own property
 *
 * @example
 * ```typescript
 * hasOwn({a: 1}, 'a')           // true
 * hasOwn({a: 1}, 'b')           // false
 * hasOwn({a: 1}, 'toString')    // false (inherited)
 * ```
 */
export default function hasOwn(obj: any, prop: string): boolean {
  if (obj == null) return false;
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

// CLI usage
if (import.meta.url.includes("elide-has-own.ts")) {
  console.log("🔑 has-own - Own Property Check on Elide\n");

  console.log("=== Own Properties ===");
  console.log(`hasOwn({a: 1}, 'a'):           ${hasOwn({ a: 1 }, 'a')}`);
  console.log(`hasOwn({a: 1}, 'b'):           ${hasOwn({ a: 1 }, 'b')}`);
  console.log();

  console.log("=== Inherited Properties (False) ===");
  console.log(`hasOwn({a: 1}, 'toString'):    ${hasOwn({ a: 1 }, 'toString')}`);
  console.log(`hasOwn({a: 1}, 'hasOwnProperty'): ${hasOwn({ a: 1 }, 'hasOwnProperty')}`);
  console.log();

  console.log("=== Edge Cases ===");
  console.log(`hasOwn(null, 'a'):             ${hasOwn(null, 'a')}`);
  console.log(`hasOwn(undefined, 'a'):        ${hasOwn(undefined, 'a')}`);
  console.log(`hasOwn([1, 2], 'length'):      ${hasOwn([1, 2], 'length')}`);
  console.log(`hasOwn([1, 2], '0'):           ${hasOwn([1, 2], '0')}`);
  console.log();

  console.log("✅ 40M+ downloads/week on npm");
  console.log("✅ Checks only own properties (not inherited)");
}
