/**
 * Throughput Benchmark
 *
 * Measures requests per second under various concurrency levels.
 */

import { MLBridge } from '../src/polyglot/bridge';

interface ThroughputResult {
  concurrency: number;
  totalRequests: number;
  duration: number;
  rps: number;
  avgLatency: number;
  p95Latency: number;
}

async function measureThroughput(
  mlBridge: MLBridge,
  concurrency: number,
  durationMs: number
): Promise<ThroughputResult> {
  const latencies: number[] = [];
  let totalRequests = 0;
  const endTime = Date.now() + durationMs;

  const workers = Array(concurrency).fill(null).map(async () => {
    while (Date.now() < endTime) {
      const start = performance.now();
      await mlBridge.analyzeSentiment({ text: 'Throughput test' });
      latencies.push(performance.now() - start);
      totalRequests++;
    }
  });

  await Promise.all(workers);

  latencies.sort((a, b) => a - b);
  const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const p95Latency = latencies[Math.floor(latencies.length * 0.95)];

  return {
    concurrency,
    totalRequests,
    duration: durationMs,
    rps: (totalRequests / durationMs) * 1000,
    avgLatency,
    p95Latency,
  };
}

async function main() {
  console.log('🚀 Throughput Benchmark\n');
  console.log('='.repeat(70));

  const mlBridge = new MLBridge({ debug: false });

  // Warmup
  console.log('Warming up...\n');
  await mlBridge.warmup();

  const testDuration = 5000; // 5 seconds per test
  const concurrencyLevels = [1, 5, 10, 20, 50, 100];
  const results: ThroughputResult[] = [];

  for (const concurrency of concurrencyLevels) {
    console.log(`\nTesting concurrency level: ${concurrency}`);
    console.log('─'.repeat(70));

    const result = await measureThroughput(mlBridge, concurrency, testDuration);
    results.push(result);

    console.log(`  Total requests: ${result.totalRequests}`);
    console.log(`  Duration:       ${(result.duration / 1000).toFixed(1)}s`);
    console.log(`  RPS:            ${result.rps.toFixed(0)} req/sec`);
    console.log(`  Avg latency:    ${result.avgLatency.toFixed(3)} ms`);
    console.log(`  P95 latency:    ${result.p95Latency.toFixed(3)} ms`);
  }

  // Summary
  console.log('\n\n📊 Throughput Summary');
  console.log('='.repeat(70));
  console.log('| Concurrency | Total Reqs | RPS    | Avg Lat (ms) | P95 Lat (ms) |');
  console.log('|' + '─'.repeat(68) + '|');

  results.forEach((result) => {
    console.log(
      `| ${String(result.concurrency).padStart(11)} | ${String(result.totalRequests).padStart(10)} | ${result.rps.toFixed(0).padStart(6)} | ${result.avgLatency.toFixed(3).padStart(12)} | ${result.p95Latency.toFixed(3).padStart(12)} |`
    );
  });

  // Analysis
  console.log('\n\n💡 Performance Analysis');
  console.log('='.repeat(70));

  const maxThroughput = Math.max(...results.map(r => r.rps));
  const optimalConcurrency = results.find(r => r.rps === maxThroughput)?.concurrency || 0;

  console.log(`\nOptimal concurrency: ${optimalConcurrency}`);
  console.log(`Peak throughput: ${maxThroughput.toFixed(0)} req/sec`);

  const singleThreadRps = results[0].rps;
  const maxScaling = maxThroughput / singleThreadRps;
  console.log(`\nScaling efficiency: ${maxScaling.toFixed(2)}x (from single thread)`);

  // Latency under load
  const lowLoadLatency = results[0].avgLatency;
  const highLoadLatency = results[results.length - 1].avgLatency;
  const latencyIncrease = ((highLoadLatency - lowLoadLatency) / lowLoadLatency * 100);

  console.log(`\nLatency under load:`);
  console.log(`  Low load (c=1):   ${lowLoadLatency.toFixed(3)} ms`);
  console.log(`  High load (c=100): ${highLoadLatency.toFixed(3)} ms`);
  console.log(`  Increase:         ${latencyIncrease.toFixed(1)}%`);

  if (latencyIncrease < 50) {
    console.log(`  ✓ Excellent: Latency remains stable under high concurrency`);
  } else if (latencyIncrease < 100) {
    console.log(`  ✓ Good: Reasonable latency increase under load`);
  } else {
    console.log(`  ⚠  Warning: Significant latency degradation under load`);
  }

  // Comparison
  console.log(`\n\nComparison to typical architectures:`);
  console.log(`  Elide Polyglot:    ${maxThroughput.toFixed(0)} req/sec`);
  console.log(`  HTTP Microservices: ~5,000 req/sec (estimated)`);
  console.log(`  Node.js + Workers:  ~2,000 req/sec (estimated)`);
  console.log(`  Advantage:         ${(maxThroughput / 5000).toFixed(1)}x vs microservices`);

  console.log('\n✅ Throughput benchmark complete!\n');
}

main().catch((error) => {
  console.error('Benchmark error:', error);
  process.exit(1);
});
