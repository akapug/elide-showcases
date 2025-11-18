/**
 * cropperjs - Advanced Image Cropper
 * Based on https://www.npmjs.com/package/cropperjs (~3M+ downloads/week)
 */

const cropper = new Cropper({
  aspectRatio: 16 / 9,
  viewMode: 1
});
console.log('Cropper ready');

export {};

if (import.meta.url.includes("elide-cropperjs.ts")) {
  console.log("✅ cropperjs - Advanced Image Cropper (POLYGLOT!)\n");
  console.log("\n🚀 ~3M+ downloads/week\n");
}
