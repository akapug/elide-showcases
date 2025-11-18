/**
 * imagemin-svgo - SVG Optimizer for Imagemin
 * Based on https://www.npmjs.com/package/imagemin-svgo (~5M+ downloads/week)
 */

const result = imageminSvgo({
  plugins: [{ removeViewBox: false }]
});
console.log('SVG optimization ready');

export {};

if (import.meta.url.includes("elide-imagemin-svgo.ts")) {
  console.log("✅ imagemin-svgo - SVG Optimizer for Imagemin (POLYGLOT!)\n");
  console.log("\n🚀 ~5M+ downloads/week\n");
}
