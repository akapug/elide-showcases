/**
 * Geohash - Geohash Encoding/Decoding
 *
 * Encode and decode geographic coordinates to geohash strings.
 * **POLYGLOT SHOWCASE**: One geohash library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/geohash (~50K+ downloads/week)
 *
 * Features:
 * - Encode lat/lon to geohash
 * - Decode geohash to lat/lon
 * - Neighbor calculation
 * - Bounding box from geohash
 * - Precision levels (1-12 characters)
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all use geohashing
 * - ONE implementation works everywhere on Elide
 * - Consistent spatial indexing across languages
 * - Share geohash keys across your stack
 *
 * Use cases:
 * - Spatial database indexing
 * - Location-based caching
 * - Proximity searches
 * - Geographic clustering
 *
 * Package has ~50K+ downloads/week on npm - essential spatial indexing!
 */

const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

interface Bounds {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

interface LatLon {
  latitude: number;
  longitude: number;
  error?: { latitude: number; longitude: number };
}

/**
 * Encode latitude and longitude to geohash
 */
export function encode(latitude: number, lon: number, precision: number = 9): string {
  if (precision < 1 || precision > 12) {
    throw new Error('Precision must be between 1 and 12');
  }

  let idx = 0;
  let bit = 0;
  let evenBit = true;
  let geohash = '';

  let latMin = -90, latMax = 90;
  let lonMin = -180, lonMax = 180;

  while (geohash.length < precision) {
    if (evenBit) {
      const lonMid = (lonMin + lonMax) / 2;
      if (lon > lonMid) {
        idx = (idx << 1) + 1;
        lonMin = lonMid;
      } else {
        idx = idx << 1;
        lonMax = lonMid;
      }
    } else {
      const latMid = (latMin + latMax) / 2;
      if (latitude > latMid) {
        idx = (idx << 1) + 1;
        latMin = latMid;
      } else {
        idx = idx << 1;
        latMax = latMid;
      }
    }

    evenBit = !evenBit;

    if (++bit === 5) {
      geohash += BASE32[idx];
      bit = 0;
      idx = 0;
    }
  }

  return geohash;
}

/**
 * Decode geohash to latitude and longitude
 */
export function decode(geohash: string): LatLon {
  let evenBit = true;
  let latMin = -90, latMax = 90;
  let lonMin = -180, lonMax = 180;

  for (const char of geohash.toLowerCase()) {
    const idx = BASE32.indexOf(char);
    if (idx === -1) throw new Error('Invalid geohash character');

    for (let n = 4; n >= 0; n--) {
      const bitN = (idx >> n) & 1;

      if (evenBit) {
        const lonMid = (lonMin + lonMax) / 2;
        if (bitN === 1) {
          lonMin = lonMid;
        } else {
          lonMax = lonMid;
        }
      } else {
        const latMid = (latMin + latMax) / 2;
        if (bitN === 1) {
          latMin = latMid;
        } else {
          latMax = latMid;
        }
      }

      evenBit = !evenBit;
    }
  }

  return {
    latitude: (latMin + latMax) / 2,
    longitude: (lonMin + lonMax) / 2,
    error: {
      latitude: (latMax - latMin) / 2,
      longitude: (lonMax - lonMin) / 2
    }
  };
}

/**
 * Get bounding box for a geohash
 */
export function bounds(geohash: string): Bounds {
  let evenBit = true;
  let latMin = -90, latMax = 90;
  let lonMin = -180, lonMax = 180;

  for (const char of geohash.toLowerCase()) {
    const idx = BASE32.indexOf(char);
    if (idx === -1) throw new Error('Invalid geohash character');

    for (let n = 4; n >= 0; n--) {
      const bitN = (idx >> n) & 1;

      if (evenBit) {
        const lonMid = (lonMin + lonMax) / 2;
        if (bitN === 1) {
          lonMin = lonMid;
        } else {
          lonMax = lonMid;
        }
      } else {
        const latMid = (latMin + latMax) / 2;
        if (bitN === 1) {
          latMin = latMid;
        } else {
          latMax = latMid;
        }
      }

      evenBit = !evenBit;
    }
  }

  return { minLat: latMin, maxLat: latMax, minLon: lonMin, maxLon: lonMax };
}

/**
 * Get neighbor geohash in a direction
 */
export function neighbor(geohash: string, direction: 'n' | 's' | 'e' | 'w'): string {
  const { latitude, longitude } = decode(geohash);
  const box = bounds(geohash);
  const latDiff = box.maxLat - box.minLat;
  const lonDiff = box.maxLon - box.minLon;

  let newLat = latitude;
  let newLon = longitude;

  switch (direction) {
    case 'n': newLat += latDiff; break;
    case 's': newLat -= latDiff; break;
    case 'e': newLon += lonDiff; break;
    case 'w': newLon -= lonDiff; break;
  }

  return encode(newLat, newLon, geohash.length);
}

/**
 * Get all 8 neighbors of a geohash
 */
export function neighbors(geohash: string): { [key: string]: string } {
  return {
    n: neighbor(geohash, 'n'),
    ne: neighbor(neighbor(geohash, 'n'), 'e'),
    e: neighbor(geohash, 'e'),
    se: neighbor(neighbor(geohash, 's'), 'e'),
    s: neighbor(geohash, 's'),
    sw: neighbor(neighbor(geohash, 's'), 'w'),
    w: neighbor(geohash, 'w'),
    nw: neighbor(neighbor(geohash, 'n'), 'w')
  };
}

export default { encode, decode, bounds, neighbor, neighbors };

// CLI Demo
if (import.meta.url.includes("elide-geohash.ts")) {
  console.log("🔢 Geohash - Spatial Indexing for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Encode Coordinates ===");
  const lat = 40.7128, lon = -74.0060;
  const hash = encode(lat, lon, 9);
  console.log(`NYC (${lat}, ${lon}) => ${hash}`);
  console.log();

  console.log("=== Example 2: Decode Geohash ===");
  const decoded = decode(hash);
  console.log(`${hash} => (${decoded.latitude.toFixed(6)}, ${decoded.longitude.toFixed(6)})`);
  console.log(`Error: ±${decoded.error?.latitude.toFixed(6)}°, ±${decoded.error?.longitude.toFixed(6)}°`);
  console.log();

  console.log("=== Example 3: Different Precisions ===");
  for (let precision = 1; precision <= 9; precision++) {
    const h = encode(lat, lon, precision);
    const d = decode(h);
    console.log(`Precision ${precision}: ${h} (error: ±${(d.error?.latitude ?? 0 * 111).toFixed(2)}km)`);
  }
  console.log();

  console.log("=== Example 4: Bounding Box ===");
  const box = bounds('dr5ru7');
  console.log("Bounding box for 'dr5ru7':");
  console.log(`  Lat: ${box.minLat.toFixed(6)} to ${box.maxLat.toFixed(6)}`);
  console.log(`  Lon: ${box.minLon.toFixed(6)} to ${box.maxLon.toFixed(6)}`);
  console.log();

  console.log("=== Example 5: Neighbors ===");
  const centerHash = 'dr5ru7';
  const nbrs = neighbors(centerHash);
  console.log(`Neighbors of ${centerHash}:`);
  console.log(`  N: ${nbrs.n}   NE: ${nbrs.ne}   E: ${nbrs.e}`);
  console.log(`  W: ${nbrs.w}   [center]   E: ${nbrs.e}`);
  console.log(`  S: ${nbrs.s}   SE: ${nbrs.se}   S: ${nbrs.s}`);
  console.log();

  console.log("=== Example 6: Cache Keys ===");
  const locations = [
    { name: "Times Square", lat: 40.7580, lon: -73.9855 },
    { name: "Central Park", lat: 40.7829, lon: -73.9654 },
    { name: "Brooklyn Bridge", lat: 40.7061, lon: -73.9969 }
  ];
  console.log("Geohash cache keys (precision 7):");
  locations.forEach(loc => {
    console.log(`  ${loc.name}: ${encode(loc.lat, loc.lon, 7)}`);
  });
  console.log();

  console.log("=== Example 7: Proximity Search ===");
  const searchCenter = encode(40.7580, -73.9855, 6);
  const searchCells = [searchCenter, ...Object.values(neighbors(searchCenter))];
  console.log(`Search area around Times Square (${searchCenter}):`);
  console.log(`  Search ${searchCells.length} geohash cells`);
  console.log(`  Cells: ${searchCells.slice(0, 3).join(', ')}...`);
  console.log();

  console.log("=== Example 8: Database Indexing ===");
  const stores = [
    { id: 1, name: "Store A", lat: 40.7128, lon: -74.0060 },
    { id: 2, name: "Store B", lat: 40.7580, lon: -73.9855 },
    { id: 3, name: "Store C", lat: 40.7489, lon: -73.9680 }
  ];

  console.log("Stores with geohash index:");
  stores.forEach(store => {
    const gh = encode(store.lat, store.lon, 8);
    console.log(`  ${store.name}: ${gh} (use for DB indexing)`);
  });
  console.log();

  console.log("=== POLYGLOT Use Case ===");
  console.log("🌐 Same Geohash API works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Spatial database indexing");
  console.log("- Location-based caching");
  console.log("- Proximity searches");
  console.log("- Geographic clustering");
  console.log("- Spatial sharding");
  console.log();
}
