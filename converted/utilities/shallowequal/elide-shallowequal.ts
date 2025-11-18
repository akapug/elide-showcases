/**
 * ShallowEqual - Shallow Comparison Utility
 *
 * Shallow comparison for React and general use.
 * **POLYGLOT SHOWCASE**: One shallow compare for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/shallowequal (~2M+ downloads/week)
 *
 * Features:
 * - Fast shallow check
 * - React-compatible
 * - Simple API
 * - Zero dependencies
 *
 * Package has ~2M+ downloads/week on npm!
 */

export default function shallowequal(objA: any, objB: any): boolean {
  if (objA === objB) return true;
  
  if (typeof objA !== 'object' || objA === null ||
      typeof objB !== 'object' || objB === null) {
    return false;
  }
  
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  
  if (keysA.length !== keysB.length) return false;
  
  for (let i = 0; i < keysA.length; i++) {
    if (!Object.prototype.hasOwnProperty.call(objB, keysA[i]) ||
        objA[keysA[i]] !== objB[keysA[i]]) {
      return false;
    }
  }
  
  return true;
}

if (import.meta.url.includes("elide-shallowequal.ts")) {
  console.log("⚡ ShallowEqual - React-Style Comparison for Elide (POLYGLOT!)\n");
  console.log(shallowequal({ a: 1 }, { a: 1 })); // true
  console.log("\n✅ ~2M+ downloads/week on npm");
}
