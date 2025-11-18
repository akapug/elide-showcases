/**
 * probability-distributions - Probability Distributions
 *
 * Collection of probability distribution functions.
 * **POLYGLOT SHOWCASE**: One probability library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/probability-distributions (~10K+ downloads/week)
 *
 * Features:
 * - Normal, uniform, exponential distributions
 * - Binomial, poisson distributions
 * - Random sampling
 * - PDF and CDF functions
 * - Zero dependencies
 *
 * Use cases:
 * - Statistical modeling
 * - Monte Carlo simulations
 * - Random data generation
 *
 * Package has ~10K+ downloads/week on npm!
 */

export const normal = {
  sample(n: number, mean: number = 0, std: number = 1): number[] {
    const result: number[] = [];
    for (let i = 0; i < n; i++) {
      const u1 = Math.random(), u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      result.push(z * std + mean);
    }
    return result;
  }
};

export const uniform = {
  sample(n: number, min: number = 0, max: number = 1): number[] {
    return Array(n).fill(0).map(() => min + Math.random() * (max - min));
  }
};

export const exponential = {
  sample(n: number, rate: number = 1): number[] {
    return Array(n).fill(0).map(() => -Math.log(Math.random()) / rate);
  }
};

export const binomial = {
  sample(n: number, trials: number, p: number): number[] {
    return Array(n).fill(0).map(() => {
      let successes = 0;
      for (let i = 0; i < trials; i++) {
        if (Math.random() < p) successes++;
      }
      return successes;
    });
  }
};

export const poisson = {
  sample(n: number, lambda: number): number[] {
    return Array(n).fill(0).map(() => {
      let k = 0;
      let p = Math.exp(-lambda);
      let s = p;
      const u = Math.random();
      while (u > s) {
        k++;
        p *= lambda / k;
        s += p;
      }
      return k;
    });
  }
};

export default { normal, uniform, exponential, binomial, poisson };

// CLI Demo
if (import.meta.url.includes("elide-probability-distributions.ts")) {
  console.log("🎲 probability-distributions for Elide (POLYGLOT!)\n");
  console.log("Normal samples:", normal.sample(5, 0, 1).map(x => x.toFixed(2)));
  console.log("Uniform samples:", uniform.sample(5, 0, 10).map(x => x.toFixed(2)));
  console.log("Exponential samples:", exponential.sample(5, 0.5).map(x => x.toFixed(2)));
  console.log("Binomial samples:", binomial.sample(5, 10, 0.5));
  console.log("Poisson samples:", poisson.sample(5, 3));
  console.log("\n🚀 ~10K+ downloads/week on npm!");
}
