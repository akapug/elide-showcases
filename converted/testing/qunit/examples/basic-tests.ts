#!/usr/bin/env elide

/**
 * Basic QUnit Tests Example
 *
 * Demonstrates fundamental QUnit testing patterns on Elide.
 */

import { QUnit, test } from '../index.ts';

// Simple synchronous tests
test('basic assertion', (assert) => {
  assert.ok(true, 'true is truthy');
  assert.ok(1, '1 is truthy');
  assert.ok('hello', 'non-empty string is truthy');
});

test('equality assertions', (assert) => {
  assert.equal(1, 1, 'numbers are equal');
  assert.equal('hello', 'hello', 'strings are equal');
  assert.strictEqual(1, 1, 'strict equality');
  assert.notEqual(1, 2, 'numbers are not equal');
});

test('boolean assertions', (assert) => {
  assert.true(true, 'value is true');
  assert.false(false, 'value is false');
  assert.true(1 === 1, 'expression is true');
});

test('deep equality', (assert) => {
  const obj1 = { name: 'Alice', age: 30 };
  const obj2 = { name: 'Alice', age: 30 };
  const obj3 = { name: 'Bob', age: 25 };

  assert.deepEqual(obj1, obj2, 'objects are deeply equal');
  assert.notDeepEqual(obj1, obj3, 'objects are not deeply equal');

  const arr1 = [1, 2, 3];
  const arr2 = [1, 2, 3];

  assert.deepEqual(arr1, arr2, 'arrays are deeply equal');
});

test('exception testing', (assert) => {
  assert.throws(() => {
    throw new Error('Something went wrong');
  }, 'function throws an error');

  assert.throws(() => {
    throw new Error('TypeError: invalid input');
  }, /TypeError/, 'error message matches pattern');
});

test('multiple assertions', (assert) => {
  const user = {
    name: 'Alice',
    email: 'alice@example.com',
    age: 30,
    active: true,
  };

  assert.ok(user, 'user object exists');
  assert.equal(user.name, 'Alice', 'user name is Alice');
  assert.equal(user.email, 'alice@example.com', 'email is correct');
  assert.strictEqual(user.age, 30, 'age is 30');
  assert.true(user.active, 'user is active');
});

// Test with expected assertion count
test('expected assertions', (assert) => {
  assert.expect(3);

  assert.ok(true, 'first assertion');
  assert.ok(true, 'second assertion');
  assert.ok(true, 'third assertion');
});

// Skipped test
test.skip('this test is skipped', (assert) => {
  assert.ok(false, 'this should not run');
});

// Todo test (expected to fail)
test.todo('implement advanced feature', (assert) => {
  assert.ok(false, 'not implemented yet');
});

// Run tests if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  const results = await QUnit.run();
  QUnit.printResults(results);
  process.exit(results.failed > 0 ? 1 : 0);
}
