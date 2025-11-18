/**
 * pcm-util - PCM Utilities
 *
 * Utilities for working with PCM audio data.
 * **POLYGLOT SHOWCASE**: PCM utilities for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/pcm-util (~10K+ downloads/week)
 *
 * Features:
 * - PCM format conversion
 * - Sample manipulation
 * - Buffer utilities
 * - Zero dependencies
 *
 * Package has ~10K+ downloads/week on npm!
 */

export function normalize(buffer: Float32Array): Float32Array {
  let max = 0;
  for (let i = 0; i < buffer.length; i++) {
    max = Math.max(max, Math.abs(buffer[i]));
  }

  const normalized = new Float32Array(buffer.length);
  if (max > 0) {
    for (let i = 0; i < buffer.length; i++) {
      normalized[i] = buffer[i] / max;
    }
  }

  console.log(`[pcm-util] Normalized ${buffer.length} samples (peak: ${max.toFixed(4)})`);
  return normalized;
}

export function mix(buffer1: Float32Array, buffer2: Float32Array, ratio: number = 0.5): Float32Array {
  const length = Math.min(buffer1.length, buffer2.length);
  const mixed = new Float32Array(length);

  for (let i = 0; i < length; i++) {
    mixed[i] = buffer1[i] * ratio + buffer2[i] * (1 - ratio);
  }

  console.log(`[pcm-util] Mixed ${length} samples (ratio: ${ratio})`);
  return mixed;
}

export function toMono(stereoBuffer: Float32Array, channelCount: number = 2): Float32Array {
  const monoLength = stereoBuffer.length / channelCount;
  const mono = new Float32Array(monoLength);

  for (let i = 0; i < monoLength; i++) {
    let sum = 0;
    for (let ch = 0; ch < channelCount; ch++) {
      sum += stereoBuffer[i * channelCount + ch];
    }
    mono[i] = sum / channelCount;
  }

  console.log(`[pcm-util] Converted to mono: ${mono.length} samples`);
  return mono;
}

export default { normalize, mix, toMono };

// CLI Demo
if (import.meta.url.includes("elide-pcm-util.ts")) {
  console.log("🔧 pcm-util - PCM Utilities for Elide (POLYGLOT!)\n");

  console.log("=== Normalize ===");
  const buffer = new Float32Array([0.5, 1.0, 0.3, -0.8]);
  const normalized = normalize(buffer);
  console.log(`Original: [${Array.from(buffer).map(n => n.toFixed(2)).join(', ')}]`);
  console.log(`Normalized: [${Array.from(normalized).map(n => n.toFixed(2)).join(', ')}]`);
  console.log();

  console.log("=== Mix ===");
  const buf1 = new Float32Array([1.0, 0.8, 0.6]);
  const buf2 = new Float32Array([0.2, 0.4, 0.6]);
  const mixed = mix(buf1, buf2, 0.5);
  console.log(`Mixed: [${Array.from(mixed).map(n => n.toFixed(2)).join(', ')}]`);
  console.log();

  console.log("=== To Mono ===");
  const stereo = new Float32Array([1.0, 0.8, 0.6, 0.4, 0.2, 0.0]);
  const mono = toMono(stereo, 2);
  console.log(`Stereo ${stereo.length} -> Mono ${mono.length}`);

  console.log("\n~10K+ downloads/week on npm!");
}
