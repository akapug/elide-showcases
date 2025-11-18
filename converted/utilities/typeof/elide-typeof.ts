// typeof - Better typeof for Elide/TypeScript
// Zero dependencies - pure TypeScript!

/**
 * A better typeof that handles arrays, null, and other edge cases.
 *
 * @param value - Value to check type of
 * @returns Type name as lowercase string
 *
 * @example
 * ```typescript
 * typeOf([])           // 'array'
 * typeOf(null)         // 'null'
 * typeOf({})           // 'object'
 * typeOf(42)           // 'number'
 * typeOf('hello')      // 'string'
 * ```
 */
export default function typeOf(value: any): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

// CLI usage
if (import.meta.url.includes("elide-typeof.ts")) {
  console.log("🔍 typeof - Better typeof on Elide\n");

  console.log("=== Improvements over native typeof ===");
  console.log(`typeOf([])           = '${typeOf([])}'       (vs typeof: '${typeof []}')`);
  console.log(`typeOf(null)         = '${typeOf(null)}'     (vs typeof: '${typeof null}')`);
  console.log(`typeOf({})           = '${typeOf({})}'       (vs typeof: '${typeof {}}')`);
  console.log(`typeOf(42)           = '${typeOf(42)}'       (vs typeof: '${typeof 42}')`);
  console.log(`typeOf('hello')      = '${typeOf('hello')}'  (vs typeof: '${typeof 'hello'}')`);
  console.log(`typeOf(() => {})     = '${typeOf(() => {})}'  (vs typeof: '${typeof (() => {})}')`);
  console.log();

  console.log("✅ 10M+ downloads/week on npm");
}
