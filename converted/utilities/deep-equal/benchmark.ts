/**
 * Performance Benchmark: Deep Equal
 */

import deepEqual from './elide-deep-equal.ts';

console.log("🔍 Deep Equal Benchmark\n");

const ITERATIONS = 50000;

console.log("=== Benchmark 1: Deep Comparison ===\n");

const obj1 = { user: { name: 'Alice', age: 25, address: { city: 'NYC' } } };
const obj2 = { user: { name: 'Alice', age: 25, address: { city: 'NYC' } } };

const startEqual = Date.now();
for (let i = 0; i < ITERATIONS; i++) {
    deepEqual(obj1, obj2);
}
const equalTime = Date.now() - startEqual;

console.log("Deep equal: " + equalTime + "ms");
console.log("Per-op: " + (equalTime / ITERATIONS).toFixed(3) + "ms");
console.log();

console.log("=== Correctness Test ===\n");

const a = { x: 1, y: { z: 2 } };
const b = { x: 1, y: { z: 2 } };
const c = { x: 1, y: { z: 3 } };

console.log("Equal objects: " + (deepEqual(a, b) ? '✅' : '❌'));
console.log("Different objects: " + (!deepEqual(a, c) ? '✅' : '❌'));
console.log();

console.log("Benchmark complete! ✨");
