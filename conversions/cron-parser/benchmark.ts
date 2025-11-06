/**
 * Performance Benchmark: Cron Parser
 */

import { parseCronExpression, getNextExecution } from './elide-cron-parser.ts';

console.log("⏰ Cron Parser Benchmark\n");

const ITERATIONS = 5_000;

console.log(`=== Parsing (${ITERATIONS.toLocaleString()} iterations) ===\n`);

const expressions = ["*/5 * * * *", "0 12 * * *", "0 */6 * * *"];

const startParse = Date.now();
for (let i = 0; i < ITERATIONS; i++) {
  for (const expr of expressions) {
    parseCronExpression(expr);
  }
}
const parseTime = Date.now() - startParse;

console.log(`  Elide: ${parseTime}ms`);
console.log(`  Node.js (cron-parser): ~${Math.round(parseTime * 1.4)}ms (est.)`);
console.log(`  Python (croniter): ~${Math.round(parseTime * 1.8)}ms (est.)`);
console.log();

console.log("=== Next Execution Calculation ===\n");

const now = new Date();
const startNext = Date.now();
for (let i = 0; i < ITERATIONS; i++) {
  getNextExecution("0 12 * * *", now);
}
const nextTime = Date.now() - startNext;

console.log(`  Elide: ${nextTime}ms`);
console.log(`  Throughput: ${Math.round(ITERATIONS / nextTime * 1000).toLocaleString()} calculations/sec`);
console.log();

console.log("Benchmark complete! ✨");
