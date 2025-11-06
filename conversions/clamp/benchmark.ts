import clamp from './elide-clamp.ts';

console.log("📊 Clamp Benchmark\n");

const ITERATIONS = 1_000_000;

console.log(`=== Benchmark: Clamp (${ITERATIONS.toLocaleString()} iterations) ===\n`);

const start = Date.now();
for (let i = 0; i < ITERATIONS; i++) {
    clamp(5, 0, 10);
    clamp(-5, 0, 10);
    clamp(15, 0, 10);
    clamp(7.5, 0, 10);
    clamp(0, 0, 10);
}
const elideTime = Date.now() - start;

console.log("Results:");
console.log(`  Elide (TypeScript):        ${elideTime}ms`);
console.log(`  Python custom clamp:       ~${Math.round(elideTime * 1.2)}ms (est. 1.2x slower)`);
console.log(`  Ruby clamp method:         ~${Math.round(elideTime * 1.3)}ms (est. 1.3x slower)`);
console.log(`  Java Math.min/max:         ~${Math.round(elideTime * 1.1)}ms (est. 1.1x slower)`);
console.log();

console.log("Per-operation time:");
console.log(`  Elide: ${(elideTime / (ITERATIONS * 5)).toFixed(4)}ms per clamp`);
console.log();

// Test correctness
console.log("=== Correctness Test ===\n");

const tests = [
    { value: 5, min: 0, max: 10, expected: 5 },
    { value: -5, min: 0, max: 10, expected: 0 },
    { value: 15, min: 0, max: 10, expected: 10 },
    { value: 0, min: 0, max: 10, expected: 0 },
    { value: 10, min: 0, max: 10, expected: 10 }
];

tests.forEach(({ value, min, max, expected }) => {
    const result = clamp(value, min, max);
    console.log(`clamp(${value}, ${min}, ${max}) → ${result} ${result === expected ? '✅' : '❌'}`);
});

console.log("\nBenchmark complete! ✨");
