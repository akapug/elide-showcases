/**
 * Throughput benchmark: Measure events/sec ingestion capacity.
 * Target: 50K+ events/sec
 */

import { EventBuffer } from '../src/event-buffer';
import { Event } from '../bridge/dataframe-bridge';

interface BenchmarkResult {
  totalEvents: number;
  durationMs: number;
  throughputPerSec: number;
  avgLatencyMs: number;
  memoryUsageMB: number;
}

function generateEvent(index: number): Event {
  const eventTypes = ['click', 'view', 'purchase', 'signup', 'logout'];
  const userIds = Array.from({ length: 1000 }, (_, i) => `user_${i}`);

  return {
    timestamp: Date.now(),
    event_type: eventTypes[index % eventTypes.length],
    user_id: userIds[index % userIds.length],
    value: Math.random() * 100,
    metadata: {
      source: 'web',
      session_id: `session_${Math.floor(index / 100)}`
    }
  };
}

async function benchmarkThroughput(
  eventCount: number,
  batchSize: number,
  engine: 'pandas' | 'polars'
): Promise<BenchmarkResult> {
  console.log(`\nBenchmarking ${engine} engine...`);
  console.log(`Events: ${eventCount.toLocaleString()}, Batch size: ${batchSize}`);

  const buffer = new EventBuffer({
    maxSize: batchSize * 2,
    flushInterval: 10000, // Don't auto-flush during benchmark
    engine
  });

  const startMemory = process.memoryUsage().heapUsed;
  const startTime = Date.now();

  let processedEvents = 0;
  const latencies: number[] = [];

  // Process events in batches
  for (let i = 0; i < eventCount; i += batchSize) {
    const batch: Event[] = [];
    const batchStart = Date.now();

    for (let j = 0; j < batchSize && i + j < eventCount; j++) {
      batch.push(generateEvent(i + j));
    }

    await buffer.addBatch(batch);
    await buffer.flush(); // Flush each batch to analytics engine

    const batchLatency = Date.now() - batchStart;
    latencies.push(batchLatency);

    processedEvents += batch.length;

    if (processedEvents % 10000 === 0) {
      const elapsed = (Date.now() - startTime) / 1000;
      const throughput = Math.round(processedEvents / elapsed);
      process.stdout.write(`\r  Processed: ${processedEvents.toLocaleString()} | Throughput: ${throughput.toLocaleString()}/sec`);
    }
  }

  const endTime = Date.now();
  const endMemory = process.memoryUsage().heapUsed;

  const durationMs = endTime - startTime;
  const throughputPerSec = (processedEvents / durationMs) * 1000;
  const avgLatencyMs = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const memoryUsageMB = (endMemory - startMemory) / 1024 / 1024;

  buffer.stop();

  console.log(); // New line after progress

  return {
    totalEvents: processedEvents,
    durationMs,
    throughputPerSec,
    avgLatencyMs,
    memoryUsageMB
  };
}

function printResults(engine: string, result: BenchmarkResult): void {
  console.log(`\n${engine.toUpperCase()} Results:`);
  console.log(`  Total events:      ${result.totalEvents.toLocaleString()}`);
  console.log(`  Duration:          ${(result.durationMs / 1000).toFixed(2)}s`);
  console.log(`  Throughput:        ${Math.round(result.throughputPerSec).toLocaleString()} events/sec`);
  console.log(`  Avg batch latency: ${result.avgLatencyMs.toFixed(2)}ms`);
  console.log(`  Memory usage:      ${result.memoryUsageMB.toFixed(2)}MB`);

  const targetThroughput = 50000;
  const achievement = (result.throughputPerSec / targetThroughput) * 100;
  console.log(`  Target achievement: ${achievement.toFixed(1)}% (target: 50K/sec)`);

  if (result.throughputPerSec >= targetThroughput) {
    console.log(`  ✓ Target ACHIEVED`);
  } else {
    console.log(`  ✗ Target MISSED`);
  }
}

async function runBenchmarks(): Promise<void> {
  console.log('='.repeat(60));
  console.log('THROUGHPUT BENCHMARK');
  console.log('='.repeat(60));
  console.log('Target: 50,000 events/sec');
  console.log('Measuring ingestion + analytics processing throughput');
  console.log();

  const eventCount = 100000; // 100K events
  const batchSize = 1000;

  // Benchmark Polars (expected to be faster)
  const polarsResult = await benchmarkThroughput(eventCount, batchSize, 'polars');
  printResults('Polars', polarsResult);

  // Benchmark Pandas
  const pandasResult = await benchmarkThroughput(eventCount, batchSize, 'pandas');
  printResults('Pandas', pandasResult);

  // Comparison
  console.log('\n' + '='.repeat(60));
  console.log('COMPARISON');
  console.log('='.repeat(60));

  const speedup = polarsResult.throughputPerSec / pandasResult.throughputPerSec;
  console.log(`Polars speedup: ${speedup.toFixed(2)}x faster than Pandas`);

  const memoryReduction = ((pandasResult.memoryUsageMB - polarsResult.memoryUsageMB) / pandasResult.memoryUsageMB) * 100;
  console.log(`Memory efficiency: ${memoryReduction.toFixed(1)}% less memory with Polars`);

  console.log('\n' + '='.repeat(60));
  console.log('ELIDE ADVANTAGE');
  console.log('='.repeat(60));
  console.log('Zero-copy DataFrame sharing eliminates serialization overhead');
  console.log('Traditional microservices approach would require:');
  console.log('  - JSON serialization/deserialization');
  console.log('  - Network transfer overhead');
  console.log('  - 10-100x slower performance');
  console.log('');
  console.log('Elide enables direct memory access between TypeScript and Python');
  console.log('Result: Native performance with polyglot flexibility');
  console.log('='.repeat(60));
}

// Run benchmarks
runBenchmarks().catch(console.error);
