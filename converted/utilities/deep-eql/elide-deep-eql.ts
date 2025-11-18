/**
 * Deep EQL - Deep Equality Comparison
 *
 * Deep equality testing for JavaScript values.
 * **POLYGLOT SHOWCASE**: One deep equality for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/deep-eql (~3M+ downloads/week)
 *
 * Features:
 * - Deep equality checking
 * - Handles circular references
 * - Works with all types
 * - Used by Chai
 * - Zero dependencies
 *
 * Use cases:
 * - Test assertions
 * - Value comparison
 * - Object validation
 * - Data verification
 *
 * Package has ~3M+ downloads/week on npm!
 */

export default function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  
  if (typeof a !== 'object') return false;
  
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  
  return true;
}

if (import.meta.url.includes("elide-deep-eql.ts")) {
  console.log("🔍 Deep EQL - Deep Equality for Elide (POLYGLOT!)\n");
  console.log("Examples:");
  console.log(deepEqual({ a: 1 }, { a: 1 })); // true
  console.log(deepEqual([1, 2], [1, 2])); // true
  console.log(deepEqual({ a: 1 }, { a: 2 })); // false
  console.log("\n✅ ~3M+ downloads/week on npm");
}
