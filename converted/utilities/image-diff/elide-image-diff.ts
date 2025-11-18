/**
 * image-diff - Image Difference Tool
 * Based on https://www.npmjs.com/package/image-diff (~500K+ downloads/week)
 */

const diff = await imageDiff({
  actualImage: 'actual.png',
  expectedImage: 'expected.png'
});
console.log('Difference:', diff.percentage);

export {};

if (import.meta.url.includes("elide-image-diff.ts")) {
  console.log("✅ image-diff - Image Difference Tool (POLYGLOT!)\n");
  console.log("\n🚀 ~500K+ downloads/week\n");
}
