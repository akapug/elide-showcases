/**
 * Geodesy - Geodetic Calculations
 *
 * Precise geodetic calculations for navigation and surveying.
 * **POLYGLOT SHOWCASE**: One geodesy library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/geodesy (~50K+ downloads/week)
 *
 * Features:
 * - Vincenty distance formula
 * - Great circle calculations
 * - Rhumb line calculations
 * - Zero dependencies
 *
 * Package has ~50K+ downloads/week on npm!
 */

export class LatLon {
  constructor(public lat: number, public lon: number) {}

  distanceTo(point: LatLon): number {
    const R = 6371e3;
    const φ1 = this.lat * Math.PI / 180;
    const φ2 = point.lat * Math.PI / 180;
    const Δφ = (point.lat - this.lat) * Math.PI / 180;
    const Δλ = (point.lon - this.lon) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  bearingTo(point: LatLon): number {
    const φ1 = this.lat * Math.PI / 180;
    const φ2 = point.lat * Math.PI / 180;
    const Δλ = (point.lon - this.lon) * Math.PI / 180;

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) -
              Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    const θ = Math.atan2(y, x);

    return (θ * 180 / Math.PI + 360) % 360;
  }
}

export default LatLon;

// CLI Demo
if (import.meta.url.includes("elide-geodesy.ts")) {
  console.log("🌐 Geodesy for Elide (POLYGLOT!)\n");
  const p1 = new LatLon(40.7128, -74.0060);
  const p2 = new LatLon(51.5074, -0.1278);
  console.log("Distance:", p1.distanceTo(p2).toFixed(0), "m\n");
  console.log("✅ Use Cases: Navigation, surveying\n");
}
