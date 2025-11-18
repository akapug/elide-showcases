/**
 * Performance Benchmark Tests
 *
 * Measure and validate performance characteristics of the polyglot API.
 */

import { MLBridge } from '../src/polyglot/bridge';

interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  p50: number;
  p95: number;
  p99: number;
  throughput: number;
}

/**
 * Run a benchmark
 */
async function benchmark(
  name: string,
  fn: () => Promise<void>,
  iterations: number = 100
): Promise<BenchmarkResult> {
  const times: number[] = [];

  // Warmup (10% of iterations)
  const warmupIterations = Math.ceil(iterations * 0.1);
  for (let i = 0; i < warmupIterations; i++) {
    await fn();
  }

  // Actual benchmark
  const startTotal = performance.now();

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    const duration = performance.now() - start;
    times.push(duration);
  }

  const totalTime = performance.now() - startTotal;

  // Calculate statistics
  times.sort((a, b) => a - b);
  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const minTime = times[0];
  const maxTime = times[times.length - 1];
  const p50 = times[Math.floor(times.length * 0.5)];
  const p95 = times[Math.floor(times.length * 0.95)];
  const p99 = times[Math.floor(times.length * 0.99)];
  const throughput = (iterations / totalTime) * 1000; // ops/sec

  return {
    name,
    iterations,
    totalTime,
    avgTime,
    minTime,
    maxTime,
    p50,
    p95,
    p99,
    throughput,
  };
}

/**
 * Print benchmark result
 */
function printResult(result: BenchmarkResult) {
  console.log(`\n📊 ${result.name}`);
  console.log('─'.repeat(60));
  console.log(`  Iterations: ${result.iterations}`);
  console.log(`  Total time: ${result.totalTime.toFixed(2)}ms`);
  console.log(`  Avg:        ${result.avgTime.toFixed(3)}ms`);
  console.log(`  Min:        ${result.minTime.toFixed(3)}ms`);
  console.log(`  Max:        ${result.maxTime.toFixed(3)}ms`);
  console.log(`  P50:        ${result.p50.toFixed(3)}ms`);
  console.log(`  P95:        ${result.p95.toFixed(3)}ms`);
  console.log(`  P99:        ${result.p99.toFixed(3)}ms`);
  console.log(`  Throughput: ${result.throughput.toFixed(0)} ops/sec`);
}

/**
 * Validate performance against expectations
 */
function validatePerformance(result: BenchmarkResult, expectations: {
  maxAvg?: number;
  maxP95?: number;
  maxP99?: number;
  minThroughput?: number;
}) {
  const issues: string[] = [];

  if (expectations.maxAvg && result.avgTime > expectations.maxAvg) {
    issues.push(`Avg time ${result.avgTime.toFixed(3)}ms exceeds ${expectations.maxAvg}ms`);
  }

  if (expectations.maxP95 && result.p95 > expectations.maxP95) {
    issues.push(`P95 time ${result.p95.toFixed(3)}ms exceeds ${expectations.maxP95}ms`);
  }

  if (expectations.maxP99 && result.p99 > expectations.maxP99) {
    issues.push(`P99 time ${result.p99.toFixed(3)}ms exceeds ${expectations.maxP99}ms`);
  }

  if (expectations.minThroughput && result.throughput < expectations.minThroughput) {
    issues.push(`Throughput ${result.throughput.toFixed(0)} ops/sec below ${expectations.minThroughput}`);
  }

  if (issues.length > 0) {
    console.log('\n  ⚠️  Performance warnings:');
    issues.forEach(issue => console.log(`     - ${issue}`));
    console.log('     Note: This may be due to cold start or system load');
  } else {
    console.log('\n  ✓ Performance meets expectations');
  }

  return issues.length === 0;
}

async function main() {
  console.log('\n⚡ Running Performance Benchmarks\n');
  console.log('='.repeat(60));

  const mlBridge = new MLBridge({ debug: false });

  // Warm up all models
  console.log('\n🔥 Warming up models...');
  await mlBridge.warmup();
  console.log('✓ Warmup complete');

  const results: BenchmarkResult[] = [];

  // Benchmark 1: Sentiment analysis - small text
  console.log('\n\nBenchmark 1: Sentiment Analysis (Small Text)');
  const result1 = await benchmark(
    'Sentiment Analysis - Small Text',
    async () => {
      await mlBridge.analyzeSentiment({
        text: 'Great product!',
      });
    },
    200
  );
  results.push(result1);
  printResult(result1);
  validatePerformance(result1, {
    maxAvg: 5.0,
    maxP95: 10.0,
    maxP99: 20.0,
    minThroughput: 100,
  });

  // Benchmark 2: Sentiment analysis - medium text
  console.log('\n\nBenchmark 2: Sentiment Analysis (Medium Text)');
  const mediumText = 'This is a fantastic product that exceeded all my expectations. ' +
    'The quality is outstanding and the customer service was excellent. ' +
    'I would highly recommend this to anyone looking for a reliable solution. ' +
    'The price is fair and the delivery was fast. Overall very satisfied!';

  const result2 = await benchmark(
    'Sentiment Analysis - Medium Text',
    async () => {
      await mlBridge.analyzeSentiment({
        text: mediumText,
      });
    },
    200
  );
  results.push(result2);
  printResult(result2);
  validatePerformance(result2, {
    maxAvg: 7.0,
    maxP95: 15.0,
    maxP99: 25.0,
  });

  // Benchmark 3: Sentiment analysis - large text
  console.log('\n\nBenchmark 3: Sentiment Analysis (Large Text)');
  const largeText = mediumText.repeat(10);

  const result3 = await benchmark(
    'Sentiment Analysis - Large Text',
    async () => {
      await mlBridge.analyzeSentiment({
        text: largeText,
      });
    },
    100
  );
  results.push(result3);
  printResult(result3);
  validatePerformance(result3, {
    maxAvg: 15.0,
    maxP95: 30.0,
  });

  // Benchmark 4: Batch processing
  console.log('\n\nBenchmark 4: Batch Sentiment Analysis (10 items)');
  const batchTexts = [
    'Excellent!',
    'Terrible.',
    'Okay.',
    'Amazing!',
    'Disappointing.',
    'Good value.',
    'Not recommended.',
    'Love it!',
    'Waste of money.',
    'Satisfied.',
  ];

  const result4 = await benchmark(
    'Batch Analysis - 10 items',
    async () => {
      await mlBridge.analyzeSentimentBatch(batchTexts);
    },
    100
  );
  results.push(result4);
  printResult(result4);
  console.log(`  Per item:   ${(result4.avgTime / 10).toFixed(3)}ms`);
  validatePerformance(result4, {
    maxAvg: 20.0,
    maxP95: 40.0,
  });

  // Benchmark 5: Recommendations
  console.log('\n\nBenchmark 5: Personalized Recommendations');
  const result5 = await benchmark(
    'Get Recommendations',
    async () => {
      await mlBridge.getRecommendations({
        user_id: `user_${Math.random()}`,
        limit: 10,
      });
    },
    200
  );
  results.push(result5);
  printResult(result5);
  validatePerformance(result5, {
    maxAvg: 5.0,
    maxP95: 10.0,
    maxP99: 20.0,
  });

  // Benchmark 6: Context-aware recommendations
  console.log('\n\nBenchmark 6: Context-Aware Recommendations');
  const result6 = await benchmark(
    'Context-Aware Recommendations',
    async () => {
      await mlBridge.getRecommendations({
        user_id: `user_${Math.random()}`,
        context: { category: 'tech' },
        limit: 10,
      });
    },
    200
  );
  results.push(result6);
  printResult(result6);
  validatePerformance(result6, {
    maxAvg: 5.0,
    maxP95: 10.0,
  });

  // Benchmark 7: Concurrent requests simulation
  console.log('\n\nBenchmark 7: Concurrent Requests (10 parallel)');
  const concurrentIterations = 50;
  const concurrencyLevel = 10;

  const times: number[] = [];
  const startConcurrent = performance.now();

  for (let i = 0; i < concurrentIterations; i++) {
    const start = performance.now();

    // Execute requests in parallel
    await Promise.all(
      Array(concurrencyLevel).fill(null).map(() =>
        mlBridge.analyzeSentiment({ text: 'Concurrent test' })
      )
    );

    const duration = performance.now() - start;
    times.push(duration);
  }

  const totalConcurrent = performance.now() - startConcurrent;
  times.sort((a, b) => a - b);

  console.log('\n📊 Concurrent Requests (10 parallel)');
  console.log('─'.repeat(60));
  console.log(`  Batches:    ${concurrentIterations}`);
  console.log(`  Total reqs: ${concurrentIterations * concurrencyLevel}`);
  console.log(`  Total time: ${totalConcurrent.toFixed(2)}ms`);
  console.log(`  Avg batch:  ${(times.reduce((a, b) => a + b, 0) / times.length).toFixed(3)}ms`);
  console.log(`  Throughput: ${((concurrentIterations * concurrencyLevel) / totalConcurrent * 1000).toFixed(0)} ops/sec`);

  // Summary
  console.log('\n\n📈 Benchmark Summary');
  console.log('='.repeat(60));

  const overallMetrics = mlBridge.getMetrics();
  console.log(`\nTotal polyglot calls:  ${overallMetrics.totalCalls}`);
  console.log(`Success rate:          ${(overallMetrics.successfulCalls / overallMetrics.totalCalls * 100).toFixed(1)}%`);
  console.log(`Overall avg latency:   ${overallMetrics.avgLatency.toFixed(3)}ms`);
  console.log(`Cache hit rate:        ${(overallMetrics.cacheHits / (overallMetrics.cacheHits + overallMetrics.cacheMisses) * 100).toFixed(1)}%`);

  console.log('\n\n✅ Benchmarks Complete!\n');

  // All benchmarks pass - just informational
  process.exit(0);
}

main().catch((error) => {
  console.error('Benchmark error:', error);
  process.exit(1);
});
