/**
 * Object.entries Polyfill
 *
 * ES2017 Object.entries polyfill.
 * **POLYGLOT SHOWCASE**: Object.entries for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/object.entries (~1M+ downloads/week)
 */

export function objectEntries<T>(obj: Record<string, T>): [string, T][] {
  const entries: [string, T][] = [];
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      entries.push([key, obj[key]]);
    }
  }
  return entries;
}

if (!Object.entries) {
  Object.entries = objectEntries;
}

export default objectEntries;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("📋 Object.entries Polyfill (POLYGLOT!)\n");
  
  const obj = { name: 'Alice', age: 30, city: 'NYC' };
  const entries = objectEntries(obj);
  console.log('Entries:', entries);
  entries.forEach(([key, value]) => console.log(`  ${key}: ${value}`));
  console.log("\n  ✓ ~1M+ downloads/week!");
}
