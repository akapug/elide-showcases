/**
 * image-size - Get Image Dimensions
 * Based on https://www.npmjs.com/package/image-size (~80M+ downloads/week)
 */

const dimensions = sizeOf('image.jpg');
console.log('Size:', dimensions.width, 'x', dimensions.height);
console.log('Type:', dimensions.type);

export {};

if (import.meta.url.includes("elide-image-size.ts")) {
  console.log("✅ image-size - Get Image Dimensions (POLYGLOT!)\n");
  console.log("\n🚀 ~80M+ downloads/week\n");
}
