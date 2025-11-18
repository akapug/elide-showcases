/**
 * jimp - Pure JavaScript Image Processing
 * Based on https://www.npmjs.com/package/jimp (~8M+ downloads/week)
 */

const image = new Jimp(800, 600, 0xFFFFFFFF);
image.resize(400, 300)
     .blur(2)
     .quality(90);
console.log('Image:', image.getWidth(), 'x', image.getHeight());

export {};

if (import.meta.url.includes("elide-jimp.ts")) {
  console.log("✅ jimp - Pure JavaScript Image Processing (POLYGLOT!)\n");
  console.log("\n🚀 ~8M+ downloads/week\n");
}
