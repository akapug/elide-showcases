/**
 * Performance benchmarks for embedding service
 * Validates <10ms single, <50ms batch-100 requirements
 */

import { EmbeddingService } from '../api/embedding-service';
import { formatDuration, Logger } from '../shared/utils';

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
}

function calculatePercentile(times: number[], percentile: number): number {
  const sorted = [...times].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index];
}

async function benchmarkSingleEmbedding(service: EmbeddingService, iterations: number = 100): Promise<BenchmarkResult> {
  Logger.info(`\nBenchmarking single text embedding (${iterations} iterations)...`);

  const times: number[] = [];
  const text = 'Sample text for benchmarking single embedding performance';

  // Warmup
  for (let i = 0; i < 10; i++) {
    await service.encodeText([text]);
  }

  // Benchmark
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await service.encodeText([text]);
    times.push(performance.now() - start);
  }

  const totalTime = times.reduce((a, b) => a + b, 0);
  const avgTime = totalTime / iterations;

  const result: BenchmarkResult = {
    name: 'Single Embedding',
    iterations,
    totalTime,
    avgTime,
    minTime: Math.min(...times),
    maxTime: Math.max(...times),
    p50: calculatePercentile(times, 50),
    p95: calculatePercentile(times, 95),
    p99: calculatePercentile(times, 99),
  };

  Logger.info(`  Average: ${formatDuration(result.avgTime)}`);
  Logger.info(`  Min: ${formatDuration(result.minTime)}, Max: ${formatDuration(result.maxTime)}`);
  Logger.info(`  P50: ${formatDuration(result.p50)}, P95: ${formatDuration(result.p95)}, P99: ${formatDuration(result.p99)}`);

  if (result.avgTime < 10) {
    Logger.info(`  ✓ Meets <10ms requirement`);
  } else {
    Logger.warn(`  ⚠ Exceeds 10ms target (${formatDuration(result.avgTime)})`);
  }

  return result;
}

async function benchmarkBatchEmbedding(
  service: EmbeddingService,
  batchSize: number,
  iterations: number = 20
): Promise<BenchmarkResult> {
  Logger.info(`\nBenchmarking batch embedding (size: ${batchSize}, ${iterations} iterations)...`);

  const times: number[] = [];
  const texts = Array(batchSize).fill(0).map((_, i) => `Sample text ${i} for batch benchmarking`);

  // Warmup
  for (let i = 0; i < 3; i++) {
    await service.encodeTextBatch(texts);
  }

  // Benchmark
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await service.encodeTextBatch(texts);
    times.push(performance.now() - start);
  }

  const totalTime = times.reduce((a, b) => a + b, 0);
  const avgTime = totalTime / iterations;
  const avgTimePerItem = avgTime / batchSize;

  const result: BenchmarkResult = {
    name: `Batch-${batchSize} Embedding`,
    iterations,
    totalTime,
    avgTime,
    minTime: Math.min(...times),
    maxTime: Math.max(...times),
    p50: calculatePercentile(times, 50),
    p95: calculatePercentile(times, 95),
    p99: calculatePercentile(times, 99),
  };

  Logger.info(`  Average: ${formatDuration(result.avgTime)} (${formatDuration(avgTimePerItem)} per item)`);
  Logger.info(`  Min: ${formatDuration(result.minTime)}, Max: ${formatDuration(result.maxTime)}`);
  Logger.info(`  P50: ${formatDuration(result.p50)}, P95: ${formatDuration(result.p95)}, P99: ${formatDuration(result.p99)}`);

  if (batchSize === 100 && result.avgTime < 50) {
    Logger.info(`  ✓ Meets <50ms requirement for batch-100`);
  } else if (batchSize === 100) {
    Logger.warn(`  ⚠ Exceeds 50ms target (${formatDuration(result.avgTime)})`);
  }

  return result;
}

async function benchmarkThroughput(service: EmbeddingService): Promise<void> {
  Logger.info('\nBenchmarking throughput...');

  const texts = Array(1000).fill(0).map((_, i) => `Sample text ${i}`);

  const start = performance.now();
  await service.encodeTextBatch(texts);
  const elapsed = performance.now() - start;

  const throughput = 1000 / (elapsed / 1000);

  Logger.info(`  1000 embeddings: ${formatDuration(elapsed)}`);
  Logger.info(`  Throughput: ${throughput.toFixed(0)} embeddings/second`);
}

async function benchmarkDifferentSizes(service: EmbeddingService): Promise<void> {
  Logger.info('\nBenchmarking different batch sizes...');

  const sizes = [1, 10, 50, 100, 200, 500];

  for (const size of sizes) {
    const texts = Array(size).fill(0).map((_, i) => `Text ${i}`);

    const start = performance.now();
    await service.encodeTextBatch(texts);
    const elapsed = performance.now() - start;
    const perItem = elapsed / size;

    Logger.info(`  Batch-${size.toString().padStart(3)}: ${formatDuration(elapsed)} (${formatDuration(perItem)} per item)`);
  }
}

async function runAllBenchmarks() {
  Logger.info('=== Embeddings Performance Benchmarks ===');
  Logger.info('Target: <10ms single, <50ms batch-100\n');

  const service = new EmbeddingService();
  const results: BenchmarkResult[] = [];

  try {
    // Single embedding benchmark
    results.push(await benchmarkSingleEmbedding(service, 100));

    // Batch embedding benchmarks
    results.push(await benchmarkBatchEmbedding(service, 10, 50));
    results.push(await benchmarkBatchEmbedding(service, 50, 30));
    results.push(await benchmarkBatchEmbedding(service, 100, 20));
    results.push(await benchmarkBatchEmbedding(service, 500, 10));

    // Throughput test
    await benchmarkThroughput(service);

    // Different sizes
    await benchmarkDifferentSizes(service);

    // Summary
    Logger.info('\n=== Benchmark Summary ===');
    results.forEach(r => {
      Logger.info(`${r.name}: ${formatDuration(r.avgTime)} avg (P95: ${formatDuration(r.p95)})`);
    });

    Logger.info('\n=== Benchmarks Complete ===');
    process.exit(0);
  } catch (error) {
    Logger.error('Benchmark failed:', error);
    process.exit(1);
  }
}

runAllBenchmarks();
