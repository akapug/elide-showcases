/**
 * Run All Benchmarks
 * Comprehensive benchmark suite comparing Velocity against all frameworks
 */

import { $ } from 'bun';

console.log('=' .repeat(80));
console.log('VELOCITY BENCHMARK SUITE');
console.log('Running comprehensive benchmarks against all frameworks');
console.log('=' .repeat(80));

const benchmarks = [
  { name: 'Bun (raw)', script: 'benchmarks/vs-bun.ts' },
  { name: 'Hono', script: 'benchmarks/vs-hono.ts' },
  { name: 'Fastify', script: 'benchmarks/vs-fastify.ts' },
  { name: 'Express', script: 'benchmarks/vs-express.ts' },
];

for (const bench of benchmarks) {
  console.log(`\n\n${'='.repeat(80)}`);
  console.log(`Running benchmark: ${bench.name}`);
  console.log('='.repeat(80));

  try {
    await $`bun run ${bench.script}`;
  } catch (error) {
    console.error(`Error running ${bench.name} benchmark:`, error);
  }

  // Wait a bit between benchmarks to let ports be released
  await new Promise(resolve => setTimeout(resolve, 2000));
}

console.log('\n\n' + '='.repeat(80));
console.log('ALL BENCHMARKS COMPLETED');
console.log('='.repeat(80));
