/**
 * image-type - Detect Image Type
 * Based on https://www.npmjs.com/package/image-type (~15M+ downloads/week)
 */

const type = imageType(buffer);
console.log('Type:', type?.ext, type?.mime);

export {};

if (import.meta.url.includes("elide-image-type.ts")) {
  console.log("✅ image-type - Detect Image Type (POLYGLOT!)\n");
  console.log("\n🚀 ~15M+ downloads/week\n");
}
