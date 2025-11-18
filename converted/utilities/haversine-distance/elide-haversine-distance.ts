/**
 * Haversine Distance - Simple Distance Calculator
 *
 * Calculate distance using haversine formula.
 * **POLYGLOT SHOWCASE**: One haversine library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/haversine-distance (~50K+ downloads/week)
 *
 * Features:
 * - Simple API
 * - Fast calculation
 * - Zero dependencies
 *
 * Package has ~50K+ downloads/week on npm!
 */

export default function haversineDistance(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
): number {
  const R = 6371e3;
  const dLat = (b.latitude - a.latitude) * Math.PI / 180;
  const dLon = (b.longitude - a.longitude) * Math.PI / 180;
  const lat1 = a.latitude * Math.PI / 180;
  const lat2 = b.latitude * Math.PI / 180;

  const x = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));

  return R * c;
}

// CLI Demo
if (import.meta.url.includes("elide-haversine-distance.ts")) {
  console.log("📏 Haversine Distance for Elide (POLYGLOT!)\n");
  const dist = haversineDistance(
    { latitude: 40.7128, longitude: -74.0060 },
    { latitude: 51.5074, longitude: -0.1278 }
  );
  console.log("Distance:", dist.toFixed(0), "m\n");
  console.log("✅ Use Cases: Quick distance calculation\n");
}
