/**
 * Array.prototype.flat Polyfill
 *
 * ES2019 Array.flat polyfill.
 * **POLYGLOT SHOWCASE**: Array.flat for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/array.prototype.flat (~500K+ downloads/week)
 */

export function arrayFlat<T>(arr: any[], depth = 1): T[] {
  if (depth < 1) return arr.slice();
  
  return arr.reduce((acc, val) => 
    acc.concat(Array.isArray(val) ? arrayFlat(val, depth - 1) : val), 
  []);
}

if (!Array.prototype.flat) {
  Array.prototype.flat = function(depth = 1) {
    return arrayFlat(this, depth);
  };
}

export default arrayFlat;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🏔️ Array.flat Polyfill (POLYGLOT!)\n");
  
  const nested = [1, [2, [3, [4]]]];
  console.log('Flat(1):', arrayFlat(nested, 1));
  console.log('Flat(2):', arrayFlat(nested, 2));
  console.log('Flat(Infinity):', arrayFlat(nested, Infinity));
  console.log("\n  ✓ ~500K+ downloads/week!");
}
