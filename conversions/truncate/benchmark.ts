/**
 * Truncate - Performance Benchmark
 */
import truncate from './elide-truncate.ts';

const ITERATIONS = 100_000;
const testStrings = [
  "The quick brown fox jumps over the lazy dog",
  "Understanding modern web development frameworks",
  "A comprehensive guide to TypeScript programming"
];

const start = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  truncate(testStrings[i % testStrings.length], 30);
}
const end = performance.now();

console.log("✂️  Truncate - Performance Benchmark\n");
console.log(`Iterations: ${ITERATIONS.toLocaleString()}`);
console.log(`Time: ${(end - start).toFixed(2)}ms`);
console.log(`Throughput: ${Math.round((ITERATIONS / (end - start)) * 1000).toLocaleString()} ops/sec`);
console.log("\n💡 Use Cases:");
console.log("- Article previews (50-150 chars)");
console.log("- Mobile UI (30-50 chars)");
console.log("- Meta descriptions (160 chars)");
