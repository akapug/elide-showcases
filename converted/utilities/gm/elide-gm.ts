/**
 * gm - GraphicsMagick/ImageMagick Wrapper
 * Based on https://www.npmjs.com/package/gm (~3M+ downloads/week)
 */

gm('input.jpg')
  .resize(800, 600)
  .write('output.jpg');
console.log('Image processed');

export {};

if (import.meta.url.includes("elide-gm.ts")) {
  console.log("✅ gm - GraphicsMagick/ImageMagick Wrapper (POLYGLOT!)\n");
  console.log("\n🚀 ~3M+ downloads/week\n");
}
