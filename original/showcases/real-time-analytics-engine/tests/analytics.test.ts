/**
 * Tests for analytics operations.
 * Validates correctness of pandas/polars analytics functions.
 */

import { EventBuffer } from '../src/event-buffer';
import { Event } from '../bridge/dataframe-bridge';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function generateTestEvents(count: number): Event[] {
  const events: Event[] = [];
  const eventTypes = ['click', 'view', 'purchase'];
  const users = ['user_1', 'user_2', 'user_3'];

  for (let i = 0; i < count; i++) {
    events.push({
      timestamp: Date.now() - (i * 1000),
      event_type: eventTypes[i % eventTypes.length],
      user_id: users[i % users.length],
      value: (i + 1) * 10,
      metadata: { index: i }
    });
  }

  return events;
}

async function runTest(name: string, testFn: () => Promise<void>): Promise<TestResult> {
  try {
    await testFn();
    console.log(`✓ ${name}`);
    return { name, passed: true };
  } catch (error: any) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${error.message}`);
    return { name, passed: false, error: error.message };
  }
}

async function testBasicAggregation(): Promise<void> {
  const buffer = new EventBuffer({ engine: 'polars' });
  const events = generateTestEvents(9);

  await buffer.addBatch(events);
  await buffer.flush();

  const analytics = buffer.getAnalytics();
  const results = await analytics.computeAggregations(['event_type'], ['value']);

  assert(results.length === 3, 'Should have 3 event types');
  assert(results.every((r: any) => r.value_sum > 0), 'All sums should be positive');

  buffer.stop();
}

async function testWindowedAggregation(): Promise<void> {
  const buffer = new EventBuffer({ engine: 'polars' });
  const events = generateTestEvents(60);

  await buffer.addBatch(events);
  await buffer.flush();

  const analytics = buffer.getAnalytics();
  const results = await analytics.windowedAggregation({
    windowSize: '10s',
    groupBy: 'event_type',
    metric: 'value',
    aggFunc: 'sum'
  });

  assert(Array.isArray(results), 'Results should be an array');
  assert(results.length > 0, 'Should have windowed results');

  buffer.stop();
}

async function testPercentileCalculation(): Promise<void> {
  const buffer = new EventBuffer({ engine: 'polars' });
  const events = generateTestEvents(100);

  await buffer.addBatch(events);
  await buffer.flush();

  const analytics = buffer.getAnalytics();
  const percentiles = await analytics.calculatePercentiles('value', [0.5, 0.95, 0.99]);

  assert(percentiles.p50 !== undefined, 'P50 should be defined');
  assert(percentiles.p95 !== undefined, 'P95 should be defined');
  assert(percentiles.p99 !== undefined, 'P99 should be defined');
  assert(percentiles.p50 < percentiles.p95, 'P50 < P95');
  assert(percentiles.p95 < percentiles.p99, 'P95 < P99');

  buffer.stop();
}

async function testAnomalyDetection(): Promise<void> {
  const buffer = new EventBuffer({ engine: 'polars' });
  const events = generateTestEvents(100);

  // Add some outliers
  events.push({
    timestamp: Date.now(),
    event_type: 'click',
    user_id: 'user_outlier',
    value: 10000, // Outlier
    metadata: {}
  });

  await buffer.addBatch(events);
  await buffer.flush();

  const analytics = buffer.getAnalytics();
  const anomalies = await analytics.detectAnomalies('value', 3.0);

  assert(Array.isArray(anomalies), 'Anomalies should be an array');
  assert(anomalies.length > 0, 'Should detect at least one anomaly');

  buffer.stop();
}

async function testTopN(): Promise<void> {
  const buffer = new EventBuffer({ engine: 'polars' });
  const events = generateTestEvents(50);

  await buffer.addBatch(events);
  await buffer.flush();

  const analytics = buffer.getAnalytics();
  const topUsers = await analytics.topNByMetric('user_id', 'value', 2);

  assert(Array.isArray(topUsers), 'Results should be an array');
  assert(topUsers.length <= 2, 'Should return at most 2 results');
  assert(topUsers.length > 0, 'Should return at least 1 result');

  buffer.stop();
}

async function testSummaryStats(): Promise<void> {
  const buffer = new EventBuffer({ engine: 'polars' });
  const events = generateTestEvents(100);

  await buffer.addBatch(events);
  await buffer.flush();

  const analytics = buffer.getAnalytics();
  const stats = await analytics.getSummaryStats(['value']);

  assert(stats.row_count === 100, 'Should have 100 rows');
  assert(stats.summary !== undefined, 'Should have summary stats');

  buffer.stop();
}

async function testBatchProcessing(): Promise<void> {
  const buffer = new EventBuffer({ engine: 'polars', maxSize: 100 });
  const events = generateTestEvents(250);

  // Add in multiple batches
  await buffer.addBatch(events.slice(0, 100));
  await buffer.flush();

  await buffer.addBatch(events.slice(100, 200));
  await buffer.flush();

  await buffer.addBatch(events.slice(200));
  await buffer.flush();

  const analytics = buffer.getAnalytics();
  const stats = await analytics.getSummaryStats();

  assert(stats.row_count > 0, 'Should have processed events');

  buffer.stop();
}

async function testEmptyDataHandling(): Promise<void> {
  const buffer = new EventBuffer({ engine: 'polars' });
  const analytics = buffer.getAnalytics();

  // Test operations on empty dataset
  const results = await analytics.computeAggregations(['event_type'], ['value']);
  assert(Array.isArray(results), 'Should return array even when empty');

  const percentiles = await analytics.calculatePercentiles('value');
  assert(typeof percentiles === 'object', 'Should return object even when empty');

  buffer.stop();
}

async function testDataTypeConsistency(): Promise<void> {
  const buffer = new EventBuffer({ engine: 'polars' });
  const events: Event[] = [
    {
      timestamp: Date.now(),
      event_type: 'click',
      user_id: 'user_1',
      value: 100.5,
      metadata: { source: 'web' }
    },
    {
      timestamp: Date.now() - 1000,
      event_type: 'view',
      user_id: 'user_2',
      value: 50.25,
      metadata: { source: 'mobile' }
    }
  ];

  await buffer.addBatch(events);
  await buffer.flush();

  const analytics = buffer.getAnalytics();
  const results = await analytics.computeAggregations(['event_type'], ['value']);

  assert(results.length === 2, 'Should have 2 event types');
  results.forEach((r: any) => {
    assert(typeof r.event_type === 'string', 'event_type should be string');
    assert(typeof r.value_sum === 'number', 'value_sum should be number');
  });

  buffer.stop();
}

async function testHighVolumeIngestion(): Promise<void> {
  const buffer = new EventBuffer({ engine: 'polars', maxSize: 10000 });
  const events = generateTestEvents(5000);

  const startTime = Date.now();
  await buffer.addBatch(events);
  await buffer.flush();
  const duration = Date.now() - startTime;

  assert(duration < 5000, `Should process 5K events in <5s (took ${duration}ms)`);

  const analytics = buffer.getAnalytics();
  const stats = await analytics.getSummaryStats();
  assert(stats.row_count === 5000, 'Should have all 5000 events');

  buffer.stop();
}

async function runAllTests(): Promise<void> {
  console.log('='.repeat(60));
  console.log('ANALYTICS TESTS');
  console.log('='.repeat(60));
  console.log('Testing pandas/polars analytics operations\n');

  const results: TestResult[] = [];

  results.push(await runTest('Basic Aggregation', testBasicAggregation));
  results.push(await runTest('Windowed Aggregation', testWindowedAggregation));
  results.push(await runTest('Percentile Calculation', testPercentileCalculation));
  results.push(await runTest('Anomaly Detection', testAnomalyDetection));
  results.push(await runTest('Top N Query', testTopN));
  results.push(await runTest('Summary Statistics', testSummaryStats));
  results.push(await runTest('Batch Processing', testBatchProcessing));
  results.push(await runTest('Empty Data Handling', testEmptyDataHandling));
  results.push(await runTest('Data Type Consistency', testDataTypeConsistency));
  results.push(await runTest('High Volume Ingestion', testHighVolumeIngestion));

  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`Total:  ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    console.log('\nFailed tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
  }

  console.log('='.repeat(60));

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});
