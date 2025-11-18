#!/usr/bin/env elide

/**
 * Demo Tests - Basic
 *
 * Demonstrates QUnit on Elide with real working tests.
 */

import { QUnit, module, test } from '../index.ts';

module('Basic Assertions', () => {
  test('truthiness', (assert) => {
    assert.ok(true, 'true is truthy');
    assert.ok(1, '1 is truthy');
    assert.ok('hello', 'non-empty string is truthy');
    assert.ok([], 'empty array is truthy');
    assert.ok({}, 'empty object is truthy');
  });

  test('equality', (assert) => {
    assert.equal(2 + 2, 4, '2 + 2 equals 4');
    assert.equal('hello'.toUpperCase(), 'HELLO', 'string uppercase');
    assert.strictEqual(parseInt('42'), 42, 'parse int');
  });

  test('deep equality', (assert) => {
    const arr1 = [1, 2, 3];
    const arr2 = [1, 2, 3];
    assert.deepEqual(arr1, arr2, 'arrays are equal');

    const obj1 = { x: 1, y: 2 };
    const obj2 = { x: 1, y: 2 };
    assert.deepEqual(obj1, obj2, 'objects are equal');
  });
});

module('String Operations', () => {
  test('concatenation', (assert) => {
    const result = 'Hello' + ' ' + 'World';
    assert.equal(result, 'Hello World', 'strings concatenated');
  });

  test('template literals', (assert) => {
    const name = 'Alice';
    const greeting = `Hello, ${name}!`;
    assert.equal(greeting, 'Hello, Alice!', 'template literal works');
  });

  test('string methods', (assert) => {
    const text = '  hello world  ';
    assert.equal(text.trim(), 'hello world', 'trim removes whitespace');
    assert.equal(text.trim().toUpperCase(), 'HELLO WORLD', 'chained methods');
  });
});

module('Array Operations', () => {
  test('map', (assert) => {
    const numbers = [1, 2, 3, 4];
    const doubled = numbers.map(n => n * 2);
    assert.deepEqual(doubled, [2, 4, 6, 8], 'numbers doubled');
  });

  test('filter', (assert) => {
    const numbers = [1, 2, 3, 4, 5, 6];
    const evens = numbers.filter(n => n % 2 === 0);
    assert.deepEqual(evens, [2, 4, 6], 'filtered even numbers');
  });

  test('reduce', (assert) => {
    const numbers = [1, 2, 3, 4];
    const sum = numbers.reduce((acc, n) => acc + n, 0);
    assert.equal(sum, 10, 'sum of numbers');
  });
});

module('Object Operations', () => {
  test('property access', (assert) => {
    const person = { name: 'Alice', age: 30 };
    assert.equal(person.name, 'Alice', 'dot notation');
    assert.equal(person['age'], 30, 'bracket notation');
  });

  test('Object.keys', (assert) => {
    const obj = { a: 1, b: 2, c: 3 };
    const keys = Object.keys(obj);
    assert.deepEqual(keys, ['a', 'b', 'c'], 'object keys');
  });

  test('Object.values', (assert) => {
    const obj = { a: 1, b: 2, c: 3 };
    const values = Object.values(obj);
    assert.deepEqual(values, [1, 2, 3], 'object values');
  });
});

// Run tests if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  const results = await QUnit.run();
  QUnit.printResults(results);
  process.exit(results.failed > 0 ? 1 : 0);
}
