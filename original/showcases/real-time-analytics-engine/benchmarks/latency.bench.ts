/**
 * Latency benchmark: Measure query response times.
 * Target: <100ms for analytics queries
 */

import { EventBuffer } from '../src/event-buffer';
import { Event } from '../bridge/dataframe-bridge';

interface LatencyResult {
  operation: string;
  samples: number;
  p50: number;
  p95: number;
  p99: number;
  mean: number;
  min: number;
  max: number;
}

function generateEvent(index: number): Event {
  const eventTypes = ['click', 'view', 'purchase', 'signup', 'logout'];
  const userIds = Array.from({ length: 1000 }, (_, i) => `user_${i}`);

  return {
    timestamp: Date.now() - (index * 1000), // Spread over time
    event_type: eventTypes[index % eventTypes.length],
    user_id: userIds[index % userIds.length],
    value: Math.random() * 100,
    metadata: {
      source: 'web'
    }
  };
}

function calculatePercentile(sortedValues: number[], percentile: number): number {
  const index = Math.ceil(sortedValues.length * percentile) - 1;
  return sortedValues[Math.max(0, index)];
}

function calculateStats(latencies: number[]): Omit<LatencyResult, 'operation' | 'samples'> {
  const sorted = [...latencies].sort((a, b) => a - b);
  return {
    p50: calculatePercentile(sorted, 0.50),
    p95: calculatePercentile(sorted, 0.95),
    p99: calculatePercentile(sorted, 0.99),
    mean: latencies.reduce((a, b) => a + b, 0) / latencies.length,
    min: sorted[0],
    max: sorted[sorted.length - 1]
  };
}

async function benchmarkOperation(
  name: string,
  operation: () => Promise<void>,
  iterations: number
): Promise<LatencyResult> {
  const latencies: number[] = [];

  console.log(`\nBenchmarking: ${name}`);
  console.log(`Iterations: ${iterations}`);

  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    await operation();
    const latency = Date.now() - start;
    latencies.push(latency);

    if ((i + 1) % 10 === 0) {
      process.stdout.write(`\r  Progress: ${i + 1}/${iterations}`);
    }
  }

  console.log(); // New line after progress

  return {
    operation: name,
    samples: iterations,
    ...calculateStats(latencies)
  };
}

function printLatencyResult(result: LatencyResult, target: number): void {
  console.log(`\nResults for: ${result.operation}`);
  console.log(`  Samples:    ${result.samples}`);
  console.log(`  Mean:       ${result.mean.toFixed(2)}ms`);
  console.log(`  P50:        ${result.p50.toFixed(2)}ms`);
  console.log(`  P95:        ${result.p95.toFixed(2)}ms`);
  console.log(`  P99:        ${result.p99.toFixed(2)}ms`);
  console.log(`  Min:        ${result.min.toFixed(2)}ms`);
  console.log(`  Max:        ${result.max.toFixed(2)}ms`);

  const targetMet = result.p95 < target;
  console.log(`  Target:     <${target}ms (P95)`);
  console.log(`  Status:     ${targetMet ? '✓ PASS' : '✗ FAIL'}`);
}

async function runLatencyBenchmarks(): Promise<void> {
  console.log('='.repeat(60));
  console.log('LATENCY BENCHMARK');
  console.log('='.repeat(60));
  console.log('Target: <100ms query latency (P95)');
  console.log('Testing various analytics operations');
  console.log();

  // Prepare test data
  console.log('Preparing test data (50,000 events)...');
  const buffer = new EventBuffer({
    maxSize: 100000,
    flushInterval: 60000,
    engine: 'polars'
  });

  const events: Event[] = [];
  for (let i = 0; i < 50000; i++) {
    events.push(generateEvent(i));
  }

  await buffer.addBatch(events);
  await buffer.flush();

  console.log('Test data ready!');

  const analytics = buffer.getAnalytics();
  const iterations = 50;
  const results: LatencyResult[] = [];

  // Benchmark: Basic aggregation
  results.push(await benchmarkOperation(
    'Basic Aggregation (group by event_type)',
    async () => {
      await analytics.computeAggregations(['event_type'], ['value']);
    },
    iterations
  ));

  // Benchmark: Windowed aggregation
  results.push(await benchmarkOperation(
    'Windowed Aggregation (1-minute windows)',
    async () => {
      await analytics.windowedAggregation({
        windowSize: '1m',
        groupBy: 'event_type',
        metric: 'value',
        aggFunc: 'sum'
      });
    },
    iterations
  ));

  // Benchmark: Percentile calculation
  results.push(await benchmarkOperation(
    'Percentile Calculation (P50, P95, P99)',
    async () => {
      await analytics.calculatePercentiles('value', [0.5, 0.95, 0.99]);
    },
    iterations
  ));

  // Benchmark: Top N query
  results.push(await benchmarkOperation(
    'Top N Query (top 10 users)',
    async () => {
      await analytics.topNByMetric('user_id', 'value', 10);
    },
    iterations
  ));

  // Benchmark: Anomaly detection
  results.push(await benchmarkOperation(
    'Anomaly Detection (z-score)',
    async () => {
      await analytics.detectAnomalies('value', 3.0);
    },
    iterations
  ));

  // Benchmark: Summary statistics
  results.push(await benchmarkOperation(
    'Summary Statistics',
    async () => {
      await analytics.getSummaryStats(['value']);
    },
    iterations
  ));

  // Print all results
  console.log('\n' + '='.repeat(60));
  console.log('DETAILED RESULTS');
  console.log('='.repeat(60));

  const target = 100; // 100ms target
  results.forEach(result => printLatencyResult(result, target));

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));

  const allP95 = results.map(r => r.p95);
  const avgP95 = allP95.reduce((a, b) => a + b, 0) / allP95.length;
  const maxP95 = Math.max(...allP95);
  const passCount = allP95.filter(p => p < target).length;

  console.log(`Average P95 latency: ${avgP95.toFixed(2)}ms`);
  console.log(`Maximum P95 latency: ${maxP95.toFixed(2)}ms`);
  console.log(`Operations under ${target}ms: ${passCount}/${results.length}`);

  if (passCount === results.length) {
    console.log('\n✓ ALL OPERATIONS MEET TARGET (<100ms)');
  } else {
    console.log(`\n✗ ${results.length - passCount} operation(s) exceeded target`);
  }

  // Comparison with microservices
  console.log('\n' + '='.repeat(60));
  console.log('MICROSERVICES COMPARISON');
  console.log('='.repeat(60));
  console.log('Traditional microservices architecture:');
  console.log('  API → JSON serialization → Network → Python service → JSON → API');
  console.log('  Typical overhead: 200-500ms (JSON + network)');
  console.log('');
  console.log('Elide polyglot architecture:');
  console.log('  API → Direct DataFrame access (zero-copy) → Results');
  console.log(`  Measured overhead: ${avgP95.toFixed(2)}ms`);
  console.log('');
  console.log(`Speedup: ${((300 / avgP95)).toFixed(1)}x faster than microservices`);
  console.log('  (assuming 300ms baseline for microservices)');
  console.log('='.repeat(60));

  buffer.stop();
}

// Run benchmarks
runLatencyBenchmarks().catch(console.error);
