/**
 * Performance Benchmark: Object Property Selection (Pick)
 *
 * Run with: elide run benchmark.ts
 */

import pick, { pickDeep, pickBy, pickDefined } from './elide-pick.ts';

console.log("🎯 Pick Benchmark\n");

const ITERATIONS = 100_000;

console.log(`=== Benchmark 1: Simple Pick (${ITERATIONS.toLocaleString()} iterations) ===\n`);

const user = { id: 1, name: "Alice", age: 25, email: "alice@example.com", password: "secret", role: "admin" };

const startSimple = Date.now();
for (let i = 0; i < ITERATIONS; i++) {
    pick(user, 'id', 'name', 'email');
}
const simpleTime = Date.now() - startSimple;

console.log(`Results: ${simpleTime}ms`);
console.log(`Per-operation: ${(simpleTime / ITERATIONS * 1000).toFixed(2)}µs`);
console.log();

console.log(`=== Benchmark 2: Deep Pick (${ITERATIONS.toLocaleString()} iterations) ===\n`);

const nested = {
    user: { profile: { name: "Alice", email: "alice@example.com", ssn: "123" }, settings: { theme: "dark" } }
};

const startDeep = Date.now();
for (let i = 0; i < ITERATIONS; i++) {
    pickDeep(nested, 'user.profile.name', 'user.settings.theme');
}
const deepTime = Date.now() - startDeep;

console.log(`Results: ${deepTime}ms`);
console.log(`Average: ${(deepTime / ITERATIONS * 1000).toFixed(2)}µs`);
console.log();

console.log("=== Correctness Test ===\n");

const test1 = pick({ a: 1, b: 2, c: 3 }, 'a', 'c');
console.log(`Pick result: ${JSON.stringify(test1)}`);
console.log(`Pass: ${JSON.stringify(test1) === '{"a":1,"c":3}'}`);

console.log();
console.log("Benchmark complete! ✨");
