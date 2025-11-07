/**
 * Pad Left - Performance Benchmark
 */
import padLeft, { zeroPad } from './elide-pad-left.ts';

const ITERATIONS = 100_000;

const start = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  zeroPad(i % 1000, 5);
}
const end = performance.now();

console.log("⬅️  Pad Left - Performance Benchmark\n");
console.log(`Iterations: ${ITERATIONS.toLocaleString()}`);
console.log(`Time: ${(end - start).toFixed(2)}ms`);
console.log(`Throughput: ${Math.round((ITERATIONS / (end - start)) * 1000).toLocaleString()} ops/sec`);
console.log("\n💡 Use Cases:");
console.log("- File naming: file001.jpg, file002.jpg");
console.log("- Time formatting: 09:05, 14:30");
console.log("- Log line numbers");
console.log("- Invoice/table alignment");
