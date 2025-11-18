/**
 * Array.prototype.flatMap Polyfill
 *
 * ES2019 Array.flatMap polyfill.
 * **POLYGLOT SHOWCASE**: Array.flatMap for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/array.prototype.flatmap (~300K+ downloads/week)
 */

export function arrayFlatMap<T, U>(arr: T[], callback: (value: T, index: number, array: T[]) => U | U[]): U[] {
  return arr.map(callback).reduce((acc: U[], val) => 
    acc.concat(val), []
  );
}

if (!Array.prototype.flatMap) {
  Array.prototype.flatMap = function<T, U>(this: T[], callback: (value: T, index: number, array: T[]) => U | U[]): U[] {
    return arrayFlatMap(this, callback);
  };
}

export default arrayFlatMap;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🗺️ Array.flatMap Polyfill (POLYGLOT!)\n");
  
  const arr = [1, 2, 3];
  const result = arrayFlatMap(arr, x => [x, x * 2]);
  console.log('Result:', result);
  console.log("\n  ✓ ~300K+ downloads/week!");
}
