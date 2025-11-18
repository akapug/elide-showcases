/**
 * GeoJSON Merge - Merge GeoJSON Objects
 *
 * Merge multiple GeoJSON objects into a FeatureCollection.
 * **POLYGLOT SHOWCASE**: One GeoJSON merger for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/geojson-merge (~20K+ downloads/week)
 *
 * Features:
 * - Merge Features into FeatureCollection
 * - Combine multiple FeatureCollections
 * - Zero dependencies
 *
 * Package has ~20K+ downloads/week on npm!
 */

export function merge(geojsons: any[]): any {
  const features: any[] = [];

  for (const geojson of geojsons) {
    if (geojson.type === 'FeatureCollection') {
      features.push(...geojson.features);
    } else if (geojson.type === 'Feature') {
      features.push(geojson);
    } else {
      features.push({ type: 'Feature', geometry: geojson, properties: {} });
    }
  }

  return { type: 'FeatureCollection', features };
}

export default merge;

// CLI Demo
if (import.meta.url.includes("elide-geojson-merge.ts")) {
  console.log("🔗 GeoJSON Merge for Elide (POLYGLOT!)\n");

  const f1 = { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: {} };
  const f2 = { type: 'Feature', geometry: { type: 'Point', coordinates: [1, 1] }, properties: {} };
  const merged = merge([f1, f2]);
  console.log("Merged features:", merged.features.length, "\n");

  console.log("✅ Use Cases: Combining GeoJSON data, aggregation\n");
}
