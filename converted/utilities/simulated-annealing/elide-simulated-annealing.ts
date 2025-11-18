/**
 * simulated-annealing - Simulated Annealing
 *
 * Simulated annealing optimization.
 * **POLYGLOT SHOWCASE**: One SA library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/simulated-annealing (~3K+ downloads/week)
 *
 * Features:
 * - Global optimization
 * - Temperature scheduling
 * - Acceptance probability
 * - Zero dependencies
 *
 * Package has ~3K+ downloads/week on npm!
 */

export function simulatedAnnealing(
  energy: (state: number[]) => number,
  neighbor: (state: number[]) => number[],
  initial: number[],
  options: { temp?: number; coolingRate?: number; iterations?: number } = {}
): number[] {
  let temp = options.temp || 1000;
  const coolingRate = options.coolingRate || 0.95;
  const iterations = options.iterations || 1000;

  let current = initial;
  let currentEnergy = energy(current);
  let best = current;
  let bestEnergy = currentEnergy;

  for (let i = 0; i < iterations; i++) {
    const candidate = neighbor(current);
    const candidateEnergy = energy(candidate);
    const delta = candidateEnergy - currentEnergy;

    if (delta < 0 || Math.random() < Math.exp(-delta / temp)) {
      current = candidate;
      currentEnergy = candidateEnergy;

      if (currentEnergy < bestEnergy) {
        best = current;
        bestEnergy = currentEnergy;
      }
    }

    temp *= coolingRate;
  }

  return best;
}

export default simulatedAnnealing;

// CLI Demo
if (import.meta.url.includes("elide-simulated-annealing.ts")) {
  console.log("🔥 simulated-annealing for Elide (POLYGLOT!)\n");
  const energy = ([x]: number[]) => (x - 3) ** 2;
  const neighbor = ([x]: number[]) => [x + (Math.random() - 0.5)];
  const result = simulatedAnnealing(energy, neighbor, [0]);
  console.log("Minimize (x-3)²:", result[0].toFixed(4));
  console.log("\n🚀 ~3K+ downloads/week on npm!");
}
