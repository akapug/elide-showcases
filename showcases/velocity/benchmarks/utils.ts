/**
 * Benchmark Utilities
 * Common utilities for running benchmarks
 */

export interface BenchmarkResult {
  framework: string;
  requestsPerSec: number;
  avgLatency: number;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
  maxLatency: number;
  totalRequests: number;
  errors: number;
}

export async function runBenchmark(
  url: string,
  duration: number = 10,
  connections: number = 100
): Promise<BenchmarkResult> {
  const results: number[] = [];
  const startTime = Date.now();
  let totalRequests = 0;
  let errors = 0;

  const makeRequest = async (): Promise<number> => {
    const start = performance.now();
    try {
      const response = await fetch(url);
      if (!response.ok) {
        errors++;
      }
      await response.text();
      return performance.now() - start;
    } catch (error) {
      errors++;
      return performance.now() - start;
    }
  };

  // Warmup
  for (let i = 0; i < 100; i++) {
    await makeRequest();
  }

  // Reset counters after warmup
  results.length = 0;
  totalRequests = 0;
  errors = 0;

  // Run benchmark
  const promises: Promise<void>[] = [];

  for (let i = 0; i < connections; i++) {
    promises.push(
      (async () => {
        while (Date.now() - startTime < duration * 1000) {
          const latency = await makeRequest();
          results.push(latency);
          totalRequests++;
        }
      })()
    );
  }

  await Promise.all(promises);

  // Calculate statistics
  results.sort((a, b) => a - b);

  const sum = results.reduce((a, b) => a + b, 0);
  const avgLatency = sum / results.length;
  const p50Latency = results[Math.floor(results.length * 0.5)];
  const p95Latency = results[Math.floor(results.length * 0.95)];
  const p99Latency = results[Math.floor(results.length * 0.99)];
  const maxLatency = results[results.length - 1];

  const actualDuration = (Date.now() - startTime) / 1000;
  const requestsPerSec = Math.round(totalRequests / actualDuration);

  return {
    framework: '',
    requestsPerSec,
    avgLatency: Number(avgLatency.toFixed(2)),
    p50Latency: Number(p50Latency.toFixed(2)),
    p95Latency: Number(p95Latency.toFixed(2)),
    p99Latency: Number(p99Latency.toFixed(2)),
    maxLatency: Number(maxLatency.toFixed(2)),
    totalRequests,
    errors,
  };
}

export function formatResult(result: BenchmarkResult): void {
  console.log(`\n${result.framework} Results:`);
  console.log(`  Requests/sec: ${result.requestsPerSec.toLocaleString()}`);
  console.log(`  Total requests: ${result.totalRequests.toLocaleString()}`);
  console.log(`  Errors: ${result.errors}`);
  console.log(`  Latency (ms):`);
  console.log(`    Average: ${result.avgLatency}`);
  console.log(`    P50: ${result.p50Latency}`);
  console.log(`    P95: ${result.p95Latency}`);
  console.log(`    P99: ${result.p99Latency}`);
  console.log(`    Max: ${result.maxLatency}`);
}

export function compareResults(baseline: BenchmarkResult, ...others: BenchmarkResult[]): void {
  console.log('\n' + '='.repeat(80));
  console.log('PERFORMANCE COMPARISON');
  console.log('='.repeat(80));

  const allResults = [baseline, ...others];

  // Find fastest
  const fastest = allResults.reduce((prev, current) =>
    current.requestsPerSec > prev.requestsPerSec ? current : prev
  );

  console.log('\nRequests/sec comparison:');
  for (const result of allResults) {
    const percentage = ((result.requestsPerSec / fastest.requestsPerSec) * 100).toFixed(1);
    const diff = result.requestsPerSec - baseline.requestsPerSec;
    const diffSign = diff >= 0 ? '+' : '';
    const speedup = (result.requestsPerSec / baseline.requestsPerSec).toFixed(2);

    console.log(
      `  ${result.framework.padEnd(15)} ${result.requestsPerSec.toLocaleString().padStart(10)} req/sec  ` +
      `(${percentage}%)  ${diffSign}${diff.toLocaleString().padStart(8)}  ${speedup}x`
    );
  }

  // Find lowest latency
  const lowestLatency = allResults.reduce((prev, current) =>
    current.p99Latency < prev.p99Latency ? current : prev
  );

  console.log('\nP99 Latency comparison:');
  for (const result of allResults) {
    const percentage = ((result.p99Latency / lowestLatency.p99Latency) * 100).toFixed(1);
    const diff = result.p99Latency - baseline.p99Latency;
    const diffSign = diff >= 0 ? '+' : '';

    console.log(
      `  ${result.framework.padEnd(15)} ${result.p99Latency.toFixed(2).padStart(8)} ms  ` +
      `(${percentage}%)  ${diffSign}${diff.toFixed(2).padStart(8)} ms`
    );
  }

  console.log('\n' + '='.repeat(80));
}

export async function waitForServer(url: string, timeout: number = 5000): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return true;
      }
    } catch (error) {
      // Server not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return false;
}
