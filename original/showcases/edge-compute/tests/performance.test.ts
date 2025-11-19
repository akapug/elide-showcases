/**
 * Performance Tests
 *
 * Comprehensive performance testing for edge computing:
 * - Response time benchmarks
 * - Throughput testing
 * - Concurrency testing
 * - Memory usage profiling
 * - Cold start measurements
 * - Cache performance
 */

import EdgeRouter from '../router/edge-router';
import FunctionManager from '../control-plane/function-manager';
import Cache from '../storage/cache';
import * as fs from 'fs';

interface PerformanceMetrics {
  min: number;
  max: number;
  avg: number;
  p50: number;
  p95: number;
  p99: number;
  total: number;
}

/**
 * Calculate percentiles from measurements
 */
function calculateMetrics(measurements: number[]): PerformanceMetrics {
  const sorted = measurements.sort((a, b) => a - b);
  const count = sorted.length;

  return {
    min: sorted[0] || 0,
    max: sorted[count - 1] || 0,
    avg: measurements.reduce((a, b) => a + b, 0) / count || 0,
    p50: sorted[Math.floor(count * 0.5)] || 0,
    p95: sorted[Math.floor(count * 0.95)] || 0,
    p99: sorted[Math.floor(count * 0.99)] || 0,
    total: count,
  };
}

/**
 * Test 1: Response time benchmarks
 */
async function testResponseTime(): Promise<boolean> {
  console.log('Test 1: Response time benchmarks');

  try {
    const storageDir = './test-perf-functions';
    if (fs.existsSync(storageDir)) {
      fs.rmSync(storageDir, { recursive: true });
    }

    const manager = new FunctionManager(storageDir);
    const router = new EdgeRouter(manager);

    // Deploy test function
    const func = await manager.deploy('test-func', 'return "ok"', 'typescript', {
      autoVersion: true,
    });

    router.addRoute({
      path: '/test',
      functionId: func.id,
      methods: ['GET'],
    });

    // Run benchmarks
    const iterations = 1000;
    const timings: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();

      router.match({
        path: '/test',
        method: 'GET',
        headers: {},
        query: {},
      });

      const duration = performance.now() - start;
      timings.push(duration);
    }

    const metrics = calculateMetrics(timings);

    console.log(`  Iterations: ${metrics.total}`);
    console.log(`  Min: ${metrics.min.toFixed(3)}ms`);
    console.log(`  Avg: ${metrics.avg.toFixed(3)}ms`);
    console.log(`  P50: ${metrics.p50.toFixed(3)}ms`);
    console.log(`  P95: ${metrics.p95.toFixed(3)}ms`);
    console.log(`  P99: ${metrics.p99.toFixed(3)}ms`);
    console.log(`  Max: ${metrics.max.toFixed(3)}ms`);

    // Cleanup
    if (fs.existsSync(storageDir)) {
      fs.rmSync(storageDir, { recursive: true });
    }

    console.log('✓ Response time test passed\n');
    return true;
  } catch (error: any) {
    console.error('✗ Response time test failed:', error.message, '\n');
    return false;
  }
}

/**
 * Test 2: Throughput testing
 */
async function testThroughput(): Promise<boolean> {
  console.log('Test 2: Throughput testing');

  try {
    const cache = new Cache({ maxSize: 10000, defaultTTL: 300 });

    const duration = 5000; // 5 seconds
    const startTime = Date.now();
    let requestCount = 0;

    while (Date.now() - startTime < duration) {
      await cache.set(`key${requestCount}`, `value${requestCount}`);
      await cache.get(`key${requestCount}`);
      requestCount++;
    }

    const actualDuration = (Date.now() - startTime) / 1000;
    const rps = requestCount / actualDuration;

    console.log(`  Duration: ${actualDuration.toFixed(2)}s`);
    console.log(`  Total requests: ${requestCount}`);
    console.log(`  Requests/sec: ${rps.toFixed(0)}`);

    console.log('✓ Throughput test passed\n');
    return true;
  } catch (error: any) {
    console.error('✗ Throughput test failed:', error.message, '\n');
    return false;
  }
}

/**
 * Test 3: Concurrency testing
 */
async function testConcurrency(): Promise<boolean> {
  console.log('Test 3: Concurrency testing');

  try {
    const cache = new Cache({ maxSize: 10000, defaultTTL: 300 });

    const concurrentRequests = 100;
    const timings: number[] = [];

    async function simulateRequest(id: number): Promise<number> {
      const start = performance.now();

      await cache.set(`concurrent:${id}`, { data: `request-${id}` });
      await cache.get(`concurrent:${id}`);

      return performance.now() - start;
    }

    // Run concurrent requests
    const promises: Promise<number>[] = [];
    for (let i = 0; i < concurrentRequests; i++) {
      promises.push(simulateRequest(i));
    }

    const results = await Promise.all(promises);
    const metrics = calculateMetrics(results);

    console.log(`  Concurrent requests: ${concurrentRequests}`);
    console.log(`  Avg latency: ${metrics.avg.toFixed(3)}ms`);
    console.log(`  P95 latency: ${metrics.p95.toFixed(3)}ms`);
    console.log(`  P99 latency: ${metrics.p99.toFixed(3)}ms`);

    console.log('✓ Concurrency test passed\n');
    return true;
  } catch (error: any) {
    console.error('✗ Concurrency test failed:', error.message, '\n');
    return false;
  }
}

/**
 * Test 4: Memory usage profiling
 */
async function testMemoryUsage(): Promise<boolean> {
  console.log('Test 4: Memory usage profiling');

  try {
    const cache = new Cache({ maxSize: 10000, defaultTTL: 300 });

    const initialMemory = process.memoryUsage();

    // Store data
    const itemCount = 1000;
    for (let i = 0; i < itemCount; i++) {
      await cache.set(`item:${i}`, {
        id: i,
        data: 'x'.repeat(1000),
        timestamp: Date.now(),
      });
    }

    const afterMemory = process.memoryUsage();

    const heapDiff = (afterMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;
    const perItem = heapDiff / itemCount;

    console.log(`  Items stored: ${itemCount}`);
    console.log(`  Heap increase: ${heapDiff.toFixed(2)} MB`);
    console.log(`  Per item: ${(perItem * 1024).toFixed(2)} KB`);
    console.log(`  RSS: ${(afterMemory.rss / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  External: ${(afterMemory.external / 1024 / 1024).toFixed(2)} MB`);

    console.log('✓ Memory usage test passed\n');
    return true;
  } catch (error: any) {
    console.error('✗ Memory usage test failed:', error.message, '\n');
    return false;
  }
}

/**
 * Test 5: Cold start measurement
 */
async function testColdStart(): Promise<boolean> {
  console.log('Test 5: Cold start measurement');

  try {
    const coldStarts: number[] = [];
    const iterations = 10;

    for (let i = 0; i < iterations; i++) {
      const storageDir = `./test-cold-start-${i}`;

      const start = performance.now();

      const manager = new FunctionManager(storageDir);
      const router = new EdgeRouter(manager);

      const func = await manager.deploy('cold-start', 'return "ok"', 'typescript', {
        autoVersion: true,
      });

      router.addRoute({
        path: '/cold',
        functionId: func.id,
        methods: ['GET'],
      });

      const duration = performance.now() - start;
      coldStarts.push(duration);

      // Cleanup
      if (fs.existsSync(storageDir)) {
        fs.rmSync(storageDir, { recursive: true });
      }
    }

    const metrics = calculateMetrics(coldStarts);

    console.log(`  Iterations: ${iterations}`);
    console.log(`  Avg cold start: ${metrics.avg.toFixed(3)}ms`);
    console.log(`  Min: ${metrics.min.toFixed(3)}ms`);
    console.log(`  Max: ${metrics.max.toFixed(3)}ms`);
    console.log(`  P95: ${metrics.p95.toFixed(3)}ms`);

    console.log('✓ Cold start test passed\n');
    return true;
  } catch (error: any) {
    console.error('✗ Cold start test failed:', error.message, '\n');
    return false;
  }
}

/**
 * Test 6: Cache performance
 */
async function testCachePerformance(): Promise<boolean> {
  console.log('Test 6: Cache performance');

  try {
    const cache = new Cache({ maxSize: 10000, defaultTTL: 300 });

    // Warm up cache
    for (let i = 0; i < 100; i++) {
      await cache.set(`warm:${i}`, `value${i}`);
    }

    // Test cache hits
    const hitTimings: number[] = [];
    for (let i = 0; i < 1000; i++) {
      const start = performance.now();
      await cache.get(`warm:${i % 100}`);
      hitTimings.push(performance.now() - start);
    }

    // Test cache misses
    const missTimings: number[] = [];
    for (let i = 0; i < 1000; i++) {
      const start = performance.now();
      await cache.get(`missing:${i}`);
      missTimings.push(performance.now() - start);
    }

    const hitMetrics = calculateMetrics(hitTimings);
    const missMetrics = calculateMetrics(missTimings);

    console.log('  Cache Hits:');
    console.log(`    Avg: ${hitMetrics.avg.toFixed(3)}ms`);
    console.log(`    P95: ${hitMetrics.p95.toFixed(3)}ms`);

    console.log('  Cache Misses:');
    console.log(`    Avg: ${missMetrics.avg.toFixed(3)}ms`);
    console.log(`    P95: ${missMetrics.p95.toFixed(3)}ms`);

    console.log(`  Hit/Miss ratio: ${(hitMetrics.avg / missMetrics.avg).toFixed(2)}x faster`);

    console.log('✓ Cache performance test passed\n');
    return true;
  } catch (error: any) {
    console.error('✗ Cache performance test failed:', error.message, '\n');
    return false;
  }
}

/**
 * Test 7: Load balancer performance
 */
async function testLoadBalancerPerformance(): Promise<boolean> {
  console.log('Test 7: Load balancer performance');

  try {
    const storageDir = './test-lb-perf';
    if (fs.existsSync(storageDir)) {
      fs.rmSync(storageDir, { recursive: true });
    }

    const manager = new FunctionManager(storageDir);
    const router = new EdgeRouter(manager);

    const func = await manager.deploy('lb-test', 'return "ok"', 'typescript', {
      autoVersion: true,
    });

    router.addRoute({
      path: '/balanced',
      functionId: func.id,
      methods: ['GET'],
    });

    // Measure routing performance
    const timings: number[] = [];
    const iterations = 10000;

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();

      router.match({
        path: '/balanced',
        method: 'GET',
        headers: {},
        query: {},
      });

      timings.push(performance.now() - start);
    }

    const metrics = calculateMetrics(timings);

    console.log(`  Iterations: ${iterations}`);
    console.log(`  Avg: ${metrics.avg.toFixed(3)}ms`);
    console.log(`  P95: ${metrics.p95.toFixed(3)}ms`);
    console.log(`  P99: ${metrics.p99.toFixed(3)}ms`);
    console.log(`  Throughput: ${(1000 / metrics.avg).toFixed(0)} req/sec`);

    // Cleanup
    if (fs.existsSync(storageDir)) {
      fs.rmSync(storageDir, { recursive: true });
    }

    console.log('✓ Load balancer performance test passed\n');
    return true;
  } catch (error: any) {
    console.error('✗ Load balancer performance test failed:', error.message, '\n');
    return false;
  }
}

/**
 * Test 8: Sustained load testing
 */
async function testSustainedLoad(): Promise<boolean> {
  console.log('Test 8: Sustained load testing');

  try {
    const cache = new Cache({ maxSize: 10000, defaultTTL: 300 });

    const duration = 10000; // 10 seconds
    const samplingInterval = 1000; // Sample every second
    const samples: number[] = [];

    const startTime = Date.now();
    let requestCount = 0;
    let lastSample = startTime;

    while (Date.now() - startTime < duration) {
      await cache.set(`load:${requestCount}`, { data: requestCount });
      await cache.get(`load:${requestCount}`);
      requestCount++;

      // Sample RPS
      if (Date.now() - lastSample >= samplingInterval) {
        const currentRPS = requestCount / ((Date.now() - startTime) / 1000);
        samples.push(currentRPS);
        lastSample = Date.now();
      }
    }

    const avgRPS = requestCount / (duration / 1000);
    const rpsMetrics = calculateMetrics(samples);

    console.log(`  Duration: ${duration / 1000}s`);
    console.log(`  Total requests: ${requestCount}`);
    console.log(`  Avg RPS: ${avgRPS.toFixed(0)}`);
    console.log(`  Min RPS: ${rpsMetrics.min.toFixed(0)}`);
    console.log(`  Max RPS: ${rpsMetrics.max.toFixed(0)}`);

    console.log('✓ Sustained load test passed\n');
    return true;
  } catch (error: any) {
    console.error('✗ Sustained load test failed:', error.message, '\n');
    return false;
  }
}

/**
 * Run all performance tests
 */
async function runPerformanceTests(): Promise<void> {
  console.log('=== Performance Tests ===\n');

  const tests = [
    testResponseTime,
    testThroughput,
    testConcurrency,
    testMemoryUsage,
    testColdStart,
    testCachePerformance,
    testLoadBalancerPerformance,
    testSustainedLoad,
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

  console.log('=== Performance Test Summary ===');
  console.log(`Total: ${tests.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success rate: ${((passed / tests.length) * 100).toFixed(1)}%`);
}

// Run tests
if (require.main === module) {
  runPerformanceTests()
    .catch((error) => {
      console.error('Performance test suite failed:', error);
      process.exit(1);
    });
}

export default runPerformanceTests;
