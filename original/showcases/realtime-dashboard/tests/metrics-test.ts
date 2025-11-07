/**
 * Metrics Collection and Aggregation Tests
 *
 * Tests for the metrics collection, aggregation, and API functionality.
 */

import { metricsCollector, MetricsCollector } from '../backend/metrics-collector.ts';
import { dataAggregator, DataAggregator } from '../backend/data-aggregator.ts';
import { apiHandler, parseRequest } from '../backend/api.ts';

/**
 * Simple test runner
 */
class TestRunner {
  private passed: number = 0;
  private failed: number = 0;
  private tests: { name: string; fn: () => Promise<void> | void }[] = [];

  public test(name: string, fn: () => Promise<void> | void): void {
    this.tests.push({ name, fn });
  }

  public async run(): Promise<void> {
    console.log('='.repeat(60));
    console.log('Running Tests');
    console.log('='.repeat(60));
    console.log();

    for (const test of this.tests) {
      try {
        await test.fn();
        this.passed++;
        console.log(`✓ ${test.name}`);
      } catch (error) {
        this.failed++;
        console.log(`✗ ${test.name}`);
        console.log(`  Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    console.log();
    console.log('='.repeat(60));
    console.log(`Tests: ${this.passed + this.failed}`);
    console.log(`Passed: ${this.passed}`);
    console.log(`Failed: ${this.failed}`);
    console.log('='.repeat(60));
  }
}

/**
 * Assertion functions
 */
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEqual<T>(actual: T, expected: T, message?: string): void {
  if (actual !== expected) {
    const msg = message || `Expected ${expected} but got ${actual}`;
    throw new Error(msg);
  }
}

function assertGreaterThan(actual: number, expected: number, message?: string): void {
  if (actual <= expected) {
    const msg = message || `Expected ${actual} to be greater than ${expected}`;
    throw new Error(msg);
  }
}

function assertLessThan(actual: number, expected: number, message?: string): void {
  if (actual >= expected) {
    const msg = message || `Expected ${actual} to be less than ${expected}`;
    throw new Error(msg);
  }
}

function assertExists<T>(value: T | null | undefined, message?: string): void {
  if (value === null || value === undefined) {
    const msg = message || 'Expected value to exist';
    throw new Error(msg);
  }
}

/**
 * Test suites
 */
const runner = new TestRunner();

// Metrics Collector Tests
runner.test('MetricsCollector: should collect system metrics', async () => {
  const collector = new MetricsCollector();
  const metrics = await collector.collectSystemMetrics();

  assertExists(metrics);
  assertExists(metrics.cpu);
  assertExists(metrics.memory);
  assertExists(metrics.disk);
  assertExists(metrics.network);

  assertGreaterThan(metrics.cpu.cores, 0, 'CPU cores should be positive');
  assertGreaterThan(metrics.memory.total, 0, 'Memory total should be positive');
});

runner.test('MetricsCollector: CPU metrics should be in valid range', async () => {
  const collector = new MetricsCollector();
  const metrics = await collector.collectSystemMetrics();

  assert(
    metrics.cpu.usage >= 0 && metrics.cpu.usage <= 100,
    'CPU usage should be between 0 and 100'
  );
  assert(metrics.cpu.loadAverage.length === 3, 'Load average should have 3 values');
});

runner.test('MetricsCollector: Memory metrics should be consistent', async () => {
  const collector = new MetricsCollector();
  const metrics = await collector.collectSystemMetrics();

  assert(
    metrics.memory.used + metrics.memory.free <= metrics.memory.total * 1.1,
    'Used + Free should not exceed Total (with 10% tolerance)'
  );
  assert(
    metrics.memory.usagePercent >= 0 && metrics.memory.usagePercent <= 100,
    'Memory usage percent should be between 0 and 100'
  );
});

runner.test('MetricsCollector: should record application metrics', () => {
  const collector = new MetricsCollector();

  collector.recordRequest(50);
  collector.recordRequest(75);
  collector.recordRequest(100);

  const appMetrics = collector.collectApplicationMetrics();

  assertEqual(appMetrics.requests.total, 3, 'Should have recorded 3 requests');
  assertGreaterThan(appMetrics.latency.average, 0, 'Average latency should be positive');
});

runner.test('MetricsCollector: should track errors', () => {
  const collector = new MetricsCollector();

  collector.recordError('timeout', 'Connection timeout');
  collector.recordError('500', 'Internal server error');

  const appMetrics = collector.collectApplicationMetrics();

  assertEqual(appMetrics.errors.total, 2, 'Should have recorded 2 errors');
  assert(appMetrics.errors.byType['timeout'] === 1, 'Should track timeout errors');
  assert(appMetrics.errors.byType['500'] === 1, 'Should track 500 errors');
});

runner.test('MetricsCollector: should maintain history', async () => {
  const collector = new MetricsCollector();

  await collector.collectSystemMetrics();
  await collector.collectSystemMetrics();
  await collector.collectSystemMetrics();

  const history = collector.getSystemMetricsHistory();

  assertGreaterThan(history.length, 0, 'History should not be empty');
  assertLessThan(history.length, 4, 'History should have at most 3 entries');
});

// Data Aggregator Tests
runner.test('DataAggregator: should aggregate metrics over time window', async () => {
  const aggregator = new DataAggregator();
  const collector = new MetricsCollector();

  const now = Date.now();
  for (let i = 0; i < 5; i++) {
    const metrics = await collector.collectSystemMetrics();
    aggregator.addSystemMetrics(metrics);
    await sleep(10);
  }

  const aggregated = aggregator.aggregateMetrics(now - 1000, now + 1000);

  assertExists(aggregated, 'Aggregated metrics should exist');
  assertGreaterThan(aggregated!.dataPoints, 0, 'Should have data points');
  assertExists(aggregated!.cpu, 'Should have CPU aggregation');
  assertExists(aggregated!.memory, 'Should have memory aggregation');
});

runner.test('DataAggregator: should calculate moving average', () => {
  const aggregator = new DataAggregator();

  const data = [
    { timestamp: 1000, value: 10 },
    { timestamp: 2000, value: 20 },
    { timestamp: 3000, value: 30 },
    { timestamp: 4000, value: 40 },
    { timestamp: 5000, value: 50 },
  ];

  const result = aggregator.calculateMovingAverage(data, 3);

  assertGreaterThan(result.length, 0, 'Should have moving average results');
  assert(result[result.length - 1].ma > 0, 'Moving average should be positive');
});

runner.test('DataAggregator: should detect anomalies', () => {
  const aggregator = new DataAggregator();

  // Normal data with one anomaly
  const data = [
    ...Array(10).fill(0).map((_, i) => ({ timestamp: i * 1000, value: 50 })),
    { timestamp: 10000, value: 200 }, // Anomaly
    ...Array(10).fill(0).map((_, i) => ({ timestamp: (i + 11) * 1000, value: 50 })),
  ];

  const anomalies = aggregator.detectAnomalies(data, 2.0);

  const detectedAnomalies = anomalies.filter(a => a.isAnomaly);
  assertGreaterThan(detectedAnomalies.length, 0, 'Should detect at least one anomaly');
});

runner.test('DataAggregator: should get time series data', async () => {
  const aggregator = new DataAggregator();
  const collector = new MetricsCollector();

  for (let i = 0; i < 5; i++) {
    const metrics = await collector.collectSystemMetrics();
    aggregator.addSystemMetrics(metrics);
  }

  const timeSeries = aggregator.getTimeSeries('cpu.usage');

  assertGreaterThan(timeSeries.length, 0, 'Should have time series data');
  assert(timeSeries[0].timestamp > 0, 'Should have valid timestamp');
  assert(typeof timeSeries[0].value === 'number', 'Should have numeric value');
});

// API Handler Tests
runner.test('API: should handle health check request', async () => {
  const request = parseRequest('GET', '/api/health');
  const response = await apiHandler.handleRequest(request);

  assert(response.success === true, 'Health check should succeed');
  assertExists(response.data, 'Should have data');
});

runner.test('API: should handle current metrics request', async () => {
  const request = parseRequest('GET', '/api/metrics/current');
  const response = await apiHandler.handleRequest(request);

  assert(response.success === true, 'Current metrics request should succeed');
  assertExists(response.data, 'Should have metrics data');
  assertExists(response.data.system, 'Should have system metrics');
  assertExists(response.data.application, 'Should have application metrics');
});

runner.test('API: should parse query parameters', () => {
  const request = parseRequest('GET', '/api/metrics/timeseries?metric=cpu.usage&limit=50');

  assertEqual(request.path, '/api/metrics/timeseries');
  assertEqual(request.query.metric, 'cpu.usage');
  assertEqual(request.query.limit, '50');
});

runner.test('API: should handle unknown routes', async () => {
  const request = parseRequest('GET', '/api/unknown');
  const response = await apiHandler.handleRequest(request);

  assert(response.success === false, 'Unknown route should fail');
  assertExists(response.error, 'Should have error message');
});

runner.test('API: should handle metrics simulation', async () => {
  const request = parseRequest('POST', '/api/metrics/simulate');
  const response = await apiHandler.handleRequest(request);

  assert(response.success === true, 'Simulation should succeed');
});

// Performance Tests
runner.test('Performance: metrics collection should be fast', async () => {
  const collector = new MetricsCollector();
  const startTime = performance.now();

  await collector.collectSystemMetrics();

  const duration = performance.now() - startTime;
  assertLessThan(duration, 100, 'Metrics collection should take less than 100ms');
});

runner.test('Performance: application metrics should be fast', () => {
  const collector = new MetricsCollector();

  // Simulate some traffic
  for (let i = 0; i < 100; i++) {
    collector.recordRequest(Math.random() * 100);
  }

  const startTime = performance.now();
  collector.collectApplicationMetrics();
  const duration = performance.now() - startTime;

  assertLessThan(duration, 50, 'Application metrics should take less than 50ms');
});

runner.test('Performance: aggregation should handle large datasets', async () => {
  const aggregator = new DataAggregator();
  const collector = new MetricsCollector();

  // Add 100 data points
  for (let i = 0; i < 100; i++) {
    const metrics = await collector.collectSystemMetrics();
    aggregator.addSystemMetrics(metrics);
  }

  const startTime = performance.now();
  const timeSeries = aggregator.getTimeSeries('cpu.usage');
  const duration = performance.now() - startTime;

  assertGreaterThan(timeSeries.length, 0, 'Should have time series data');
  assertLessThan(duration, 100, 'Time series extraction should take less than 100ms');
});

/**
 * Helper function to sleep
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main test execution
 */
export async function runTests(): Promise<void> {
  await runner.run();
}

// Run tests if this is the main module
if (import.meta.main) {
  runTests();
}
