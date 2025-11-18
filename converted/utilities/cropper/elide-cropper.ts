/**
 * cropper - Simple Image Cropper
 * Based on https://www.npmjs.com/package/cropper (~2M+ downloads/week)
 */

const crop = new ImageCropper({
  width: 800,
  height: 600
});
console.log('Crop area: 800x600');

export {};

if (import.meta.url.includes("elide-cropper.ts")) {
  console.log("✅ cropper - Simple Image Cropper (POLYGLOT!)\n");
  console.log("\n🚀 ~2M+ downloads/week\n");
}
