/**
 * Haversine - Distance Calculation
 *
 * Calculate distance between two points on Earth using Haversine formula.
 * **POLYGLOT SHOWCASE**: One distance calculator for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/haversine (~100K+ downloads/week)
 *
 * Features:
 * - Accurate distance calculation
 * - Multiple units (km, miles, meters, nautical miles)
 * - Great circle distance
 * - Flexible coordinate formats
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need distance calculations
 * - ONE implementation works everywhere on Elide
 * - Consistent geo math across languages
 * - Share distance utilities across your stack
 *
 * Use cases:
 * - Location proximity checks
 * - Travel distance estimation
 * - Geofencing
 * - Route planning
 *
 * Package has ~100K+ downloads/week on npm - essential geo utility!
 */

interface Coordinate {
  latitude: number;
  longitude: number;
}

type CoordinateInput =
  | Coordinate
  | { lat: number; lon: number }
  | { lat: number; lng: number }
  | [number, number]; // [lat, lon]

type Unit = 'km' | 'mile' | 'meter' | 'nmi';

interface Options {
  unit?: Unit;
  threshold?: number;
}

// Earth radius in different units
const EARTH_RADIUS = {
  km: 6371,
  mile: 3960,
  meter: 6371000,
  nmi: 3440
};

/**
 * Normalize coordinate input
 */
function normalizeCoordinate(coord: CoordinateInput): Coordinate {
  if (Array.isArray(coord)) {
    return { latitude: coord[0], longitude: coord[1] };
  }
  if ('latitude' in coord && 'longitude' in coord) {
    return coord;
  }
  if ('lat' in coord && 'lon' in coord) {
    return { latitude: coord.lat, longitude: coord.lon };
  }
  if ('lat' in coord && 'lng' in coord) {
    return { latitude: coord.lat, longitude: coord.lng };
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
 * Calculate haversine distance between two points
 */
export default function haversine(
  start: CoordinateInput,
  end: CoordinateInput,
  options: Options = {}
): number {
  const startCoord = normalizeCoordinate(start);
  const endCoord = normalizeCoordinate(end);
  const unit = options.unit || 'km';

  const lat1 = toRadians(startCoord.latitude);
  const lon1 = toRadians(startCoord.longitude);
  const lat2 = toRadians(endCoord.latitude);
  const lon2 = toRadians(endCoord.longitude);

  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = EARTH_RADIUS[unit] * c;

  if (options.threshold !== undefined) {
    return distance <= options.threshold ? distance : -1;
  }

  return distance;
}

/**
 * Calculate distance in kilometers
 */
export function distanceInKm(start: CoordinateInput, end: CoordinateInput): number {
  return haversine(start, end, { unit: 'km' });
}

/**
 * Calculate distance in miles
 */
export function distanceInMiles(start: CoordinateInput, end: CoordinateInput): number {
  return haversine(start, end, { unit: 'mile' });
}

/**
 * Calculate distance in meters
 */
export function distanceInMeters(start: CoordinateInput, end: CoordinateInput): number {
  return haversine(start, end, { unit: 'meter' });
}

/**
 * Calculate distance in nautical miles
 */
export function distanceInNauticalMiles(start: CoordinateInput, end: CoordinateInput): number {
  return haversine(start, end, { unit: 'nmi' });
}

/**
 * Check if two points are within a certain distance
 */
export function isWithinRadius(
  start: CoordinateInput,
  end: CoordinateInput,
  radius: number,
  unit: Unit = 'km'
): boolean {
  const distance = haversine(start, end, { unit });
  return distance <= radius;
}

export { haversine };

// CLI Demo
if (import.meta.url.includes("elide-haversine.ts")) {
  console.log("📏 Haversine - Distance Calculation for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Distance ===");
  const newYork = { latitude: 40.7128, longitude: -74.0060 };
  const losAngeles = { latitude: 34.0522, longitude: -118.2437 };
  const distance = haversine(newYork, losAngeles);
  console.log(`NYC to LA: ${distance.toFixed(2)} km`);
  console.log();

  console.log("=== Example 2: Different Units ===");
  console.log(`Distance in km: ${haversine(newYork, losAngeles, { unit: 'km' }).toFixed(2)}`);
  console.log(`Distance in miles: ${haversine(newYork, losAngeles, { unit: 'mile' }).toFixed(2)}`);
  console.log(`Distance in meters: ${haversine(newYork, losAngeles, { unit: 'meter' }).toFixed(0)}`);
  console.log(`Distance in nautical miles: ${haversine(newYork, losAngeles, { unit: 'nmi' }).toFixed(2)}`);
  console.log();

  console.log("=== Example 3: Helper Functions ===");
  const london = { latitude: 51.5074, longitude: -0.1278 };
  const paris = { latitude: 48.8566, longitude: 2.3522 };
  console.log(`London to Paris: ${distanceInKm(london, paris).toFixed(2)} km`);
  console.log(`London to Paris: ${distanceInMiles(london, paris).toFixed(2)} miles`);
  console.log(`London to Paris: ${distanceInMeters(london, paris).toFixed(0)} meters`);
  console.log();

  console.log("=== Example 4: Array Format ===");
  const tokyo: [number, number] = [35.6762, 139.6503];
  const osaka: [number, number] = [34.6937, 135.5023];
  console.log(`Tokyo to Osaka: ${haversine(tokyo, osaka).toFixed(2)} km`);
  console.log();

  console.log("=== Example 5: Within Radius Check ===");
  const store = { latitude: 40.7580, longitude: -73.9855 };
  const customer1 = { latitude: 40.7589, longitude: -73.9851 };
  const customer2 = { latitude: 40.8000, longitude: -74.0000 };
  console.log(`Customer 1 within 1km: ${isWithinRadius(store, customer1, 1)}`);
  console.log(`Customer 2 within 1km: ${isWithinRadius(store, customer2, 1)}`);
  console.log();

  console.log("=== Example 6: Threshold Option ===");
  const result = haversine(store, customer1, { unit: 'meter', threshold: 500 });
  console.log(`Distance (or -1 if > 500m): ${result.toFixed(2)} meters`);
  console.log();

  console.log("=== Example 7: City Distances ===");
  const cities = [
    { name: "New York", coord: { latitude: 40.7128, longitude: -74.0060 } },
    { name: "Chicago", coord: { latitude: 41.8781, longitude: -87.6298 } },
    { name: "San Francisco", coord: { latitude: 37.7749, longitude: -122.4194 } },
    { name: "Miami", coord: { latitude: 25.7617, longitude: -80.1918 } }
  ];

  console.log("Distances from New York:");
  cities.slice(1).forEach(city => {
    const dist = haversine(cities[0].coord, city.coord);
    console.log(`  to ${city.name}: ${dist.toFixed(2)} km`);
  });
  console.log();

  console.log("=== Example 8: Delivery Zones ===");
  const warehouse = { latitude: 34.0522, longitude: -118.2437 };
  const deliveries = [
    { id: "D1", location: { latitude: 34.0500, longitude: -118.2500 } },
    { id: "D2", location: { latitude: 34.1000, longitude: -118.3000 } },
    { id: "D3", location: { latitude: 34.0400, longitude: -118.2400 } },
    { id: "D4", location: { latitude: 34.2000, longitude: -118.5000 } }
  ];

  console.log("Delivery distance check (25km radius):");
  deliveries.forEach(delivery => {
    const dist = haversine(warehouse, delivery.location);
    const canDeliver = isWithinRadius(warehouse, delivery.location, 25);
    console.log(`  ${delivery.id}: ${dist.toFixed(2)}km - ${canDeliver ? '✓ Can deliver' : '✗ Out of range'}`);
  });
  console.log();

  console.log("=== POLYGLOT Use Case ===");
  console.log("🌐 Same Haversine API works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Location proximity checks");
  console.log("- Travel distance estimation");
  console.log("- Delivery radius validation");
  console.log("- Route planning");
  console.log("- Geofencing applications");
  console.log();
}
