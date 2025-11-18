// is-array - Array validation for Elide/TypeScript
// Original: https://github.com/ljharb/is-array
// Zero dependencies - pure TypeScript!

/**
 * Check if a value is an array.
 * This is just a thin wrapper around Array.isArray.
 *
 * @param value - Value to test
 * @returns True if value is an array
 *
 * @example
 * ```typescript
 * isArray([1, 2, 3])      // true
 * isArray([])             // true
 * isArray("not array")    // false
 * isArray({length: 3})    // false (array-like but not array)
 * isArray(null)           // false
 * ```
 */
export default function isArray(value: any): value is any[] {
  return Array.isArray(value);
}

// CLI usage and demonstrations
if (import.meta.url.includes("elide-is-array.ts")) {
  console.log("📚 is-array - Array Detection on Elide\n");

  console.log("=== Arrays ===");
  console.log(`isArray([1, 2, 3])          = ${isArray([1, 2, 3])}`);
  console.log(`isArray([])                 = ${isArray([])}`);
  console.log(`isArray(new Array(5))       = ${isArray(new Array(5))}`);
  console.log();

  console.log("=== Non-Arrays ===");
  console.log(`isArray("not array")        = ${isArray("not array")}`);
  console.log(`isArray({length: 3})        = ${isArray({ length: 3 })}`);
  console.log(`isArray(arguments)          = ${isArray((function () { return arguments; })())}`);
  console.log(`isArray(null)               = ${isArray(null)}`);
  console.log(`isArray(undefined)          = ${isArray(undefined)}`);
  console.log(`isArray(42)                 = ${isArray(42)}`);
  console.log();

  console.log("=== Performance Note ===");
  console.log("✅ 40M+ downloads/week on npm");
  console.log("✅ Uses native Array.isArray");
  console.log("✅ Zero dependencies");
}
