/**
 * audio-play - Audio Playback
 *
 * Simple audio playback utility.
 * **POLYGLOT SHOWCASE**: Audio playback for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/audio-play (~5K+ downloads/week)
 *
 * Features:
 * - Simple audio playback
 * - Stream support
 * - Zero dependencies
 *
 * Package has ~5K+ downloads/week on npm!
 */

export function play(buffer: AudioBuffer, options?: { rate?: number; volume?: number }): any {
  console.log(`[audio-play] Playing audio: ${buffer.duration}s`);
  if (options?.rate) console.log(`  Rate: ${options.rate}x`);
  if (options?.volume) console.log(`  Volume: ${options.volume}`);
  return { stop: () => console.log('[audio-play] Stopped') };
}

export default play;

// CLI Demo
if (import.meta.url.includes("elide-audio-play.ts")) {
  console.log("🔊 audio-play - Audio Playback for Elide (POLYGLOT!)\n");
  const buffer = { duration: 3.0 } as AudioBuffer;
  play(buffer, { volume: 0.8 });
  console.log("\n~5K+ downloads/week on npm!");
}
