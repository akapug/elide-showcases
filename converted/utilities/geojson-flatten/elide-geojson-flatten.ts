/**
 * GeoJSON Flatten - Flatten Multi-Geometries
 *
 * Flatten MultiPoint, MultiLineString, MultiPolygon into individual features.
 * **POLYGLOT SHOWCASE**: One GeoJSON flattener for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/geojson-flatten (~30K+ downloads/week)
 *
 * Features:
 * - Flatten multi-geometries
 * - Preserve properties
 * - Zero dependencies
 *
 * Package has ~30K+ downloads/week on npm!
 */

export function flatten(geojson: any): any {
  if (geojson.type === 'FeatureCollection') {
    return {
      type: 'FeatureCollection',
      features: geojson.features.flatMap((f: any) => flatten(f).features || [f])
    };
  }

  if (geojson.type === 'Feature') {
    const geom = geojson.geometry;
    if (geom.type.startsWith('Multi')) {
      const singleType = geom.type.replace('Multi', '');
      return {
        type: 'FeatureCollection',
        features: geom.coordinates.map((coords: any) => ({
          type: 'Feature',
          geometry: { type: singleType, coordinates: coords },
          properties: geojson.properties
        }))
      };
    }
  }

  return { type: 'FeatureCollection', features: [geojson] };
}

export default flatten;

// CLI Demo
if (import.meta.url.includes("elide-geojson-flatten.ts")) {
  console.log("⬇️  GeoJSON Flatten for Elide (POLYGLOT!)\n");

  const multi = {
    type: 'Feature',
    geometry: { type: 'MultiPoint', coordinates: [[0, 0], [1, 1]] },
    properties: { name: 'test' }
  };
  const flattened = flatten(multi);
  console.log("Flattened features:", flattened.features.length, "\n");

  console.log("✅ Use Cases: Simplifying multi-geometries\n");
}
