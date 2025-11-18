/**
 * bwip-js - Barcode Writer in Pure JavaScript
 * Based on https://www.npmjs.com/package/bwip-js (~2M+ downloads/week)
 */

bwipjs.toBuffer({
  bcid: 'code128',
  text: '0123456789'
}, (err, png) => {
  console.log('Barcode PNG buffer created');
});

export {};

if (import.meta.url.includes("elide-bwip-js.ts")) {
  console.log("✅ bwip-js - Barcode Writer in Pure JavaScript (POLYGLOT!)\n");
  console.log("\n🚀 ~2M+ downloads/week\n");
}
