/**
 * sharp - High-Performance Image Processing
 * Based on https://www.npmjs.com/package/sharp (~15M+ downloads/week)
 */

const pipeline = sharp('input.jpg')
  .resize(800, 600)
  .rotate(90)
  .jpeg({ quality: 90 });

pipeline.toFile('output.jpg').then(info => {
  console.log('Output:', info);
});

export {};

if (import.meta.url.includes("elide-sharp.ts")) {
  console.log("✅ sharp - High-Performance Image Processing (POLYGLOT!)\n");
  console.log("\n🚀 ~15M+ downloads/week\n");
}
