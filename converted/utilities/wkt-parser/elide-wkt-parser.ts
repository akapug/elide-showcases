/**
 * WKT Parser - Well-Known Text Parser
 *
 * Parse and stringify Well-Known Text geometries.
 * **POLYGLOT SHOWCASE**: One WKT parser for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/wkt-parser (~20K+ downloads/week)
 *
 * Features:
 * - Parse WKT strings
 * - Convert to GeoJSON
 * - Support POINT, LINESTRING, POLYGON
 * - Zero dependencies
 *
 * Package has ~20K+ downloads/week on npm!
 */

export function parse(wkt: string): any {
  wkt = wkt.trim().toUpperCase();

  if (wkt.startsWith('POINT')) {
    const coords = wkt.match(/\(([^)]+)\)/)?.[1].split(/\s+/).map(Number);
    return { type: 'Point', coordinates: coords };
  }

  if (wkt.startsWith('LINESTRING')) {
    const coords = wkt.match(/\(([^)]+)\)/)?.[1]
      .split(',')
      .map(p => p.trim().split(/\s+/).map(Number));
    return { type: 'LineString', coordinates: coords };
  }

  if (wkt.startsWith('POLYGON')) {
    const inner = wkt.match(/\(\(([^)]+)\)\)/)?.[1];
    const coords = inner?.split(',').map(p => p.trim().split(/\s+/).map(Number));
    return { type: 'Polygon', coordinates: [coords] };
  }

  return null;
}

export function stringify(geom: any): string {
  if (geom.type === 'Point') {
    return `POINT(${geom.coordinates.join(' ')})`;
  }
  if (geom.type === 'LineString') {
    return `LINESTRING(${geom.coordinates.map((p: any) => p.join(' ')).join(', ')})`;
  }
  if (geom.type === 'Polygon') {
    return `POLYGON((${geom.coordinates[0].map((p: any) => p.join(' ')).join(', ')}))`;
  }
  return '';
}

export default { parse, stringify };

// CLI Demo
if (import.meta.url.includes("elide-wkt-parser.ts")) {
  console.log("📝 WKT Parser for Elide (POLYGLOT!)\n");

  const wkt = "POINT(-74.006 40.7128)";
  const geom = parse(wkt);
  console.log("Parsed:", geom, "\n");

  console.log("✅ Use Cases: WKT parsing, GIS integration\n");
}
