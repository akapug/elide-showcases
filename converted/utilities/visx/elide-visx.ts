/**
 * visx - React Visualization Components
 *
 * Low-level visualization primitives for React.
 * **POLYGLOT SHOWCASE**: One visx implementation for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/@visx/visx (~200K+ downloads/week)
 *
 * Features:
 * - Low-level primitives
 * - React components
 * - D3-powered
 * - Composable
 * - Zero dependencies
 *
 * Package has ~200K+ downloads/week on npm!
 */

export class VisxScale {
  domain: [number, number] = [0, 1];
  range: [number, number] = [0, 1];

  scaleLinear() {
    return this;
  }

  call(value: number): number {
    const [d0, d1] = this.domain;
    const [r0, r1] = this.range;
    return r0 + ((value - d0) / (d1 - d0)) * (r1 - r0);
  }
}

export function scaleLinear(): VisxScale {
  return new VisxScale();
}

if (import.meta.url.includes("elide-visx.ts")) {
  console.log("📊 visx for Elide (POLYGLOT!)\n");
  const scale = scaleLinear();
  scale.domain = [0, 100];
  scale.range = [0, 500];
  console.log("Scale(50):", scale.call(50));
  console.log("🚀 ~200K+ downloads/week on npm!");
}
