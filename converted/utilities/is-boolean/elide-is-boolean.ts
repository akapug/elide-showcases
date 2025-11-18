// is-boolean - Boolean validation for Elide/TypeScript
// Original: https://github.com/ljharb/is-boolean
// Zero dependencies - pure TypeScript!

/**
 * Check if a value is a boolean primitive or Boolean object.
 *
 * @param value - Value to test
 * @returns True if value is a boolean
 *
 * @example
 * ```typescript
 * isBoolean(true)              // true
 * isBoolean(false)             // true
 * isBoolean(new Boolean(true)) // true
 * isBoolean(1)                 // false
 * isBoolean("true")            // false
 * isBoolean(null)              // false
 * ```
 */
export default function isBoolean(value: any): value is boolean {
  return typeof value === 'boolean' || value instanceof Boolean;
}

// CLI usage and demonstrations
if (import.meta.url.includes("elide-is-boolean.ts")) {
  console.log("✓ is-boolean - Boolean Detection on Elide\n");

  console.log("=== Booleans ===");
  console.log(`isBoolean(true)              = ${isBoolean(true)}`);
  console.log(`isBoolean(false)             = ${isBoolean(false)}`);
  console.log(`isBoolean(new Boolean(true)) = ${isBoolean(new Boolean(true))}`);
  console.log(`isBoolean(Boolean(1))        = ${isBoolean(Boolean(1))}`);
  console.log();

  console.log("=== Non-Booleans ===");
  console.log(`isBoolean(1)                 = ${isBoolean(1)}`);
  console.log(`isBoolean(0)                 = ${isBoolean(0)}`);
  console.log(`isBoolean("true")            = ${isBoolean("true")}`);
  console.log(`isBoolean(null)              = ${isBoolean(null)}`);
  console.log(`isBoolean(undefined)         = ${isBoolean(undefined)}`);
  console.log(`isBoolean({})                = ${isBoolean({})}`);
  console.log();

  console.log("=== Performance Note ===");
  console.log("✅ 30M+ downloads/week on npm");
  console.log("✅ Simple typeof check");
  console.log("✅ Zero dependencies");
}
