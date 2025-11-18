#!/usr/bin/env elide

/**
 * Demo Tests - Async
 *
 * Demonstrates async testing with QUnit on Elide.
 */

import { QUnit, module, test } from '../index.ts';

module('Async Operations', () => {
  test('promise resolution', async (assert) => {
    const value = await Promise.resolve(42);
    assert.equal(value, 42, 'promise resolved');
  });

  test('async function', async (assert) => {
    async function fetchData() {
      await new Promise(resolve => setTimeout(resolve, 10));
      return { status: 'success', data: [1, 2, 3] };
    }

    const result = await fetchData();
    assert.equal(result.status, 'success', 'status is success');
    assert.deepEqual(result.data, [1, 2, 3], 'data is correct');
  });

  test('parallel promises', async (assert) => {
    const promises = [
      Promise.resolve(1),
      Promise.resolve(2),
      Promise.resolve(3),
    ];

    const results = await Promise.all(promises);
    assert.deepEqual(results, [1, 2, 3], 'all promises resolved');
  });

  test('sequential async operations', async (assert) => {
    const results: number[] = [];

    async function addNumber(n: number) {
      await new Promise(resolve => setTimeout(resolve, 5));
      results.push(n);
    }

    await addNumber(1);
    await addNumber(2);
    await addNumber(3);

    assert.deepEqual(results, [1, 2, 3], 'operations executed in order');
  });
});

module('Error Handling', () => {
  test('async error', async (assert) => {
    async function failingFunction() {
      await new Promise(resolve => setTimeout(resolve, 5));
      throw new Error('Failed');
    }

    try {
      await failingFunction();
      assert.ok(false, 'should have thrown');
    } catch (error) {
      assert.ok(error instanceof Error, 'caught error');
      assert.equal((error as Error).message, 'Failed', 'error message correct');
    }
  });

  test('promise rejection', async (assert) => {
    const promise = Promise.reject(new Error('Rejected'));

    try {
      await promise;
      assert.ok(false, 'should have rejected');
    } catch (error) {
      assert.ok(true, 'promise was rejected');
    }
  });
});

module('Timeouts and Delays', () => {
  test('setTimeout', async (assert) => {
    let called = false;

    await new Promise(resolve => {
      setTimeout(() => {
        called = true;
        resolve(undefined);
      }, 10);
    });

    assert.true(called, 'timeout callback was called');
  });

  test('multiple timeouts', async (assert) => {
    const order: number[] = [];

    await new Promise(resolve => {
      setTimeout(() => order.push(1), 20);
      setTimeout(() => order.push(2), 10);
      setTimeout(() => {
        order.push(3);
        resolve(undefined);
      }, 30);
    });

    assert.deepEqual(order, [2, 1, 3], 'timeouts executed in correct order');
  });
});

// Run tests if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  const results = await QUnit.run();
  QUnit.printResults(results);
  process.exit(results.failed > 0 ? 1 : 0);
}
