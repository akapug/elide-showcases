/**
 * Stream Browserify - Browser Stream Polyfill
 * **POLYGLOT SHOWCASE**: Browser streams for ALL languages on Elide!
 * Package has ~40M+ downloads/week on npm!
 */

export { Readable, Writable, Transform } from '../readable-stream/elide-readable-stream.ts';
export { default as PassThrough } from '../through/elide-through.ts';

if (import.meta.url.includes("elide-stream-browserify.ts")) {
  console.log("🎯 Stream Browserify - Browser Streams (POLYGLOT!)\n");
  console.log("  ✓ Readable, Writable, Transform exports");
  console.log("\n✅ ~40M+ downloads/week on npm");
}
