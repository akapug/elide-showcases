/**
 * qr-image - QR Image Generator
 * Based on https://www.npmjs.com/package/qr-image (~2M+ downloads/week)
 */

const qr = qrImage.image('Hello', { type: 'png' });
console.log('QR image stream created');

export {};

if (import.meta.url.includes("elide-qr-image.ts")) {
  console.log("✅ qr-image - QR Image Generator (POLYGLOT!)\n");
  console.log("\n🚀 ~2M+ downloads/week\n");
}
