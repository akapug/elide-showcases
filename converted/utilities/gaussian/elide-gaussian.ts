/**
 * gaussian - Gaussian Distribution
 *
 * JavaScript model of the Gaussian (normal) distribution.
 * **POLYGLOT SHOWCASE**: One gaussian library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/gaussian (~20K+ downloads/week)
 *
 * Features:
 * - PDF and CDF calculations
 * - Probability ranges
 * - Random sampling
 * - PPF (inverse CDF)
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Normal distribution in any language
 * - Share probability code across stack
 * - Consistent statistical results
 * - One implementation everywhere
 *
 * Use cases:
 * - Statistical analysis
 * - Monte Carlo simulations
 * - Machine learning
 * - Quality control
 *
 * Package has ~20K+ downloads/week on npm!
 */

export class Gaussian {
  mean: number;
  variance: number;
  standardDeviation: number;

  constructor(mean: number = 0, variance: number = 1) {
    this.mean = mean;
    this.variance = variance;
    this.standardDeviation = Math.sqrt(variance);
  }

  /**
   * Probability density function
   */
  pdf(x: number): number {
    const m = this.mean;
    const v = this.variance;
    return Math.exp(-0.5 * ((x - m) ** 2) / v) / Math.sqrt(2 * Math.PI * v);
  }

  /**
   * Cumulative distribution function
   */
  cdf(x: number): number {
    const z = (x - this.mean) / this.standardDeviation;
    return 0.5 * (1 + this.erf(z / Math.sqrt(2)));
  }

  /**
   * Percent point function (inverse CDF)
   */
  ppf(p: number): number {
    return this.mean + this.standardDeviation * Math.sqrt(2) * this.ierf(2 * p - 1);
  }

  /**
   * Product of two Gaussians
   */
  mul(other: Gaussian): Gaussian {
    const v1 = this.variance;
    const v2 = other.variance;
    const m1 = this.mean;
    const m2 = other.mean;

    const variance = 1 / (1 / v1 + 1 / v2);
    const mean = (m1 / v1 + m2 / v2) * variance;

    return new Gaussian(mean, variance);
  }

  /**
   * Sum of two independent Gaussians
   */
  add(other: Gaussian): Gaussian {
    return new Gaussian(
      this.mean + other.mean,
      this.variance + other.variance
    );
  }

  /**
   * Scale Gaussian
   */
  scale(factor: number): Gaussian {
    return new Gaussian(
      this.mean * factor,
      this.variance * factor * factor
    );
  }

  /**
   * Generate random sample
   */
  random(): number {
    // Box-Muller transform
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z * this.standardDeviation + this.mean;
  }

  /**
   * Error function approximation
   */
  private erf(x: number): number {
    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const t = 1 / (1 + p * x);
    const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  /**
   * Inverse error function (approximation)
   */
  private ierf(x: number): number {
    const a = 0.147;
    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const ln = Math.log(1 - x * x);
    const part1 = 2 / (Math.PI * a) + ln / 2;
    const part2 = ln / a;

    return sign * Math.sqrt(Math.sqrt(part1 * part1 - part2) - part1);
  }
}

export default Gaussian;

// CLI Demo
if (import.meta.url.includes("elide-gaussian.ts")) {
  console.log("📊 gaussian - Normal Distribution for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Standard Normal ===");
  const std = new Gaussian(0, 1);
  console.log("Mean:", std.mean);
  console.log("Variance:", std.variance);
  console.log("PDF at 0:", std.pdf(0).toFixed(4));
  console.log("CDF at 0:", std.cdf(0).toFixed(4));
  console.log();

  console.log("=== Example 2: Custom Distribution ===");
  const custom = new Gaussian(10, 4);
  console.log("N(10, 4)");
  console.log("PDF at 10:", custom.pdf(10).toFixed(4));
  console.log("CDF at 10:", custom.cdf(10).toFixed(4));
  console.log("CDF at 12:", custom.cdf(12).toFixed(4));
  console.log();

  console.log("=== Example 3: Inverse CDF ===");
  console.log("95th percentile:", std.ppf(0.95).toFixed(4));
  console.log("99th percentile:", std.ppf(0.99).toFixed(4));
  console.log();

  console.log("=== Example 4: Operations ===");
  const g1 = new Gaussian(5, 2);
  const g2 = new Gaussian(3, 1);
  const sum = g1.add(g2);
  console.log("N(5,2) + N(3,1) = N(" + sum.mean + ", " + sum.variance + ")");
  console.log();

  console.log("=== Example 5: Random Sampling ===");
  const samples = Array(5).fill(0).map(() => std.random());
  console.log("5 samples from N(0,1):", samples.map(x => x.toFixed(2)));
  console.log();

  console.log("=== POLYGLOT Use Case ===");
  console.log("🌐 Works in JavaScript, Python, R via Elide");
  console.log("✅ Normal distribution across all languages");
  console.log("🚀 ~20K+ downloads/week on npm!");
}
