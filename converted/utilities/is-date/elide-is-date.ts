// is-date - Date validation for Elide/TypeScript
// Original: https://github.com/ljharb/is-date-object
// Zero dependencies - pure TypeScript!

/**
 * Check if a value is a Date object.
 *
 * @param value - Value to test
 * @returns True if value is a Date
 *
 * @example
 * ```typescript
 * isDate(new Date())        // true
 * isDate(Date.now())        // false (number)
 * isDate('2023-01-01')      // false (string)
 * isDate({})                // false
 * ```
 */
export default function isDate(value: any): value is Date {
  return Object.prototype.toString.call(value) === '[object Date]';
}

// CLI usage
if (import.meta.url.includes("elide-is-date.ts")) {
  console.log("📅 is-date - Date Detection on Elide\n");
  console.log(`isDate(new Date())        = ${isDate(new Date())}`);
  console.log(`isDate(Date.now())        = ${isDate(Date.now())}`);
  console.log(`isDate('2023-01-01')      = ${isDate('2023-01-01')}`);
  console.log(`isDate({})                = ${isDate({})}`);
  console.log("\n✅ 20M+ downloads/week on npm");
}
