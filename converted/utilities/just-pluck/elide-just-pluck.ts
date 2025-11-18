/**
 * Just Pluck - Array Property Extraction
 *
 * Extract property values from array of objects.
 * **POLYGLOT SHOWCASE**: One pluck utility for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/just-pluck (~10K+ downloads/week)
 */

export function pluck<T, K extends keyof T>(array: T[], key: K): T[K][] {
  return array.map(item => item[key]);
}

export default pluck;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🎯 Just Pluck - Array Property Extraction for Elide (POLYGLOT!)\n");
  
  const users = [
    { id: 1, name: "Alice", age: 25 },
    { id: 2, name: "Bob", age: 30 },
    { id: 3, name: "Charlie", age: 35 }
  ];
  
  console.log("Users:", users);
  console.log("pluck(users, 'name'):", pluck(users, 'name'));
  console.log("pluck(users, 'age'):", pluck(users, 'age'));
  console.log("\n🌐 Works in all languages via Elide!");
  console.log("🚀 ~10K+ downloads/week on npm");
}
