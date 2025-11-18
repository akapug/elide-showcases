#!/usr/bin/env elide

/**
 * Async QUnit Tests Example
 *
 * Demonstrates asynchronous testing patterns with QUnit on Elide.
 */

import { QUnit, test } from '../index.ts';

// Simple async test
test('async test with promise', async (assert) => {
  const result = await Promise.resolve(42);
  assert.equal(result, 42, 'promise resolved with correct value');
});

// Async test with timeout
test('async test with delay', async (assert) => {
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const start = Date.now();
  await delay(100);
  const elapsed = Date.now() - start;

  assert.ok(elapsed >= 100, 'delay was at least 100ms');
});

// Test with async function
test('fetching data', async (assert) => {
  // Simulate an API call
  async function fetchUser(id: number) {
    await new Promise(resolve => setTimeout(resolve, 50));
    return {
      id,
      name: 'Alice',
      email: 'alice@example.com',
    };
  }

  const user = await fetchUser(1);

  assert.ok(user, 'user was fetched');
  assert.equal(user.id, 1, 'user ID is correct');
  assert.equal(user.name, 'Alice', 'user name is correct');
});

// Multiple async operations
test('multiple async operations', async (assert) => {
  const promises = [
    Promise.resolve(1),
    Promise.resolve(2),
    Promise.resolve(3),
  ];

  const results = await Promise.all(promises);

  assert.deepEqual(results, [1, 2, 3], 'all promises resolved correctly');
});

// Test with async error handling
test('async error handling', async (assert) => {
  async function failingOperation() {
    await new Promise(resolve => setTimeout(resolve, 10));
    throw new Error('Operation failed');
  }

  try {
    await failingOperation();
    assert.ok(false, 'should have thrown an error');
  } catch (error) {
    assert.ok(error instanceof Error, 'caught an error');
    assert.equal((error as Error).message, 'Operation failed', 'error message is correct');
  }
});

// Test with multiple async assertions
test('async computation', async (assert) => {
  async function calculate(a: number, b: number): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, 10));
    return a + b;
  }

  const result1 = await calculate(2, 3);
  assert.equal(result1, 5, '2 + 3 = 5');

  const result2 = await calculate(10, 20);
  assert.equal(result2, 30, '10 + 20 = 30');
});

// Test with promise rejection
test('promise rejection', async (assert) => {
  const promise = Promise.reject(new Error('Failed'));

  try {
    await promise;
    assert.ok(false, 'should have rejected');
  } catch (error) {
    assert.ok(true, 'promise was rejected');
  }
});

// Async test with steps
test('async workflow with steps', async (assert) => {
  assert.step('start');

  await new Promise(resolve => setTimeout(resolve, 10));
  assert.step('after delay 1');

  await new Promise(resolve => setTimeout(resolve, 10));
  assert.step('after delay 2');

  assert.verifySteps(['start', 'after delay 1', 'after delay 2'], 'steps executed in order');
});

// Run tests if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  const results = await QUnit.run();
  QUnit.printResults(results);
  process.exit(results.failed > 0 ? 1 : 0);
}
