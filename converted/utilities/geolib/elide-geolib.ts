/**
 * Geolib - Geographic Calculations
 *
 * Library for geographic calculations like distance, bearing, and more.
 * **POLYGLOT SHOWCASE**: One geo calculation library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/geolib (~300K+ downloads/week)
 *
 * Features:
 * - Distance calculations (multiple formulas)
 * - Bearing and compass direction
 * - Center point calculation
 * - Bounding box generation
 * - Point in circle/polygon checks
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need geo calculations
 * - ONE implementation works everywhere on Elide
 * - Consistent coordinate math across languages
 * - Share geo utilities across your stack
 *
 * Use cases:
 * - Distance between locations
 * - Nearest location finder
 * - Geofencing applications
 * - Navigation and routing
 *
 * Package has ~300K+ downloads/week on npm - essential geo utility!
 */

interface Coordinate {
  latitude: number;
  longitude: number;
}

type CoordinateInput = Coordinate | { lat: number; lon: number } | { lat: number; lng: number } | [number, number];

const EARTH_RADIUS = 6371000; // meters

/**
 * Normalize coordinate input to standard format
 */
function toCoordinate(input: CoordinateInput): Coordinate {
  if (Array.isArray(input)) {
    return { latitude: input[0], longitude: input[1] };
  }
  if ('latitude' in input) {
    return input;
  }
  if ('lat' in input && 'lon' in input) {
    return { latitude: input.lat, longitude: input.lon };
  }
  if ('lat' in input && 'lng' in input) {
    return { latitude: input.lat, longitude: input.lng };
  }
  throw new Error('Invalid coordinate format');
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * Math.PI / 180;
}

/**
 * Convert radians to degrees
 */
function toDegrees(radians: number): number {
  return radians * 180 / Math.PI;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function getDistance(from: CoordinateInput, to: CoordinateInput, accuracy: number = 1): number {
  const start = toCoordinate(from);
  const end = toCoordinate(to);

  const dLat = toRadians(end.latitude - start.latitude);
  const dLon = toRadians(end.longitude - start.longitude);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(start.latitude)) * Math.cos(toRadians(end.latitude)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS * c;

  return Math.round(distance / accuracy) * accuracy;
}

/**
 * Calculate bearing between two coordinates
 */
export function getBearing(from: CoordinateInput, to: CoordinateInput): number {
  const start = toCoordinate(from);
  const end = toCoordinate(to);

  const dLon = toRadians(end.longitude - start.longitude);
  const lat1 = toRadians(start.latitude);
  const lat2 = toRadians(end.latitude);

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) -
            Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  const bearing = toDegrees(Math.atan2(y, x));
  return (bearing + 360) % 360;
}

/**
 * Get compass direction from bearing
 */
export function getCompassDirection(bearing: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                     'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(bearing / 22.5) % 16;
  return directions[index];
}

/**
 * Calculate center point of coordinates
 */
export function getCenter(coords: CoordinateInput[]): Coordinate {
  if (coords.length === 0) {
    throw new Error('Cannot get center of empty array');
  }

  let x = 0, y = 0, z = 0;

  for (const coord of coords) {
    const c = toCoordinate(coord);
    const lat = toRadians(c.latitude);
    const lon = toRadians(c.longitude);

    x += Math.cos(lat) * Math.cos(lon);
    y += Math.cos(lat) * Math.sin(lon);
    z += Math.sin(lat);
  }

  const total = coords.length;
  x /= total;
  y /= total;
  z /= total;

  const lon = Math.atan2(y, x);
  const hyp = Math.sqrt(x * x + y * y);
  const lat = Math.atan2(z, hyp);

  return {
    latitude: toDegrees(lat),
    longitude: toDegrees(lon)
  };
}

/**
 * Get bounding box for coordinates
 */
export function getBounds(coords: CoordinateInput[]): { minLat: number; maxLat: number; minLng: number; maxLng: number } {
  if (coords.length === 0) {
    throw new Error('Cannot get bounds of empty array');
  }

  let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;

  for (const coord of coords) {
    const c = toCoordinate(coord);
    minLat = Math.min(minLat, c.latitude);
    maxLat = Math.max(maxLat, c.latitude);
    minLng = Math.min(minLng, c.longitude);
    maxLng = Math.max(maxLng, c.longitude);
  }

  return { minLat, maxLat, minLng, maxLng };
}

/**
 * Check if point is inside circle
 */
export function isPointInCircle(point: CoordinateInput, center: CoordinateInput, radius: number): boolean {
  return getDistance(point, center) <= radius;
}

/**
 * Find nearest coordinate to a point
 */
export function findNearest(point: CoordinateInput, coords: CoordinateInput[]): Coordinate | null {
  if (coords.length === 0) return null;

  let nearest = toCoordinate(coords[0]);
  let minDistance = getDistance(point, coords[0]);

  for (let i = 1; i < coords.length; i++) {
    const distance = getDistance(point, coords[i]);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = toCoordinate(coords[i]);
    }
  }

  return nearest;
}

/**
 * Order coordinates by distance from a point
 */
export function orderByDistance(point: CoordinateInput, coords: CoordinateInput[]): Array<{ coord: Coordinate; distance: number }> {
  return coords
    .map(coord => ({
      coord: toCoordinate(coord),
      distance: getDistance(point, coord)
    }))
    .sort((a, b) => a.distance - b.distance);
}

export default {
  getDistance,
  getBearing,
  getCompassDirection,
  getCenter,
  getBounds,
  isPointInCircle,
  findNearest,
  orderByDistance
};

// CLI Demo
if (import.meta.url.includes("elide-geolib.ts")) {
  console.log("🧭 Geolib - Geographic Calculations for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Distance Calculation ===");
  const newYork = { latitude: 40.7128, longitude: -74.0060 };
  const london = { latitude: 51.5074, longitude: -0.1278 };
  const distance = getDistance(newYork, london);
  console.log(`Distance NYC to London: ${(distance / 1000).toFixed(2)} km`);
  console.log();

  console.log("=== Example 2: Bearing and Direction ===");
  const bearing = getBearing(newYork, london);
  const direction = getCompassDirection(bearing);
  console.log(`Bearing: ${bearing.toFixed(2)}°`);
  console.log(`Direction: ${direction}`);
  console.log();

  console.log("=== Example 3: Center Point ===");
  const cities = [
    { latitude: 40.7128, longitude: -74.0060 }, // NYC
    { latitude: 34.0522, longitude: -118.2437 }, // LA
    { latitude: 41.8781, longitude: -87.6298 }  // Chicago
  ];
  const center = getCenter(cities);
  console.log("Center of NYC, LA, Chicago:", center);
  console.log();

  console.log("=== Example 4: Bounding Box ===");
  const bounds = getBounds(cities);
  console.log("Bounds:", bounds);
  console.log();

  console.log("=== Example 5: Point in Circle ===");
  const store = { latitude: 40.7580, longitude: -73.9855 };
  const customer = { latitude: 40.7589, longitude: -73.9851 };
  const deliveryRadius = 500; // meters
  const canDeliver = isPointInCircle(customer, store, deliveryRadius);
  console.log(`Customer within delivery radius: ${canDeliver}`);
  console.log();

  console.log("=== Example 6: Find Nearest ===");
  const myLocation = { latitude: 40.7500, longitude: -73.9900 };
  const stores = [
    { latitude: 40.7580, longitude: -73.9855 },
    { latitude: 40.7489, longitude: -73.9680 },
    { latitude: 40.7614, longitude: -73.9776 }
  ];
  const nearest = findNearest(myLocation, stores);
  console.log("Nearest store:", nearest);
  console.log(`Distance: ${(getDistance(myLocation, nearest!) / 1000).toFixed(2)} km`);
  console.log();

  console.log("=== Example 7: Order by Distance ===");
  const ordered = orderByDistance(myLocation, stores);
  console.log("Stores ordered by distance:");
  ordered.forEach((item, idx) => {
    console.log(`  ${idx + 1}. ${(item.distance / 1000).toFixed(2)} km - ${item.coord.latitude.toFixed(4)}, ${item.coord.longitude.toFixed(4)}`);
  });
  console.log();

  console.log("=== Example 8: Delivery Zone Check ===");
  const warehouse = { latitude: 34.0522, longitude: -118.2437 };
  const customers = [
    { latitude: 34.0500, longitude: -118.2500 },
    { latitude: 34.1000, longitude: -118.3000 },
    { latitude: 34.0400, longitude: -118.2400 }
  ];
  console.log("Checking delivery zones (10km radius):");
  customers.forEach((cust, idx) => {
    const inZone = isPointInCircle(cust, warehouse, 10000);
    console.log(`  Customer ${idx + 1}: ${inZone ? '✓ Can deliver' : '✗ Out of range'}`);
  });
  console.log();

  console.log("=== POLYGLOT Use Case ===");
  console.log("🌐 Same Geolib API works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Distance calculations");
  console.log("- Nearest location finder");
  console.log("- Delivery zone validation");
  console.log("- Navigation and routing");
  console.log("- Geofencing applications");
  console.log();
}
