/**
 * svgo - SVG Optimizer
 * Based on https://www.npmjs.com/package/svgo (~30M+ downloads/week)
 */

const result = optimize(svgString, {
  plugins: ['removeDoctype', 'removeComments']
});
console.log('Optimized SVG:', result.data.length, 'bytes');

export {};

if (import.meta.url.includes("elide-svgo.ts")) {
  console.log("✅ svgo - SVG Optimizer (POLYGLOT!)\n");
  console.log("\n🚀 ~30M+ downloads/week\n");
}
