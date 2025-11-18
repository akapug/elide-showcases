/**
 * Run All Benchmarks
 */

import { execSync } from 'child_process';

async function runAllBenchmarks(): Promise<void> {
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   MULTIPLAYER GAME SERVER AI - COMPREHENSIVE BENCHMARK SUITE');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('\n');

  const benchmarks = [
    {
      name: 'FPS Consistency Test',
      command: 'elide run benchmarks/fps_benchmark.ts 10 60000'
    },
    {
      name: 'AI Latency Test',
      command: 'elide run benchmarks/ai_latency.ts 1000 10'
    },
    {
      name: 'Stress Test',
      command: 'elide run benchmarks/stress_test.ts 20 30000'
    }
  ];

  for (const benchmark of benchmarks) {
    console.log(`\n${'='.repeat(63)}`);
    console.log(`Running: ${benchmark.name}`);
    console.log(`${'='.repeat(63)}\n`);

    try {
      execSync(benchmark.command, { stdio: 'inherit' });
    } catch (error) {
      console.error(`\n❌ Benchmark failed: ${benchmark.name}\n`);
    }
  }

  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('               ALL BENCHMARKS COMPLETED');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('\n');
}

runAllBenchmarks().catch(console.error);
