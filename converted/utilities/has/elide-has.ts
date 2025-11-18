// has - Property existence check for Elide/TypeScript
// Original: https://github.com/tarruda/has
// Zero dependencies - pure TypeScript!

/**
 * Check if an object has a property (including inherited properties).
 * Uses the 'in' operator.
 *
 * @param obj - Object to check
 * @param prop - Property name
 * @returns True if property exists
 *
 * @example
 * ```typescript
 * has({a: 1}, 'a')           // true
 * has({a: 1}, 'b')           // false
 * has({a: 1}, 'toString')    // true (inherited)
 * ```
 */
export default function has(obj: any, prop: string): boolean {
  if (obj == null) return false;
  return prop in Object(obj);
}

// CLI usage
if (import.meta.url.includes("elide-has.ts")) {
  console.log("🔍 has - Property Check on Elide\n");

  console.log("=== Own Properties ===");
  console.log(`has({a: 1}, 'a'):           ${has({ a: 1 }, 'a')}`);
  console.log(`has({a: 1}, 'b'):           ${has({ a: 1 }, 'b')}`);
  console.log();

  console.log("=== Inherited Properties ===");
  console.log(`has({a: 1}, 'toString'):    ${has({ a: 1 }, 'toString')}`);
  console.log(`has({a: 1}, 'hasOwnProperty'): ${has({ a: 1 }, 'hasOwnProperty')}`);
  console.log();

  console.log("=== Edge Cases ===");
  console.log(`has(null, 'a'):             ${has(null, 'a')}`);
  console.log(`has(undefined, 'a'):        ${has(undefined, 'a')}`);
  console.log(`has([1, 2], 'length'):      ${has([1, 2], 'length')}`);
  console.log(`has([1, 2], '0'):           ${has([1, 2], '0')}`);
  console.log();

  console.log("✅ 120M+ downloads/week on npm");
  console.log("✅ Checks both own and inherited properties");
}
