/**
 * wavelets - Wavelet Transform
 *
 * Discrete wavelet transform.
 * **POLYGLOT SHOWCASE**: One wavelet library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/wavelets (~5K+ downloads/week)
 *
 * Features:
 * - Haar wavelet transform
 * - Forward and inverse DWT
 * - Multi-resolution analysis
 * - Zero dependencies
 *
 * Package has ~5K+ downloads/week on npm!
 */

export function haarTransform(signal: number[]): { approx: number[]; detail: number[] } {
  const n = signal.length;
  const approx: number[] = [];
  const detail: number[] = [];

  for (let i = 0; i < n; i += 2) {
    approx.push((signal[i] + signal[i + 1]) / Math.sqrt(2));
    detail.push((signal[i] - signal[i + 1]) / Math.sqrt(2));
  }

  return { approx, detail };
}

export function inverseHaarTransform(approx: number[], detail: number[]): number[] {
  const signal: number[] = [];

  for (let i = 0; i < approx.length; i++) {
    signal.push((approx[i] + detail[i]) / Math.sqrt(2));
    signal.push((approx[i] - detail[i]) / Math.sqrt(2));
  }

  return signal;
}

export function dwt(signal: number[], level: number = 1): { approx: number[]; details: number[][] } {
  let current = signal;
  const details: number[][] = [];

  for (let i = 0; i < level; i++) {
    const { approx, detail } = haarTransform(current);
    details.unshift(detail);
    current = approx;
  }

  return { approx: current, details };
}

export default { haarTransform, inverseHaarTransform, dwt };

// CLI Demo
if (import.meta.url.includes("elide-wavelets.ts")) {
  console.log("🌊 wavelets for Elide (POLYGLOT!)\n");
  const signal = [1, 2, 3, 4, 5, 6, 7, 8];
  const { approx, detail } = haarTransform(signal);
  console.log("Approximation:", approx.map(x => x.toFixed(2)));
  console.log("Detail:", detail.map(x => x.toFixed(2)));

  const reconstructed = inverseHaarTransform(approx, detail);
  console.log("Reconstructed:", reconstructed.map(x => x.toFixed(2)));

  console.log("\n🚀 ~5K+ downloads/week on npm!");
}
