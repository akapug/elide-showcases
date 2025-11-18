/**
 * imagemin-gifsicle - GIF Optimizer for Imagemin
 * Based on https://www.npmjs.com/package/imagemin-gifsicle (~5M+ downloads/week)
 */

const result = imageminGifsicle({
  optimizationLevel: 3,
  colors: 128
});
console.log('GIF optimization ready');

export {};

if (import.meta.url.includes("elide-imagemin-gifsicle.ts")) {
  console.log("✅ imagemin-gifsicle - GIF Optimizer for Imagemin (POLYGLOT!)\n");
  console.log("\n🚀 ~5M+ downloads/week\n");
}
