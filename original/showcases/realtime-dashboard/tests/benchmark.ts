/**
 * Performance Benchmarks
 *
 * Benchmarks for measuring update latency, throughput, and resource usage
 * of the real-time dashboard system.
 */

import { metricsCollector, MetricsCollector } from '../backend/metrics-collector.ts';
import { dataAggregator, DataAggregator } from '../backend/data-aggregator.ts';
import { dashboardServer, DashboardServer } from '../backend/server.ts';

/**
 * Benchmark result
 */
interface BenchmarkResult {
  name: string;
  operations: number;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  opsPerSecond: number;
  percentiles: {
    p50: number;
    p90: number;
    p95: number;
    p99: number;
  };
}

/**
 * Benchmark runner
 */
class BenchmarkRunner {
  private results: BenchmarkResult[] = [];

  /**
   * Run a benchmark
   */
  public async benchmark(
    name: string,
    fn: () => Promise<void> | void,
    iterations: number = 1000
  ): Promise<BenchmarkResult> {
    console.log(`Running benchmark: ${name} (${iterations} iterations)`);

    const times: number[] = [];
    const startTotal = performance.now();

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      const duration = performance.now() - start;
      times.push(duration);
    }

    const totalTime = performance.now() - startTotal;
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const opsPerSecond = (iterations / totalTime) * 1000;

    // Calculate percentiles
    const sorted = times.sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.50)];
    const p90 = sorted[Math.floor(sorted.length * 0.90)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];

    const result: BenchmarkResult = {
      name,
      operations: iterations,
      totalTime,
      avgTime,
      minTime,
      maxTime,
      opsPerSecond,
      percentiles: { p50, p90, p95, p99 },
    };

    this.results.push(result);
    return result;
  }

  /**
   * Print results
   */
  public printResults(): void {
    console.log('\n' + '='.repeat(80));
    console.log('BENCHMARK RESULTS');
    console.log('='.repeat(80));

    for (const result of this.results) {
      console.log(`\n${result.name}`);
      console.log('-'.repeat(80));
      console.log(`  Operations:      ${result.operations}`);
      console.log(`  Total Time:      ${result.totalTime.toFixed(2)} ms`);
      console.log(`  Average:         ${result.avgTime.toFixed(4)} ms`);
      console.log(`  Min:             ${result.minTime.toFixed(4)} ms`);
      console.log(`  Max:             ${result.maxTime.toFixed(4)} ms`);
      console.log(`  Throughput:      ${result.opsPerSecond.toFixed(2)} ops/sec`);
      console.log(`  Percentiles:`);
      console.log(`    P50:           ${result.percentiles.p50.toFixed(4)} ms`);
      console.log(`    P90:           ${result.percentiles.p90.toFixed(4)} ms`);
      console.log(`    P95:           ${result.percentiles.p95.toFixed(4)} ms`);
      console.log(`    P99:           ${result.percentiles.p99.toFixed(4)} ms`);
    }

    console.log('\n' + '='.repeat(80));
  }

  /**
   * Get summary
   */
  public getSummary(): Record<string, any> {
    return {
      benchmarks: this.results.length,
      results: this.results.map(r => ({
        name: r.name,
        avgTime: r.avgTime,
        opsPerSecond: r.opsPerSecond,
        p95: r.percentiles.p95,
      })),
    };
  }
}

/**
 * Run all benchmarks
 */
async function runBenchmarks(): Promise<void> {
  const runner = new BenchmarkRunner();

  console.log('='.repeat(80));
  console.log('REAL-TIME DASHBOARD PERFORMANCE BENCHMARKS');
  console.log('='.repeat(80));
  console.log();

  // Benchmark 1: System metrics collection
  await runner.benchmark(
    'System Metrics Collection',
    async () => {
      const collector = new MetricsCollector();
      await collector.collectSystemMetrics();
    },
    1000
  );

  // Benchmark 2: Application metrics collection
  await runner.benchmark(
    'Application Metrics Collection',
    () => {
      const collector = new MetricsCollector();
      collector.simulateTraffic();
      collector.collectApplicationMetrics();
    },
    1000
  );

  // Benchmark 3: Request recording
  await runner.benchmark(
    'Request Recording',
    () => {
      const collector = new MetricsCollector();
      collector.recordRequest(50);
    },
    10000
  );

  // Benchmark 4: Error recording
  await runner.benchmark(
    'Error Recording',
    () => {
      const collector = new MetricsCollector();
      collector.recordError('timeout', 'Connection timeout');
    },
    10000
  );

  // Benchmark 5: Data aggregation
  const aggregator = new DataAggregator();
  const collector = new MetricsCollector();

  // Prepare data
  for (let i = 0; i < 100; i++) {
    const metrics = await collector.collectSystemMetrics();
    aggregator.addSystemMetrics(metrics);
  }

  await runner.benchmark(
    'Data Aggregation (100 data points)',
    () => {
      const now = Date.now();
      aggregator.aggregateMetrics(now - 60000, now);
    },
    1000
  );

  // Benchmark 6: Time series extraction
  await runner.benchmark(
    'Time Series Extraction',
    () => {
      aggregator.getTimeSeries('cpu.usage');
    },
    1000
  );

  // Benchmark 7: Moving average calculation
  const timeSeries = aggregator.getTimeSeries('cpu.usage');
  await runner.benchmark(
    'Moving Average Calculation',
    () => {
      aggregator.calculateMovingAverage(timeSeries, 10);
    },
    1000
  );

  // Benchmark 8: Anomaly detection
  await runner.benchmark(
    'Anomaly Detection',
    () => {
      aggregator.detectAnomalies(timeSeries, 2.5);
    },
    100
  );

  // Benchmark 9: End-to-end update cycle
  await runner.benchmark(
    'End-to-End Update Cycle',
    async () => {
      const collector = new MetricsCollector();
      const aggregator = new DataAggregator();

      // Collect metrics
      const systemMetrics = await collector.collectSystemMetrics();
      const appMetrics = collector.collectApplicationMetrics();

      // Add to aggregator
      aggregator.addSystemMetrics(systemMetrics);
      aggregator.addApplicationMetrics(appMetrics);

      // Get summary
      aggregator.getSummaryStatistics(5);
    },
    100
  );

  // Print results
  runner.printResults();

  // Print key findings
  printKeyFindings(runner);
}

/**
 * Print key findings from benchmarks
 */
function printKeyFindings(runner: BenchmarkRunner): void {
  const summary = runner.getSummary();

  console.log('\n' + '='.repeat(80));
  console.log('KEY FINDINGS');
  console.log('='.repeat(80));

  const updateCycle = summary.results.find((r: any) => r.name === 'End-to-End Update Cycle');
  if (updateCycle) {
    console.log(`\nUpdate Latency:`);
    console.log(`  Average: ${updateCycle.avgTime.toFixed(2)} ms`);
    console.log(`  P95:     ${updateCycle.p95.toFixed(2)} ms`);

    if (updateCycle.avgTime < 50) {
      console.log(`  ✓ Excellent! Well below 100ms target`);
    } else if (updateCycle.avgTime < 100) {
      console.log(`  ✓ Good! Meets the 100ms target`);
    } else {
      console.log(`  ✗ Warning! Exceeds 100ms target`);
    }
  }

  const systemMetrics = summary.results.find((r: any) => r.name === 'System Metrics Collection');
  if (systemMetrics) {
    console.log(`\nSystem Metrics Collection:`);
    console.log(`  Throughput: ${systemMetrics.opsPerSecond.toFixed(0)} ops/sec`);
    console.log(`  Can support updates every ${(1000 / systemMetrics.opsPerSecond).toFixed(0)} ms`);
  }

  const requestRecording = summary.results.find((r: any) => r.name === 'Request Recording');
  if (requestRecording) {
    console.log(`\nRequest Recording:`);
    console.log(`  Throughput: ${requestRecording.opsPerSecond.toFixed(0)} requests/sec`);
    console.log(`  Can handle high-traffic applications`);
  }

  console.log('\n' + '='.repeat(80));
}

/**
 * Run real-time update benchmark
 */
async function benchmarkRealTimeUpdates(): Promise<void> {
  console.log('\n' + '='.repeat(80));
  console.log('REAL-TIME UPDATE BENCHMARK');
  console.log('='.repeat(80));

  const updateFrequencies = [100, 250, 500, 1000, 2000, 5000];
  const duration = 10000; // 10 seconds

  console.log('\nTesting different update frequencies:');
  console.log(`Duration: ${duration / 1000} seconds\n`);

  for (const frequency of updateFrequencies) {
    const collector = new MetricsCollector();
    const aggregator = new DataAggregator();

    let updates = 0;
    let totalLatency = 0;
    const latencies: number[] = [];

    const startTime = Date.now();
    const endTime = startTime + duration;

    while (Date.now() < endTime) {
      const updateStart = performance.now();

      // Simulate update cycle
      const systemMetrics = await collector.collectSystemMetrics();
      collector.simulateTraffic();
      const appMetrics = collector.collectApplicationMetrics();

      aggregator.addSystemMetrics(systemMetrics);
      aggregator.addApplicationMetrics(appMetrics);

      const updateLatency = performance.now() - updateStart;
      latencies.push(updateLatency);
      totalLatency += updateLatency;
      updates++;

      // Wait for next update
      const nextUpdate = startTime + updates * frequency;
      const waitTime = nextUpdate - Date.now();
      if (waitTime > 0) {
        await sleep(waitTime);
      }
    }

    // Calculate statistics
    const avgLatency = totalLatency / updates;
    const sorted = latencies.sort((a, b) => a - b);
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];

    console.log(`Frequency: ${frequency}ms (${1000 / frequency} updates/sec)`);
    console.log(`  Updates:     ${updates}`);
    console.log(`  Avg Latency: ${avgLatency.toFixed(2)} ms`);
    console.log(`  P95 Latency: ${p95.toFixed(2)} ms`);
    console.log(`  P99 Latency: ${p99.toFixed(2)} ms`);

    if (p95 < 100) {
      console.log(`  ✓ P95 latency < 100ms\n`);
    } else {
      console.log(`  ✗ P95 latency >= 100ms\n`);
    }
  }

  console.log('='.repeat(80));
}

/**
 * Helper function to sleep
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main benchmark execution
 */
async function main() {
  // Run standard benchmarks
  await runBenchmarks();

  // Run real-time update benchmark
  await benchmarkRealTimeUpdates();

  console.log('\n✓ All benchmarks completed\n');
}

// Run benchmarks if this is the main module
if (import.meta.main) {
  main();
}

export { runBenchmarks, benchmarkRealTimeUpdates };
