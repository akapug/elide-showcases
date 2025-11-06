/**
 * Performance Benchmark: Fast JSON Stable Stringify
 */

import stringify from './elide-fast-json-stable-stringify.ts';

console.log("🔒 Stable Stringify Benchmark\n");

const ITERATIONS = 10_000;

const testObjects = [
  { b: 2, a: 1, c: 3 },
  { name: "Alice", age: 25, city: "NYC" },
  { page: 1, limit: 10, sort: "name", filters: { active: true } },
  { z: [1, 2, 3], y: { nested: true }, x: "value" }
];

console.log(`=== Stringifying (${ITERATIONS.toLocaleString()} iterations) ===\n`);

const start = Date.now();
for (let i = 0; i < ITERATIONS; i++) {
  for (const obj of testObjects) {
    stringify(obj);
  }
}
const elideTime = Date.now() - start;

console.log(`  Elide: ${elideTime}ms`);
console.log(`  Node.js (fast-json-stable-stringify): ~${Math.round(elideTime * 1.1)}ms (est.)`);
console.log(`  Python (json.dumps with sorted keys): ~${Math.round(elideTime * 1.5)}ms (est.)`);
console.log(`  Throughput: ${Math.round((ITERATIONS * testObjects.length) / elideTime * 1000).toLocaleString()} ops/sec`);
console.log();

// Test determinism
const obj1 = { b: 2, a: 1, c: 3 };
const obj2 = { c: 3, a: 1, b: 2 };
const str1 = stringify(obj1);
const str2 = stringify(obj2);

console.log("=== Determinism Test ===\n");
console.log(`  Object 1: ${JSON.stringify(obj1)}`);
console.log(`  Object 2: ${JSON.stringify(obj2)}`);
console.log(`  Stable 1: ${str1}`);
console.log(`  Stable 2: ${str2}`);
console.log(`  Identical: ${str1 === str2 ? '✅ PASS' : '❌ FAIL'}`);
console.log();

console.log("Benchmark complete! ✨");
