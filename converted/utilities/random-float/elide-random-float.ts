/**
 * Random Float - Generate Random Floating Point Numbers
 *
 * Generate random floating point numbers within a range.
 * **POLYGLOT SHOWCASE**: One random float library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/random-float (~50K+ downloads/week)
 *
 * Features:
 * - Generate random floats in range
 * - Min/max bounds
 * - Precision control
 * - Uniform distribution
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need random floats
 * - ONE implementation works everywhere on Elide
 * - Consistent randomness across languages
 * - Share random logic across your stack
 *
 * Use cases:
 * - Simulations (physics, games)
 * - Testing (random weights, probabilities)
 * - Graphics (random positions, colors)
 * - Machine learning (random initialization)
 *
 * Package has ~50K+ downloads/week on npm!
 */

/**
 * Generate random float between min and max
 */
export default function randomFloat(min: number = 0, max: number = 1): number {
  if (min > max) {
    throw new RangeError('`max` must be greater than or equal to `min`');
  }

  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  const random = bytes[0] / 0x100000000; // 0 to 1
  return min + (random * (max - min));
}

/**
 * Generate random float with fixed precision
 */
export function randomFloatFixed(min: number, max: number, precision: number): number {
  const value = randomFloat(min, max);
  return Number(value.toFixed(precision));
}

/**
 * Generate array of random floats
 */
export function randomFloats(count: number, min: number = 0, max: number = 1): number[] {
  const result: number[] = [];
  for (let i = 0; i < count; i++) {
    result.push(randomFloat(min, max));
  }
  return result;
}

// CLI Demo
if (import.meta.url.includes("elide-random-float.ts")) {
  console.log("🎲 Random Float - Random Floats for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Random Floats ===");
  console.log("0-1:", randomFloat());
  console.log("0-10:", randomFloat(0, 10));
  console.log("5-15:", randomFloat(5, 15));
  console.log();

  console.log("=== Example 2: Fixed Precision ===");
  console.log("2 decimals:", randomFloatFixed(0, 100, 2));
  console.log("4 decimals:", randomFloatFixed(0, 1, 4));
  console.log("1 decimal:", randomFloatFixed(10, 20, 1));
  console.log();

  console.log("=== Example 3: Probabilities ===");
  console.log("Random probability:", randomFloat());
  console.log("Random percentage:", randomFloat(0, 100).toFixed(2) + "%");
  console.log();

  console.log("=== Example 4: Graphics ===");
  console.log("Random X (0-800):", randomFloat(0, 800).toFixed(2));
  console.log("Random Y (0-600):", randomFloat(0, 600).toFixed(2));
  console.log("Random opacity:", randomFloat(0, 1).toFixed(2));
  console.log();

  console.log("=== Example 5: Multiple Values ===");
  console.log("5 random floats:", randomFloats(5).map(n => n.toFixed(3)));
  console.log("10 random 0-100:", randomFloats(10, 0, 100).map(n => n.toFixed(1)));
  console.log();

  console.log("=== Example 6: Physics Simulation ===");
  function randomVelocity(): { x: number, y: number } {
    return {
      x: randomFloat(-10, 10),
      y: randomFloat(-10, 10)
    };
  }
  console.log("Random velocity:", randomVelocity());
  console.log();

  console.log("=== Example 7: POLYGLOT Use Case ===");
  console.log("🌐 Same random float works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();

  console.log("🚀 Performance: Zero dependencies!");
  console.log("📦 ~50K+ downloads/week on npm!");
}
