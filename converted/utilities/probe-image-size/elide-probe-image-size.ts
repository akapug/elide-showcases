/**
 * probe-image-size - Probe Image Size
 * Based on https://www.npmjs.com/package/probe-image-size (~5M+ downloads/week)
 */

const size = await probe('http://example.com/image.jpg');
console.log('Size:', size.width, 'x', size.height);

export {};

if (import.meta.url.includes("elide-probe-image-size.ts")) {
  console.log("✅ probe-image-size - Probe Image Size (POLYGLOT!)\n");
  console.log("\n🚀 ~5M+ downloads/week\n");
}
