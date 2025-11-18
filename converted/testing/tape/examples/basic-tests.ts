#!/usr/bin/env elide

/**
 * Basic Tape Tests Example
 *
 * Demonstrates fundamental Tape testing patterns on Elide.
 */

import test from '../index.ts';

// Simple test with ok assertion
test('basic ok assertion', (t) => {
  t.ok(true, 'true is truthy');
  t.ok(1, '1 is truthy');
  t.ok('hello', 'non-empty string is truthy');
  t.end();
});

// Test with plan
test('planned assertions', (t) => {
  t.plan(3);

  t.equal(1 + 1, 2, '1 + 1 = 2');
  t.equal('hello'.length, 5, 'hello has 5 characters');
  t.ok(true, 'this is true');
});

// Equality tests
test('equality assertions', (t) => {
  t.equal(1, 1, 'numbers are equal');
  t.equal('hello', 'hello', 'strings are equal');
  t.strictEqual(1, 1, 'strict equality');
  t.notEqual(1, 2, 'numbers are not equal');
  t.end();
});

// Deep equality
test('deep equality', (t) => {
  const obj1 = { name: 'Alice', age: 30 };
  const obj2 = { name: 'Alice', age: 30 };
  const obj3 = { name: 'Bob', age: 25 };

  t.deepEqual(obj1, obj2, 'objects are deeply equal');
  t.notDeepEqual(obj1, obj3, 'objects are not deeply equal');

  const arr1 = [1, 2, 3];
  const arr2 = [1, 2, 3];

  t.deepEqual(arr1, arr2, 'arrays are deeply equal');
  t.end();
});

// Error testing
test('error handling', (t) => {
  const err = null;
  t.error(err, 'no error occurred');

  const actualError = new Error('something went wrong');
  t.ok(actualError, 'error exists');

  t.end();
});

// Exception testing
test('throws assertion', (t) => {
  t.throws(() => {
    throw new Error('oops');
  }, 'function throws an error');

  t.doesNotThrow(() => {
    const x = 1 + 1;
  }, 'function does not throw');

  t.end();
});

// Not ok
test('notOk assertion', (t) => {
  t.notOk(false, 'false is falsy');
  t.notOk(0, '0 is falsy');
  t.notOk('', 'empty string is falsy');
  t.notOk(null, 'null is falsy');
  t.notOk(undefined, 'undefined is falsy');
  t.end();
});

// Comments in tests
test('test with comments', (t) => {
  t.comment('This is a comment');
  t.ok(true, 'assertion after comment');
  t.comment('Another comment');
  t.equal(2 + 2, 4, 'math works');
  t.end();
});

// Skipped test
test.skip('this test is skipped', (t) => {
  t.fail('this should not run');
  t.end();
});

// Run tests when executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const { run } = await import('../index.ts');
  const exitCode = await run();
  process.exit(exitCode);
}
