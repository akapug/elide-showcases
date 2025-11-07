/**
 * Stress Tests for API Gateway
 *
 * Tests gateway performance under high load:
 * - High throughput scenarios
 * - Memory leak detection
 * - Resource exhaustion handling
 * - Degradation under stress
 */

import { createServer } from '../gateway/server.ts';

/**
 * Stress test configuration
 */
const CONFIG = {
  warmupRequests: 10,
  concurrentUsers: 50,
  requestsPerUser: 20,
  testDuration: 10000, // 10 seconds
};

/**
 * Stress test results
 */
interface StressTestResults {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p50: number;
  p95: number;
  p99: number;
  requestsPerSecond: number;
  duration: number;
}

/**
 * Stress Test Suite
 */
class StressTestSuite {
  private server: any;

  async setup() {
    console.log('Setting up stress test environment...\n');
    this.server = await createServer();
  }

  async request(method: string, url: string, options: any = {}) {
    const start = Date.now();
    try {
      const response = await this.server.handleRequest({
        method,
        url,
        headers: options.headers || {},
        body: options.body,
        ip: '127.0.0.1',
      });
      return {
        success: response.status < 400,
        duration: Date.now() - start,
        status: response.status,
      };
    } catch (error) {
      return {
        success: false,
        duration: Date.now() - start,
        error: error.message,
      };
    }
  }

  /**
   * Warm up the server with some requests
   */
  async warmup() {
    console.log(`Warming up with ${CONFIG.warmupRequests} requests...`);
    for (let i = 0; i < CONFIG.warmupRequests; i++) {
      await this.request('GET', '/health');
    }
    console.log('Warmup complete\n');
  }

  /**
   * Run throughput stress test
   */
  async runThroughputTest(): Promise<StressTestResults> {
    console.log('Running throughput stress test...');
    console.log(`  Concurrent users: ${CONFIG.concurrentUsers}`);
    console.log(`  Requests per user: ${CONFIG.requestsPerUser}`);
    console.log(`  Total requests: ${CONFIG.concurrentUsers * CONFIG.requestsPerUser}\n`);

    const startTime = Date.now();
    const durations: number[] = [];
    let successful = 0;
    let failed = 0;

    // Create concurrent users
    const users = Array.from({ length: CONFIG.concurrentUsers }, async (_, userId) => {
      // Each user makes multiple requests
      const userRequests = Array.from({ length: CONFIG.requestsPerUser }, async (_, reqId) => {
        const result = await this.request('GET', `/health?user=${userId}&req=${reqId}`);
        durations.push(result.duration);
        if (result.success) {
          successful++;
        } else {
          failed++;
        }
        return result;
      });

      return Promise.all(userRequests);
    });

    await Promise.all(users);

    const endTime = Date.now();
    const totalDuration = endTime - startTime;

    // Calculate statistics
    const sorted = durations.sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
      totalRequests: durations.length,
      successfulRequests: successful,
      failedRequests: failed,
      averageResponseTime: sum / sorted.length,
      minResponseTime: sorted[0],
      maxResponseTime: sorted[sorted.length - 1],
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      requestsPerSecond: durations.length / (totalDuration / 1000),
      duration: totalDuration,
    };
  }

  /**
   * Run sustained load test
   */
  async runSustainedLoadTest(): Promise<StressTestResults> {
    console.log('\nRunning sustained load test...');
    console.log(`  Duration: ${CONFIG.testDuration}ms`);
    console.log(`  Target: Continuous requests for ${CONFIG.testDuration / 1000} seconds\n`);

    const startTime = Date.now();
    const durations: number[] = [];
    let successful = 0;
    let failed = 0;
    let requestCount = 0;

    // Keep making requests until time expires
    const workers = Array.from({ length: 10 }, async () => {
      while (Date.now() - startTime < CONFIG.testDuration) {
        requestCount++;
        const result = await this.request('GET', `/health?req=${requestCount}`);
        durations.push(result.duration);
        if (result.success) {
          successful++;
        } else {
          failed++;
        }
      }
    });

    await Promise.all(workers);

    const endTime = Date.now();
    const totalDuration = endTime - startTime;

    // Calculate statistics
    const sorted = durations.sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
      totalRequests: durations.length,
      successfulRequests: successful,
      failedRequests: failed,
      averageResponseTime: sum / sorted.length,
      minResponseTime: sorted[0],
      maxResponseTime: sorted[sorted.length - 1],
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      requestsPerSecond: durations.length / (totalDuration / 1000),
      duration: totalDuration,
    };
  }

  /**
   * Run memory stress test
   */
  async runMemoryStressTest() {
    console.log('\nRunning memory stress test...');
    console.log('  Testing large payload handling...\n');

    // Get initial memory (if available)
    const initialMemory = typeof process !== 'undefined' && process.memoryUsage
      ? process.memoryUsage().heapUsed
      : 0;

    // Create large payloads
    const largePayload = {
      data: 'x'.repeat(100000), // 100KB
      nested: Array(100).fill({ key: 'value', data: 'x'.repeat(1000) }),
    };

    // Make requests with large payloads
    const requests = Array.from({ length: 50 }, async (_, i) => {
      return this.request('POST', '/api/analytics/events', {
        body: {
          userId: '550e8400-e29b-41d4-a716-446655440000',
          eventType: 'stress_test',
          metadata: { ...largePayload, iteration: i },
        },
      });
    });

    await Promise.all(requests);

    // Get final memory (if available)
    const finalMemory = typeof process !== 'undefined' && process.memoryUsage
      ? process.memoryUsage().heapUsed
      : 0;

    if (initialMemory > 0 && finalMemory > 0) {
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024;
      console.log(`  Memory increase: ${memoryIncrease.toFixed(2)} MB`);

      if (memoryIncrease > 50) {
        console.log('  ⚠️  Warning: Potential memory leak detected');
      } else {
        console.log('  ✓ Memory usage within acceptable range');
      }
    }
  }

  /**
   * Print test results
   */
  printResults(name: string, results: StressTestResults) {
    console.log('\n' + '='.repeat(60));
    console.log(`${name} Results`);
    console.log('='.repeat(60));
    console.log(`Total Requests:       ${results.totalRequests}`);
    console.log(`Successful:           ${results.successfulRequests} (${((results.successfulRequests / results.totalRequests) * 100).toFixed(1)}%)`);
    console.log(`Failed:               ${results.failedRequests}`);
    console.log(`Duration:             ${results.duration}ms`);
    console.log(`Requests/sec:         ${results.requestsPerSecond.toFixed(2)}`);
    console.log('\nResponse Times:');
    console.log(`  Average:            ${results.averageResponseTime.toFixed(2)}ms`);
    console.log(`  Min:                ${results.minResponseTime}ms`);
    console.log(`  Max:                ${results.maxResponseTime}ms`);
    console.log(`  P50 (median):       ${results.p50}ms`);
    console.log(`  P95:                ${results.p95}ms`);
    console.log(`  P99:                ${results.p99}ms`);
    console.log('='.repeat(60) + '\n');
  }

  /**
   * Evaluate performance
   */
  evaluatePerformance(results: StressTestResults) {
    console.log('Performance Evaluation:');

    // Success rate
    const successRate = (results.successfulRequests / results.totalRequests) * 100;
    if (successRate >= 99) {
      console.log('  ✓ Success Rate: EXCELLENT (≥99%)');
    } else if (successRate >= 95) {
      console.log('  ✓ Success Rate: GOOD (≥95%)');
    } else if (successRate >= 90) {
      console.log('  ⚠️  Success Rate: ACCEPTABLE (≥90%)');
    } else {
      console.log('  ✗ Success Rate: POOR (<90%)');
    }

    // Throughput
    if (results.requestsPerSecond >= 100) {
      console.log('  ✓ Throughput: EXCELLENT (≥100 req/sec)');
    } else if (results.requestsPerSecond >= 50) {
      console.log('  ✓ Throughput: GOOD (≥50 req/sec)');
    } else if (results.requestsPerSecond >= 20) {
      console.log('  ⚠️  Throughput: ACCEPTABLE (≥20 req/sec)');
    } else {
      console.log('  ✗ Throughput: POOR (<20 req/sec)');
    }

    // Response time
    if (results.p95 < 100) {
      console.log('  ✓ P95 Response Time: EXCELLENT (<100ms)');
    } else if (results.p95 < 200) {
      console.log('  ✓ P95 Response Time: GOOD (<200ms)');
    } else if (results.p95 < 500) {
      console.log('  ⚠️  P95 Response Time: ACCEPTABLE (<500ms)');
    } else {
      console.log('  ✗ P95 Response Time: POOR (≥500ms)');
    }

    // Consistency (max/min ratio)
    const ratio = results.maxResponseTime / results.minResponseTime;
    if (ratio < 3) {
      console.log('  ✓ Consistency: EXCELLENT (max/min < 3x)');
    } else if (ratio < 5) {
      console.log('  ✓ Consistency: GOOD (max/min < 5x)');
    } else if (ratio < 10) {
      console.log('  ⚠️  Consistency: ACCEPTABLE (max/min < 10x)');
    } else {
      console.log('  ✗ Consistency: POOR (max/min ≥ 10x)');
    }

    console.log('');
  }
}

/**
 * Main stress test execution
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║     API Gateway Stress Tests                       ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  const suite = new StressTestSuite();
  await suite.setup();
  await suite.warmup();

  // Test 1: Throughput test
  const throughputResults = await suite.runThroughputTest();
  suite.printResults('Throughput Stress Test', throughputResults);
  suite.evaluatePerformance(throughputResults);

  // Test 2: Sustained load test
  const sustainedResults = await suite.runSustainedLoadTest();
  suite.printResults('Sustained Load Test', sustainedResults);
  suite.evaluatePerformance(sustainedResults);

  // Test 3: Memory stress test
  await suite.runMemoryStressTest();

  console.log('\n' + '='.repeat(60));
  console.log('Stress Testing Complete');
  console.log('='.repeat(60));
  console.log('\nKey Metrics:');
  console.log(`  Peak Throughput:      ${Math.max(throughputResults.requestsPerSecond, sustainedResults.requestsPerSecond).toFixed(2)} req/sec`);
  console.log(`  Best P95:             ${Math.min(throughputResults.p95, sustainedResults.p95)}ms`);
  console.log(`  Overall Success Rate: ${(((throughputResults.successfulRequests + sustainedResults.successfulRequests) / (throughputResults.totalRequests + sustainedResults.totalRequests)) * 100).toFixed(1)}%`);
  console.log('\nRecommendations:');
  console.log('  • Monitor memory usage in production');
  console.log('  • Consider connection pooling for high load');
  console.log('  • Implement circuit breakers for service failures');
  console.log('  • Add caching layer for frequently accessed data');
  console.log('  • Set up auto-scaling based on request rate\n');
}

// Run tests
if (import.meta.url.includes('stress-test.ts')) {
  main().catch(console.error);
}

export { StressTestSuite, main };
