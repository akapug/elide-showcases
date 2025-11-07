/**
 * Performance Benchmark: Clone Deep
 */

import cloneDeep, { cloneShallow } from './elide-clone-deep.ts';

console.log("📋 Clone Deep Benchmark\n");

const ITERATIONS = 50000;

console.log("=== Benchmark 1: Deep Clone ===\n");

const nested = { user: { name: 'Alice', profile: { age: 25, city: 'NYC' } } };

const startDeep = Date.now();
for (let i = 0; i < ITERATIONS; i++) {
    cloneDeep(nested);
}
const deepTime = Date.now() - startDeep;

console.log("Deep clone: " + deepTime + "ms");
console.log("Per-op: " + (deepTime / ITERATIONS).toFixed(3) + "ms");
console.log();

console.log("=== Benchmark 2: Shallow Clone ===\n");

const startShallow = Date.now();
for (let i = 0; i < ITERATIONS; i++) {
    cloneShallow(nested);
}
const shallowTime = Date.now() - startShallow;

console.log("Shallow clone: " + shallowTime + "ms");
console.log("Speedup: " + (deepTime / shallowTime).toFixed(1) + "x faster");
console.log();

console.log("=== Correctness Test ===\n");

const original = { a: 1, nested: { b: 2 } };
const cloned = cloneDeep(original);
cloned.nested.b = 999;

console.log("Original unchanged: " + (original.nested.b === 2 ? '✅' : '❌'));
console.log("Clone modified: " + (cloned.nested.b === 999 ? '✅' : '❌'));
console.log();

console.log("Benchmark complete! ✨");
