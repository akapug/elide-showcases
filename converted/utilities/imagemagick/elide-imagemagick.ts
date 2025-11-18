/**
 * imagemagick - ImageMagick Node.js Wrapper
 * Based on https://www.npmjs.com/package/imagemagick (~2M+ downloads/week)
 */

convert('input.jpg', [
  '-resize', '800x600',
  '-quality', '90'
], 'output.jpg');

export {};

if (import.meta.url.includes("elide-imagemagick.ts")) {
  console.log("✅ imagemagick - ImageMagick Node.js Wrapper (POLYGLOT!)\n");
  console.log("\n🚀 ~2M+ downloads/week\n");
}
