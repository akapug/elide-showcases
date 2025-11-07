// array-unique - Remove duplicates from array
// Original: github.com/jonschlinkert/array-unique
export default function arrayUnique<T>(arr: T[]): T[] {
  if (!Array.isArray(arr)) {
    throw new TypeError('array-unique expects an array');
  }
  return [...new Set(arr)];
}
if (import.meta.url.includes("array-unique.ts")) {
  console.log("✅", arrayUnique([1, 2, 2, 3, 3, 3, 4]));
  console.log("✅", arrayUnique(['a', 'b', 'a', 'c']));
}
