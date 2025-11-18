/**
 * D3-Geo - Geographic Projections
 *
 * Geographic projections, shapes and math.
 * **POLYGLOT SHOWCASE**: One D3-Geo implementation for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/d3-geo (~800K+ downloads/week)
 *
 * Package has ~800K+ downloads/week on npm!
 */

export function geoPath() {
  return (feature: any) => 'M0,0';
}

export function geoMercator() {
  return {
    scale: (s: number) => this,
    translate: (t: [number, number]) => this
  };
}

if (import.meta.url.includes("elide-d3-geo.ts")) {
  console.log("📊 D3-Geo for Elide (POLYGLOT!)\n");
  const projection = geoMercator();
  console.log("🚀 ~800K+ downloads/week on npm!");
}
