/**
 * looks-same - Image Comparison Tool
 * Based on https://www.npmjs.com/package/looks-same (~2M+ downloads/week)
 */

looksSame('image1.png', 'image2.png', (error, equal) => {
  console.log('Images equal:', equal);
});

export {};

if (import.meta.url.includes("elide-looks-same.ts")) {
  console.log("✅ looks-same - Image Comparison Tool (POLYGLOT!)\n");
  console.log("\n🚀 ~2M+ downloads/week\n");
}
