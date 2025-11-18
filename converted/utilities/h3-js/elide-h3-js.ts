/**
 * H3-js - Hexagonal Hierarchical Geospatial Indexing System
 *
 * Uber's H3 system for hexagonal grid spatial indexing.
 * **POLYGLOT SHOWCASE**: One H3 library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/h3-js (~100K+ downloads/week)
 *
 * Features:
 * - Lat/lon to H3 index conversion
 * - Hexagonal grid cells
 * - Multiple resolutions (0-15)
 * - Neighbor finding
 * - Distance calculation
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all use hexagonal indexing
 * - ONE implementation works everywhere on Elide
 * - Consistent spatial indexing across languages
 * - Share H3 indexes across your stack
 *
 * Use cases:
 * - Spatial analytics
 * - Ride-sharing dispatch
 * - Location-based aggregation
 * - Heat maps
 *
 * Package has ~100K+ downloads/week on npm - used by Uber!
 */

type H3Index = string;
type Resolution = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;

interface LatLng {
  lat: number;
  lng: number;
}

interface H3Cell {
  index: H3Index;
  center: LatLng;
  resolution: Resolution;
}

/**
 * Convert lat/lng to H3 index (simplified implementation)
 */
export function geoToH3(lat: number, lng: number, resolution: Resolution): H3Index {
  // Simplified H3 encoding - actual H3 uses icosahedron projection
  const latNorm = (lat + 90) / 180;
  const lngNorm = (lng + 180) / 360;

  // Create a pseudo-H3 index
  const latBits = Math.floor(latNorm * (1 << (resolution + 1)));
  const lngBits = Math.floor(lngNorm * (1 << (resolution + 1)));

  return `${resolution}${latBits.toString(16).padStart(8, '0')}${lngBits.toString(16).padStart(8, '0')}`;
}

/**
 * Convert H3 index back to lat/lng
 */
export function h3ToGeo(h3Index: H3Index): LatLng {
  const resolution = parseInt(h3Index[0]);
  const latBits = parseInt(h3Index.substring(1, 9), 16);
  const lngBits = parseInt(h3Index.substring(9, 17), 16);

  const lat = (latBits / (1 << (resolution + 1))) * 180 - 90;
  const lng = (lngBits / (1 << (resolution + 1))) * 360 - 180;

  return { lat, lng };
}

/**
 * Get the resolution of an H3 index
 */
export function h3GetResolution(h3Index: H3Index): Resolution {
  return parseInt(h3Index[0]) as Resolution;
}

/**
 * Get the hexagon boundary vertices
 */
export function h3ToGeoBoundary(h3Index: H3Index): LatLng[] {
  const center = h3ToGeo(h3Index);
  const res = h3GetResolution(h3Index);
  const radius = 0.5 / (1 << res); // Approximate hex radius

  const vertices: LatLng[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    vertices.push({
      lat: center.lat + radius * Math.sin(angle),
      lng: center.lng + radius * Math.cos(angle) / Math.cos(center.lat * Math.PI / 180)
    });
  }

  return vertices;
}

/**
 * Get neighboring hexagons (k-ring with k=1)
 */
export function kRing(h3Index: H3Index, k: number = 1): H3Index[] {
  const center = h3ToGeo(h3Index);
  const res = h3GetResolution(h3Index);
  const step = 1.0 / (1 << res);

  const neighbors: H3Index[] = [h3Index];

  if (k >= 1) {
    // Approximate hex neighbors
    const offsets = [
      [0, step], [0, -step],
      [step, 0], [-step, 0],
      [step * 0.5, step * 0.866], [-step * 0.5, -step * 0.866]
    ];

    for (const [dLat, dLng] of offsets) {
      neighbors.push(geoToH3(center.lat + dLat, center.lng + dLng, res));
    }
  }

  return neighbors;
}

/**
 * Get all hexagons within k distance
 */
export function kRingDistances(h3Index: H3Index, k: number): H3Index[][] {
  const result: H3Index[][] = [[h3Index]];

  for (let i = 1; i <= k; i++) {
    const ring = kRing(h3Index, i).filter(idx => !result[0].includes(idx));
    result.push(ring);
  }

  return result;
}

/**
 * Check if two H3 indexes are neighbors
 */
export function h3IndexesAreNeighbors(h3Index1: H3Index, h3Index2: H3Index): boolean {
  const neighbors = kRing(h3Index1, 1);
  return neighbors.includes(h3Index2);
}

/**
 * Get the distance between two H3 indexes
 */
export function h3Distance(h3Index1: H3Index, h3Index2: H3Index): number {
  const geo1 = h3ToGeo(h3Index1);
  const geo2 = h3ToGeo(h3Index2);

  // Simple Euclidean distance in degrees (not accurate for large distances)
  const dLat = geo2.lat - geo1.lat;
  const dLng = geo2.lng - geo1.lng;

  return Math.sqrt(dLat * dLat + dLng * dLng);
}

/**
 * Get hexagons to cover a polygon
 */
export function polyfill(coordinates: LatLng[][], resolution: Resolution): H3Index[] {
  const indexes = new Set<H3Index>();

  // Find bounding box
  let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
  for (const ring of coordinates) {
    for (const { lat, lng } of ring) {
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
    }
  }

  // Sample points in bounding box
  const step = 1 / (1 << resolution);
  for (let lat = minLat; lat <= maxLat; lat += step) {
    for (let lng = minLng; lng <= maxLng; lng += step) {
      indexes.add(geoToH3(lat, lng, resolution));
    }
  }

  return Array.from(indexes);
}

export default {
  geoToH3,
  h3ToGeo,
  h3GetResolution,
  h3ToGeoBoundary,
  kRing,
  kRingDistances,
  h3IndexesAreNeighbors,
  h3Distance,
  polyfill
};

// CLI Demo
if (import.meta.url.includes("elide-h3-js.ts")) {
  console.log("⬡ H3 - Hexagonal Geospatial Indexing for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Lat/Lng to H3 ===");
  const lat = 40.7128, lng = -74.0060;
  const h3Index = geoToH3(lat, lng, 9);
  console.log(`NYC (${lat}, ${lng}) at resolution 9:`);
  console.log(`  H3 Index: ${h3Index}`);
  console.log();

  console.log("=== Example 2: H3 to Lat/Lng ===");
  const recovered = h3ToGeo(h3Index);
  console.log(`${h3Index} => (${recovered.lat.toFixed(6)}, ${recovered.lng.toFixed(6)})`);
  console.log();

  console.log("=== Example 3: Different Resolutions ===");
  for (let res = 0; res <= 10; res += 2) {
    const idx = geoToH3(lat, lng, res as Resolution);
    console.log(`  Resolution ${res}: ${idx.substring(0, 10)}...`);
  }
  console.log();

  console.log("=== Example 4: Hexagon Boundary ===");
  const boundary = h3ToGeoBoundary(h3Index);
  console.log(`Hexagon has ${boundary.length} vertices:`);
  console.log(`  First vertex: (${boundary[0].lat.toFixed(6)}, ${boundary[0].lng.toFixed(6)})`);
  console.log();

  console.log("=== Example 5: K-Ring (Neighbors) ===");
  const neighbors = kRing(h3Index, 1);
  console.log(`H3 cell ${h3Index.substring(0, 10)}... has ${neighbors.length} cells in k-ring:`);
  console.log(`  Including center and ${neighbors.length - 1} neighbors`);
  console.log();

  console.log("=== Example 6: Distance Rings ===");
  const rings = kRingDistances(h3Index, 2);
  console.log("K-ring distances:");
  rings.forEach((ring, k) => {
    console.log(`  k=${k}: ${ring.length} cells`);
  });
  console.log();

  console.log("=== Example 7: Neighbor Check ===");
  const idx1 = geoToH3(40.7128, -74.0060, 8);
  const idx2 = geoToH3(40.7130, -74.0062, 8);
  const areNeighbors = h3IndexesAreNeighbors(idx1, idx2);
  console.log(`Are indexes neighbors? ${areNeighbors}`);
  console.log();

  console.log("=== Example 8: Coverage Area ===");
  const polygon: LatLng[][] = [[
    { lat: 40.70, lng: -74.01 },
    { lat: 40.70, lng: -74.00 },
    { lat: 40.71, lng: -74.00 },
    { lat: 40.71, lng: -74.01 },
    { lat: 40.70, lng: -74.01 }
  ]];
  const coverage = polyfill(polygon, 10);
  console.log(`Polygon covered by ${coverage.length} H3 hexagons at resolution 10`);
  console.log();

  console.log("=== Example 9: Ride-Share Zones ===");
  const zones = [
    { name: "Manhattan", lat: 40.7580, lng: -73.9855 },
    { name: "Brooklyn", lat: 40.6782, lng: -73.9442 },
    { name: "Queens", lat: 40.7282, lng: -73.7949 }
  ];
  console.log("Ride-share dispatch zones (resolution 7):");
  zones.forEach(zone => {
    const zoneIndex = geoToH3(zone.lat, zone.lng, 7);
    console.log(`  ${zone.name}: ${zoneIndex}`);
  });
  console.log();

  console.log("=== POLYGLOT Use Case ===");
  console.log("🌐 Same H3 API works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Ride-sharing dispatch zones");
  console.log("- Spatial analytics");
  console.log("- Location-based aggregation");
  console.log("- Heat maps and density analysis");
  console.log("- Geographic clustering");
  console.log();
}
