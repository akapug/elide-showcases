/**
 * Performance Benchmark: Object Hashing
 *
 * Run with: elide run benchmark.ts
 */

import hash, { md5, sha1, sha256, equals } from './elide-object-hash.ts';

console.log("🔐 Object Hash Benchmark\n");

const ITERATIONS = 100_000;

console.log(`=== Benchmark 1: Simple Object Hash (${ITERATIONS.toLocaleString()} iterations) ===\n`);

const obj = { name: "Alice", age: 25, city: "NYC" };

const startSimple = Date.now();
for (let i = 0; i < ITERATIONS; i++) {
    hash(obj);
}
const simpleTime = Date.now() - startSimple;

console.log(`Results: ${simpleTime}ms`);
console.log(`Per-operation: ${(simpleTime / ITERATIONS * 1000).toFixed(2)}µs`);
console.log();

console.log(`=== Benchmark 2: Nested Object Hash (${ITERATIONS.toLocaleString()} iterations) ===\n`);

const nested = {
    user: { profile: { name: "Alice", age: 25 }, settings: { theme: "dark" } }
};

const startNested = Date.now();
for (let i = 0; i < ITERATIONS; i++) {
    hash(nested);
}
const nestedTime = Date.now() - startNested;

console.log(`Results: ${nestedTime}ms`);
console.log(`Average: ${(nestedTime / ITERATIONS * 1000).toFixed(2)}µs`);
console.log();

console.log(`=== Benchmark 3: Cache Key Generation (${ITERATIONS.toLocaleString()} iterations) ===\n`);

const startCache = Date.now();
for (let i = 0; i < ITERATIONS; i++) {
    hash({ endpoint: '/users', params: { page: i % 10, limit: 10 } });
}
const cacheTime = Date.now() - startCache;

console.log(`Results: ${cacheTime}ms`);
console.log(`Average: ${(cacheTime / ITERATIONS * 1000).toFixed(2)}µs per cache key`);
console.log();

console.log("=== Correctness Test ===\n");

const obj1 = { a: 1, b: 2 };
const obj2 = { b: 2, a: 1 }; // Same data, different order
const obj3 = { a: 1, b: 3 }; // Different data

console.log(`Hash 1: ${hash(obj1)}`);
console.log(`Hash 2: ${hash(obj2)}`);
console.log(`Hash 3: ${hash(obj3)}`);
console.log(`Same hash for same data (different order): ${hash(obj1) === hash(obj2)}`);
console.log(`Different hash for different data: ${hash(obj1) !== hash(obj3)}`);

console.log();
console.log("Benchmark complete! ✨");
