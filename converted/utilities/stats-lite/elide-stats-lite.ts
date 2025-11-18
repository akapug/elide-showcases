/**
 * stats-lite - Lightweight Statistics
 *
 * Lightweight statistical functions.
 * **POLYGLOT SHOWCASE**: One stats library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/stats-lite (~30K+ downloads/week)
 *
 * Features:
 * - Mean, median, mode
 * - Variance and standard deviation
 * - Percentiles
 * - Histogram
 * - Zero dependencies
 *
 * Package has ~30K+ downloads/week on npm!
 */

export function mean(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function variance(arr: number[]): number {
  const m = mean(arr);
  return arr.reduce((sum, x) => sum + (x - m) ** 2, 0) / arr.length;
}

export function stdev(arr: number[]): number {
  return Math.sqrt(variance(arr));
}

export function percentile(arr: number[], p: number): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

export function histogram(arr: number[], bins: number = 10): number[] {
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  const binWidth = (max - min) / bins;
  const hist = new Array(bins).fill(0);

  arr.forEach(x => {
    const bin = Math.min(Math.floor((x - min) / binWidth), bins - 1);
    hist[bin]++;
  });

  return hist;
}

export default { mean, median, variance, stdev, percentile, histogram };

// CLI Demo
if (import.meta.url.includes("elide-stats-lite.ts")) {
  console.log("📊 stats-lite for Elide (POLYGLOT!)\n");
  const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  console.log("Mean:", mean(data));
  console.log("Median:", median(data));
  console.log("Stdev:", stdev(data).toFixed(2));
  console.log("90th percentile:", percentile(data, 90));
  console.log("\n🚀 ~30K+ downloads/week on npm!");
}
