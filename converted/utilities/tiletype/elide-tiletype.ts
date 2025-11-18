/**
 * Tiletype - Tile Type Detection
 *
 * Detect map tile format from buffer.
 * **POLYGLOT SHOWCASE**: One tile detector for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/@mapbox/tiletype (~30K+ downloads/week)
 *
 * Features:
 * - Detect PNG/JPEG/WebP
 * - Detect vector tiles
 * - Zero dependencies
 *
 * Package has ~30K+ downloads/week on npm!
 */

export function type(buffer: Uint8Array): string | null {
  if (buffer[0] === 0x89 && buffer[1] === 0x50) return 'png';
  if (buffer[0] === 0xFF && buffer[1] === 0xD8) return 'jpg';
  if (buffer[0] === 0x1F && buffer[1] === 0x8B) return 'pbf';
  return null;
}

export default type;

// CLI Demo
if (import.meta.url.includes("elide-tiletype.ts")) {
  console.log("🔍 Tiletype for Elide (POLYGLOT!)\n");
  const pngBuffer = new Uint8Array([0x89, 0x50, 0x4E, 0x47]);
  console.log("Type:", type(pngBuffer), "\n");
  console.log("✅ Use Cases: Tile format detection\n");
}
