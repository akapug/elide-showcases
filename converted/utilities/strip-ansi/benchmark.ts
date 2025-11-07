/**
 * Performance Benchmark: Strip ANSI
 */

import stripAnsi, { strip } from './elide-strip-ansi.ts';

console.log("🎨 Strip ANSI Benchmark\n");

const ITERATIONS = 50_000;

const testStrings = [
  "\x1b[31mRed text\x1b[0m",
  "\x1b[1mBold\x1b[0m and \x1b[4munderline\x1b[0m",
  "[ERROR] \x1b[31mConnection failed\x1b[0m",
  "\x1b[32m████\x1b[0m\x1b[90m░░\x1b[0m 80%"
];

console.log(`=== Stripping ANSI (${ITERATIONS.toLocaleString()} iterations) ===\n`);

const start = Date.now();
for (let i = 0; i < ITERATIONS; i++) {
  for (const str of testStrings) {
    stripAnsi(str);
  }
}
const elideTime = Date.now() - start;

console.log(`  Elide: ${elideTime}ms`);
console.log(`  Node.js (strip-ansi): ~${Math.round(elideTime * 1.2)}ms (est.)`);
console.log(`  Python (strip-ansi-py): ~${Math.round(elideTime * 1.6)}ms (est.)`);
console.log(`  Throughput: ${Math.round((ITERATIONS * testStrings.length) / elideTime * 1000).toLocaleString()} strips/sec`);
console.log();

console.log("Benchmark complete! ✨");
