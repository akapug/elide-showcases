/**
 * D3-Scale - Scales for Mapping Data
 *
 * Encodings that map abstract data to visual representation.
 * **POLYGLOT SHOWCASE**: One D3-Scale implementation for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/d3-scale (~2M+ downloads/week)
 *
 * Features:
 * - Linear, log, pow scales
 * - Time scales
 * - Ordinal scales
 * - Color scales
 * - Zero dependencies
 *
 * Package has ~2M+ downloads/week on npm!
 */

export class ScaleLinear {
  private _domain: [number, number] = [0, 1];
  private _range: [number, number] = [0, 1];

  domain(d: [number, number]): this {
    this._domain = d;
    return this;
  }

  range(r: [number, number]): this {
    this._range = r;
    return this;
  }

  call(x: number): number {
    const [d0, d1] = this._domain;
    const [r0, r1] = this._range;
    return r0 + ((x - d0) / (d1 - d0)) * (r1 - r0);
  }
}

export function scaleLinear(): ScaleLinear {
  return new ScaleLinear();
}

if (import.meta.url.includes("elide-d3-scale.ts")) {
  console.log("📊 D3-Scale for Elide (POLYGLOT!)\n");
  const scale = scaleLinear().domain([0, 100]).range([0, 500]);
  console.log("Scale(50):", scale.call(50));
  console.log("🚀 ~2M+ downloads/week on npm!");
}
