/**
 * Batch processing efficiency benchmarks
 * Demonstrates performance improvements from batching
 */

import { EmbeddingService } from '../api/embedding-service';
import { formatDuration, Logger } from '../shared/utils';

async function benchmarkSequentialVsBatch(service: EmbeddingService, count: number): Promise<void> {
  Logger.info(`\n=== Sequential vs Batch (${count} items) ===`);

  const texts = Array(count).fill(0).map((_, i) => `Sample text ${i} for comparison`);

  // Sequential processing
  Logger.info('Testing sequential processing...');
  const seqStart = performance.now();
  for (const text of texts) {
    await service.encodeText([text]);
  }
  const seqTime = performance.now() - seqStart;

  // Batch processing
  Logger.info('Testing batch processing...');
  const batchStart = performance.now();
  await service.encodeTextBatch(texts);
  const batchTime = performance.now() - batchStart;

  // Results
  const speedup = seqTime / batchTime;
  const efficiency = (speedup - 1) * 100;

  Logger.info(`\nResults:`);
  Logger.info(`  Sequential: ${formatDuration(seqTime)} (${formatDuration(seqTime / count)} per item)`);
  Logger.info(`  Batch: ${formatDuration(batchTime)} (${formatDuration(batchTime / count)} per item)`);
  Logger.info(`  Speedup: ${speedup.toFixed(2)}x`);
  Logger.info(`  Efficiency gain: ${efficiency.toFixed(1)}%`);
}

async function benchmarkBatchSizeOptimization(service: EmbeddingService): Promise<void> {
  Logger.info('\n=== Batch Size Optimization ===');

  const totalItems = 1000;
  const batchSizes = [1, 10, 32, 64, 128, 256, 512];

  Logger.info(`Processing ${totalItems} items with different batch sizes:\n`);

  for (const batchSize of batchSizes) {
    const texts = Array(totalItems).fill(0).map((_, i) => `Text ${i}`);
    const batches = Math.ceil(totalItems / batchSize);

    const start = performance.now();

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      await service.encodeTextBatch(batch);
    }

    const elapsed = performance.now() - start;
    const perItem = elapsed / totalItems;
    const throughput = totalItems / (elapsed / 1000);

    Logger.info(`  Batch size ${batchSize.toString().padStart(3)}: ${formatDuration(elapsed)} (${batches} batches, ${throughput.toFixed(0)} items/s)`);
  }
}

async function benchmarkMemoryEfficiency(service: EmbeddingService): Promise<void> {
  Logger.info('\n=== Memory Efficiency ===');

  const sizes = [100, 500, 1000, 2000];

  for (const size of sizes) {
    const before = process.memoryUsage();
    const texts = Array(size).fill(0).map((_, i) => `Text ${i}`);

    const start = performance.now();
    const result = await service.encodeTextBatch(texts);
    const elapsed = performance.now() - start;

    const after = process.memoryUsage();
    const memDelta = (after.heapUsed - before.heapUsed) / 1024 / 1024;
    const embeddingSize = size * result.dimensions * 8; // 8 bytes per float64
    const embeddingSizeMB = embeddingSize / 1024 / 1024;

    Logger.info(`\n  ${size} items:`);
    Logger.info(`    Time: ${formatDuration(elapsed)}`);
    Logger.info(`    Memory delta: ${memDelta.toFixed(2)}MB`);
    Logger.info(`    Embedding data: ${embeddingSizeMB.toFixed(2)}MB`);
    Logger.info(`    Overhead: ${((memDelta / embeddingSizeMB - 1) * 100).toFixed(1)}%`);
  }
}

async function benchmarkCacheImpact(service: EmbeddingService): Promise<void> {
  Logger.info('\n=== Cache Impact on Performance ===');

  const texts = Array(100).fill(0).map((_, i) => `Repeated text ${i % 10}`);

  // First pass (cold cache)
  Logger.info('First pass (cold cache)...');
  const coldStart = performance.now();
  for (const text of texts) {
    await service.encodeText([text]);
  }
  const coldTime = performance.now() - coldStart;

  // Second pass (warm cache - note: cache is in the API layer, not service)
  Logger.info('Second pass (would use cache in API layer)...');
  const warmStart = performance.now();
  for (const text of texts) {
    await service.encodeText([text]);
  }
  const warmTime = performance.now() - warmStart;

  Logger.info(`\nResults:`);
  Logger.info(`  Cold cache: ${formatDuration(coldTime)}`);
  Logger.info(`  Warm cache: ${formatDuration(warmTime)}`);
  Logger.info(`  Note: Cache is implemented in API layer, not service layer`);
}

async function runAllBenchmarks() {
  Logger.info('=== Batch Processing Efficiency Benchmarks ===\n');

  const service = new EmbeddingService();

  try {
    await benchmarkSequentialVsBatch(service, 50);
    await benchmarkBatchSizeOptimization(service);
    await benchmarkMemoryEfficiency(service);
    await benchmarkCacheImpact(service);

    Logger.info('\n=== Benchmarks Complete ===');
    process.exit(0);
  } catch (error) {
    Logger.error('Benchmark failed:', error);
    process.exit(1);
  }
}

runAllBenchmarks();
