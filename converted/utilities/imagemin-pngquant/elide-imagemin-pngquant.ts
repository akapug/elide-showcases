/**
 * imagemin-pngquant - PNG Optimizer for Imagemin
 * Based on https://www.npmjs.com/package/imagemin-pngquant (~5M+ downloads/week)
 */

const result = imageminPngquant({
  quality: [0.65, 0.80],
  speed: 1
});
console.log('PNG optimization ready');

export {};

if (import.meta.url.includes("elide-imagemin-pngquant.ts")) {
  console.log("✅ imagemin-pngquant - PNG Optimizer for Imagemin (POLYGLOT!)\n");
  console.log("\n🚀 ~5M+ downloads/week\n");
}
