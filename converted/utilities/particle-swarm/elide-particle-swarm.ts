/**
 * particle-swarm - Particle Swarm Optimization
 *
 * PSO algorithm for optimization.
 * **POLYGLOT SHOWCASE**: One PSO library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/particle-swarm (~2K+ downloads/week)
 *
 * Features:
 * - Swarm-based optimization
 * - Velocity and position updates
 * - Global and local best tracking
 * - Zero dependencies
 *
 * Package has ~2K+ downloads/week on npm!
 */

export function particleSwarm(
  fitness: (position: number[]) => number,
  dimensions: number,
  options: { particles?: number; iterations?: number } = {}
): number[] {
  const numParticles = options.particles || 30;
  const iterations = options.iterations || 100;

  // Initialize particles
  const particles = Array(numParticles).fill(0).map(() => ({
    position: Array(dimensions).fill(0).map(() => Math.random() * 10 - 5),
    velocity: Array(dimensions).fill(0).map(() => Math.random() * 2 - 1),
    bestPosition: [] as number[],
    bestFitness: -Infinity
  }));

  let globalBest = Array(dimensions).fill(0);
  let globalBestFitness = -Infinity;

  for (let iter = 0; iter < iterations; iter++) {
    for (const p of particles) {
      const fit = fitness(p.position);

      if (fit > p.bestFitness) {
        p.bestPosition = [...p.position];
        p.bestFitness = fit;
      }

      if (fit > globalBestFitness) {
        globalBest = [...p.position];
        globalBestFitness = fit;
      }

      // Update velocity and position
      for (let d = 0; d < dimensions; d++) {
        const r1 = Math.random();
        const r2 = Math.random();
        p.velocity[d] = 0.5 * p.velocity[d] +
          1.5 * r1 * (p.bestPosition[d] - p.position[d]) +
          1.5 * r2 * (globalBest[d] - p.position[d]);
        p.position[d] += p.velocity[d];
      }
    }
  }

  return globalBest;
}

export default particleSwarm;

// CLI Demo
if (import.meta.url.includes("elide-particle-swarm.ts")) {
  console.log("🐝 particle-swarm for Elide (POLYGLOT!)\n");
  const fitness = ([x]: number[]) => -(x - 3) ** 2;
  const result = particleSwarm(fitness, 1, { iterations: 50 });
  console.log("Maximize -(x-3)²:", result[0].toFixed(4));
  console.log("\n🚀 ~2K+ downloads/week on npm!");
}
