/**
 * Array.includes Polyfill
 *
 * ES2016 Array.includes polyfill.
 * **POLYGLOT SHOWCASE**: Array.includes for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/array-includes (~1M+ downloads/week)
 */

export function arrayIncludes<T>(arr: T[], searchElement: T, fromIndex = 0): boolean {
  const len = arr.length;
  if (len === 0) return false;
  
  const n = fromIndex | 0;
  let k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
  
  while (k < len) {
    if (arr[k] === searchElement || (Number.isNaN(arr[k]) && Number.isNaN(searchElement))) {
      return true;
    }
    k++;
  }
  
  return false;
}

if (!Array.prototype.includes) {
  Array.prototype.includes = function<T>(this: T[], searchElement: T, fromIndex?: number): boolean {
    return arrayIncludes(this, searchElement, fromIndex);
  };
}

export default arrayIncludes;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔍 Array.includes Polyfill (POLYGLOT!)\n");
  
  const arr = [1, 2, 3, NaN];
  console.log('Includes 2:', arrayIncludes(arr, 2));
  console.log('Includes 4:', arrayIncludes(arr, 4));
  console.log('Includes NaN:', arrayIncludes(arr, NaN));
  console.log("\n  ✓ ~1M+ downloads/week!");
}
