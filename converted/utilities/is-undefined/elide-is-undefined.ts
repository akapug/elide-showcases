// is-undefined - Undefined validation for Elide/TypeScript
// Zero dependencies - pure TypeScript!

/**
 * Check if a value is undefined.
 *
 * @param value - Value to test
 * @returns True if value is undefined
 *
 * @example
 * ```typescript
 * isUndefined(undefined)    // true
 * isUndefined(null)         // false
 * isUndefined(0)            // false
 * isUndefined("")           // false
 * ```
 */
export default function isUndefined(value: any): value is undefined {
  return value === undefined;
}

// CLI usage
if (import.meta.url.includes("elide-is-undefined.ts")) {
  console.log("? is-undefined - Undefined Detection on Elide\n");
  console.log(`isUndefined(undefined)    = ${isUndefined(undefined)}`);
  console.log(`isUndefined(null)         = ${isUndefined(null)}`);
  console.log(`isUndefined(0)            = ${isUndefined(0)}`);
  console.log(`isUndefined("")           = ${isUndefined("")}`);
  console.log(`isUndefined(false)        = ${isUndefined(false)}`);
  console.log("\n✅ 20M+ downloads/week on npm");
}
