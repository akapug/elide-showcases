/**
 * jsbarcode - Barcode Generator
 * Based on https://www.npmjs.com/package/jsbarcode (~3M+ downloads/week)
 */

JsBarcode.barcode('1234567890', {
  format: 'CODE128',
  width: 2,
  height: 100
});
console.log('Barcode generated');

export {};

if (import.meta.url.includes("elide-jsbarcode.ts")) {
  console.log("✅ jsbarcode - Barcode Generator (POLYGLOT!)\n");
  console.log("\n🚀 ~3M+ downloads/week\n");
}
