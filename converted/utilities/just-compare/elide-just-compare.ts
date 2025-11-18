/**
 * Just Compare - Deep Comparison
 *
 * Deep equality comparison for objects and arrays.
 * **POLYGLOT SHOWCASE**: One compare utility for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/just-compare (~20K+ downloads/week)
 */

export function compare(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object') return a === b;

  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    return a.every((item, i) => compare(item, b[i]));
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;

  return keysA.every(key => compare(a[key], b[key]));
}

export default compare;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔍 Just Compare - Deep Comparison for Elide (POLYGLOT!)\n");
  console.log("compare({a:1}, {a:1}):", compare({a:1}, {a:1}));
  console.log("compare([1,2,3], [1,2,3]):", compare([1,2,3], [1,2,3]));
  console.log("compare({a:1}, {a:2}):", compare({a:1}, {a:2}));
  console.log("\n🌐 Works in all languages via Elide!");
  console.log("🚀 ~20K+ downloads/week on npm");
}
