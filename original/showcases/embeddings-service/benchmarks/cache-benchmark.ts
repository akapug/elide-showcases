/**
 * Cache performance benchmarks
 */

import { EmbeddingCache } from '../shared/cache';
import { formatDuration, formatBytes, Logger } from '../shared/utils';

function benchmarkCacheOperations(): void {
  Logger.info('\n=== Cache Operations Benchmark ===');

  const cache = new EmbeddingCache(100000, 3600000);
  const embedding = Array(384).fill(0).map(() => Math.random());

  // Benchmark set operations
  const setIterations = 10000;
  const setStart = performance.now();
  for (let i = 0; i < setIterations; i++) {
    cache.set(`text${i}`, 'model', embedding);
  }
  const setTime = performance.now() - setStart;

  // Benchmark get operations (hits)
  const getStart = performance.now();
  for (let i = 0; i < setIterations; i++) {
    cache.get(`text${i}`, 'model');
  }
  const getTime = performance.now() - getStart;

  // Benchmark get operations (misses)
  const missStart = performance.now();
  for (let i = 0; i < 1000; i++) {
    cache.get(`missing${i}`, 'model');
  }
  const missTime = performance.now() - missStart;

  Logger.info(`Set operations:`);
  Logger.info(`  ${setIterations} operations: ${formatDuration(setTime)}`);
  Logger.info(`  Average: ${formatDuration(setTime / setIterations)}`);

  Logger.info(`\nGet operations (hits):`);
  Logger.info(`  ${setIterations} operations: ${formatDuration(getTime)}`);
  Logger.info(`  Average: ${formatDuration(getTime / setIterations)}`);

  Logger.info(`\nGet operations (misses):`);
  Logger.info(`  1000 operations: ${formatDuration(missTime)}`);
  Logger.info(`  Average: ${formatDuration(missTime / 1000)}`);
}

function benchmarkCacheSize(): void {
  Logger.info('\n=== Cache Size Impact ===');

  const sizes = [100, 1000, 10000, 100000];
  const embedding = Array(384).fill(0).map(() => Math.random());

  for (const size of sizes) {
    const cache = new EmbeddingCache(size, 3600000);

    // Fill cache
    const fillStart = performance.now();
    for (let i = 0; i < size; i++) {
      cache.set(`text${i}`, 'model', embedding);
    }
    const fillTime = performance.now() - fillStart;

    // Test retrieval
    const getStart = performance.now();
    for (let i = 0; i < Math.min(1000, size); i++) {
      cache.get(`text${i}`, 'model');
    }
    const getTime = performance.now() - getStart;

    // Estimate memory usage
    const itemSize = embedding.length * 8 + 100; // 8 bytes per number + overhead
    const estimatedMem = size * itemSize;

    Logger.info(`\nCache size: ${size}`);
    Logger.info(`  Fill time: ${formatDuration(fillTime)} (${formatDuration(fillTime / size)} per item)`);
    Logger.info(`  Get time: ${formatDuration(getTime / Math.min(1000, size))} per item`);
    Logger.info(`  Estimated memory: ${formatBytes(estimatedMem)}`);
  }
}

function benchmarkHitRate(): void {
  Logger.info('\n=== Cache Hit Rate Scenarios ===');

  const cache = new EmbeddingCache(1000, 3600000);
  const embedding = Array(384).fill(0).map(() => Math.random());

  // Scenario 1: Random access pattern (low hit rate)
  Logger.info('\nScenario 1: Random access (low hit rate)');
  cache.clear();
  const random1Start = performance.now();
  for (let i = 0; i < 10000; i++) {
    const key = `text${Math.floor(Math.random() * 5000)}`;
    const cached = cache.get(key, 'model');
    if (!cached) {
      cache.set(key, 'model', embedding);
    }
  }
  const random1Time = performance.now() - random1Start;
  const stats1 = cache.getStats();
  Logger.info(`  Time: ${formatDuration(random1Time)}`);
  Logger.info(`  Hit rate: ${(stats1.hitRate * 100).toFixed(1)}%`);

  // Scenario 2: Repeated access pattern (high hit rate)
  Logger.info('\nScenario 2: Repeated access (high hit rate)');
  cache.clear();
  // Seed cache
  for (let i = 0; i < 100; i++) {
    cache.set(`popular${i}`, 'model', embedding);
  }
  const random2Start = performance.now();
  for (let i = 0; i < 10000; i++) {
    const key = `popular${Math.floor(Math.random() * 100)}`;
    cache.get(key, 'model');
  }
  const random2Time = performance.now() - random2Start;
  const stats2 = cache.getStats();
  Logger.info(`  Time: ${formatDuration(random2Time)}`);
  Logger.info(`  Hit rate: ${(stats2.hitRate * 100).toFixed(1)}%`);
  Logger.info(`  Speedup: ${(random1Time / random2Time).toFixed(2)}x`);

  // Scenario 3: Working set pattern (zipf distribution)
  Logger.info('\nScenario 3: Working set (80/20 rule)');
  cache.clear();
  const random3Start = performance.now();
  for (let i = 0; i < 10000; i++) {
    // 80% access to 20% of keys
    const key = Math.random() < 0.8
      ? `popular${Math.floor(Math.random() * 200)}`
      : `text${Math.floor(Math.random() * 1000)}`;
    const cached = cache.get(key, 'model');
    if (!cached) {
      cache.set(key, 'model', embedding);
    }
  }
  const random3Time = performance.now() - random3Start;
  const stats3 = cache.getStats();
  Logger.info(`  Time: ${formatDuration(random3Time)}`);
  Logger.info(`  Hit rate: ${(stats3.hitRate * 100).toFixed(1)}%`);
}

function benchmarkTTL(): void {
  Logger.info('\n=== TTL Performance Impact ===');

  const embedding = Array(384).fill(0).map(() => Math.random());
  const operations = 1000;

  const ttls = [60000, 300000, 3600000, 86400000]; // 1min, 5min, 1hr, 1day

  for (const ttl of ttls) {
    const cache = new EmbeddingCache(10000, ttl);

    const start = performance.now();
    for (let i = 0; i < operations; i++) {
      cache.set(`text${i}`, 'model', embedding);
      cache.get(`text${i}`, 'model');
    }
    const elapsed = performance.now() - start;

    Logger.info(`  TTL ${(ttl / 60000).toFixed(0)}min: ${formatDuration(elapsed)} (${formatDuration(elapsed / operations)} per op)`);
  }
}

function runAllBenchmarks() {
  Logger.info('=== Cache Performance Benchmarks ===');

  try {
    benchmarkCacheOperations();
    benchmarkCacheSize();
    benchmarkHitRate();
    benchmarkTTL();

    Logger.info('\n=== Benchmarks Complete ===');
    process.exit(0);
  } catch (error) {
    Logger.error('Benchmark failed:', error);
    process.exit(1);
  }
}

runAllBenchmarks();
