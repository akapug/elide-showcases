// is-regexp - RegExp validation for Elide/TypeScript
// Original: https://github.com/ljharb/is-regex
// Zero dependencies - pure TypeScript!

/**
 * Check if a value is a RegExp.
 *
 * @param value - Value to test
 * @returns True if value is a RegExp
 *
 * @example
 * ```typescript
 * isRegExp(/test/)          // true
 * isRegExp(new RegExp('x')) // true
 * isRegExp('/test/')        // false (string)
 * isRegExp({})              // false
 * ```
 */
export default function isRegExp(value: any): value is RegExp {
  return Object.prototype.toString.call(value) === '[object RegExp]';
}

// CLI usage
if (import.meta.url.includes("elide-is-regexp.ts")) {
  console.log("🔍 is-regexp - RegExp Detection on Elide\n");
  console.log(`isRegExp(/test/)          = ${isRegExp(/test/)}`);
  console.log(`isRegExp(new RegExp('x')) = ${isRegExp(new RegExp('x'))}`);
  console.log(`isRegExp('/test/')        = ${isRegExp('/test/')}`);
  console.log(`isRegExp({})              = ${isRegExp({})}`);
  console.log("\n✅ 40M+ downloads/week on npm");
}
