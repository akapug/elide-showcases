/**
 * Random Int - Generate Random Integers
 *
 * Generate a random integer within a specified range.
 * **POLYGLOT SHOWCASE**: One random int library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/random-int (~100K+ downloads/week)
 *
 * Features:
 * - Generate random integers in range
 * - Min/max bounds
 * - Inclusive/exclusive options
 * - Uniform distribution
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need random integers
 * - ONE implementation works everywhere on Elide
 * - Consistent randomness across languages
 * - Share random logic across your stack
 *
 * Use cases:
 * - Game development (dice rolls, random positions)
 * - Testing (random test data)
 * - Simulations (Monte Carlo)
 * - Load balancing (random server selection)
 *
 * Package has ~100K+ downloads/week on npm!
 */

/**
 * Generate random integer between min and max (inclusive)
 */
export default function randomInt(min: number, max?: number): number {
  if (max === undefined) {
    max = min;
    min = 0;
  }

  if (min > max) {
    throw new RangeError('`max` must be greater than or equal to `min`');
  }

  const range = max - min + 1;
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return min + (bytes[0] % range);
}

/**
 * Generate random integer with exclusive max
 */
export function randomIntExclusive(min: number, max: number): number {
  return randomInt(min, max - 1);
}

/**
 * Generate array of random integers
 */
export function randomInts(count: number, min: number, max?: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < count; i++) {
    result.push(randomInt(min, max));
  }
  return result;
}

// CLI Demo
if (import.meta.url.includes("elide-random-int.ts")) {
  console.log("🎲 Random Int - Random Integers for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Random Integers ===");
  console.log("0-10:", randomInt(0, 10));
  console.log("1-100:", randomInt(1, 100));
  console.log("0-999:", randomInt(999));
  console.log();

  console.log("=== Example 2: Dice Rolls ===");
  function rollDice(sides: number = 6): number {
    return randomInt(1, sides);
  }
  console.log("d6:", rollDice());
  console.log("d20:", rollDice(20));
  console.log("d100:", rollDice(100));
  console.log();

  console.log("=== Example 3: Multiple Rolls ===");
  console.log("Roll 5 dice:", randomInts(5, 1, 6));
  console.log("10 random 0-99:", randomInts(10, 0, 99));
  console.log();

  console.log("=== Example 4: Game Examples ===");
  console.log("Coin flip:", randomInt(0, 1) === 1 ? "Heads" : "Tails");
  console.log("Card (1-13):", randomInt(1, 13));
  console.log("Random player (1-4):", randomInt(1, 4));
  console.log();

  console.log("=== Example 5: Array Index Selection ===");
  const items = ["apple", "banana", "cherry", "date", "elderberry"];
  const randomIndex = randomInt(0, items.length - 1);
  console.log("Random item:", items[randomIndex]);
  console.log();

  console.log("=== Example 6: Load Balancing ===");
  const servers = ["server1", "server2", "server3", "server4"];
  const serverIndex = randomInt(0, servers.length - 1);
  console.log("Selected server:", servers[serverIndex]);
  console.log();

  console.log("=== Example 7: POLYGLOT Use Case ===");
  console.log("🌐 Same random int works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();

  console.log("🚀 Performance: Zero dependencies!");
  console.log("📦 ~100K+ downloads/week on npm!");
}
