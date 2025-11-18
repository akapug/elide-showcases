/**
 * audio-rms - RMS Calculation
 *
 * Calculate Root Mean Square (RMS) of audio signals.
 * **POLYGLOT SHOWCASE**: RMS calculation for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/audio-rms (~2K+ downloads/week)
 *
 * Features:
 * - RMS calculation
 * - Signal level measurement
 * - Zero dependencies
 *
 * Package has ~2K+ downloads/week on npm!
 */

export function rms(buffer: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) {
    sum += buffer[i] * buffer[i];
  }
  const rmsValue = Math.sqrt(sum / buffer.length);
  console.log(`[audio-rms] RMS: ${rmsValue.toFixed(4)}`);
  return rmsValue;
}

export default rms;

// CLI Demo
if (import.meta.url.includes("elide-audio-rms.ts")) {
  console.log("📊 audio-rms - RMS Calculation for Elide (POLYGLOT!)\n");

  const buffer = new Float32Array(1024).map(() => Math.random() * 2 - 1);
  const level = rms(buffer);

  console.log(`Signal level: ${level.toFixed(4)}`);
  console.log("\n~2K+ downloads/week on npm!");
}
