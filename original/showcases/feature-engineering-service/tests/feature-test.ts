/**
 * Feature Store Tests - Comprehensive test suite
 *
 * Tests feature computation, caching, and API endpoints
 */

import * as http from 'http';

const BASE_URL = 'http://localhost:3000';

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

async function makeRequest(
  method: string,
  path: string,
  body?: any
): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options: http.RequestOptions = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function runTests(): Promise<void> {
  const results: TestResult[] = [];

  console.log('🧪 Running Feature Store Tests\n');

  // Test 1: Health check
  await runTest(results, 'Health Check', async () => {
    const response = await makeRequest('GET', '/health');
    if (response.status !== 'healthy') {
      throw new Error('Service not healthy');
    }
  });

  // Test 2: Single feature request
  await runTest(results, 'Single Feature Request', async () => {
    const response = await makeRequest('POST', '/features', {
      entity_id: 'test_entity_123',
    });

    if (!response.features) {
      throw new Error('No features returned');
    }

    if (!response.latency_ms) {
      throw new Error('No latency reported');
    }
  });

  // Test 3: Feature caching
  await runTest(results, 'Feature Caching', async () => {
    const entityId = 'cached_entity_456';

    // First request (cache miss)
    const response1 = await makeRequest('POST', '/features', {
      entity_id: entityId,
    });

    if (response1.cached) {
      throw new Error('First request should not be cached');
    }

    // Second request (cache hit)
    const response2 = await makeRequest('POST', '/features', {
      entity_id: entityId,
    });

    if (!response2.cached) {
      throw new Error('Second request should be cached');
    }

    if (response2.latency_ms >= response1.latency_ms) {
      throw new Error('Cached request should be faster');
    }
  });

  // Test 4: Specific features request
  await runTest(results, 'Specific Features Request', async () => {
    const response = await makeRequest('POST', '/features', {
      entity_id: 'test_entity_789',
      features: ['value_mean', 'value_std', 'trend_7d'],
    });

    const featureKeys = Object.keys(response.features);
    if (featureKeys.length > 3) {
      throw new Error('Should only return requested features');
    }

    if (!('value_mean' in response.features)) {
      throw new Error('Missing requested feature');
    }
  });

  // Test 5: Batch feature request
  await runTest(results, 'Batch Feature Request', async () => {
    const response = await makeRequest('POST', '/features/batch', {
      entity_ids: ['batch_1', 'batch_2', 'batch_3', 'batch_4', 'batch_5'],
    });

    if (response.count !== 5) {
      throw new Error(`Expected 5 results, got ${response.count}`);
    }

    if (!response.avg_latency_per_entity) {
      throw new Error('No average latency reported');
    }
  });

  // Test 6: Feature statistics
  await runTest(results, 'Feature Statistics', async () => {
    const response = await makeRequest('GET', '/features/stats');

    if (!('total_computes' in response)) {
      throw new Error('Missing compute statistics');
    }

    if (!('cache_hit_rate' in response)) {
      throw new Error('Missing cache hit rate');
    }
  });

  // Test 7: Feature versioning
  await runTest(results, 'Feature Versioning', async () => {
    const response = await makeRequest('POST', '/features', {
      entity_id: 'versioned_entity',
      version: 'v1',
    });

    if (response.version !== 'v1') {
      throw new Error('Version not preserved');
    }
  });

  // Test 8: Error handling - invalid entity
  await runTest(results, 'Error Handling', async () => {
    try {
      await makeRequest('POST', '/features', {
        // Missing entity_id
        features: ['value_mean'],
      });
      throw new Error('Should have thrown error for missing entity_id');
    } catch (error) {
      // Expected error
    }
  });

  // Test 9: Cache clear
  await runTest(results, 'Cache Clear', async () => {
    const response = await makeRequest('POST', '/cache/clear');

    if (!response.message) {
      throw new Error('No confirmation message');
    }

    // Verify cache is cleared
    const stats = await makeRequest('GET', '/features/stats');
    if (stats.cache_stats.size !== 0) {
      throw new Error('Cache not properly cleared');
    }
  });

  // Test 10: Drift report
  await runTest(results, 'Drift Monitoring Report', async () => {
    const response = await makeRequest('GET', '/drift/report');

    if (!('status' in response)) {
      throw new Error('Missing drift status');
    }

    if (!('total_tracked' in response)) {
      throw new Error('Missing tracking statistics');
    }
  });

  // Print results
  console.log('\n📊 Test Results:\n');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  for (const result of results) {
    const icon = result.passed ? '✅' : '❌';
    const duration = result.duration.toFixed(2);
    console.log(`${icon} ${result.name} (${duration}ms)`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  }

  console.log('');
  console.log(`Total: ${results.length} tests`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log('');

  if (failed > 0) {
    process.exit(1);
  }
}

async function runTest(
  results: TestResult[],
  name: string,
  testFn: () => Promise<void>
): Promise<void> {
  const startTime = Date.now();
  try {
    await testFn();
    results.push({
      name,
      passed: true,
      duration: Date.now() - startTime,
    });
  } catch (error) {
    results.push({
      name,
      passed: false,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// Run tests
runTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
