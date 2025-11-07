/**
 * ElideHTML - Cache Tests
 */

import { assertEquals, assert } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { FragmentCache, cacheKey, cacheTags } from '../runtime/cache.ts';

Deno.test('FragmentCache - basic set and get', () => {
  const cache = new FragmentCache();
  cache.set('key1', '<div>content</div>');

  const result = cache.get('key1');
  assertEquals(result, '<div>content</div>');
});

Deno.test('FragmentCache - cache miss', () => {
  const cache = new FragmentCache();
  const result = cache.get('nonexistent');
  assertEquals(result, undefined);
});

Deno.test('FragmentCache - TTL expiration', async () => {
  const cache = new FragmentCache();
  cache.set('key1', '<div>content</div>', 100); // 100ms TTL

  // Should exist immediately
  assertEquals(cache.get('key1'), '<div>content</div>');

  // Wait for expiration
  await new Promise((resolve) => setTimeout(resolve, 150));

  // Should be expired
  assertEquals(cache.get('key1'), undefined);
});

Deno.test('FragmentCache - delete', () => {
  const cache = new FragmentCache();
  cache.set('key1', '<div>content</div>');

  assertEquals(cache.delete('key1'), true);
  assertEquals(cache.get('key1'), undefined);
  assertEquals(cache.delete('key1'), false);
});

Deno.test('FragmentCache - has', () => {
  const cache = new FragmentCache();
  cache.set('key1', '<div>content</div>');

  assertEquals(cache.has('key1'), true);
  assertEquals(cache.has('key2'), false);
});

Deno.test('FragmentCache - clear', () => {
  const cache = new FragmentCache();
  cache.set('key1', '<div>1</div>');
  cache.set('key2', '<div>2</div>');

  cache.clear();

  assertEquals(cache.get('key1'), undefined);
  assertEquals(cache.get('key2'), undefined);
});

Deno.test('FragmentCache - stats', () => {
  const cache = new FragmentCache();

  cache.set('key1', '<div>content</div>');
  cache.get('key1');
  cache.get('key1');
  cache.get('nonexistent');

  const stats = cache.getStats();

  assertEquals(stats.entries, 1);
  assertEquals(stats.hits, 2);
  assertEquals(stats.misses, 1);
  assertEquals(stats.hitRate, 2 / 3);
});

Deno.test('FragmentCache - LRU eviction', () => {
  const cache = new FragmentCache({ maxEntries: 3 });

  cache.set('key1', '<div>1</div>');
  cache.set('key2', '<div>2</div>');
  cache.set('key3', '<div>3</div>');

  // Access key1 to make it recently used
  cache.get('key1');

  // Add key4, should evict key2 (least recently used)
  cache.set('key4', '<div>4</div>');

  assertEquals(cache.get('key1'), '<div>1</div>');
  assertEquals(cache.get('key2'), undefined);
  assertEquals(cache.get('key3'), '<div>3</div>');
  assertEquals(cache.get('key4'), '<div>4</div>');
});

Deno.test('FragmentCache - size limits', () => {
  const cache = new FragmentCache({ maxSize: 1000 });

  const content = 'x'.repeat(100);
  for (let i = 0; i < 20; i++) {
    cache.set(`key${i}`, content);
  }

  const stats = cache.getStats();
  assert(stats.totalSize <= 1000);
});

Deno.test('CacheKeyBuilder - simple key', () => {
  const key = cacheKey().add('page', 'home').add('lang', 'en').build();

  assertEquals(key, 'page:home|lang:en');
});

Deno.test('CacheKeyBuilder - params', () => {
  const key = cacheKey().params({ page: 1, limit: 10 }).build();

  assertEquals(key, 'page:1|limit:10');
});

Deno.test('CacheTags - tagging and retrieval', () => {
  const tags = new cacheTags.constructor();

  tags.tag('post-1', 'posts', 'user-123');
  tags.tag('post-2', 'posts', 'user-123');
  tags.tag('post-3', 'posts');

  const postKeys = tags.getKeys('posts');
  assertEquals(postKeys.length, 3);
  assert(postKeys.includes('post-1'));
  assert(postKeys.includes('post-2'));
  assert(postKeys.includes('post-3'));
});

Deno.test('CacheTags - invalidation', () => {
  const cache = new FragmentCache();
  const tags = new cacheTags.constructor();

  cache.set('post-1', '<div>Post 1</div>');
  cache.set('post-2', '<div>Post 2</div>');
  cache.set('post-3', '<div>Post 3</div>');

  tags.tag('post-1', 'posts');
  tags.tag('post-2', 'posts');
  tags.tag('post-3', 'other');

  // Invalidate all posts
  tags.invalidate('posts');

  assertEquals(cache.get('post-1'), undefined);
  assertEquals(cache.get('post-2'), undefined);
  assertEquals(cache.get('post-3'), '<div>Post 3</div>');
});

Deno.test('FragmentCache - performance', () => {
  const cache = new FragmentCache();
  const content = '<div>cached content</div>';

  // Warm up
  cache.set('test', content);
  cache.get('test');

  // Benchmark
  const iterations = 100000;
  const start = performance.now();

  for (let i = 0; i < iterations; i++) {
    cache.get('test');
  }

  const duration = performance.now() - start;
  const opsPerSec = (iterations / duration) * 1000;

  console.log(`Cache reads: ${opsPerSec.toFixed(0)} ops/sec`);
  console.log(`Average: ${(duration / iterations).toFixed(6)}ms per read`);

  assert(opsPerSec > 100000); // Should be very fast
});
