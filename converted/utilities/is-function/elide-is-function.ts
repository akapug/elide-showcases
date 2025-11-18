// is-function - Function validation for Elide/TypeScript
// Original: https://github.com/ljharb/is-function
// Zero dependencies - pure TypeScript!

/**
 * Check if a value is a function.
 *
 * @param value - Value to test
 * @returns True if value is a function
 *
 * @example
 * ```typescript
 * isFunction(() => {})           // true
 * isFunction(function() {})      // true
 * isFunction(async () => {})     // true
 * isFunction(class MyClass {})   // true
 * isFunction(42)                 // false
 * isFunction(null)               // false
 * ```
 */
export default function isFunction(value: any): value is Function {
  return typeof value === 'function';
}

// CLI usage and demonstrations
if (import.meta.url.includes("elide-is-function.ts")) {
  console.log("⚡ is-function - Function Detection on Elide\n");

  console.log("=== Functions ===");
  console.log(`isFunction(() => {})           = ${isFunction(() => {})}`);
  console.log(`isFunction(function() {})      = ${isFunction(function () {})}`);
  console.log(`isFunction(async () => {})     = ${isFunction(async () => {})}`);
  console.log(`isFunction(function*() {})     = ${isFunction(function* () {})}`);
  console.log(`isFunction(class MyClass {})   = ${isFunction(class MyClass {})}`);
  console.log();

  console.log("=== Non-Functions ===");
  console.log(`isFunction(42)                 = ${isFunction(42)}`);
  console.log(`isFunction("string")           = ${isFunction("string")}`);
  console.log(`isFunction(null)               = ${isFunction(null)}`);
  console.log(`isFunction(undefined)          = ${isFunction(undefined)}`);
  console.log(`isFunction({})                 = ${isFunction({})}`);
  console.log(`isFunction([])                 = ${isFunction([])}`);
  console.log();

  console.log("=== Performance Note ===");
  console.log("✅ 40M+ downloads/week on npm");
  console.log("✅ Simple typeof check");
  console.log("✅ Zero dependencies");
}
