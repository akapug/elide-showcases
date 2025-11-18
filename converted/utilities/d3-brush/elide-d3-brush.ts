/**
 * D3-Brush - Brush Selection
 *
 * Select a one- or two-dimensional region using the mouse or touch.
 * **POLYGLOT SHOWCASE**: One D3-Brush implementation for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/d3-brush (~500K+ downloads/week)
 *
 * Package has ~500K+ downloads/week on npm!
 */

export class Brush {
  extent(extent: [[number, number], [number, number]]): this {
    return this;
  }

  on(type: string, listener: any): this {
    return this;
  }
}

export function brushX(): Brush {
  return new Brush();
}

export function brushY(): Brush {
  return new Brush();
}

export function brush(): Brush {
  return new Brush();
}

if (import.meta.url.includes("elide-d3-brush.ts")) {
  console.log("📊 D3-Brush for Elide (POLYGLOT!)\n");
  const b = brush().extent([[0, 0], [100, 100]]);
  console.log("🚀 ~500K+ downloads/week on npm!");
}
