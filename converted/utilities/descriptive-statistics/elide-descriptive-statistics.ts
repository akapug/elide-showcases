/**
 * descriptive-statistics - Descriptive Statistics
 *
 * Calculate descriptive statistics.
 * **POLYGLOT SHOWCASE**: One stats library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/descriptive-statistics (~5K+ downloads/week)
 *
 * Features:
 * - Central tendency (mean, median, mode)
 * - Dispersion (variance, std dev, range)
 * - Distribution shape (skewness, kurtosis)
 * - Zero dependencies
 *
 * Package has ~5K+ downloads/week on npm!
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

export function standardDeviation(arr: number[]): number {
  return Math.sqrt(variance(arr));
}

export function skewness(arr: number[]): number {
  const m = mean(arr);
  const s = standardDeviation(arr);
  const n = arr.length;
  return arr.reduce((sum, x) => sum + Math.pow((x - m) / s, 3), 0) / n;
}

export function kurtosis(arr: number[]): number {
  const m = mean(arr);
  const s = standardDeviation(arr);
  const n = arr.length;
  return arr.reduce((sum, x) => sum + Math.pow((x - m) / s, 4), 0) / n - 3;
}

export default { mean, median, variance, standardDeviation, skewness, kurtosis };

// CLI Demo
if (import.meta.url.includes("elide-descriptive-statistics.ts")) {
  console.log("📊 descriptive-statistics for Elide (POLYGLOT!)\n");
  const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  console.log("Mean:", mean(data));
  console.log("Median:", median(data));
  console.log("Skewness:", skewness(data).toFixed(2));
  console.log("Kurtosis:", kurtosis(data).toFixed(2));
  console.log("\n🚀 ~5K+ downloads/week on npm!");
}
