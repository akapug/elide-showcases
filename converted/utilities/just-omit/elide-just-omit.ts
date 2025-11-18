/**
 * Just Omit - Object Property Omission
 *
 * Omit specific properties from objects.
 * **POLYGLOT SHOWCASE**: One omit utility for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/just-omit (~30K+ downloads/week)
 *
 * Features:
 * - Omit specific properties
 * - Array of keys support
 * - Type-safe omission
 * - Pure functional
 * - Zero dependencies
 *
 * Package has ~30K+ downloads/week on npm!
 */

export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K | K[]
): Omit<T, K> {
  const result = { ...obj } as any;
  const keyArray = Array.isArray(keys) ? keys : [keys];

  for (const key of keyArray) {
    delete result[key];
  }

  return result;
}

export default omit;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🚫 Just Omit - Object Property Omission for Elide (POLYGLOT!)\n");

  const user = {
    id: 1,
    name: "Alice",
    password: "secret",
    token: "abc123",
  };

  console.log("Original:", user);
  console.log("Omit password & token:", omit(user, ["password", "token"]));
  console.log("\n🌐 Works in JavaScript, Python, Ruby, Java via Elide!");
  console.log("🚀 ~30K+ downloads/week on npm");
}
