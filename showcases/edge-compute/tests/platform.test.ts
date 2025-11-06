/**
 * Platform Integration Tests
 *
 * Tests the complete edge compute platform.
 */

import EdgeComputePlatform from '../platform';

async function testPlatform() {
  console.log('=== Edge Compute Platform Tests ===\n');

  const platform = new EdgeComputePlatform({
    storageDir: './test-functions',
    dataDir: './test-data',
    logLevel: 'info',
  });

  await platform.initialize();

  // Test 1: Deploy a TypeScript function
  console.log('Test 1: Deploy TypeScript function');
  try {
    const result = await platform.deploy({
      name: 'hello-ts',
      runtime: 'typescript',
      code: `
        export function handler(event: any, context: any) {
          return { message: 'Hello from TypeScript!', event };
        }
      `,
      routes: ['/hello-ts'],
    });

    console.log('✓ Deployment successful');
    console.log(`  Function ID: ${result.functionId}`);
    console.log(`  Version: ${result.version}\n`);
  } catch (error: any) {
    console.error('✗ Deployment failed:', error.message);
  }

  // Test 2: Invoke the function
  console.log('Test 2: Invoke function');
  try {
    const response = await platform.invoke({
      path: '/hello-ts',
      method: 'GET',
      query: { name: 'Edge' },
    });

    console.log('✓ Invocation successful');
    console.log(`  Status: ${response.statusCode}`);
    console.log(`  Response:`, response.body);
    console.log(`  Execution time: ${response.executionTime}ms\n`);
  } catch (error: any) {
    console.error('✗ Invocation failed:', error.message);
  }

  // Test 3: Check caching
  console.log('Test 3: Test caching');
  try {
    const response1 = await platform.invoke({
      path: '/hello-ts',
      method: 'GET',
      query: { name: 'Cache' },
    });

    const response2 = await platform.invoke({
      path: '/hello-ts',
      method: 'GET',
      query: { name: 'Cache' },
    });

    console.log('✓ Caching works');
    console.log(`  First request: ${response1.executionTime}ms (cached: ${response1.cached})`);
    console.log(`  Second request: ${response2.executionTime}ms (cached: ${response2.cached})\n`);
  } catch (error: any) {
    console.error('✗ Caching test failed:', error.message);
  }

  // Test 4: KV Store
  console.log('Test 4: KV Store operations');
  try {
    const kv = platform.getKV();

    await kv.set('test-key', { value: 'test-data' });
    const value = await kv.get('test-key');

    console.log('✓ KV Store works');
    console.log(`  Value:`, value);

    const stats = kv.getStats();
    console.log(`  Stats: ${stats.size} keys, ${stats.memoryUsageFormatted}\n`);
  } catch (error: any) {
    console.error('✗ KV Store test failed:', error.message);
  }

  // Test 5: Metrics
  console.log('Test 5: Metrics collection');
  try {
    const metrics = platform.getMetrics();
    const summary = metrics.getSummary();

    console.log('✓ Metrics collected');
    console.log(`  Total requests: ${summary.requests.total}`);
    console.log(`  Success rate: ${(summary.requests.success / summary.requests.total * 100).toFixed(2)}%`);
    console.log(`  Avg latency: ${summary.latency.avg.toFixed(2)}ms\n`);
  } catch (error: any) {
    console.error('✗ Metrics test failed:', error.message);
  }

  // Test 6: Platform status
  console.log('Test 6: Platform status');
  try {
    const status = platform.getStatus();

    console.log('✓ Status retrieved');
    console.log(`  Status: ${status.status}`);
    console.log(`  Uptime: ${(status.uptime / 1000).toFixed(2)}s`);
    console.log(`  Functions: ${status.components.functions.total}`);
    console.log(`  Cache size: ${status.components.cache.size}\n`);
  } catch (error: any) {
    console.error('✗ Status test failed:', error.message);
  }

  // Cleanup
  await platform.shutdown();

  console.log('=== All tests completed ===');
}

// Run tests
if (require.main === module) {
  testPlatform()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Test suite failed:', error);
      process.exit(1);
    });
}

export default testPlatform;
