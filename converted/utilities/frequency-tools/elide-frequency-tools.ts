/**
 * frequency-tools - Frequency Utilities
 *
 * Tools for working with audio frequencies and notes.
 * **POLYGLOT SHOWCASE**: Frequency tools for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/frequency-tools (~3K+ downloads/week)
 *
 * Features:
 * - Frequency to note conversion
 * - Note to frequency conversion
 * - Cent calculations
 * - Zero dependencies
 *
 * Package has ~3K+ downloads/week on npm!
 */

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function frequencyToNote(freq: number): { note: string; octave: number; cents: number } {
  const A4 = 440;
  const C0 = A4 * Math.pow(2, -4.75);

  const h = Math.round(12 * Math.log2(freq / C0));
  const octave = Math.floor(h / 12);
  const note = NOTES[h % 12];

  const exactPitch = 12 * Math.log2(freq / C0);
  const cents = Math.round((exactPitch - h) * 100);

  return { note, octave, cents };
}

export function noteToFrequency(note: string, octave: number): number {
  const A4 = 440;
  const noteIndex = NOTES.indexOf(note.toUpperCase());
  if (noteIndex === -1) throw new Error(`Invalid note: ${note}`);

  const n = (octave - 4) * 12 + (noteIndex - 9);
  const freq = A4 * Math.pow(2, n / 12);

  console.log(`[frequency-tools] ${note}${octave} = ${freq.toFixed(2)}Hz`);
  return freq;
}

export function getCents(freq1: number, freq2: number): number {
  return 1200 * Math.log2(freq2 / freq1);
}

export default { frequencyToNote, noteToFrequency, getCents };

// CLI Demo
if (import.meta.url.includes("elide-frequency-tools.ts")) {
  console.log("🎼 frequency-tools - Frequency Utilities for Elide (POLYGLOT!)\n");

  console.log("=== Note to Frequency ===");
  console.log(`A4: ${noteToFrequency('A', 4).toFixed(2)}Hz`);
  console.log(`C5: ${noteToFrequency('C', 5).toFixed(2)}Hz`);
  console.log();

  console.log("=== Frequency to Note ===");
  const { note, octave, cents } = frequencyToNote(440);
  console.log(`440Hz = ${note}${octave} (${cents > 0 ? '+' : ''}${cents}¢)`);

  console.log("\n~3K+ downloads/week on npm!");
}
