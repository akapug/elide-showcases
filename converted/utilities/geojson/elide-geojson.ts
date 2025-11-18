/**
 * GeoJSON - GeoJSON Utilities
 *
 * Utilities for working with GeoJSON data.
 * **POLYGLOT SHOWCASE**: One GeoJSON library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/geojson (~200K+ downloads/week)
 *
 * Features:
 * - Parse GeoJSON features
 * - Create GeoJSON from data
 * - Validate GeoJSON structure
 * - Feature collections
 * - Geometry types (Point, LineString, Polygon)
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all work with GeoJSON
 * - ONE implementation works everywhere on Elide
 * - Consistent GeoJSON handling across languages
 * - Share geographic data across your stack
 *
 * Use cases:
 * - API responses with geographic data
 * - Map visualization
 * - Spatial data exchange
 * - GIS integration
 *
 * Package has ~200K+ downloads/week on npm - essential geo format!
 */

type Position = [number, number] | [number, number, number];

interface GeoJSONGeometry {
  type: string;
  coordinates: any;
}

interface GeoJSONFeature {
  type: 'Feature';
  geometry: GeoJSONGeometry;
  properties: Record<string, any>;
  id?: string | number;
}

interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

/**
 * Create a Point geometry
 */
export function point(coordinates: Position, properties?: Record<string, any>): GeoJSONFeature {
  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates
    },
    properties: properties || {}
  };
}

/**
 * Create a LineString geometry
 */
export function lineString(coordinates: Position[], properties?: Record<string, any>): GeoJSONFeature {
  return {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates
    },
    properties: properties || {}
  };
}

/**
 * Create a Polygon geometry
 */
export function polygon(coordinates: Position[][], properties?: Record<string, any>): GeoJSONFeature {
  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates
    },
    properties: properties || {}
  };
}

/**
 * Create a MultiPoint geometry
 */
export function multiPoint(coordinates: Position[], properties?: Record<string, any>): GeoJSONFeature {
  return {
    type: 'Feature',
    geometry: {
      type: 'MultiPoint',
      coordinates
    },
    properties: properties || {}
  };
}

/**
 * Create a FeatureCollection
 */
export function featureCollection(features: GeoJSONFeature[]): GeoJSONFeatureCollection {
  return {
    type: 'FeatureCollection',
    features
  };
}

/**
 * Parse data into GeoJSON features
 */
export function parse(
  data: any[],
  options: {
    Point?: string[];
    LineString?: string;
    Polygon?: string;
    include?: string[];
  } = {}
): GeoJSONFeatureCollection {
  const features: GeoJSONFeature[] = [];

  for (const item of data) {
    let feature: GeoJSONFeature | null = null;

    if (options.Point) {
      const [lonKey, latKey] = options.Point;
      if (item[lonKey] !== undefined && item[latKey] !== undefined) {
        const coords: Position = [item[lonKey], item[latKey]];
        const props: Record<string, any> = {};

        if (options.include) {
          for (const key of options.include) {
            if (item[key] !== undefined) props[key] = item[key];
          }
        } else {
          Object.assign(props, item);
          delete props[lonKey];
          delete props[latKey];
        }

        feature = point(coords, props);
      }
    }

    if (feature) features.push(feature);
  }

  return featureCollection(features);
}

/**
 * Validate GeoJSON object
 */
export function validate(obj: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!obj || typeof obj !== 'object') {
    return { valid: false, errors: ['Not a valid object'] };
  }

  if (!obj.type) {
    errors.push('Missing type property');
  }

  if (obj.type === 'Feature') {
    if (!obj.geometry) errors.push('Feature missing geometry');
    if (!obj.properties) errors.push('Feature missing properties');

    if (obj.geometry && !obj.geometry.type) {
      errors.push('Geometry missing type');
    }
    if (obj.geometry && !obj.geometry.coordinates) {
      errors.push('Geometry missing coordinates');
    }
  }

  if (obj.type === 'FeatureCollection') {
    if (!Array.isArray(obj.features)) {
      errors.push('FeatureCollection missing features array');
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Get coordinates from a feature
 */
export function getCoordinates(feature: GeoJSONFeature): any {
  return feature.geometry.coordinates;
}

/**
 * Get properties from a feature
 */
export function getProperties(feature: GeoJSONFeature): Record<string, any> {
  return feature.properties;
}

/**
 * Set properties on a feature
 */
export function setProperties(feature: GeoJSONFeature, properties: Record<string, any>): GeoJSONFeature {
  return {
    ...feature,
    properties: { ...feature.properties, ...properties }
  };
}

export default {
  point,
  lineString,
  polygon,
  multiPoint,
  featureCollection,
  parse,
  validate,
  getCoordinates,
  getProperties,
  setProperties
};

// CLI Demo
if (import.meta.url.includes("elide-geojson.ts")) {
  console.log("🗺️  GeoJSON - GeoJSON Utilities for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Create Point ===");
  const pt = point([-74.006, 40.7128], { name: "New York City", population: 8336817 });
  console.log(JSON.stringify(pt, null, 2));
  console.log();

  console.log("=== Example 2: Create LineString ===");
  const line = lineString([
    [-74.006, 40.7128],
    [-118.2437, 34.0522],
    [-87.6298, 41.8781]
  ], { name: "Route", distance: 3500 });
  console.log("LineString with", getCoordinates(line).length, "points");
  console.log();

  console.log("=== Example 3: Create Polygon ===");
  const poly = polygon([[
    [-74.0, 40.7],
    [-74.0, 40.8],
    [-73.9, 40.8],
    [-73.9, 40.7],
    [-74.0, 40.7]
  ]], { name: "Area", type: "park" });
  console.log("Polygon properties:", getProperties(poly));
  console.log();

  console.log("=== Example 4: Feature Collection ===");
  const collection = featureCollection([pt, line, poly]);
  console.log(`FeatureCollection with ${collection.features.length} features`);
  console.log();

  console.log("=== Example 5: Parse from Data ===");
  const cities = [
    { name: "NYC", lon: -74.006, lat: 40.7128, pop: 8336817 },
    { name: "LA", lon: -118.2437, lat: 34.0522, pop: 3979576 },
    { name: "Chicago", lon: -87.6298, lat: 41.8781, pop: 2693976 }
  ];
  const parsed = parse(cities, {
    Point: ['lon', 'lat'],
    include: ['name', 'pop']
  });
  console.log(`Parsed ${parsed.features.length} city features`);
  console.log("First feature:", JSON.stringify(parsed.features[0], null, 2));
  console.log();

  console.log("=== Example 6: Validation ===");
  const validFeature = point([-74.006, 40.7128], { name: "NYC" });
  const invalidFeature = { type: 'Feature', geometry: { type: 'Point' } };

  console.log("Valid feature:", validate(validFeature));
  console.log("Invalid feature:", validate(invalidFeature));
  console.log();

  console.log("=== Example 7: Update Properties ===");
  const feature = point([-74.006, 40.7128], { name: "NYC" });
  const updated = setProperties(feature, { population: 8336817, country: "USA" });
  console.log("Updated properties:", getProperties(updated));
  console.log();

  console.log("=== Example 8: Store Locations ===");
  const stores = [
    { id: 1, name: "Store A", lng: -74.006, lat: 40.7128, sales: 50000 },
    { id: 2, name: "Store B", lng: -73.9857, lat: 40.7484, sales: 75000 },
    { id: 3, name: "Store C", lng: -73.9712, lat: 40.7831, sales: 60000 }
  ];

  const storeGeoJSON = parse(stores, {
    Point: ['lng', 'lat'],
    include: ['id', 'name', 'sales']
  });

  console.log(`Created GeoJSON for ${storeGeoJSON.features.length} stores`);
  console.log("Total sales:", storeGeoJSON.features.reduce((sum, f) => sum + f.properties.sales, 0));
  console.log();

  console.log("=== POLYGLOT Use Case ===");
  console.log("🌐 Same GeoJSON API works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- API responses with geographic data");
  console.log("- Map visualization");
  console.log("- Spatial data exchange");
  console.log("- GIS integration");
  console.log("- Location-based services");
  console.log();
}
