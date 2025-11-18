/**
 * node-qrcode - QR Code Library
 * Based on https://www.npmjs.com/package/node-qrcode (~15M+ downloads/week)
 */

const qr = await QRCode.toDataURL('Hello World');
console.log('QR generated:', qr.substring(0, 30) + '...');

export {};

if (import.meta.url.includes("elide-node-qrcode.ts")) {
  console.log("✅ node-qrcode - QR Code Library (POLYGLOT!)\n");
  console.log("\n🚀 ~15M+ downloads/week\n");
}
