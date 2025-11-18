/**
 * resemblejs - Image Analysis and Comparison
 * Based on https://www.npmjs.com/package/resemblejs (~1M+ downloads/week)
 */

resemble('image1.jpg')
  .compareTo('image2.jpg')
  .onComplete(data => {
    console.log('Mismatch:', data.mismatchPercentage + '%');
  });

export {};

if (import.meta.url.includes("elide-resemblejs.ts")) {
  console.log("✅ resemblejs - Image Analysis and Comparison (POLYGLOT!)\n");
  console.log("\n🚀 ~1M+ downloads/week\n");
}
