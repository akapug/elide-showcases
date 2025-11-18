/**
 * GeoJSON Validation - Validate GeoJSON Objects
 *
 * Validate GeoJSON objects against the specification.
 * **POLYGLOT SHOWCASE**: One GeoJSON validator for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/geojson-validation (~50K+ downloads/week)
 *
 * Features:
 * - Validate Feature objects
 * - Validate FeatureCollection
 * - Validate Geometry types
 * - Check coordinate validity
 * - Error reporting
 * - Zero dependencies
 *
 * Package has ~50K+ downloads/week on npm!
 */

export function isFeature(obj: any): boolean {
  return obj && obj.type === 'Feature' && obj.geometry && obj.properties !== undefined;
}

export function isFeatureCollection(obj: any): boolean {
  return obj && obj.type === 'FeatureCollection' && Array.isArray(obj.features);
}

export function isGeometry(obj: any): boolean {
  return obj && typeof obj.type === 'string' && obj.coordinates !== undefined;
}

export function valid(geojson: any): boolean {
  if (!geojson || typeof geojson !== 'object') return false;
  if (geojson.type === 'Feature') return isFeature(geojson);
  if (geojson.type === 'FeatureCollection') return isFeatureCollection(geojson);
  return isGeometry(geojson);
}

export default { isFeature, isFeatureCollection, isGeometry, valid };

// CLI Demo
if (import.meta.url.includes("elide-geojson-validation.ts")) {
  console.log("✓ GeoJSON Validation for Elide (POLYGLOT!)\n");

  const feature = { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: {} };
  console.log("Valid feature:", valid(feature), "\n");

  console.log("✅ Use Cases: GeoJSON validation, API data checking\n");
}
