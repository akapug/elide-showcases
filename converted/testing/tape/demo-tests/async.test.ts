#!/usr/bin/env elide

/**
 * Demo Tests - Async
 *
 * Demonstrates async testing with Tape on Elide.
 */

import test from '../index.ts';

// Async operations
test('promise resolution', async (t) => {
  const value = await Promise.resolve(42);
  t.equal(value, 42, 'promise resolved');
  t.end();
});

test('async function', async (t) => {
  async function fetchData() {
    await new Promise(resolve => setTimeout(resolve, 10));
    return { status: 'success', data: [1, 2, 3] };
  }

  const result = await fetchData();
  t.equal(result.status, 'success', 'status is success');
  t.deepEqual(result.data, [1, 2, 3], 'data is correct');
  t.end();
});

test('parallel promises', async (t) => {
  t.plan(1);

  const promises = [
    Promise.resolve(1),
    Promise.resolve(2),
    Promise.resolve(3),
  ];

  const results = await Promise.all(promises);
  t.deepEqual(results, [1, 2, 3], 'all promises resolved');
});

test('sequential async operations', async (t) => {
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

// Error handling
test('async error', async (t) => {
  async function failingFunction() {
    await new Promise(resolve => setTimeout(resolve, 5));
    throw new Error('Failed');
  }

  try {
    await failingFunction();
    t.fail('should have thrown');
  } catch (error) {
    t.ok(error instanceof Error, 'caught error');
    t.equal((error as Error).message, 'Failed', 'error message correct');
  }

  t.end();
});

test('promise rejection', async (t) => {
  const promise = Promise.reject(new Error('Rejected'));

  try {
    await promise;
    t.fail('should have rejected');
  } catch (error) {
    t.ok(true, 'promise was rejected');
  }

  t.end();
});

// Timeouts
test('setTimeout callback', async (t) => {
  let called = false;

  await new Promise(resolve => {
    setTimeout(() => {
      called = true;
      resolve(undefined);
    }, 10);
  });

  t.ok(called, 'timeout callback was called');
  t.end();
});

test('multiple timeouts', async (t) => {
  const order: number[] = [];

  await new Promise(resolve => {
    setTimeout(() => order.push(1), 20);
    setTimeout(() => order.push(2), 10);
    setTimeout(() => {
      order.push(3);
      resolve(undefined);
    }, 30);
  });

  t.deepEqual(order, [2, 1, 3], 'timeouts executed in correct order');
  t.end();
});

// Run tests when executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const { run } = await import('../index.ts');
  const exitCode = await run();
  process.exit(exitCode);
}
