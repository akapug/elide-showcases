/**
 * imagemin-mozjpeg - JPEG Optimizer for Imagemin
 * Based on https://www.npmjs.com/package/imagemin-mozjpeg (~5M+ downloads/week)
 */

const result = imageminMozjpeg({
  quality: 80,
  progressive: true
});
console.log('JPEG optimization ready');

export {};

if (import.meta.url.includes("elide-imagemin-mozjpeg.ts")) {
  console.log("✅ imagemin-mozjpeg - JPEG Optimizer for Imagemin (POLYGLOT!)\n");
  console.log("\n🚀 ~5M+ downloads/week\n");
}
