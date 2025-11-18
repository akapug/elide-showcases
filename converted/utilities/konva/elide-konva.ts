/**
 * konva - 2D Canvas Framework
 * Based on https://www.npmjs.com/package/konva (~2M+ downloads/week)
 */

const rect = new Konva.Rect({
  x: 50, y: 50,
  width: 100, height: 100,
  fill: 'green'
});
console.log('Shape:', rect.width(), 'x', rect.height());

export {};

if (import.meta.url.includes("elide-konva.ts")) {
  console.log("✅ konva - 2D Canvas Framework (POLYGLOT!)\n");
  console.log("\n🚀 ~2M+ downloads/week\n");
}
