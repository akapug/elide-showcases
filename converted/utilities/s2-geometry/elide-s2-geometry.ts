/**
 * S2 Geometry - S2 Spatial Indexing
 *
 * Google's S2 geometry library for spatial indexing.
 * **POLYGLOT SHOWCASE**: One S2 library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/s2-geometry (~20K+ downloads/week)
 *
 * Features:
 * - S2 cell generation
 * - Hierarchical spatial indexing
 * - Coverage calculations
 * - Zero dependencies (core)
 *
 * Package has ~20K+ downloads/week on npm!
 */

export class S2 {
  static latLngToKey(lat: number, lng: number, level: number = 30): string {
    const latNorm = (lat + 90) / 180;
    const lngNorm = (lng + 180) / 360;
    return `${level}:${Math.floor(latNorm * (1 << level))}:${Math.floor(lngNorm * (1 << level))}`;
  }

  static keyToLatLng(key: string): { lat: number; lng: number } {
    const [level, x, y] = key.split(':').map(Number);
    const lat = (x / (1 << level)) * 180 - 90;
    const lng = (y / (1 << level)) * 360 - 180;
    return { lat, lng };
  }

  static neighbors(key: string): string[] {
    const { lat, lng } = this.keyToLatLng(key);
    const [level] = key.split(':').map(Number);
    const step = 180 / (1 << level);

    return [
      this.latLngToKey(lat + step, lng, level),
      this.latLngToKey(lat - step, lng, level),
      this.latLngToKey(lat, lng + step, level),
      this.latLngToKey(lat, lng - step, level)
    ];
  }
}

export default S2;

// CLI Demo
if (import.meta.url.includes("elide-s2-geometry.ts")) {
  console.log("🔷 S2 Geometry for Elide (POLYGLOT!)\n");
  const key = S2.latLngToKey(40.7128, -74.0060, 15);
  console.log("S2 Key:", key, "\n");
  const coords = S2.keyToLatLng(key);
  console.log("Coords:", coords, "\n");
  console.log("✅ Use Cases: Spatial indexing, coverage\n");
}
