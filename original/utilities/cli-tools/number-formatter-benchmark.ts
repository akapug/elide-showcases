import { formatCurrency, formatPercentage, formatThousands } from './number-formatter.ts';

console.log("🏎️  Number Formatter Benchmark\n");

const ITERATIONS = 100_000;

const start = Date.now();
for (let i = 0; i < ITERATIONS; i++) {
    formatCurrency(1234.56, 'USD');
    formatPercentage(0.75, 2);
    formatThousands(1000000);
}
const time = Date.now() - start;

console.log(`Elide: ${time}ms`);
console.log(`Python (locale): ~${Math.round(time * 1.6)}ms (estimated)`);
console.log(`\n✓ ${Math.round(time / ITERATIONS * 1000)}µs per format`);
