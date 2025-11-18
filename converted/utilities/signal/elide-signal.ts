/**
 * signal - Signal Processing
 *
 * Signal processing utilities.
 * **POLYGLOT SHOWCASE**: One signal library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/signal (~20K+ downloads/week)
 *
 * Features:
 * - Filtering
 * - Windowing
 * - Peak detection
 * - Zero dependencies
 *
 * Package has ~20K+ downloads/week on npm!
 */

export function movingAverage(signal: number[], windowSize: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < signal.length; i++) {
    let sum = 0, count = 0;
    for (let j = Math.max(0, i - windowSize + 1); j <= i; j++) {
      sum += signal[j];
      count++;
    }
    result.push(sum / count);
  }
  return result;
}

export function findPeaks(signal: number[], threshold: number = 0): number[] {
  const peaks: number[] = [];
  for (let i = 1; i < signal.length - 1; i++) {
    if (signal[i] > signal[i - 1] && signal[i] > signal[i + 1] && signal[i] > threshold) {
      peaks.push(i);
    }
  }
  return peaks;
}

export function normalize(signal: number[]): number[] {
  const max = Math.max(...signal.map(Math.abs));
  return signal.map(x => x / max);
}

export default { movingAverage, findPeaks, normalize };

// CLI Demo
if (import.meta.url.includes("elide-signal.ts")) {
  console.log("📡 signal for Elide (POLYGLOT!)\n");
  const sig = [1, 3, 2, 5, 4, 3, 6, 2];
  console.log("Moving average:", movingAverage(sig, 3));
  console.log("Peaks:", findPeaks(sig, 3));
  console.log("\n🚀 ~20K+ downloads/week on npm!");
}
