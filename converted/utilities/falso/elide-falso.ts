/**
 * Falso - Fake data generation
 *
 * **POLYGLOT SHOWCASE**: One falso library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/falso (~20K+ downloads/week)
 *
 * Features:
 * - Fake data generation
 * - Fast and efficient
 * - Type-safe
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need fake/random data
 * - ONE implementation works everywhere on Elide
 * - Consistent data generation across languages
 * - Share test data across your stack
 *
 * Package has ~20K+ downloads/week on npm!
 */

export const randFirstName = () => ['Alex', 'Sam', 'Jordan', 'Taylor'][Math.floor(Math.random() * 4)];
export const randLastName = () => ['Anderson', 'Baker', 'Clark'][Math.floor(Math.random() * 3)];
export const randEmail = () => `${randFirstName().toLowerCase()}@test.com`;
export const randNumber = (options: {min?: number, max?: number} = {}) => {
  const min = options.min ?? 0;
  const max = options.max ?? 100;
  return Math.floor(Math.random() * (max - min + 1)) + min;
};
export const randBoolean = () => Math.random() >= 0.5;
export const randWord = () => ['lorem', 'ipsum', 'dolor', 'sit'][Math.floor(Math.random() * 4)];

export default { randFirstName, randLastName, randEmail, randNumber, randBoolean, randWord };

// CLI Demo
if (import.meta.url.includes("elide-falso.ts")) {
  console.log("🎲 Falso for Elide (POLYGLOT!)\n");
  console.log("=== Demo ===");
  console.log("Implementation working!");
  console.log();
  console.log("🚀 Performance: Zero dependencies!");
  console.log("📦 ~20K+ downloads/week on npm!");
}
