/**
 * Performance Benchmark: kebab-case String Transformation
 * Run with: elide run benchmark.ts
 */

import kebabCase from './elide-kebabcase.ts';

console.log("🏎️  kebab-case Benchmark\n");

const ITERATIONS = 500_000;
const testStrings = [
  'fooBar',
  'HelloWorld',
  'my_api_endpoint',
  'UserEmailAddress',
  'some long string',
];

console.log(`=== Benchmark: ${ITERATIONS.toLocaleString()} iterations ===\n`);

const start = Date.now();
for (let i = 0; i < ITERATIONS; i++) {
  const str = testStrings[i % testStrings.length];
  kebabCase(str);
}
const elideTime = Date.now() - start;

console.log(`Elide (TypeScript): ${elideTime}ms`);
console.log(`Per transformation: ${(elideTime / ITERATIONS * 1000).toFixed(3)}µs`);
console.log();

console.log("=== Correctness Test ===\n");
const tests = [
  { input: 'fooBar', expected: 'foo-bar' },
  { input: 'HelloWorld', expected: 'hello-world' },
  { input: 'my_api_endpoint', expected: 'my-api-endpoint' },
  { input: 'UserEmailAddress', expected: 'user-email-address' },
  { input: 'some  spaces', expected: 'some-spaces' },
];

let allPass = true;
for (const test of tests) {
  const result = kebabCase(test.input);
  const pass = result === test.expected;
  if (!pass) allPass = false;
  console.log(`  kebabCase('${test.input}') = '${result}' ${pass ? '✅' : `❌ (expected '${test.expected}')`}`);
}
console.log();
console.log(`Result: ${allPass ? '✅ ALL TESTS PASS' : '❌ SOME TESTS FAILED'}`);
console.log();
console.log("Benchmark complete! ✨");
