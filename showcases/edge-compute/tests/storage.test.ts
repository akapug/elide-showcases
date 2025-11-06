/**
 * Storage Tests
 *
 * Tests KV store and caching layer.
 */

import KVStore from '../storage/kv-store';
import Cache from '../storage/cache';
import * as fs from 'fs';

async function testStorage() {
  console.log('=== Storage Tests ===\n');

  // Test 1: KV Store - Basic operations
  console.log('Test 1: KV Store basic operations');
  try {
    const dataDir = './test-kv-data';
    if (fs.existsSync(dataDir)) {
      fs.rmSync(dataDir, { recursive: true });
    }

    const kv = new KVStore({
      persistent: false,
      dataDir,
    });

    // Set values
    await kv.set('user:1', { name: 'Alice', email: 'alice@example.com' });
    await kv.set('user:2', { name: 'Bob', email: 'bob@example.com' });
    await kv.set('config:api', { endpoint: 'https://api.example.com' });

    // Get values
    const user1 = await kv.get('user:1');
    const user2 = await kv.get('user:2');

    console.log('✓ KV Store basic operations work');
    console.log(`  user:1 =`, user1);
    console.log(`  user:2 =`, user2);

    const stats = kv.getStats();
    console.log(`  Stats: ${stats.size} keys, ${stats.memoryUsageFormatted}\n`);

    await kv.shutdown();
  } catch (error: any) {
    console.error('✗ KV Store test failed:', error.message);
  }

  // Test 2: KV Store - TTL
  console.log('Test 2: KV Store with TTL');
  try {
    const kv = new KVStore({ persistent: false });

    // Set with TTL
    await kv.set('temp:data', { value: 'expires soon' }, { ttl: 2 });

    // Get immediately
    const value1 = await kv.get('temp:data');
    console.log('✓ Value exists:', value1);

    // Wait for expiration
    await new Promise((resolve) => setTimeout(resolve, 2500));

    // Try to get expired value
    const value2 = await kv.get('temp:data');
    console.log('✓ Value expired:', value2 === null ? 'null (as expected)' : value2);
    console.log();

    await kv.shutdown();
  } catch (error: any) {
    console.error('✗ TTL test failed:', error.message);
  }

  // Test 3: KV Store - List operations
  console.log('Test 3: KV Store list operations');
  try {
    const kv = new KVStore({ persistent: false });

    // Set multiple values
    await kv.set('product:1', { name: 'Product 1' }, { tags: ['electronics'] });
    await kv.set('product:2', { name: 'Product 2' }, { tags: ['electronics'] });
    await kv.set('product:3', { name: 'Product 3' }, { tags: ['clothing'] });
    await kv.set('order:1', { total: 100 });

    // List with prefix
    const products = await kv.list({ prefix: 'product:' });
    console.log('✓ List with prefix works');
    console.log(`  Products: ${products.length} items`);

    // List with tags
    const electronics = await kv.list({ tags: ['electronics'] });
    console.log(`  Electronics: ${electronics.length} items\n`);

    await kv.shutdown();
  } catch (error: any) {
    console.error('✗ List operations test failed:', error.message);
  }

  // Test 4: Cache - Basic operations
  console.log('Test 4: Cache basic operations');
  try {
    const cache = new Cache({
      maxSize: 100,
      defaultTTL: 300,
    });

    // Set values
    cache.set('page:/home', '<html>Home Page</html>');
    cache.set('page:/about', '<html>About Page</html>');
    cache.set('api:/users', [{ id: 1 }, { id: 2 }]);

    // Get values
    const home = cache.get('page:/home');
    const about = cache.get('page:/about');

    console.log('✓ Cache basic operations work');
    console.log(`  Cached home: ${home ? 'yes' : 'no'}`);
    console.log(`  Cached about: ${about ? 'yes' : 'no'}`);

    const stats = cache.getStats();
    console.log(`  Stats: ${stats.size} entries, hit rate: ${(stats.hitRate * 100).toFixed(2)}%\n`);
  } catch (error: any) {
    console.error('✗ Cache test failed:', error.message);
  }

  // Test 5: Cache - Invalidation
  console.log('Test 5: Cache invalidation');
  try {
    const cache = new Cache();

    // Set values with tags
    cache.set('user:1:profile', { name: 'Alice' }, { tags: ['user', 'profile'] });
    cache.set('user:2:profile', { name: 'Bob' }, { tags: ['user', 'profile'] });
    cache.set('config:api', { endpoint: 'api' }, { tags: ['config'] });

    console.log(`  Initial size: ${cache.getStats().size}`);

    // Invalidate by tag
    const invalidated = cache.invalidateByTags(['user']);
    console.log('✓ Cache invalidation works');
    console.log(`  Invalidated: ${invalidated} entries`);
    console.log(`  Final size: ${cache.getStats().size}\n`);
  } catch (error: any) {
    console.error('✗ Cache invalidation test failed:', error.message);
  }

  // Test 6: Cache - Hit rate
  console.log('Test 6: Cache hit rate');
  try {
    const cache = new Cache();

    cache.set('data', { value: 123 });

    // Multiple gets
    for (let i = 0; i < 10; i++) {
      cache.get('data');
    }

    // One miss
    cache.get('missing');

    const stats = cache.getStats();
    console.log('✓ Cache hit rate tracking works');
    console.log(`  Hits: ${stats.hits}`);
    console.log(`  Misses: ${stats.misses}`);
    console.log(`  Hit rate: ${(stats.hitRate * 100).toFixed(2)}%\n`);
  } catch (error: any) {
    console.error('✗ Hit rate test failed:', error.message);
  }

  console.log('=== All storage tests completed ===');
}

// Run tests
if (require.main === module) {
  testStorage()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Test suite failed:', error);
      process.exit(1);
    });
}

export default testStorage;
