/**
 * Shallow Equal - Shallow Equality Comparison
 *
 * Fast shallow equality for objects and arrays.
 * **POLYGLOT SHOWCASE**: One shallow equal for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/shallow-equal (~500K+ downloads/week)
 *
 * Features:
 * - Fast shallow comparison
 * - Object/array support
 * - Simple API
 * - Zero dependencies
 *
 * Package has ~500K+ downloads/week on npm!
 */

export function shallowEqualObjects(a: any, b: any): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (a[key] !== b[key] || !Object.prototype.hasOwnProperty.call(b, key)) {
      return false;
    }
  }
  
  return true;
}

export function shallowEqualArrays(a: any[], b: any[]): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  
  return true;
}

export default function shallowEqual(a: any, b: any): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return shallowEqualArrays(a, b);
  }
  return shallowEqualObjects(a, b);
}

if (import.meta.url.includes("elide-shallow-equal.ts")) {
  console.log("⚡ Shallow Equal - Fast Equality for Elide (POLYGLOT!)\n");
  console.log(shallowEqual({ a: 1 }, { a: 1 })); // true
  console.log(shallowEqual([1, 2], [1, 2])); // true
  console.log("\n✅ ~500K+ downloads/week on npm");
}
