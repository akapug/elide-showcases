// is-string - String validation for Elide/TypeScript
// Original: https://github.com/ljharb/is-string
// Zero dependencies - pure TypeScript!

/**
 * Check if a value is a string primitive or String object.
 *
 * @param value - Value to test
 * @returns True if value is a string
 *
 * @example
 * ```typescript
 * isString("hello")           // true
 * isString(new String("hi"))  // true
 * isString(42)                // false
 * isString(null)              // false
 * isString(undefined)         // false
 * ```
 */
export default function isString(value: any): value is string {
  return typeof value === 'string' || value instanceof String;
}

// CLI usage and demonstrations
if (import.meta.url.includes("elide-is-string.ts")) {
  console.log("🔤 is-string - String Detection on Elide\n");

  console.log("=== String Primitives ===");
  console.log(`isString("hello")           = ${isString("hello")}`);
  console.log(`isString('')                = ${isString("")}`);
  console.log(`isString("123")             = ${isString("123")}`);
  console.log();

  console.log("=== String Objects ===");
  console.log(`isString(new String("hi"))  = ${isString(new String("hi"))}`);
  console.log(`isString(String("hi"))      = ${isString(String("hi"))}`);
  console.log();

  console.log("=== Non-Strings ===");
  console.log(`isString(42)                = ${isString(42)}`);
  console.log(`isString(true)              = ${isString(true)}`);
  console.log(`isString(null)              = ${isString(null)}`);
  console.log(`isString(undefined)         = ${isString(undefined)}`);
  console.log(`isString([])                = ${isString([])}`);
  console.log(`isString({})                = ${isString({})}`);
  console.log();

  console.log("=== Real-World Examples ===");
  const mixed = ["hello", 42, true, "world", null, "test"];
  console.log(`Input:  ${JSON.stringify(mixed)}`);
  console.log(`Strings: ${JSON.stringify(mixed.filter(isString))}`);
  console.log();

  console.log("=== Performance Note ===");
  console.log("✅ 40M+ downloads/week on npm");
  console.log("✅ Ultra-fast type check");
  console.log("✅ Zero dependencies");
}
