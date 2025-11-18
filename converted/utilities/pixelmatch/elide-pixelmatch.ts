/**
 * pixelmatch - Pixel-level Image Comparison
 * Based on https://www.npmjs.com/package/pixelmatch (~15M+ downloads/week)
 */

const diff = pixelmatch(img1, img2, null, 800, 600);
console.log('Different pixels:', diff);

export {};

if (import.meta.url.includes("elide-pixelmatch.ts")) {
  console.log("✅ pixelmatch - Pixel-level Image Comparison (POLYGLOT!)\n");
  console.log("\n🚀 ~15M+ downloads/week\n");
}
