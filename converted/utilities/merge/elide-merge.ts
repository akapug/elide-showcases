/**
 * Merge - Object Merging Utility
 *
 * Deep merge of objects and arrays.
 * **POLYGLOT SHOWCASE**: One merge for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/merge (~100K+ downloads/week)
 *
 * Features:
 * - Deep merge
 * - Array handling
 * - Multiple objects
 * - Zero dependencies
 *
 * Package has ~100K+ downloads/week on npm!
 */

export default function merge(...objects: any[]): any {
  const result: any = {};
  
  for (const obj of objects) {
    if (obj == null || typeof obj !== 'object') continue;
    
    for (const key of Object.keys(obj)) {
      if (typeof obj[key] === 'object' && !Array.isArray(obj[key]) && obj[key] !== null) {
        result[key] = merge(result[key] || {}, obj[key]);
      } else {
        result[key] = obj[key];
      }
    }
  }
  
  return result;
}

if (import.meta.url.includes("elide-merge.ts")) {
  console.log("🔀 Merge - Object Merging for Elide (POLYGLOT!)\n");
  
  const obj1 = { a: 1, b: { x: 1 } };
  const obj2 = { b: { y: 2 }, c: 3 };
  const merged = merge(obj1, obj2);
  
  console.log("Object 1:", obj1);
  console.log("Object 2:", obj2);
  console.log("Merged:", merged);
  console.log("\n✅ ~100K+ downloads/week on npm");
}
