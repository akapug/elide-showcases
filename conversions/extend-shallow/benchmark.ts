/**
 * Performance Benchmark: Shallow Object Extension
 *
 * Run with: elide run benchmark.ts
 */

import extend, { defaults, extendWith, extendDefined } from './elide-extend-shallow.ts';

console.log("🔗 Extend Shallow Benchmark\n");

const ITERATIONS = 100_000;

console.log(`=== Benchmark 1: Simple Extend (${ITERATIONS.toLocaleString()} iterations) ===\n`);

const obj1 = { a: 1, b: 2 };
const obj2 = { b: 3, c: 4 };

const startSimple = Date.now();
for (let i = 0; i < ITERATIONS; i++) {
    extend(obj1, obj2);
}
const simpleTime = Date.now() - startSimple;

console.log(`Results: ${simpleTime}ms`);
console.log(`Per-operation: ${(simpleTime / ITERATIONS * 1000).toFixed(2)}µs`);
console.log();

console.log(`=== Benchmark 2: Multiple Objects (${ITERATIONS.toLocaleString()} iterations) ===\n`);

const multi1 = { a: 1 };
const multi2 = { b: 2 };
const multi3 = { c: 3 };

const startMulti = Date.now();
for (let i = 0; i < ITERATIONS; i++) {
    extend(multi1, multi2, multi3);
}
const multiTime = Date.now() - startMulti;

console.log(`Results: ${multiTime}ms`);
console.log(`Average: ${(multiTime / ITERATIONS * 1000).toFixed(2)}µs`);
console.log();

console.log("=== Correctness Test ===\n");

const test = extend({ a: 1, b: 2 }, { b: 3, c: 4 });
console.log(`Extend result: ${JSON.stringify(test)}`);
console.log(`Pass: ${JSON.stringify(test) === '{"a":1,"b":3,"c":4}'}`);

console.log();
console.log("Benchmark complete! ✨");
