/**
 * Just Unique - Array Deduplication
 *
 * Remove duplicates from arrays efficiently.
 * **POLYGLOT SHOWCASE**: One unique utility for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/just-unique (~20K+ downloads/week)
 */

export function unique<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

export function uniqueBy<T>(array: T[], fn: (item: T) => any): T[] {
  const seen = new Set();
  return array.filter(item => {
    const key = fn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default unique;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("✨ Just Unique - Array Deduplication for Elide (POLYGLOT!)\n");
  console.log("unique([1,2,2,3,3,3]):", unique([1,2,2,3,3,3]));
  
  const users = [
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
    { id: 1, name: "Alice" }
  ];
  console.log("uniqueBy(users, u => u.id):", uniqueBy(users, u => u.id));
  console.log("\n🌐 Works in all languages via Elide!");
  console.log("🚀 ~20K+ downloads/week on npm");
}
