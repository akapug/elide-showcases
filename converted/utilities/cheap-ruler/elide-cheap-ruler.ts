/**
 * Cheap Ruler - Fast Geographic Calculations
 *
 * Fast approximations for geographic calculations using flat projections.
 * **POLYGLOT SHOWCASE**: One fast geo library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/cheap-ruler (~100K+ downloads/week)
 *
 * Features:
 * - Fast distance calculations
 * - Area and length measurements
 * - Along-track distance
 * - Point on line
 * - Bounding box calculations
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need fast geo math
 * - ONE implementation works everywhere on Elide
 * - Consistent fast calculations across languages
 * - Share ruler instances across your stack
 *
 * Use cases:
 * - Real-time location tracking
 * - High-performance routing
 * - Live map applications
 * - Distance-based queries
 *
 * Package has ~100K+ downloads/week on npm - 10x faster than Haversine!
 */

type Point = [number, number]; // [lon, lat]

export class CheapRuler {
  private kx: number;
  private ky: number;

  constructor(latitude: number, units: 'kilometers' | 'miles' | 'meters' = 'kilometers') {
    const cos = Math.cos(latitude * Math.PI / 180);
    const cos2 = 2 * cos * cos - 1;
    const cos3 = 2 * cos * cos2 - cos;
    const cos4 = 2 * cos * cos3 - cos2;
    const cos5 = 2 * cos * cos4 - cos3;

    this.ky = 110.25 / (1 + cos2 / 2 - cos4 / 24);
    this.kx = this.ky * cos;

    if (units === 'miles') {
      this.kx *= 0.621371;
      this.ky *= 0.621371;
    } else if (units === 'meters') {
      this.kx *= 1000;
      this.ky *= 1000;
    }
  }

  distance(a: Point, b: Point): number {
    const dx = (a[0] - b[0]) * this.kx;
    const dy = (a[1] - b[1]) * this.ky;
    return Math.sqrt(dx * dx + dy * dy);
  }

  bearing(a: Point, b: Point): number {
    const dx = (b[0] - a[0]) * this.kx;
    const dy = (b[1] - a[1]) * this.ky;
    return Math.atan2(dx, dy) * 180 / Math.PI;
  }

  destination(p: Point, dist: number, bearing: number): Point {
    const a = bearing * Math.PI / 180;
    return [
      p[0] + Math.sin(a) * dist / this.kx,
      p[1] + Math.cos(a) * dist / this.ky
    ];
  }

  lineDistance(points: Point[]): number {
    let total = 0;
    for (let i = 0; i < points.length - 1; i++) {
      total += this.distance(points[i], points[i + 1]);
    }
    return total;
  }

  area(polygon: Point[]): number {
    let sum = 0;
    for (let i = 0; i < polygon.length - 1; i++) {
      const p1 = polygon[i];
      const p2 = polygon[i + 1];
      sum += (p1[0] - p2[0]) * (p1[1] + p2[1]);
    }
    return Math.abs(sum) * this.kx * this.ky / 2;
  }

  along(line: Point[], dist: number): Point {
    let sum = 0;
    for (let i = 0; i < line.length - 1; i++) {
      const p1 = line[i];
      const p2 = line[i + 1];
      const d = this.distance(p1, p2);
      if (sum + d >= dist) {
        const t = (dist - sum) / d;
        return [p1[0] + (p2[0] - p1[0]) * t, p1[1] + (p2[1] - p1[1]) * t];
      }
      sum += d;
    }
    return line[line.length - 1];
  }

  bufferPoint(p: Point, buffer: number): [Point, Point] {
    const v = buffer / this.ky;
    const h = buffer / this.kx;
    return [[p[0] - h, p[1] - v], [p[0] + h, p[1] + v]];
  }
}

export default CheapRuler;

// CLI Demo
if (import.meta.url.includes("elide-cheap-ruler.ts")) {
  console.log("📏 Cheap Ruler - Fast Geographic Calculations for Elide (POLYGLOT!)\n");

  const myRuler = new CheapRuler(40.7128);
  const p1: Point = [-74.0060, 40.7128];
  const p2: Point = [-73.9855, 40.7580];

  console.log("=== Example 1: Distance ===");
  console.log("Distance:", myRuler.distance(p1, p2).toFixed(3), "km\n");

  console.log("=== Example 2: Bearing ===");
  console.log("Bearing:", myRuler.bearing(p1, p2).toFixed(2), "degrees\n");

  console.log("=== Example 3: Line Distance ===");
  const route: Point[] = [[-74.0060, 40.7128], [-73.9855, 40.7580], [-73.9712, 40.7831]];
  console.log("Route length:", myRuler.lineDistance(route).toFixed(3), "km\n");

  console.log("=== POLYGLOT Use Case ===");
  console.log("🌐 Same Cheap Ruler API works in all languages on Elide\n");

  console.log("✅ Use Cases:");
  console.log("- Real-time location tracking");
  console.log("- High-performance routing");
  console.log("- Live map applications\n");
}
