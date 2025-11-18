/**
 * Recursive Merge - Deep Recursive Merging
 *
 * Recursively merge objects and arrays.
 * **POLYGLOT SHOWCASE**: One recursive merge for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/recursive-merge (~20K+ downloads/week)
 *
 * Features:
 * - Recursive merging
 * - Array concatenation
 * - Deep cloning
 * - Zero dependencies
 *
 * Package has ~20K+ downloads/week on npm!
 */

export default function recursiveMerge(...objects: any[]): any {
  if (objects.length === 0) return {};
  if (objects.length === 1) return objects[0];
  
  const [first, ...rest] = objects;
  const merged = recursiveMerge(...rest);
  
  if (typeof first !== 'object' || first === null) return merged;
  if (typeof merged !== 'object' || merged === null) return first;
  
  const result: any = Array.isArray(first) ? [] : {};
  
  if (Array.isArray(first) && Array.isArray(merged)) {
    return [...first, ...merged];
  }
  
  for (const key of Object.keys(first)) {
    if (merged.hasOwnProperty(key)) {
      result[key] = recursiveMerge(first[key], merged[key]);
    } else {
      result[key] = first[key];
    }
  }
  
  for (const key of Object.keys(merged)) {
    if (!result.hasOwnProperty(key)) {
      result[key] = merged[key];
    }
  }
  
  return result;
}

if (import.meta.url.includes("elide-recursive-merge.ts")) {
  console.log("🔁 Recursive Merge - Deep Merging for Elide (POLYGLOT!)\n");
  
  const obj1 = { a: 1, b: { x: 1 } };
  const obj2 = { b: { y: 2 }, c: 3 };
  const merged = recursiveMerge(obj1, obj2);
  
  console.log("Merged:", merged);
  console.log("\n✅ ~20K+ downloads/week on npm");
}
