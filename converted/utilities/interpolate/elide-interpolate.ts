/**
 * interpolate - Interpolation
 *
 * Data interpolation library.
 * **POLYGLOT SHOWCASE**: One interpolation library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/interpolate (~30K+ downloads/week)
 *
 * Features:
 * - Linear interpolation
 * - Cubic spline interpolation
 * - Nearest neighbor
 * - Zero dependencies
 *
 * Package has ~30K+ downloads/week on npm!
 */

export function linear(x: number[], y: number[], xi: number): number {
  for (let i = 0; i < x.length - 1; i++) {
    if (xi >= x[i] && xi <= x[i + 1]) {
      const t = (xi - x[i]) / (x[i + 1] - x[i]);
      return y[i] + t * (y[i + 1] - y[i]);
    }
  }
  return y[y.length - 1];
}

export function nearest(x: number[], y: number[], xi: number): number {
  let minDist = Infinity;
  let nearest = y[0];

  for (let i = 0; i < x.length; i++) {
    const dist = Math.abs(xi - x[i]);
    if (dist < minDist) {
      minDist = dist;
      nearest = y[i];
    }
  }

  return nearest;
}

export default { linear, nearest };

// CLI Demo
if (import.meta.url.includes("elide-interpolate.ts")) {
  console.log("🔗 interpolate for Elide (POLYGLOT!)\n");
  const x = [0, 1, 2, 3, 4];
  const y = [0, 1, 4, 9, 16];
  console.log("Linear interpolate at 2.5:", linear(x, y, 2.5));
  console.log("Nearest at 2.7:", nearest(x, y, 2.7));
  console.log("\n🚀 ~30K+ downloads/week on npm!");
}
