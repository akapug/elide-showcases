/**
 * Tests for event ingestion and buffering.
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

function generateEvent(index: number): Event {
  return {
    timestamp: Date.now() - (index * 1000),
    event_type: 'test_event',
    user_id: `user_${index}`,
    value: index * 10,
    metadata: { test: true }
  };
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

async function testSingleEventIngestion(): Promise<void> {
  const buffer = new EventBuffer({ engine: 'polars', maxSize: 100, flushInterval: 60000 });

  const event = generateEvent(0);
  await buffer.add(event);

  assert(buffer.size() === 1, 'Buffer should contain 1 event');

  buffer.stop();
}

async function testBatchIngestion(): Promise<void> {
  const buffer = new EventBuffer({ engine: 'polars', maxSize: 100, flushInterval: 60000 });

  const events: Event[] = [];
  for (let i = 0; i < 10; i++) {
    events.push(generateEvent(i));
  }

  await buffer.addBatch(events);

  assert(buffer.size() === 10, 'Buffer should contain 10 events');

  buffer.stop();
}

async function testAutoFlush(): Promise<void> {
  const buffer = new EventBuffer({ engine: 'polars', maxSize: 5, flushInterval: 60000 });

  const events: Event[] = [];
  for (let i = 0; i < 10; i++) {
    events.push(generateEvent(i));
  }

  await buffer.addBatch(events);

  // Should auto-flush when exceeding maxSize
  assert(buffer.size() < 10, 'Buffer should have flushed');

  buffer.stop();
}

async function testManualFlush(): Promise<void> {
  const buffer = new EventBuffer({ engine: 'polars', maxSize: 100, flushInterval: 60000 });

  const events: Event[] = [];
  for (let i = 0; i < 5; i++) {
    events.push(generateEvent(i));
  }

  await buffer.addBatch(events);
  assert(buffer.size() === 5, 'Buffer should contain 5 events before flush');

  await buffer.flush();
  assert(buffer.size() === 0, 'Buffer should be empty after flush');

  buffer.stop();
}

async function testFlushCallback(): Promise<void> {
  const buffer = new EventBuffer({ engine: 'polars', maxSize: 100, flushInterval: 60000 });

  let callbackCalled = false;
  let callbackEventCount = 0;

  buffer.onFlush(async (events) => {
    callbackCalled = true;
    callbackEventCount = events.length;
  });

  const events: Event[] = [];
  for (let i = 0; i < 5; i++) {
    events.push(generateEvent(i));
  }

  await buffer.addBatch(events);
  await buffer.flush();

  assert(callbackCalled, 'Flush callback should be called');
  assert(callbackEventCount === 5, 'Callback should receive 5 events');

  buffer.stop();
}

async function testBufferClear(): Promise<void> {
  const buffer = new EventBuffer({ engine: 'polars', maxSize: 100, flushInterval: 60000 });

  const events: Event[] = [];
  for (let i = 0; i < 5; i++) {
    events.push(generateEvent(i));
  }

  await buffer.addBatch(events);
  assert(buffer.size() === 5, 'Buffer should contain 5 events');

  buffer.clear();
  assert(buffer.size() === 0, 'Buffer should be empty after clear');

  buffer.stop();
}

async function testConcurrentIngestion(): Promise<void> {
  const buffer = new EventBuffer({ engine: 'polars', maxSize: 1000, flushInterval: 60000 });

  const promises: Promise<void>[] = [];

  for (let i = 0; i < 10; i++) {
    const batch = Array.from({ length: 10 }, (_, j) => generateEvent(i * 10 + j));
    promises.push(buffer.addBatch(batch));
  }

  await Promise.all(promises);

  assert(buffer.size() > 0, 'Buffer should contain events');
  assert(buffer.size() <= 100, 'Buffer should not exceed expected size');

  buffer.stop();
}

async function testEngineSelection(): Promise<void> {
  const pandasBuffer = new EventBuffer({ engine: 'pandas', maxSize: 100, flushInterval: 60000 });
  const polarsBuffer = new EventBuffer({ engine: 'polars', maxSize: 100, flushInterval: 60000 });

  const event = generateEvent(0);

  await pandasBuffer.add(event);
  await polarsBuffer.add(event);

  assert(pandasBuffer.size() === 1, 'Pandas buffer should work');
  assert(polarsBuffer.size() === 1, 'Polars buffer should work');

  pandasBuffer.stop();
  polarsBuffer.stop();
}

async function testLargeEventBatch(): Promise<void> {
  const buffer = new EventBuffer({ engine: 'polars', maxSize: 10000, flushInterval: 60000 });

  const events: Event[] = [];
  for (let i = 0; i < 1000; i++) {
    events.push(generateEvent(i));
  }

  const startTime = Date.now();
  await buffer.addBatch(events);
  const duration = Date.now() - startTime;

  assert(duration < 1000, `Should ingest 1000 events quickly (took ${duration}ms)`);
  assert(buffer.size() === 1000, 'Buffer should contain all events');

  buffer.stop();
}

async function testEventValidation(): Promise<void> {
  const buffer = new EventBuffer({ engine: 'polars', maxSize: 100, flushInterval: 60000 });

  const validEvent: Event = {
    timestamp: Date.now(),
    event_type: 'click',
    user_id: 'user_1',
    value: 100,
    metadata: {}
  };

  await buffer.add(validEvent);
  assert(buffer.size() === 1, 'Valid event should be added');

  buffer.stop();
}

async function runAllTests(): Promise<void> {
  console.log('='.repeat(60));
  console.log('INGESTION TESTS');
  console.log('='.repeat(60));
  console.log('Testing event ingestion and buffering\n');

  const results: TestResult[] = [];

  results.push(await runTest('Single Event Ingestion', testSingleEventIngestion));
  results.push(await runTest('Batch Ingestion', testBatchIngestion));
  results.push(await runTest('Auto Flush', testAutoFlush));
  results.push(await runTest('Manual Flush', testManualFlush));
  results.push(await runTest('Flush Callback', testFlushCallback));
  results.push(await runTest('Buffer Clear', testBufferClear));
  results.push(await runTest('Concurrent Ingestion', testConcurrentIngestion));
  results.push(await runTest('Engine Selection', testEngineSelection));
  results.push(await runTest('Large Event Batch', testLargeEventBatch));
  results.push(await runTest('Event Validation', testEventValidation));

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
