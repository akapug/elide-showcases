/**
 * image-extensions - List of Image Extensions
 * Based on https://www.npmjs.com/package/image-extensions (~5M+ downloads/week)
 */

console.log('Image extensions:', imageExtensions.slice(0, 5));
console.log('Is image:', imageExtensions.includes('png'));

export {};

if (import.meta.url.includes("elide-image-extensions.ts")) {
  console.log("✅ image-extensions - List of Image Extensions (POLYGLOT!)\n");
  console.log("\n🚀 ~5M+ downloads/week\n");
}
