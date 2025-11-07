/**
 * Pluralize - Performance Benchmark
 */

import pluralize, { singularize } from './elide-pluralize.ts';

const ITERATIONS = 100_000;

const testWords = [
  'user', 'person', 'child', 'item', 'product', 'category',
  'box', 'class', 'fish', 'sheep', 'foot', 'tooth'
];

function benchmark(name: string, fn: (word: string) => string) {
  const start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    fn(testWords[i % testWords.length]);
  }
  const end = performance.now();
  return { duration: (end - start).toFixed(2), opsPerSec: Math.round((ITERATIONS / (end - start)) * 1000) };
}

console.log("📝 Pluralize - Performance Benchmark\n");
console.log(`Running ${ITERATIONS.toLocaleString()} iterations...\n`);

console.log("=== Sample Conversions ===");
testWords.slice(0, 6).forEach(word => {
  console.log(`  ${word} → ${pluralize(word)}`);
});
console.log();

const elideResult = benchmark("Elide pluralize", pluralize);
console.log("=== Benchmark Results ===");
console.log(`Elide: ${elideResult.duration}ms (${elideResult.opsPerSec.toLocaleString()} ops/sec)`);
console.log();

console.log("💡 Use Cases:");
console.log("- UI labels (1 item / 5 items)");
console.log("- API responses");
console.log("- Form generation");
console.log("- Database table names");
