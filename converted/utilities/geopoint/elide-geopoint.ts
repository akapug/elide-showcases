/**
 * GeoPoint - Geographic Point Class
 *
 * Class for working with geographic points.
 * **POLYGLOT SHOWCASE**: One GeoPoint class for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/geopoint (~20K+ downloads/week)
 *
 * Features:
 * - Point creation
 * - Distance calculation
 * - Bearing calculation
 * - Zero dependencies
 *
 * Package has ~20K+ downloads/week on npm!
 */

export class GeoPoint {
  constructor(public latitude: number, public longitude: number) {}

  distanceTo(other: GeoPoint, units: 'km' | 'm' = 'km'): number {
    const R = units === 'km' ? 6371 : 6371000;
    const dLat = (other.latitude - this.latitude) * Math.PI / 180;
    const dLon = (other.longitude - this.longitude) * Math.PI / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.latitude * Math.PI / 180) * Math.cos(other.latitude * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  bearingTo(other: GeoPoint): number {
    const dLon = (other.longitude - this.longitude) * Math.PI / 180;
    const lat1 = this.latitude * Math.PI / 180;
    const lat2 = other.latitude * Math.PI / 180;

    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  }
}

export default GeoPoint;

// CLI Demo
if (import.meta.url.includes("elide-geopoint.ts")) {
  console.log("📍 GeoPoint for Elide (POLYGLOT!)\n");
  const p1 = new GeoPoint(40.7128, -74.0060);
  const p2 = new GeoPoint(51.5074, -0.1278);
  console.log("Distance:", p1.distanceTo(p2).toFixed(2), "km\n");
  console.log("Bearing:", p1.bearingTo(p2).toFixed(2), "°\n");
  console.log("✅ Use Cases: Point-based geo operations\n");
}
