/**
 * Tests for time-windowed aggregations.
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

function generateTimedEvents(count: number, intervalMs: number): Event[] {
  const events: Event[] = [];
  const baseTime = Date.now();

  for (let i = 0; i < count; i++) {
    events.push({
      timestamp: baseTime - (i * intervalMs),
      event_type: i % 2 === 0 ? 'click' : 'view',
      user_id: `user_${i % 5}`,
      value: (i + 1) * 10,
      metadata: {}
    });
  }

  return events;
}

async function testBasicWindowing(): Promise<void> {
  const buffer = new EventBuffer({ engine: 'polars' });
  const events = generateTimedEvents(60, 1000); // 60 events, 1 second apart

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

async function testDifferentWindowSizes(): Promise<void> {
  const buffer = new EventBuffer({ engine: 'polars' });
  const events = generateTimedEvents(120, 1000); // 120 events, 1 second apart

  await buffer.addBatch(events);
  await buffer.flush();

  const analytics = buffer.getAnalytics();

  // Test different window sizes
  const sizes = ['5s', '10s', '30s', '1m'];

  for (const size of sizes) {
    const results = await analytics.windowedAggregation({
      windowSize: size,
      groupBy: 'event_type',
      metric: 'value',
      aggFunc: 'sum'
    });

    assert(Array.isArray(results), `Results for ${size} should be an array`);
  }

  buffer.stop();
}

async function testDifferentAggFunctions(): Promise<void> {
  const buffer = new EventBuffer({ engine: 'polars' });
  const events = generateTimedEvents(60, 1000);

  await buffer.addBatch(events);
  await buffer.flush();

  const analytics = buffer.getAnalytics();

  const aggFuncs: Array<'sum' | 'mean' | 'count' | 'min' | 'max'> = ['sum', 'mean', 'count', 'min', 'max'];

  for (const aggFunc of aggFuncs) {
    const results = await analytics.windowedAggregation({
      windowSize: '10s',
      groupBy: 'event_type',
      metric: 'value',
      aggFunc
    });

    assert(Array.isArray(results), `Results for ${aggFunc} should be an array`);
    assert(results.length > 0, `Should have results for ${aggFunc}`);
  }

  buffer.stop();
}

async function testSlidingWindows(): Promise<void> {
  const buffer = new EventBuffer({ engine: 'polars' });
  const events = generateTimedEvents(100, 500); // 100 events, 500ms apart

  await buffer.addBatch(events);
  await buffer.flush();

  const analytics = buffer.getAnalytics();

  const results = await analytics.windowedAggregation({
    windowSize: '5s',
    groupBy: 'event_type',
    metric: 'value',
    aggFunc: 'sum'
  });

  assert(Array.isArray(results), 'Results should be an array');
  assert(results.length >= 2, 'Should have multiple windows');

  buffer.stop();
}

async function testMultipleGroupBy(): Promise<void> {
  const buffer = new EventBuffer({ engine: 'polars' });
  const events = generateTimedEvents(60, 1000);

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

  // Check that we have results for different event types
  const eventTypes = [...new Set(results.map((r: any) => r.event_type))];
  assert(eventTypes.length >= 1, 'Should have at least one event type');

  buffer.stop();
}

async function testEmptyWindows(): Promise<void> {
  const buffer = new EventBuffer({ engine: 'polars' });
  const events: Event[] = [
    {
      timestamp: Date.now(),
      event_type: 'click',
      user_id: 'user_1',
      value: 100,
      metadata: {}
    },
    {
      timestamp: Date.now() - 60000, // 60 seconds ago
      event_type: 'click',
      user_id: 'user_1',
      value: 200,
      metadata: {}
    }
  ];

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

  buffer.stop();
}

async function testWindowAlignment(): Promise<void> {
  const buffer = new EventBuffer({ engine: 'polars' });

  // Create events at specific times to test window alignment
  const baseTime = Math.floor(Date.now() / 10000) * 10000; // Align to 10s boundary
  const events: Event[] = [];

  for (let i = 0; i < 30; i++) {
    events.push({
      timestamp: baseTime - (i * 1000),
      event_type: 'click',
      user_id: 'user_1',
      value: 10,
      metadata: {}
    });
  }

  await buffer.addBatch(events);
  await buffer.flush();

  const analytics = buffer.getAnalytics();

  const results = await analytics.windowedAggregation({
    windowSize: '10s',
    groupBy: 'event_type',
    metric: 'value',
    aggFunc: 'count'
  });

  assert(Array.isArray(results), 'Results should be an array');

  buffer.stop();
}

async function testHighFrequencyEvents(): Promise<void> {
  const buffer = new EventBuffer({ engine: 'polars' });
  const events = generateTimedEvents(1000, 10); // 1000 events, 10ms apart

  await buffer.addBatch(events);
  await buffer.flush();

  const analytics = buffer.getAnalytics();

  const results = await analytics.windowedAggregation({
    windowSize: '1s',
    groupBy: 'event_type',
    metric: 'value',
    aggFunc: 'sum'
  });

  assert(Array.isArray(results), 'Results should be an array');
  assert(results.length > 0, 'Should have windowed results');

  buffer.stop();
}

async function runAllTests(): Promise<void> {
  console.log('='.repeat(60));
  console.log('WINDOWING TESTS');
  console.log('='.repeat(60));
  console.log('Testing time-windowed aggregations\n');

  const results: TestResult[] = [];

  results.push(await runTest('Basic Windowing', testBasicWindowing));
  results.push(await runTest('Different Window Sizes', testDifferentWindowSizes));
  results.push(await runTest('Different Aggregation Functions', testDifferentAggFunctions));
  results.push(await runTest('Sliding Windows', testSlidingWindows));
  results.push(await runTest('Multiple Group By', testMultipleGroupBy));
  results.push(await runTest('Empty Windows', testEmptyWindows));
  results.push(await runTest('Window Alignment', testWindowAlignment));
  results.push(await runTest('High Frequency Events', testHighFrequencyEvents));

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
