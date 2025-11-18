/**
 * is-svg - Check if SVG
 * Based on https://www.npmjs.com/package/is-svg (~30M+ downloads/week)
 */

console.log('Is SVG string:', isSvg('<svg>...</svg>'));
console.log('Is SVG buffer:', isSvg(buffer));

export {};

if (import.meta.url.includes("elide-is-svg.ts")) {
  console.log("✅ is-svg - Check if SVG (POLYGLOT!)\n");
  console.log("\n🚀 ~30M+ downloads/week\n");
}
