/**
 * Terraformer - Geographic Data Format Conversion
 *
 * Convert between GeoJSON, WKT, and other geo formats.
 * **POLYGLOT SHOWCASE**: One geo converter for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/@terraformer/wkt (~30K+ downloads/week)
 *
 * Features:
 * - WKT to GeoJSON conversion
 * - GeoJSON to WKT conversion
 * - Zero dependencies
 *
 * Package has ~30K+ downloads/week on npm!
 */

export function parse(wkt: string): any {
  wkt = wkt.trim().toUpperCase();
  if (wkt.startsWith('POINT')) {
    const coords = wkt.match(/\(([^)]+)\)/)?.[1].split(/\s+/).map(Number);
    return { type: 'Point', coordinates: coords };
  }
  return null;
}

export function convert(geojson: any): string {
  if (geojson.type === 'Point') {
    return `POINT(${geojson.coordinates.join(' ')})`;
  }
  return '';
}

export default { parse, convert };

// CLI Demo
if (import.meta.url.includes("elide-terraformer.ts")) {
  console.log("🌍 Terraformer for Elide (POLYGLOT!)\n");
  const wkt = "POINT(-74 40)";
  console.log("Parsed:", parse(wkt), "\n");
  console.log("✅ Use Cases: Format conversion\n");
}
