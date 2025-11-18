/**
 * Cache functionality tests
 */

import { EmbeddingCache } from '../shared/cache';
import { Logger } from '../shared/utils';

function testBasicOperations() {
  Logger.info('\n=== Testing Basic Cache Operations ===');

  const cache = new EmbeddingCache(100, 60000);

  // Test set and get
  const embedding = Array(384).fill(0).map(() => Math.random());
  cache.set('test text', 'model-1', embedding);

  const retrieved = cache.get('test text', 'model-1');
  console.assert(retrieved !== undefined, 'Cache get failed');
  console.assert(retrieved!.length === embedding.length, 'Embedding length mismatch');
  Logger.info('✓ Set and get operations work');

  // Test cache miss
  const missing = cache.get('missing text', 'model-1');
  console.assert(missing === undefined, 'Cache should miss for non-existent key');
  Logger.info('✓ Cache miss works correctly');

  // Test model separation
  cache.set('test text', 'model-2', embedding);
  const model1 = cache.get('test text', 'model-1');
  const model2 = cache.get('test text', 'model-2');
  console.assert(model1 !== undefined && model2 !== undefined, 'Both models should be cached');
  Logger.info('✓ Model separation works');

  return true;
}

function testCacheStats() {
  Logger.info('\n=== Testing Cache Statistics ===');

  const cache = new EmbeddingCache(100, 60000);
  const embedding = Array(384).fill(0).map(() => Math.random());

  // Generate some hits and misses
  cache.set('text1', 'model', embedding);
  cache.set('text2', 'model', embedding);

  cache.get('text1', 'model'); // Hit
  cache.get('text1', 'model'); // Hit
  cache.get('text3', 'model'); // Miss
  cache.get('text2', 'model'); // Hit

  const stats = cache.getStats();
  console.assert(stats.hits === 3, 'Hit count incorrect');
  console.assert(stats.misses === 1, 'Miss count incorrect');
  console.assert(stats.hitRate === 0.75, 'Hit rate incorrect');
  console.assert(stats.size === 2, 'Cache size incorrect');

  Logger.info(`Cache stats: ${stats.hits} hits, ${stats.misses} misses, ${(stats.hitRate * 100).toFixed(1)}% hit rate`);
  Logger.info('✓ Cache statistics work correctly');

  return true;
}

function testLRUEviction() {
  Logger.info('\n=== Testing LRU Eviction ===');

  const cache = new EmbeddingCache(3, 60000); // Small cache
  const embedding = Array(384).fill(0).map(() => Math.random());

  // Fill cache
  cache.set('text1', 'model', embedding);
  cache.set('text2', 'model', embedding);
  cache.set('text3', 'model', embedding);

  const stats1 = cache.getStats();
  console.assert(stats1.size === 3, 'Cache should be full');

  // Access text1 to make it recently used
  cache.get('text1', 'model');

  // Add new item (should evict text2, the least recently used)
  cache.set('text4', 'model', embedding);

  const stats2 = cache.getStats();
  console.assert(stats2.size === 3, 'Cache should still be at max size');
  console.assert(cache.has('text1', 'model'), 'Recently accessed item should remain');
  console.assert(!cache.has('text2', 'model'), 'LRU item should be evicted');
  console.assert(cache.has('text4', 'model'), 'New item should be cached');

  Logger.info('✓ LRU eviction works correctly');

  return true;
}

function testCachePerformance() {
  Logger.info('\n=== Testing Cache Performance ===');

  const cache = new EmbeddingCache(10000, 60000);
  const embedding = Array(384).fill(0).map(() => Math.random());

  // Benchmark set operations
  const setStart = performance.now();
  for (let i = 0; i < 1000; i++) {
    cache.set(`text${i}`, 'model', embedding);
  }
  const setTime = performance.now() - setStart;

  // Benchmark get operations
  const getStart = performance.now();
  for (let i = 0; i < 1000; i++) {
    cache.get(`text${i}`, 'model');
  }
  const getTime = performance.now() - getStart;

  Logger.info(`1000 set operations: ${setTime.toFixed(2)}ms (${(setTime / 1000).toFixed(4)}ms avg)`);
  Logger.info(`1000 get operations: ${getTime.toFixed(2)}ms (${(getTime / 1000).toFixed(4)}ms avg)`);

  console.assert(setTime / 1000 < 1, 'Set operation too slow');
  console.assert(getTime / 1000 < 1, 'Get operation too slow');

  Logger.info('✓ Cache performance acceptable');

  return true;
}

function runAllTests() {
  Logger.info('Starting cache tests...');

  try {
    testBasicOperations();
    testCacheStats();
    testLRUEviction();
    testCachePerformance();

    Logger.info('\n=== All Cache Tests Passed ===');
    process.exit(0);
  } catch (error) {
    Logger.error('\n=== Test Failed ===');
    Logger.error(String(error));
    process.exit(1);
  }
}

runAllTests();
