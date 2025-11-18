/**
 * audio-oscillator - Audio Oscillator
 *
 * Generate oscillator waveforms for audio synthesis.
 * **POLYGLOT SHOWCASE**: Oscillators for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/audio-oscillator (~5K+ downloads/week)
 *
 * Features:
 * - Sine, square, sawtooth, triangle waves
 * - Frequency control
 * - Zero dependencies
 *
 * Package has ~5K+ downloads/week on npm!
 */

export type WaveType = 'sine' | 'square' | 'sawtooth' | 'triangle';

export function generate(type: WaveType, frequency: number, duration: number, sampleRate: number = 44100): Float32Array {
  const samples = Math.floor(duration * sampleRate);
  const buffer = new Float32Array(samples);

  console.log(`[oscillator] Generating ${type} wave: ${frequency}Hz for ${duration}s`);

  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    buffer[i] = getWaveformValue(type, frequency, t);
  }

  return buffer;
}

function getWaveformValue(type: WaveType, freq: number, t: number): number {
  const phase = 2 * Math.PI * freq * t;
  switch (type) {
    case 'sine': return Math.sin(phase);
    case 'square': return Math.sin(phase) > 0 ? 1 : -1;
    case 'sawtooth': return 2 * ((freq * t) % 1) - 1;
    case 'triangle': return 2 * Math.abs(2 * ((freq * t) % 1) - 1) - 1;
  }
}

export default generate;

// CLI Demo
if (import.meta.url.includes("elide-audio-oscillator.ts")) {
  console.log("🎵 audio-oscillator - Waveform Generator for Elide (POLYGLOT!)\n");

  const sine = generate('sine', 440, 1.0);
  const square = generate('square', 440, 1.0);

  console.log(`Generated sine: ${sine.length} samples`);
  console.log(`Generated square: ${square.length} samples`);

  console.log("\n~5K+ downloads/week on npm!");
}
