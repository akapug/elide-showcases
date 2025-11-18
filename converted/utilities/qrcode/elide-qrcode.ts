/**
 * qrcode - QR Code Generator
 * Based on https://www.npmjs.com/package/qrcode (~15M+ downloads/week)
 */

QRCode.toDataURL('https://example.com', (err, url) => {
  console.log('QR Code URL:', url.substring(0, 50) + '...');
});

export {};

if (import.meta.url.includes("elide-qrcode.ts")) {
  console.log("✅ qrcode - QR Code Generator (POLYGLOT!)\n");
  console.log("\n🚀 ~15M+ downloads/week\n");
}
