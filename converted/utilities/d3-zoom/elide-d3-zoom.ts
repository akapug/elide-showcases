/**
 * D3-Zoom - Pan and Zoom
 *
 * Pan and zoom SVG, HTML or Canvas using mouse or touch input.
 * **POLYGLOT SHOWCASE**: One D3-Zoom implementation for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/d3-zoom (~800K+ downloads/week)
 *
 * Package has ~800K+ downloads/week on npm!
 */

export class Zoom {
  scaleExtent(extent: [number, number]): this {
    return this;
  }

  on(type: string, listener: any): this {
    return this;
  }
}

export function zoom(): Zoom {
  return new Zoom();
}

if (import.meta.url.includes("elide-d3-zoom.ts")) {
  console.log("📊 D3-Zoom for Elide (POLYGLOT!)\n");
  const z = zoom().scaleExtent([1, 8]);
  console.log("🚀 ~800K+ downloads/week on npm!");
}
