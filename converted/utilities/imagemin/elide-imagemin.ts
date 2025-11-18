/**
 * imagemin - Image Minification Library
 * Based on https://www.npmjs.com/package/imagemin (~8M+ downloads/week)
 */

const files = imagemin(['images/*.png'], {
  plugins: [imageminPngquant({ quality: [0.6, 0.8] })]
});
console.log('Minified', files.length, 'images');

export {};

if (import.meta.url.includes("elide-imagemin.ts")) {
  console.log("✅ imagemin - Image Minification Library (POLYGLOT!)\n");
  console.log("\n🚀 ~8M+ downloads/week\n");
}
