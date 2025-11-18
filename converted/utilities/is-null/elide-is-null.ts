// is-null - Null validation for Elide/TypeScript
// Zero dependencies - pure TypeScript!

/**
 * Check if a value is null.
 *
 * @param value - Value to test
 * @returns True if value is null
 *
 * @example
 * ```typescript
 * isNull(null)           // true
 * isNull(undefined)      // false
 * isNull(0)              // false
 * isNull("")             // false
 * ```
 */
export default function isNull(value: any): value is null {
  return value === null;
}

// CLI usage
if (import.meta.url.includes("elide-is-null.ts")) {
  console.log("∅ is-null - Null Detection on Elide\n");
  console.log(`isNull(null)           = ${isNull(null)}`);
  console.log(`isNull(undefined)      = ${isNull(undefined)}`);
  console.log(`isNull(0)              = ${isNull(0)}`);
  console.log(`isNull("")             = ${isNull("")}`);
  console.log(`isNull(false)          = ${isNull(false)}`);
  console.log("\n✅ 20M+ downloads/week on npm");
}
