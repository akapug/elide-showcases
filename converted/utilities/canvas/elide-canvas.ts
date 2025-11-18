/**
 * canvas - Cairo Canvas for Node.js
 * Based on https://www.npmjs.com/package/canvas (~8M+ downloads/week)
 */

const canvas = createCanvas(800, 600);
const ctx = canvas.getContext('2d');
ctx.fillStyle = 'blue';
ctx.fillRect(10, 10, 100, 100);

export {};

if (import.meta.url.includes("elide-canvas.ts")) {
  console.log("✅ canvas - Cairo Canvas for Node.js (POLYGLOT!)\n");
  console.log("\n🚀 ~8M+ downloads/week\n");
}
