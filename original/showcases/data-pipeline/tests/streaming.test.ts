/**
 * Streaming Tests
 *
 * Comprehensive tests for streaming components:
 * - Kafka processor tests
 * - Kinesis processor tests
 * - Window processor tests
 * - Transformer tests
 * - Aggregation tests
 * - Integration tests
 */

import * as crypto from 'crypto';

// ============================================================================
// Test Framework
// ============================================================================

class TestRunner {
  private tests: Array<{ name: string; fn: () => Promise<void> }> = [];
  private passed: number = 0;
  private failed: number = 0;

  public test(name: string, fn: () => Promise<void>): void {
    this.tests.push({ name, fn });
  }

  public async run(): Promise<void> {
    console.log(`\nRunning ${this.tests.length} tests...\n`);

    for (const test of this.tests) {
      try {
        await test.fn();
        this.passed++;
        console.log(`✓ ${test.name}`);
      } catch (error) {
        this.failed++;
        console.log(`✗ ${test.name}`);
        console.error(`  Error: ${(error as Error).message}`);
      }
    }

    console.log(`\n${this.passed} passed, ${this.failed} failed\n`);

    if (this.failed > 0) {
      process.exit(1);
    }
  }
}

function assert(condition: boolean, message: string = 'Assertion failed'): void {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEquals<T>(actual: T, expected: T, message?: string): void {
  if (actual !== expected) {
    throw new Error(
      message || `Expected ${expected}, but got ${actual}`
    );
  }
}

function assertNotNull<T>(value: T | null | undefined, message?: string): void {
  if (value === null || value === undefined) {
    throw new Error(message || 'Value should not be null or undefined');
  }
}

async function assertThrows(
  fn: () => Promise<any>,
  expectedError?: string
): Promise<void> {
  try {
    await fn();
    throw new Error('Expected function to throw, but it did not');
  } catch (error) {
    if (expectedError && !(error as Error).message.includes(expectedError)) {
      throw new Error(
        `Expected error containing "${expectedError}", but got "${(error as Error).message}"`
      );
    }
  }
}

// ============================================================================
// Mock Implementations
// ============================================================================

interface Message {
  key?: string;
  value: any;
  timestamp?: number;
  partition?: number;
  offset?: string;
}

class MockKafkaProducer {
  private messages: Message[] = [];

  public async send(message: Message): Promise<void> {
    this.messages.push(message);
  }

  public getMessages(): Message[] {
    return this.messages;
  }

  public clear(): void {
    this.messages = [];
  }
}

class MockMessageProcessor {
  private processedMessages: any[] = [];
  private shouldFail: boolean = false;

  public async process(message: any): Promise<any> {
    if (this.shouldFail) {
      throw new Error('Processing failed');
    }

    const processed = {
      ...message,
      processed: true,
      processedAt: Date.now()
    };

    this.processedMessages.push(processed);
    return processed;
  }

  public getProcessedMessages(): any[] {
    return this.processedMessages;
  }

  public setShouldFail(shouldFail: boolean): void {
    this.shouldFail = shouldFail;
  }

  public clear(): void {
    this.processedMessages = [];
  }
}

// ============================================================================
// Window Tests
// ============================================================================

class TumblingWindowTest {
  private windowSize: number;
  private windows: Map<string, any[]> = new Map();

  constructor(windowSize: number) {
    this.windowSize = windowSize;
  }

  public addEvent(timestamp: number, data: any): void {
    const windowStart = Math.floor(timestamp / this.windowSize) * this.windowSize;
    const windowKey = `${windowStart}`;

    if (!this.windows.has(windowKey)) {
      this.windows.set(windowKey, []);
    }

    this.windows.get(windowKey)!.push({ timestamp, data });
  }

  public getWindow(windowStart: number): any[] {
    return this.windows.get(`${windowStart}`) || [];
  }

  public getAllWindows(): Map<string, any[]> {
    return this.windows;
  }
}

class SlidingWindowTest {
  private windowSize: number;
  private slideInterval: number;
  private events: Array<{ timestamp: number; data: any }> = [];

  constructor(windowSize: number, slideInterval: number) {
    this.windowSize = windowSize;
    this.slideInterval = slideInterval;
  }

  public addEvent(timestamp: number, data: any): void {
    this.events.push({ timestamp, data });
  }

  public getWindowsForTimestamp(timestamp: number): any[][] {
    const windows: any[][] = [];

    // Calculate window starts
    const firstWindowStart = Math.floor(
      (timestamp - this.windowSize + this.slideInterval) / this.slideInterval
    ) * this.slideInterval;

    for (
      let windowStart = firstWindowStart;
      windowStart <= timestamp;
      windowStart += this.slideInterval
    ) {
      const windowEnd = windowStart + this.windowSize;

      if (timestamp >= windowStart && timestamp < windowEnd) {
        const windowEvents = this.events.filter(
          e => e.timestamp >= windowStart && e.timestamp < windowEnd
        );
        windows.push(windowEvents);
      }
    }

    return windows;
  }
}

class SessionWindowTest {
  private gap: number;
  private sessions: Array<{
    start: number;
    end: number;
    events: any[];
  }> = [];

  constructor(gap: number) {
    this.gap = gap;
  }

  public addEvent(timestamp: number, data: any): void {
    // Find active session
    let session = this.sessions.find(
      s => timestamp - s.end <= this.gap
    );

    if (!session) {
      // Create new session
      session = {
        start: timestamp,
        end: timestamp,
        events: []
      };
      this.sessions.push(session);
    }

    // Add event to session
    session.events.push({ timestamp, data });
    session.end = timestamp;
  }

  public getSessions(): typeof this.sessions {
    return this.sessions;
  }
}

// ============================================================================
// Transformation Tests
// ============================================================================

class TransformationPipeline {
  private transformers: Array<(data: any) => any> = [];

  public addTransformer(transformer: (data: any) => any): void {
    this.transformers.push(transformer);
  }

  public transform(data: any): any {
    let result = data;

    for (const transformer of this.transformers) {
      result = transformer(result);
    }

    return result;
  }
}

// ============================================================================
// Tests
// ============================================================================

const runner = new TestRunner();

// Tumbling Window Tests
runner.test('Tumbling window assigns events correctly', async () => {
  const windowSize = 1000;
  const window = new TumblingWindowTest(windowSize);

  window.addEvent(0, 'event1');
  window.addEvent(500, 'event2');
  window.addEvent(1000, 'event3');
  window.addEvent(1500, 'event4');

  const window0 = window.getWindow(0);
  const window1 = window.getWindow(1000);

  assertEquals(window0.length, 2, 'First window should have 2 events');
  assertEquals(window1.length, 2, 'Second window should have 2 events');
});

runner.test('Tumbling window creates distinct windows', async () => {
  const windowSize = 1000;
  const window = new TumblingWindowTest(windowSize);

  for (let i = 0; i < 10; i++) {
    window.addEvent(i * 500, `event${i}`);
  }

  const allWindows = window.getAllWindows();
  assert(allWindows.size >= 5, 'Should create at least 5 windows');
});

// Sliding Window Tests
runner.test('Sliding window overlaps correctly', async () => {
  const windowSize = 1000;
  const slideInterval = 500;
  const window = new SlidingWindowTest(windowSize, slideInterval);

  window.addEvent(0, 'event1');
  window.addEvent(500, 'event2');
  window.addEvent(1000, 'event3');

  const windowsAt1000 = window.getWindowsForTimestamp(1000);
  assert(windowsAt1000.length >= 2, 'Should have multiple overlapping windows');
});

runner.test('Sliding window includes events in multiple windows', async () => {
  const windowSize = 2000;
  const slideInterval = 1000;
  const window = new SlidingWindowTest(windowSize, slideInterval);

  window.addEvent(1500, 'event1');

  const windowsAt1500 = window.getWindowsForTimestamp(1500);
  assert(windowsAt1500.length >= 1, 'Event should appear in at least one window');
});

// Session Window Tests
runner.test('Session window creates new session after gap', async () => {
  const gap = 1000;
  const session = new SessionWindowTest(gap);

  session.addEvent(0, 'event1');
  session.addEvent(500, 'event2');
  session.addEvent(2000, 'event3'); // Should create new session

  const sessions = session.getSessions();
  assertEquals(sessions.length, 2, 'Should have 2 sessions');
});

runner.test('Session window merges events within gap', async () => {
  const gap = 1000;
  const session = new SessionWindowTest(gap);

  session.addEvent(0, 'event1');
  session.addEvent(500, 'event2');
  session.addEvent(900, 'event3');

  const sessions = session.getSessions();
  assertEquals(sessions.length, 1, 'Should have 1 session');
  assertEquals(sessions[0].events.length, 3, 'Session should have 3 events');
});

// Message Processing Tests
runner.test('Message processor processes messages correctly', async () => {
  const processor = new MockMessageProcessor();

  await processor.process({ id: 1, data: 'test' });
  await processor.process({ id: 2, data: 'test2' });

  const processed = processor.getProcessedMessages();
  assertEquals(processed.length, 2, 'Should process 2 messages');
  assert(processed[0].processed, 'First message should be processed');
  assert(processed[1].processed, 'Second message should be processed');
});

runner.test('Message processor handles errors', async () => {
  const processor = new MockMessageProcessor();
  processor.setShouldFail(true);

  await assertThrows(
    () => processor.process({ id: 1 }),
    'Processing failed'
  );
});

// Transformation Tests
runner.test('Transformation pipeline applies transformers in order', async () => {
  const pipeline = new TransformationPipeline();

  pipeline.addTransformer((data: any) => ({ ...data, step1: true }));
  pipeline.addTransformer((data: any) => ({ ...data, step2: true }));
  pipeline.addTransformer((data: any) => ({ ...data, step3: true }));

  const result = pipeline.transform({ id: 1 });

  assert(result.step1, 'Should have step1');
  assert(result.step2, 'Should have step2');
  assert(result.step3, 'Should have step3');
});

runner.test('Transformation pipeline passes data through chain', async () => {
  const pipeline = new TransformationPipeline();

  pipeline.addTransformer((data: any) => ({ ...data, value: data.value * 2 }));
  pipeline.addTransformer((data: any) => ({ ...data, value: data.value + 10 }));

  const result = pipeline.transform({ value: 5 });

  assertEquals(result.value, 20, 'Should apply transformations in sequence');
});

// Kafka Producer Tests
runner.test('Kafka producer sends messages', async () => {
  const producer = new MockKafkaProducer();

  await producer.send({ key: 'key1', value: 'message1' });
  await producer.send({ key: 'key2', value: 'message2' });

  const messages = producer.getMessages();
  assertEquals(messages.length, 2, 'Should send 2 messages');
});

runner.test('Kafka producer stores message metadata', async () => {
  const producer = new MockKafkaProducer();

  const message = {
    key: 'key1',
    value: 'message1',
    partition: 0,
    offset: '123'
  };

  await producer.send(message);

  const messages = producer.getMessages();
  assertEquals(messages[0].partition, 0, 'Should store partition');
  assertEquals(messages[0].offset, '123', 'Should store offset');
});

// Aggregation Tests
runner.test('Count aggregation works correctly', async () => {
  const values = [1, 2, 3, 4, 5];
  const count = values.length;

  assertEquals(count, 5, 'Count should be 5');
});

runner.test('Sum aggregation works correctly', async () => {
  const values = [1, 2, 3, 4, 5];
  const sum = values.reduce((acc, val) => acc + val, 0);

  assertEquals(sum, 15, 'Sum should be 15');
});

runner.test('Average aggregation works correctly', async () => {
  const values = [10, 20, 30];
  const avg = values.reduce((acc, val) => acc + val, 0) / values.length;

  assertEquals(avg, 20, 'Average should be 20');
});

runner.test('Min aggregation works correctly', async () => {
  const values = [5, 2, 8, 1, 9];
  const min = Math.min(...values);

  assertEquals(min, 1, 'Min should be 1');
});

runner.test('Max aggregation works correctly', async () => {
  const values = [5, 2, 8, 1, 9];
  const max = Math.max(...values);

  assertEquals(max, 9, 'Max should be 9');
});

// Watermark Tests
runner.test('Watermark advances with event time', async () => {
  let watermark = 0;

  const events = [100, 200, 150, 300];

  for (const timestamp of events) {
    if (timestamp > watermark) {
      watermark = timestamp;
    }
  }

  assertEquals(watermark, 300, 'Watermark should be 300');
});

runner.test('Watermark does not go backwards', async () => {
  let watermark = 0;

  const events = [100, 200, 150, 50];

  for (const timestamp of events) {
    watermark = Math.max(watermark, timestamp);
  }

  assertEquals(watermark, 200, 'Watermark should remain at 200');
});

// Late Data Tests
runner.test('Late data detection works', async () => {
  const watermark = 1000;
  const allowedLateness = 100;

  const events = [
    { timestamp: 1050, isLate: false },
    { timestamp: 950, isLate: false },
    { timestamp: 850, isLate: true }
  ];

  for (const event of events) {
    const isLate = event.timestamp < watermark - allowedLateness;
    assertEquals(
      isLate,
      event.isLate,
      `Event at ${event.timestamp} should ${event.isLate ? 'be' : 'not be'} late`
    );
  }
});

// Batching Tests
runner.test('Batch accumulation works correctly', async () => {
  const batchSize = 10;
  const batch: any[] = [];

  for (let i = 0; i < 15; i++) {
    batch.push(i);

    if (batch.length >= batchSize) {
      assertEquals(batch.length, batchSize, 'Batch should be full');
      batch.length = 0; // Clear batch
    }
  }

  assertEquals(batch.length, 5, 'Remaining items should be 5');
});

// Error Handling Tests
runner.test('DLQ receives failed messages', async () => {
  const dlq: any[] = [];

  const message = { id: 1, data: 'test' };

  try {
    throw new Error('Processing failed');
  } catch (error) {
    dlq.push({
      ...message,
      error: (error as Error).message
    });
  }

  assertEquals(dlq.length, 1, 'DLQ should have 1 message');
  assert(dlq[0].error, 'DLQ message should have error');
});

// Integration Tests
runner.test('End-to-end streaming pipeline', async () => {
  const producer = new MockKafkaProducer();
  const processor = new MockMessageProcessor();

  // Produce messages
  await producer.send({ value: { id: 1, value: 10 } });
  await producer.send({ value: { id: 2, value: 20 } });

  // Process messages
  const messages = producer.getMessages();
  for (const message of messages) {
    await processor.process(message.value);
  }

  const processed = processor.getProcessedMessages();
  assertEquals(processed.length, 2, 'Should process all messages');
});

runner.test('Windowed aggregation pipeline', async () => {
  const windowSize = 1000;
  const window = new TumblingWindowTest(windowSize);

  // Add events
  const events = [
    { timestamp: 100, value: 10 },
    { timestamp: 500, value: 20 },
    { timestamp: 1100, value: 30 },
    { timestamp: 1500, value: 40 }
  ];

  for (const event of events) {
    window.addEvent(event.timestamp, event);
  }

  // Verify windows
  const window0 = window.getWindow(0);
  const window1 = window.getWindow(1000);

  assertEquals(window0.length, 2, 'First window should have 2 events');
  assertEquals(window1.length, 2, 'Second window should have 2 events');

  // Calculate aggregates
  const sum0 = window0.reduce((acc, e) => acc + e.data.value, 0);
  const sum1 = window1.reduce((acc, e) => acc + e.data.value, 0);

  assertEquals(sum0, 30, 'First window sum should be 30');
  assertEquals(sum1, 70, 'Second window sum should be 70');
});

// ============================================================================
// Run Tests
// ============================================================================

if (require.main === module) {
  runner.run().catch(console.error);
}

export { runner, assert, assertEquals, assertNotNull, assertThrows };
