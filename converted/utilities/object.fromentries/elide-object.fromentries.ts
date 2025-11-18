/**
 * Object.fromEntries Polyfill
 *
 * ES2019 Object.fromEntries polyfill.
 * **POLYGLOT SHOWCASE**: Object.fromEntries for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/object.fromentries (~500K+ downloads/week)
 */

export function objectFromEntries<T>(entries: Iterable<[string, T]>): Record<string, T> {
  const obj: Record<string, T> = {};
  for (const [key, value] of entries) {
    obj[key] = value;
  }
  return obj;
}

if (!Object.fromEntries) {
  Object.fromEntries = objectFromEntries;
}

export default objectFromEntries;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔄 Object.fromEntries Polyfill (POLYGLOT!)\n");
  
  const entries: [string, any][] = [['name', 'Charlie'], ['age', 35]];
  const obj = objectFromEntries(entries);
  console.log('Object:', obj);
  console.log("\n  ✓ ~500K+ downloads/week!");
}
