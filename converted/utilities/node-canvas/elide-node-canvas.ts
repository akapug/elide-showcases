/**
 * node-canvas - Canvas API for Node.js
 * Based on https://www.npmjs.com/package/node-canvas (~8M+ downloads/week)
 */

const canvas = createCanvas(800, 600);
const ctx = canvas.getContext('2d');
ctx.fillStyle = '#FF5733';
ctx.fillRect(0, 0, 400, 300);
console.log('Canvas:', canvas.width, 'x', canvas.height);

export {};

if (import.meta.url.includes("elide-node-canvas.ts")) {
  console.log("✅ node-canvas - Canvas API for Node.js (POLYGLOT!)\n");
  console.log("\n🚀 ~8M+ downloads/week\n");
}
