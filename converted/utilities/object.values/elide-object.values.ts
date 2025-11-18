/**
 * Object.values Polyfill
 *
 * ES2017 Object.values polyfill.
 * **POLYGLOT SHOWCASE**: Object.values for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/object.values (~1M+ downloads/week)
 */

export function objectValues<T>(obj: Record<string, T>): T[] {
  const values: T[] = [];
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      values.push(obj[key]);
    }
  }
  return values;
}

if (!Object.values) {
  Object.values = objectValues;
}

export default objectValues;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("📊 Object.values Polyfill (POLYGLOT!)\n");
  
  const obj = { name: 'Bob', age: 25, role: 'Developer' };
  const values = objectValues(obj);
  console.log('Values:', values);
  console.log("\n  ✓ ~1M+ downloads/week!");
}
