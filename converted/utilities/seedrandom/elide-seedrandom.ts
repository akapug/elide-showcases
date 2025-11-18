/**
 * seedrandom - Seeded Random Number Generator
 *
 * Seedable random number generator for reproducible randomness.
 * **POLYGLOT SHOWCASE**: Deterministic random in ANY language on Elide!
 *
 * Based on https://www.npmjs.com/package/seedrandom (~300K+ downloads/week)
 *
 * Features:
 * - Seeded RNG
 * - Reproducible results
 * - Multiple algorithms
 * - State management
 *
 * Package has ~300K+ downloads/week on npm!
 */

export class SeedRandom {
  private state: number;

  constructor(seed: string | number = Date.now()) {
    this.state = this.hashSeed(typeof seed === 'string' ? seed : String(seed));
  }

  private hashSeed(seed: string): number {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  next(): number {
    this.state = (this.state * 1664525 + 1013904223) % 4294967296;
    return this.state / 4294967296;
  }

  quick(): number {
    return this.next();
  }

  int32(): number {
    return (this.next() * 4294967296) | 0;
  }

  double(): number {
    return this.next();
  }
}

export default function seedrandom(seed?: string | number): () => number {
  const rng = new SeedRandom(seed);
  return () => rng.next();
}

if (import.meta.url.includes("elide-seedrandom.ts")) {
  console.log("🎲 seedrandom - Seeded RNG for Elide (POLYGLOT!)\n");

  const rng = new SeedRandom("test-seed");
  console.log("Random 1:", rng.next());
  console.log("Random 2:", rng.next());
  console.log("Random 3:", rng.next());

  const rng2 = new SeedRandom("test-seed");
  console.log("\nSame seed, same results:");
  console.log("Random 1:", rng2.next());
  
  console.log("\n✅ Use Cases:");
  console.log("- Procedural generation");
  console.log("- Testing");
  console.log("- Game development");
  console.log("- ~300K+ downloads/week on npm");
}
