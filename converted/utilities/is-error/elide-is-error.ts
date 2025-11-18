// is-error - Error validation for Elide/TypeScript
// Zero dependencies - pure TypeScript!

/**
 * Check if a value is an Error object.
 *
 * @param value - Value to test
 * @returns True if value is an Error
 *
 * @example
 * ```typescript
 * isError(new Error('x'))       // true
 * isError(new TypeError('x'))   // true
 * isError({message: 'x'})       // false
 * isError('error')              // false
 * ```
 */
export default function isError(value: any): value is Error {
  return Object.prototype.toString.call(value) === '[object Error]' || value instanceof Error;
}

// CLI usage
if (import.meta.url.includes("elide-is-error.ts")) {
  console.log("⚠️ is-error - Error Detection on Elide\n");
  console.log(`isError(new Error('x'))       = ${isError(new Error('x'))}`);
  console.log(`isError(new TypeError('x'))   = ${isError(new TypeError('x'))}`);
  console.log(`isError({message: 'x'})       = ${isError({ message: 'x' })}`);
  console.log(`isError('error')              = ${isError('error')}`);
  console.log("\n✅ 30M+ downloads/week on npm");
}
