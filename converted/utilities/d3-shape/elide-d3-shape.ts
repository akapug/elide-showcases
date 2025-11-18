/**
 * D3-Shape - Shape Generators
 *
 * Graphical primitives for visualization.
 * **POLYGLOT SHOWCASE**: One D3-Shape implementation for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/d3-shape (~2M+ downloads/week)
 *
 * Package has ~2M+ downloads/week on npm!
 */

export function line() {
  let x = (d: any) => d[0];
  let y = (d: any) => d[1];

  const gen = (data: any[]): string => {
    return 'M ' + data.map(d => `${x(d)},${y(d)}`).join(' L ');
  };

  gen.x = (fn: any) => { x = fn; return gen; };
  gen.y = (fn: any) => { y = fn; return gen; };

  return gen;
}

if (import.meta.url.includes("elide-d3-shape.ts")) {
  console.log("📊 D3-Shape for Elide (POLYGLOT!)\n");
  const l = line();
  console.log(l([[0, 0], [1, 1], [2, 0]]));
  console.log("🚀 ~2M+ downloads/week on npm!");
}
