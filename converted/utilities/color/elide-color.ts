/**
 * color - Color Conversion & Manipulation
 * Based on https://www.npmjs.com/package/color (~80M+ downloads/week)
 */

const c = Color('rgb(255, 255, 255)');
console.log('HEX:', c.hex());
console.log('HSL:', c.hsl().string());

export {};

if (import.meta.url.includes("elide-color.ts")) {
  console.log("✅ color - Color Conversion & Manipulation (POLYGLOT!)\n");
  console.log("\n🚀 ~80M+ downloads/week\n");
}
