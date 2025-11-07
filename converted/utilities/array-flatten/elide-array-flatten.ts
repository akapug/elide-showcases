// array-flatten - Flatten nested arrays
export default function flatten<T>(arr: any[], depth: number = Infinity): T[] {
  if (!Array.isArray(arr)) throw new TypeError('Expected an array');
  return arr.flat(depth) as T[];
}
if (import.meta.url.includes("array-flatten.ts")) {
  console.log("✅", flatten([1, [2, [3, [4]]]]));
  console.log("✅", flatten([1, [2, [3]]], 1));
}
