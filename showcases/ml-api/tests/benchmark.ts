/**
 * Performance Benchmarks - Load and Stress Testing
 *
 * Comprehensive performance benchmarks for ML API:
 * - Throughput testing
 * - Latency measurements
 * - Concurrent request handling
 * - Cache performance
 * - Resource utilization
 *
 * @module tests/benchmark
 */

import http from 'http';
import { performance } from 'perf_hooks';

// Benchmark configuration
const CONFIG = {
  apiUrl: process.env.API_URL || 'http://localhost:3000',
  apiKey: process.env.API_KEY || 'demo_pro_key_456',
  warmupRequests: 10,
  benchmarkDuration: 30000, // 30 seconds
  concurrency: [1, 5, 10, 20, 50],
  requestsPerTest: 100,
};

// Benchmark result
interface BenchmarkResult {
  name: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  duration: number;
  requestsPerSecond: number;
  avgLatency: number;
  minLatency: number;
  maxLatency: number;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
  latencies: number[];
}

/**
 * Make HTTP request with timing
 */
function makeRequest(
  method: string,
  path: string,
  body?: any,
  headers?: Record<string, string>
): Promise<{ success: boolean; latency: number; statusCode: number }> {
  return new Promise((resolve) => {
    const startTime = performance.now();
    const url = new URL(path, CONFIG.apiUrl);

    const options: http.RequestOptions = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': CONFIG.apiKey,
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const latency = performance.now() - startTime;
        resolve({
          success: (res.statusCode || 0) >= 200 && (res.statusCode || 0) < 300,
          latency,
          statusCode: res.statusCode || 0,
        });
      });
    });

    req.on('error', () => {
      const latency = performance.now() - startTime;
      resolve({
        success: false,
        latency,
        statusCode: 0,
      });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

/**
 * Calculate percentile
 */
function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * Run benchmark
 */
async function runBenchmark(
  name: string,
  requestFn: () => Promise<{ success: boolean; latency: number; statusCode: number }>,
  count: number,
  concurrency: number = 1
): Promise<BenchmarkResult> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Benchmark: ${name}`);
  console.log(`Requests: ${count}, Concurrency: ${concurrency}`);
  console.log('='.repeat(60));

  const latencies: number[] = [];
  let successfulRequests = 0;
  let failedRequests = 0;

  const startTime = performance.now();

  // Run requests with concurrency
  const batches = Math.ceil(count / concurrency);
  for (let i = 0; i < batches; i++) {
    const batchSize = Math.min(concurrency, count - i * concurrency);
    const promises: Promise<any>[] = [];

    for (let j = 0; j < batchSize; j++) {
      promises.push(requestFn());
    }

    const results = await Promise.all(promises);

    for (const result of results) {
      if (result.success) {
        successfulRequests++;
      } else {
        failedRequests++;
      }
      latencies.push(result.latency);
    }

    // Progress indicator
    const progress = ((i + 1) / batches) * 100;
    process.stdout.write(`\rProgress: ${progress.toFixed(1)}%`);
  }

  const duration = performance.now() - startTime;
  console.log('\n');

  // Calculate statistics
  const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const minLatency = Math.min(...latencies);
  const maxLatency = Math.max(...latencies);
  const p50Latency = percentile(latencies, 50);
  const p95Latency = percentile(latencies, 95);
  const p99Latency = percentile(latencies, 99);
  const requestsPerSecond = (count / duration) * 1000;

  const result: BenchmarkResult = {
    name,
    totalRequests: count,
    successfulRequests,
    failedRequests,
    duration,
    requestsPerSecond,
    avgLatency,
    minLatency,
    maxLatency,
    p50Latency,
    p95Latency,
    p99Latency,
    latencies,
  };

  printResult(result);

  return result;
}

/**
 * Print benchmark result
 */
function printResult(result: BenchmarkResult): void {
  console.log('Results:');
  console.log(`  Total Requests:      ${result.totalRequests}`);
  console.log(`  Successful:          ${result.successfulRequests}`);
  console.log(`  Failed:              ${result.failedRequests}`);
  console.log(`  Duration:            ${result.duration.toFixed(2)}ms`);
  console.log(`  Requests/sec:        ${result.requestsPerSecond.toFixed(2)}`);
  console.log('');
  console.log('Latency:');
  console.log(`  Average:             ${result.avgLatency.toFixed(2)}ms`);
  console.log(`  Min:                 ${result.minLatency.toFixed(2)}ms`);
  console.log(`  Max:                 ${result.maxLatency.toFixed(2)}ms`);
  console.log(`  50th percentile:     ${result.p50Latency.toFixed(2)}ms`);
  console.log(`  95th percentile:     ${result.p95Latency.toFixed(2)}ms`);
  console.log(`  99th percentile:     ${result.p99Latency.toFixed(2)}ms`);
}

/**
 * Warm up server
 */
async function warmUp(): Promise<void> {
  console.log(`Warming up server with ${CONFIG.warmupRequests} requests...`);

  for (let i = 0; i < CONFIG.warmupRequests; i++) {
    await makeRequest('POST', '/api/v1/analyze', {
      text: 'This is a warmup request',
    });
  }

  console.log('Warm up complete\n');
}

/**
 * Run all benchmarks
 */
async function runAllBenchmarks(): Promise<void> {
  console.log('ML API Performance Benchmarks');
  console.log('='.repeat(60));
  console.log(`API URL: ${CONFIG.apiUrl}`);
  console.log(`API Key: ${CONFIG.apiKey.substring(0, 10)}...`);
  console.log('='.repeat(60));

  // Warm up
  await warmUp();

  const results: BenchmarkResult[] = [];

  // 1. Simple sentiment analysis
  results.push(
    await runBenchmark(
      'Simple Sentiment Analysis',
      () =>
        makeRequest('POST', '/api/v1/analyze', {
          text: 'This is a great product!',
        }),
      CONFIG.requestsPerTest,
      5
    )
  );

  // 2. Sentiment analysis with emotions
  results.push(
    await runBenchmark(
      'Sentiment Analysis with Emotions',
      () =>
        makeRequest('POST', '/api/v1/analyze', {
          text: 'I am so happy with this purchase!',
          includeEmotions: true,
        }),
      CONFIG.requestsPerTest,
      5
    )
  );

  // 3. Sentiment analysis with keywords
  results.push(
    await runBenchmark(
      'Sentiment Analysis with Keywords',
      () =>
        makeRequest('POST', '/api/v1/analyze', {
          text: 'This amazing product exceeded all my expectations!',
          includeKeywords: true,
        }),
      CONFIG.requestsPerTest,
      5
    )
  );

  // 4. Full analysis (emotions + keywords)
  results.push(
    await runBenchmark(
      'Full Analysis (Emotions + Keywords)',
      () =>
        makeRequest('POST', '/api/v1/analyze', {
          text: 'I absolutely love this fantastic product! It makes me so happy!',
          includeEmotions: true,
          includeKeywords: true,
        }),
      CONFIG.requestsPerTest,
      5
    )
  );

  // 5. Batch processing (small batch)
  results.push(
    await runBenchmark(
      'Batch Processing (5 texts)',
      () =>
        makeRequest('POST', '/api/v1/batch', {
          texts: [
            'This is great!',
            'This is terrible!',
            'This is okay.',
            'I love it!',
            'Not worth it.',
          ],
        }),
      50,
      3
    )
  );

  // 6. Batch processing (medium batch)
  results.push(
    await runBenchmark(
      'Batch Processing (10 texts)',
      () =>
        makeRequest('POST', '/api/v1/batch', {
          texts: Array(10).fill('This is a test message.'),
        }),
      50,
      3
    )
  );

  // 7. Cache hit performance
  const cachedText = 'Cached text for performance test';
  // Prime the cache
  await makeRequest('POST', '/api/v1/analyze', { text: cachedText });

  results.push(
    await runBenchmark(
      'Cache Hit Performance',
      () =>
        makeRequest('POST', '/api/v1/analyze', {
          text: cachedText,
        }),
      CONFIG.requestsPerTest,
      10
    )
  );

  // 8. Cache miss performance
  let counter = 0;
  results.push(
    await runBenchmark(
      'Cache Miss Performance',
      () =>
        makeRequest('POST', '/api/v1/analyze', {
          text: `Unique text ${counter++}`,
        }),
      CONFIG.requestsPerTest,
      5
    )
  );

  // 9. Concurrency tests
  for (const concurrency of CONFIG.concurrency) {
    results.push(
      await runBenchmark(
        `Concurrency Test (${concurrency} concurrent)`,
        () =>
          makeRequest('POST', '/api/v1/analyze', {
            text: 'This is a concurrency test',
          }),
        concurrency * 10,
        concurrency
      )
    );
  }

  // 10. Long text processing
  const longText = 'This is a really great product. '.repeat(100);
  results.push(
    await runBenchmark(
      'Long Text Processing',
      () =>
        makeRequest('POST', '/api/v1/analyze', {
          text: longText,
        }),
      50,
      3
    )
  );

  // Print summary
  printSummary(results);
}

/**
 * Print summary of all benchmarks
 */
function printSummary(results: BenchmarkResult[]): void {
  console.log('\n' + '='.repeat(60));
  console.log('Summary');
  console.log('='.repeat(60));

  const totalRequests = results.reduce((sum, r) => sum + r.totalRequests, 0);
  const totalSuccessful = results.reduce((sum, r) => sum + r.successfulRequests, 0);
  const totalFailed = results.reduce((sum, r) => sum + r.failedRequests, 0);
  const avgRequestsPerSec = results.reduce((sum, r) => sum + r.requestsPerSecond, 0) / results.length;
  const avgLatency = results.reduce((sum, r) => sum + r.avgLatency, 0) / results.length;

  console.log(`Total Requests:          ${totalRequests}`);
  console.log(`Successful:              ${totalSuccessful}`);
  console.log(`Failed:                  ${totalFailed}`);
  console.log(`Success Rate:            ${((totalSuccessful / totalRequests) * 100).toFixed(2)}%`);
  console.log(`Avg Requests/sec:        ${avgRequestsPerSec.toFixed(2)}`);
  console.log(`Avg Latency:             ${avgLatency.toFixed(2)}ms`);
  console.log('='.repeat(60));

  console.log('\nTop 5 Fastest Tests:');
  const sortedByLatency = [...results].sort((a, b) => a.avgLatency - b.avgLatency);
  for (let i = 0; i < Math.min(5, sortedByLatency.length); i++) {
    const r = sortedByLatency[i];
    console.log(`  ${i + 1}. ${r.name}: ${r.avgLatency.toFixed(2)}ms`);
  }

  console.log('\nTop 5 Highest Throughput Tests:');
  const sortedByThroughput = [...results].sort((a, b) => b.requestsPerSecond - a.requestsPerSecond);
  for (let i = 0; i < Math.min(5, sortedByThroughput.length); i++) {
    const r = sortedByThroughput[i];
    console.log(`  ${i + 1}. ${r.name}: ${r.requestsPerSecond.toFixed(2)} req/s`);
  }

  console.log('\n' + '='.repeat(60));
}

/**
 * Run stress test
 */
async function runStressTest(duration: number): Promise<void> {
  console.log(`\nRunning stress test for ${duration / 1000} seconds...`);

  const startTime = performance.now();
  const endTime = startTime + duration;
  let requestCount = 0;
  let successCount = 0;
  let failCount = 0;
  const latencies: number[] = [];

  const concurrency = 10;
  const promises: Promise<any>[] = [];

  while (performance.now() < endTime) {
    if (promises.length < concurrency) {
      const promise = makeRequest('POST', '/api/v1/analyze', {
        text: `Stress test ${requestCount++}`,
      }).then((result) => {
        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }
        latencies.push(result.latency);

        // Remove from promises array
        const index = promises.indexOf(promise);
        if (index > -1) {
          promises.splice(index, 1);
        }
      });

      promises.push(promise);
    }

    await Promise.race(promises);
  }

  // Wait for remaining promises
  await Promise.all(promises);

  const actualDuration = performance.now() - startTime;

  console.log('\nStress Test Results:');
  console.log(`  Duration:            ${actualDuration.toFixed(2)}ms`);
  console.log(`  Total Requests:      ${requestCount}`);
  console.log(`  Successful:          ${successCount}`);
  console.log(`  Failed:              ${failCount}`);
  console.log(`  Requests/sec:        ${((requestCount / actualDuration) * 1000).toFixed(2)}`);
  console.log(`  Avg Latency:         ${(latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(2)}ms`);
}

// Run benchmarks
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--stress')) {
    const duration = parseInt(args[args.indexOf('--stress') + 1] || '30000', 10);
    runStressTest(duration).catch((error) => {
      console.error('Stress test failed:', error);
      process.exit(1);
    });
  } else {
    runAllBenchmarks().catch((error) => {
      console.error('Benchmarks failed:', error);
      process.exit(1);
    });
  }
}

export { runBenchmark, runAllBenchmarks, runStressTest };
