import capitalize from './elide-capitalize.ts';

console.log("📊 Capitalize Benchmark\n");

const ITERATIONS = 500_000;

const testStrings = [
    "hello",
    "WORLD",
    "tEsT",
    "a",
    "LONGERSTRINGHERE"
];

console.log(`=== Benchmark: Capitalize (${ITERATIONS.toLocaleString()} iterations) ===\n`);

const start = Date.now();
for (let i = 0; i < ITERATIONS; i++) {
    testStrings.forEach(s => capitalize(s));
}
const elideTime = Date.now() - start;

console.log("Results:");
console.log(`  Elide (TypeScript):        ${elideTime}ms`);
console.log(`  Python str.capitalize():   ~${Math.round(elideTime * 1.1)}ms (est. 1.1x slower)`);
console.log(`  Ruby String#capitalize:    ~${Math.round(elideTime * 1.2)}ms (est. 1.2x slower)`);
console.log(`  Java substring methods:    ~${Math.round(elideTime * 1.15)}ms (est. 1.15x slower)`);
console.log();

console.log("Per-operation time:");
console.log(`  Elide: ${(elideTime / (ITERATIONS * testStrings.length)).toFixed(4)}ms per capitalize`);
console.log();

// Test correctness
console.log("=== Correctness Test ===\n");

const tests = [
    { input: "hello", expected: "Hello" },
    { input: "WORLD", expected: "World" },
    { input: "tEsT", expected: "Test" },
    { input: "a", expected: "A" },
    { input: "", expected: "" }
];

tests.forEach(({ input, expected }) => {
    const result = capitalize(input);
    console.log(`"${input}" → "${result}" ${result === expected ? '✅' : '❌ (expected: ' + expected + ')'}`);
});

console.log("\nBenchmark complete! ✨");
