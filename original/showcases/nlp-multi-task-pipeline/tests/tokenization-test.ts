import { TokenizationCache } from '../shared/tokenization-cache';

/**
 * Tokenization Cache Tests
 */

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

/**
 * Test basic cache operations
 */
function testBasicOperations(): TestResult {
  try {
    const cache = new TokenizationCache(10, 60000);

    // Test set and get
    cache.set('key1', { tokens: [1, 2, 3] });
    const result = cache.get('key1');

    if (!result || result.tokens.length !== 3) {
      throw new Error('Failed to retrieve cached value');
    }

    // Test non-existent key
    const missing = cache.get('nonexistent');
    if (missing !== null) {
      throw new Error('Should return null for missing key');
    }

    return {
      name: 'Basic Cache Operations',
      passed: true,
    };
  } catch (error) {
    return {
      name: 'Basic Cache Operations',
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Test LRU eviction
 */
function testLRUEviction(): TestResult {
  try {
    const cache = new TokenizationCache(3, 60000);

    // Fill cache
    cache.set('key1', { value: 1 });
    cache.set('key2', { value: 2 });
    cache.set('key3', { value: 3 });

    // Add one more (should evict key1)
    cache.set('key4', { value: 4 });

    // key1 should be evicted
    if (cache.get('key1') !== null) {
      throw new Error('LRU eviction failed: key1 should be evicted');
    }

    // key2, key3, key4 should still exist
    if (!cache.get('key2') || !cache.get('key3') || !cache.get('key4')) {
      throw new Error('LRU eviction failed: recent keys should exist');
    }

    return {
      name: 'LRU Eviction',
      passed: true,
    };
  } catch (error) {
    return {
      name: 'LRU Eviction',
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Test TTL expiration
 */
async function testTTLExpiration(): Promise<TestResult> {
  try {
    const cache = new TokenizationCache(10, 100); // 100ms TTL

    cache.set('key1', { value: 1 });

    // Should exist immediately
    if (!cache.get('key1')) {
      throw new Error('Value should exist immediately after set');
    }

    // Wait for expiration
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Should be expired
    if (cache.get('key1') !== null) {
      throw new Error('Value should be expired after TTL');
    }

    return {
      name: 'TTL Expiration',
      passed: true,
    };
  } catch (error) {
    return {
      name: 'TTL Expiration',
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Test cache statistics
 */
function testStatistics(): TestResult {
  try {
    const cache = new TokenizationCache(100, 60000);

    cache.set('key1', { value: 1 });
    cache.set('key2', { value: 2 });
    cache.set('key3', { value: 3 });

    const stats = cache.getStats();

    if (stats.size !== 3) {
      throw new Error(`Expected size 3, got ${stats.size}`);
    }

    if (stats.maxSize !== 100) {
      throw new Error(`Expected maxSize 100, got ${stats.maxSize}`);
    }

    return {
      name: 'Cache Statistics',
      passed: true,
    };
  } catch (error) {
    return {
      name: 'Cache Statistics',
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Test cache cleanup
 */
function testCleanup(): TestResult {
  try {
    const cache = new TokenizationCache(10, 60000);

    cache.set('key1', { value: 1 });
    cache.set('key2', { value: 2 });

    cache.clear();

    if (cache.get('key1') !== null || cache.get('key2') !== null) {
      throw new Error('Cache should be empty after clear');
    }

    const stats = cache.getStats();
    if (stats.size !== 0) {
      throw new Error('Cache size should be 0 after clear');
    }

    return {
      name: 'Cache Cleanup',
      passed: true,
    };
  } catch (error) {
    return {
      name: 'Cache Cleanup',
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Test concurrent access
 */
function testConcurrentAccess(): TestResult {
  try {
    const cache = new TokenizationCache(100, 60000);

    // Simulate concurrent writes
    for (let i = 0; i < 50; i++) {
      cache.set(`key${i}`, { value: i });
    }

    // Verify all values
    for (let i = 0; i < 50; i++) {
      const result = cache.get(`key${i}`);
      if (!result || result.value !== i) {
        throw new Error(`Failed to retrieve key${i}`);
      }
    }

    return {
      name: 'Concurrent Access',
      passed: true,
    };
  } catch (error) {
    return {
      name: 'Concurrent Access',
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Print test results
 */
function printResults(results: TestResult[]) {
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;

  console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                    Tokenization Cache Tests                               ║
╠═══════════════════════════════════════════════════════════════════════════╣
  `);

  for (const result of results) {
    const status = result.passed ? '✓ PASS' : '✗ FAIL';
    const statusColor = result.passed ? '\x1b[32m' : '\x1b[31m';
    const resetColor = '\x1b[0m';

    console.log(`║ ${statusColor}${status}${resetColor} ${result.name.padEnd(65)} ║`);

    if (result.error) {
      console.log(`║      Error: ${result.error.substring(0, 60).padEnd(60)} ║`);
    }
  }

  console.log(`╠═══════════════════════════════════════════════════════════════════════════╣`);
  console.log(`║ Total: ${passed}/${total} tests passed`.padEnd(76) + '║');
  console.log(`╚═══════════════════════════════════════════════════════════════════════════╝`);

  if (passed !== total) {
    console.log('\nSome tests failed. Check the errors above.');
    process.exit(1);
  } else {
    console.log('\nAll tests passed!');
  }
}

/**
 * Main test runner
 */
async function main() {
  console.log('Running Tokenization Cache Tests...\n');

  const results: TestResult[] = [];

  results.push(testBasicOperations());
  results.push(testLRUEviction());
  results.push(await testTTLExpiration());
  results.push(testStatistics());
  results.push(testCleanup());
  results.push(testConcurrentAccess());

  printResults(results);
}

main();
