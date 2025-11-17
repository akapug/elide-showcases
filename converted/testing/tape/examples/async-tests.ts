#!/usr/bin/env elide

/**
 * Async Tape Tests Example
 *
 * Demonstrates asynchronous testing patterns with Tape on Elide.
 */

import test from '../index.ts';

// Simple async test
test('async test with promise', async (t) => {
  const result = await Promise.resolve(42);
  t.equal(result, 42, 'promise resolved with correct value');
  t.end();
});

// Async test with delay
test('async test with timeout', async (t) => {
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const start = Date.now();
  await delay(100);
  const elapsed = Date.now() - start;

  t.ok(elapsed >= 100, 'delay was at least 100ms');
  t.end();
});

// Test with async function
test('fetching data', async (t) => {
  async function fetchUser(id: number) {
    await new Promise(resolve => setTimeout(resolve, 50));
    return {
      id,
      name: 'Alice',
      email: 'alice@example.com',
    };
  }

  const user = await fetchUser(1);

  t.ok(user, 'user was fetched');
  t.equal(user.id, 1, 'user ID is correct');
  t.equal(user.name, 'Alice', 'user name is correct');
  t.end();
});

// Multiple async operations
test('multiple async operations', async (t) => {
  t.plan(1);

  const promises = [
    Promise.resolve(1),
    Promise.resolve(2),
    Promise.resolve(3),
  ];

  const results = await Promise.all(promises);

  t.deepEqual(results, [1, 2, 3], 'all promises resolved correctly');
});

// Test with async error handling
test('async error handling', async (t) => {
  async function failingOperation() {
    await new Promise(resolve => setTimeout(resolve, 10));
    throw new Error('Operation failed');
  }

  try {
    await failingOperation();
    t.fail('should have thrown an error');
  } catch (error) {
    t.ok(error instanceof Error, 'caught an error');
    t.equal((error as Error).message, 'Operation failed', 'error message is correct');
  }

  t.end();
});

// Test with plan and async
test('async computation with plan', async (t) => {
  t.plan(2);

  async function calculate(a: number, b: number): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, 10));
    return a + b;
  }

  const result1 = await calculate(2, 3);
  t.equal(result1, 5, '2 + 3 = 5');

  const result2 = await calculate(10, 20);
  t.equal(result2, 30, '10 + 20 = 30');
});

// Test with promise rejection
test('promise rejection', async (t) => {
  const promise = Promise.reject(new Error('Failed'));

  try {
    await promise;
    t.fail('should have rejected');
  } catch (error) {
    t.ok(true, 'promise was rejected');
  }

  t.end();
});

// Async test with timeout
test('async test with timeout limit', async (t) => {
  t.timeoutAfter(200);

  await new Promise(resolve => setTimeout(resolve, 50));
  t.ok(true, 'completed before timeout');

  t.end();
});

// Sequential async operations
test('sequential async calls', async (t) => {
  const results: number[] = [];

  async function addNumber(n: number) {
    await new Promise(resolve => setTimeout(resolve, 5));
    results.push(n);
  }

  await addNumber(1);
  await addNumber(2);
  await addNumber(3);

  t.deepEqual(results, [1, 2, 3], 'operations executed in order');
  t.end();
});

// Parallel async operations
test('parallel async calls', async (t) => {
  async function delay(ms: number, value: number): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, ms));
    return value;
  }

  const start = Date.now();
  const results = await Promise.all([
    delay(30, 1),
    delay(20, 2),
    delay(10, 3),
  ]);
  const elapsed = Date.now() - start;

  t.deepEqual(results, [1, 2, 3], 'all promises resolved');
  t.ok(elapsed < 100, 'executed in parallel (not sequentially)');
  t.end();
});

// Run tests when executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const { run } = await import('../index.ts');
  const exitCode = await run();
  process.exit(exitCode);
}
