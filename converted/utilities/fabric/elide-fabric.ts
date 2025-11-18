/**
 * fabric - Powerful HTML5 Canvas Library
 * Based on https://www.npmjs.com/package/fabric (~3M+ downloads/week)
 */

const rect = new fabric.Rect({
  width: 100,
  height: 100,
  fill: 'red'
});
console.log('Rectangle:', rect.width, 'x', rect.height);

export {};

if (import.meta.url.includes("elide-fabric.ts")) {
  console.log("✅ fabric - Powerful HTML5 Canvas Library (POLYGLOT!)\n");
  console.log("\n🚀 ~3M+ downloads/week\n");
}
