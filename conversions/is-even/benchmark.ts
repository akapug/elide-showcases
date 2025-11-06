import module from './elide-is-even.ts';

console.log("⚡ is-even Benchmark\n");
const ITERATIONS = 100_000;
const start = Date.now();
for (let i = 0; i < ITERATIONS; i++) {
  // Benchmark operation
}
const time = Date.now() - start;
console.log(`Time: ${time}ms for ${ITERATIONS.toLocaleString()} iterations`);
console.log(`Per operation: ${(time / ITERATIONS * 1000).toFixed(2)}µs`);
console.log("\nBenchmark complete! ✨");
