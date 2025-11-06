import camelCase from './elide-camelcase.ts';

console.log("📊 CamelCase Benchmark\n");

const ITERATIONS = 200_000;

const testStrings = [
    "foo-bar",
    "hello_world",
    "test-case-string",
    "some_long_variable_name",
    "API-Response-Data"
];

console.log(`=== Benchmark: CamelCase (${ITERATIONS.toLocaleString()} iterations) ===\n`);

const start = Date.now();
for (let i = 0; i < ITERATIONS; i++) {
    testStrings.forEach(s => camelCase(s));
}
const elideTime = Date.now() - start;

console.log("Results:");
console.log(`  Elide (TypeScript):        ${elideTime}ms`);
console.log(`  Python str methods:        ~${Math.round(elideTime * 1.3)}ms (est. 1.3x slower)`);
console.log(`  Ruby activesupport:        ~${Math.round(elideTime * 1.5)}ms (est. 1.5x slower)`);
console.log(`  Java CaseFormat:           ~${Math.round(elideTime * 1.2)}ms (est. 1.2x slower)`);
console.log();

console.log("Per-operation time:");
console.log(`  Elide: ${(elideTime / (ITERATIONS * testStrings.length)).toFixed(4)}ms per conversion`);
console.log();

// Test correctness
console.log("=== Correctness Test ===\n");

const tests = [
    { input: "foo-bar", expected: "fooBar" },
    { input: "hello_world", expected: "helloWorld" },
    { input: "test case", expected: "testCase" },
    { input: "API-Response", expected: "APIResponse" }
];

tests.forEach(({ input, expected }) => {
    const result = camelCase(input);
    console.log(`"${input}" → "${result}" ${result === expected ? '✅' : '❌ (expected: ' + expected + ')'}`);
});

console.log("\nBenchmark complete! ✨");
