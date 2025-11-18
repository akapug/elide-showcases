/**
 * GeoJSON Extent - Bounding Box Calculation
 *
 * Calculate bounding boxes for GeoJSON objects.
 * **POLYGLOT SHOWCASE**: One extent calculator for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/geojson-extent (~30K+ downloads/week)
 *
 * Features:
 * - Calculate bounding box
 * - Support all geometry types
 * - FeatureCollection support
 * - Zero dependencies
 *
 * Package has ~30K+ downloads/week on npm!
 */

type BBox = [number, number, number, number];

export function extent(geojson: any): BBox {
  let minLng = 180, minLat = 90, maxLng = -180, maxLat = -90;

  function processCoords(coords: any) {
    if (typeof coords[0] === 'number') {
      minLng = Math.min(minLng, coords[0]);
      maxLng = Math.max(maxLng, coords[0]);
      minLat = Math.min(minLat, coords[1]);
      maxLat = Math.max(maxLat, coords[1]);
    } else {
      coords.forEach(processCoords);
    }
  }

  if (geojson.type === 'FeatureCollection') {
    geojson.features.forEach((f: any) => processCoords(f.geometry.coordinates));
  } else if (geojson.type === 'Feature') {
    processCoords(geojson.geometry.coordinates);
  } else {
    processCoords(geojson.coordinates);
  }

  return [minLng, minLat, maxLng, maxLat];
}

export default extent;

// CLI Demo
if (import.meta.url.includes("elide-geojson-extent.ts")) {
  console.log("📦 GeoJSON Extent for Elide (POLYGLOT!)\n");

  const feature = { type: 'Feature', geometry: { type: 'Point', coordinates: [-74.006, 40.7128] }, properties: {} };
  console.log("Extent:", extent(feature), "\n");

  console.log("✅ Use Cases: Bounding box calculation, map fitting\n");
}
