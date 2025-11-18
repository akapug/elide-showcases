/**
 * Tilebelt - Tile Math Utilities
 *
 * Tile coordinate math and utilities.
 * **POLYGLOT SHOWCASE**: One tile utility for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/@mapbox/tilebelt (~50K+ downloads/week)
 *
 * Features:
 * - Tile to lat/lng conversion
 * - Parent/child tile calculation
 * - Tile bounding box
 * - Zero dependencies
 *
 * Package has ~50K+ downloads/week on npm!
 */

type Tile = [number, number, number]; // [x, y, z]

export function tileToBBOX(tile: Tile): [number, number, number, number] {
  const [x, y, z] = tile;
  const west = (x / Math.pow(2, z)) * 360 - 180;
  const east = ((x + 1) / Math.pow(2, z)) * 360 - 180;
  const n = Math.PI - 2 * Math.PI * y / Math.pow(2, z);
  const north = 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  const s = Math.PI - 2 * Math.PI * (y + 1) / Math.pow(2, z);
  const south = 180 / Math.PI * Math.atan(0.5 * (Math.exp(s) - Math.exp(-s)));
  return [west, south, east, north];
}

export function getParent(tile: Tile): Tile {
  const [x, y, z] = tile;
  if (z === 0) return tile;
  return [Math.floor(x / 2), Math.floor(y / 2), z - 1];
}

export function getChildren(tile: Tile): Tile[] {
  const [x, y, z] = tile;
  return [
    [x * 2, y * 2, z + 1],
    [x * 2 + 1, y * 2, z + 1],
    [x * 2, y * 2 + 1, z + 1],
    [x * 2 + 1, y * 2 + 1, z + 1]
  ];
}

export default { tileToBBOX, getParent, getChildren };

// CLI Demo
if (import.meta.url.includes("elide-tilebelt.ts")) {
  console.log("🧮 Tilebelt for Elide (POLYGLOT!)\n");
  const tile: Tile = [0, 0, 0];
  console.log("Bbox:", tileToBBOX(tile), "\n");
  console.log("Children:", getChildren(tile), "\n");
  console.log("✅ Use Cases: Tile coordinate math\n");
}
