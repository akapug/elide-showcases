/**
 * Caching Tests
 *
 * Comprehensive tests for edge caching functionality including:
 * - Cache hit/miss scenarios
 * - TTL and expiration
 * - Cache invalidation
 * - Cache key generation
 * - Stale-while-revalidate
 * - Cache tags
 */

import Cache from '../storage/cache';
import KVStore from '../storage/kv-store';

interface CacheTestResult {
  passed: number;
  failed: number;
  total: number;
}

/**
 * Test cache basic operations
 */
async function testCacheBasics(): Promise<boolean> {
  console.log('Test 1: Cache basic operations');

  try {
    const cache = new Cache({ maxSize: 100, defaultTTL: 300 });

    // Test set and get
    await cache.set('key1', 'value1');
    const value1 = await cache.get('key1');

    if (value1 !== 'value1') {
      throw new Error('Cache get failed');
    }

    // Test overwrite
    await cache.set('key1', 'value2');
    const value2 = await cache.get('key1');

    if (value2 !== 'value2') {
      throw new Error('Cache overwrite failed');
    }

    // Test delete
    await cache.delete('key1');
    const value3 = await cache.get('key1');

    if (value3 !== null) {
      throw new Error('Cache delete failed');
    }

    console.log('✓ Basic operations passed\n');
    return true;
  } catch (error: any) {
    console.error('✗ Basic operations failed:', error.message, '\n');
    return false;
  }
}

/**
 * Test cache TTL
 */
async function testCacheTTL(): Promise<boolean> {
  console.log('Test 2: Cache TTL');

  try {
    const cache = new Cache({ maxSize: 100, defaultTTL: 1 });

    // Set with short TTL
    await cache.set('short-lived', 'data', { ttl: 1 });

    // Should exist immediately
    const immediate = await cache.get('short-lived');
    if (immediate !== 'data') {
      throw new Error('Cache immediate get failed');
    }

    // Wait for expiration
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Should be expired
    const expired = await cache.get('short-lived');
    if (expired !== null) {
      throw new Error('Cache TTL expiration failed');
    }

    console.log('✓ TTL test passed\n');
    return true;
  } catch (error: any) {
    console.error('✗ TTL test failed:', error.message, '\n');
    return false;
  }
}

/**
 * Test cache hit/miss ratio
 */
async function testCacheHitRate(): Promise<boolean> {
  console.log('Test 3: Cache hit rate');

  try {
    const cache = new Cache({ maxSize: 100, defaultTTL: 300 });

    // Populate cache
    for (let i = 0; i < 10; i++) {
      await cache.set(`key${i}`, `value${i}`);
    }

    // Mix of hits and misses
    const keys = [
      'key1', 'key2', 'key3', // hits
      'missing1', 'missing2', // misses
      'key4', 'key5', // hits
      'missing3', // miss
      'key6', 'key7', // hits
    ];

    for (const key of keys) {
      await cache.get(key);
    }

    const stats = cache.getStats();
    const hitRate = stats.hits / (stats.hits + stats.misses);

    console.log(`  Hits: ${stats.hits}`);
    console.log(`  Misses: ${stats.misses}`);
    console.log(`  Hit rate: ${(hitRate * 100).toFixed(1)}%`);

    if (stats.hits !== 7 || stats.misses !== 3) {
      throw new Error('Hit/miss counting incorrect');
    }

    console.log('✓ Hit rate test passed\n');
    return true;
  } catch (error: any) {
    console.error('✗ Hit rate test failed:', error.message, '\n');
    return false;
  }
}

/**
 * Test cache eviction (LRU)
 */
async function testCacheEviction(): Promise<boolean> {
  console.log('Test 4: Cache eviction (LRU)');

  try {
    const cache = new Cache({ maxSize: 5, defaultTTL: 300 });

    // Fill cache to capacity
    for (let i = 0; i < 5; i++) {
      await cache.set(`key${i}`, `value${i}`);
    }

    // Access key0 to make it recently used
    await cache.get('key0');

    // Add new item (should evict key1, not key0)
    await cache.set('key5', 'value5');

    const key0 = await cache.get('key0');
    const key1 = await cache.get('key1');

    if (key0 === null) {
      throw new Error('LRU evicted wrong item (key0)');
    }

    if (key1 !== null) {
      throw new Error('LRU did not evict least recently used (key1)');
    }

    console.log('✓ LRU eviction test passed\n');
    return true;
  } catch (error: any) {
    console.error('✗ LRU eviction test failed:', error.message, '\n');
    return false;
  }
}

/**
 * Test cache tags
 */
async function testCacheTags(): Promise<boolean> {
  console.log('Test 5: Cache tags');

  try {
    const cache = new Cache({ maxSize: 100, defaultTTL: 300 });

    // Set items with tags
    await cache.set('product:1', { name: 'Item 1' }, { tags: ['products', 'featured'] });
    await cache.set('product:2', { name: 'Item 2' }, { tags: ['products'] });
    await cache.set('product:3', { name: 'Item 3' }, { tags: ['products', 'featured'] });
    await cache.set('user:1', { name: 'User 1' }, { tags: ['users'] });

    // Invalidate by tag
    await cache.invalidateTag('featured');

    // Check results
    const product1 = await cache.get('product:1');
    const product2 = await cache.get('product:2');
    const user1 = await cache.get('user:1');

    if (product1 !== null) {
      throw new Error('Tagged item not invalidated (product:1)');
    }

    if (product2 === null) {
      throw new Error('Untagged item was invalidated (product:2)');
    }

    if (user1 === null) {
      throw new Error('Different tag invalidated (user:1)');
    }

    console.log('✓ Cache tags test passed\n');
    return true;
  } catch (error: any) {
    console.error('✗ Cache tags test failed:', error.message, '\n');
    return false;
  }
}

/**
 * Test cache key patterns
 */
async function testCacheKeyPatterns(): Promise<boolean> {
  console.log('Test 6: Cache key patterns');

  try {
    const cache = new Cache({ maxSize: 100, defaultTTL: 300 });

    // Set items with pattern
    await cache.set('api:users:1', { id: 1 });
    await cache.set('api:users:2', { id: 2 });
    await cache.set('api:products:1', { id: 1 });
    await cache.set('api:orders:1', { id: 1 });

    // Delete by pattern
    await cache.deletePattern(/^api:users:/);

    const users1 = await cache.get('api:users:1');
    const users2 = await cache.get('api:users:2');
    const products = await cache.get('api:products:1');

    if (users1 !== null || users2 !== null) {
      throw new Error('Pattern deletion failed');
    }

    if (products === null) {
      throw new Error('Non-matching key deleted');
    }

    console.log('✓ Key patterns test passed\n');
    return true;
  } catch (error: any) {
    console.error('✗ Key patterns test failed:', error.message, '\n');
    return false;
  }
}

/**
 * Test stale-while-revalidate
 */
async function testStaleWhileRevalidate(): Promise<boolean> {
  console.log('Test 7: Stale-while-revalidate');

  try {
    const cache = new Cache({ maxSize: 100, defaultTTL: 1 });

    await cache.set('data', 'original', {
      ttl: 1,
      staleWhileRevalidate: 2,
    });

    // Wait for TTL to expire but within stale window
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const result = await cache.get('data', {
      allowStale: true,
      onStale: async () => {
        console.log('  Revalidating stale data...');
        return 'revalidated';
      },
    });

    if (result === null) {
      throw new Error('Stale data not returned');
    }

    console.log(`  Returned: ${result}`);

    console.log('✓ Stale-while-revalidate test passed\n');
    return true;
  } catch (error: any) {
    console.error('✗ Stale-while-revalidate test failed:', error.message, '\n');
    return false;
  }
}

/**
 * Test cache compression
 */
async function testCacheCompression(): Promise<boolean> {
  console.log('Test 8: Cache compression');

  try {
    const cache = new Cache({
      maxSize: 100,
      defaultTTL: 300,
      compress: true,
    });

    const largeData = 'x'.repeat(10000);
    await cache.set('large', largeData);

    const retrieved = await cache.get('large');

    if (retrieved !== largeData) {
      throw new Error('Compressed data not decompressed correctly');
    }

    const stats = cache.getStats();
    console.log(`  Original size: ${largeData.length} bytes`);
    console.log(`  Stored size: ${stats.memoryUsage} bytes (estimated)`);

    console.log('✓ Compression test passed\n');
    return true;
  } catch (error: any) {
    console.error('✗ Compression test failed:', error.message, '\n');
    return false;
  }
}

/**
 * Test cache warming
 */
async function testCacheWarming(): Promise<boolean> {
  console.log('Test 9: Cache warming');

  try {
    const cache = new Cache({ maxSize: 100, defaultTTL: 300 });

    const keysToWarm = [
      { key: 'page:home', value: '<html>Home</html>' },
      { key: 'page:about', value: '<html>About</html>' },
      { key: 'page:contact', value: '<html>Contact</html>' },
    ];

    // Warm cache
    for (const { key, value } of keysToWarm) {
      await cache.set(key, value);
    }

    // Verify all warmed
    let warmed = 0;
    for (const { key } of keysToWarm) {
      const value = await cache.get(key);
      if (value !== null) warmed++;
    }

    if (warmed !== keysToWarm.length) {
      throw new Error('Cache warming incomplete');
    }

    console.log(`  Warmed ${warmed} cache entries`);
    console.log('✓ Cache warming test passed\n');
    return true;
  } catch (error: any) {
    console.error('✗ Cache warming test failed:', error.message, '\n');
    return false;
  }
}

/**
 * Test cache statistics
 */
async function testCacheStatistics(): Promise<boolean> {
  console.log('Test 10: Cache statistics');

  try {
    const cache = new Cache({ maxSize: 100, defaultTTL: 300 });

    // Perform various operations
    for (let i = 0; i < 20; i++) {
      await cache.set(`key${i}`, `value${i}`);
    }

    for (let i = 0; i < 30; i++) {
      await cache.get(`key${i % 25}`);
    }

    const stats = cache.getStats();

    console.log(`  Entries: ${stats.size}`);
    console.log(`  Hits: ${stats.hits}`);
    console.log(`  Misses: ${stats.misses}`);
    console.log(`  Hit rate: ${((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(1)}%`);
    console.log(`  Memory usage: ${stats.memoryUsage} bytes`);

    console.log('✓ Statistics test passed\n');
    return true;
  } catch (error: any) {
    console.error('✗ Statistics test failed:', error.message, '\n');
    return false;
  }
}

/**
 * Run all caching tests
 */
async function runCachingTests(): Promise<CacheTestResult> {
  console.log('=== Cache Tests ===\n');

  const tests = [
    testCacheBasics,
    testCacheTTL,
    testCacheHitRate,
    testCacheEviction,
    testCacheTags,
    testCacheKeyPatterns,
    testStaleWhileRevalidate,
    testCacheCompression,
    testCacheWarming,
    testCacheStatistics,
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = await test();
    if (result) {
      passed++;
    } else {
      failed++;
    }
  }

  const total = tests.length;

  console.log('=== Test Summary ===');
  console.log(`Total: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success rate: ${((passed / total) * 100).toFixed(1)}%`);

  return { passed, failed, total };
}

// Run tests
if (require.main === module) {
  runCachingTests()
    .then((result) => {
      process.exit(result.failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('Test suite failed:', error);
      process.exit(1);
    });
}

export default runCachingTests;
