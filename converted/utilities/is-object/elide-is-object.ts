// is-object - Object validation for Elide/TypeScript
// Original: https://github.com/jonschlinkert/is-object
// Zero dependencies - pure TypeScript!

/**
 * Check if a value is an object (not null, not array, not function).
 * Returns true for plain objects and instances of classes.
 *
 * @param value - Value to test
 * @returns True if value is an object
 *
 * @example
 * ```typescript
 * isObject({})               // true
 * isObject({a: 1})           // true
 * isObject(new Date())       // true
 * isObject([])               // false (array)
 * isObject(null)             // false
 * isObject(42)               // false
 * ```
 */
export default function isObject(value: any): value is object {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

// CLI usage and demonstrations
if (import.meta.url.includes("elide-is-object.ts")) {
  console.log("📦 is-object - Object Detection on Elide\n");

  console.log("=== Objects ===");
  console.log(`isObject({})               = ${isObject({})}`);
  console.log(`isObject({a: 1})           = ${isObject({ a: 1 })}`);
  console.log(`isObject(new Date())       = ${isObject(new Date())}`);
  console.log(`isObject(new String("x"))  = ${isObject(new String("x"))}`);
  console.log();

  console.log("=== Non-Objects ===");
  console.log(`isObject([])               = ${isObject([])}`);
  console.log(`isObject(null)             = ${isObject(null)}`);
  console.log(`isObject(undefined)        = ${isObject(undefined)}`);
  console.log(`isObject(42)               = ${isObject(42)}`);
  console.log(`isObject("string")         = ${isObject("string")}`);
  console.log(`isObject(true)             = ${isObject(true)}`);
  console.log(`isObject(() => {})         = ${isObject(() => {})}`);
  console.log();

  console.log("=== Performance Note ===");
  console.log("✅ 80M+ downloads/week on npm");
  console.log("✅ Simple typeof + null check");
  console.log("✅ Zero dependencies");
}
