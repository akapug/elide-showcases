#!/usr/bin/env elide

/**
 * Demo Tests - Basic
 *
 * Demonstrates Tape on Elide with real working tests.
 */

import test from '../index.ts';

// Basic assertions
test('truthiness', (t) => {
  t.ok(true, 'true is truthy');
  t.ok(1, '1 is truthy');
  t.ok('hello', 'non-empty string is truthy');
  t.ok([], 'empty array is truthy');
  t.ok({}, 'empty object is truthy');
  t.end();
});

test('equality', (t) => {
  t.plan(3);

  t.equal(2 + 2, 4, '2 + 2 equals 4');
  t.equal('hello'.toUpperCase(), 'HELLO', 'string uppercase');
  t.strictEqual(parseInt('42'), 42, 'parse int');
});

test('deep equality', (t) => {
  const arr1 = [1, 2, 3];
  const arr2 = [1, 2, 3];
  t.deepEqual(arr1, arr2, 'arrays are equal');

  const obj1 = { x: 1, y: 2 };
  const obj2 = { x: 1, y: 2 };
  t.deepEqual(obj1, obj2, 'objects are equal');

  t.end();
});

// String operations
test('string concatenation', (t) => {
  const result = 'Hello' + ' ' + 'World';
  t.equal(result, 'Hello World', 'strings concatenated');
  t.end();
});

test('template literals', (t) => {
  const name = 'Alice';
  const greeting = `Hello, ${name}!`;
  t.equal(greeting, 'Hello, Alice!', 'template literal works');
  t.end();
});

test('string methods', (t) => {
  const text = '  hello world  ';
  t.equal(text.trim(), 'hello world', 'trim removes whitespace');
  t.equal(text.trim().toUpperCase(), 'HELLO WORLD', 'chained methods');
  t.end();
});

// Array operations
test('array map', (t) => {
  const numbers = [1, 2, 3, 4];
  const doubled = numbers.map(n => n * 2);
  t.deepEqual(doubled, [2, 4, 6, 8], 'numbers doubled');
  t.end();
});

test('array filter', (t) => {
  const numbers = [1, 2, 3, 4, 5, 6];
  const evens = numbers.filter(n => n % 2 === 0);
  t.deepEqual(evens, [2, 4, 6], 'filtered even numbers');
  t.end();
});

test('array reduce', (t) => {
  const numbers = [1, 2, 3, 4];
  const sum = numbers.reduce((acc, n) => acc + n, 0);
  t.equal(sum, 10, 'sum of numbers');
  t.end();
});

// Object operations
test('object property access', (t) => {
  const person = { name: 'Alice', age: 30 };
  t.equal(person.name, 'Alice', 'dot notation');
  t.equal(person['age'], 30, 'bracket notation');
  t.end();
});

test('Object.keys', (t) => {
  const obj = { a: 1, b: 2, c: 3 };
  const keys = Object.keys(obj);
  t.deepEqual(keys, ['a', 'b', 'c'], 'object keys');
  t.end();
});

test('Object.values', (t) => {
  const obj = { a: 1, b: 2, c: 3 };
  const values = Object.values(obj);
  t.deepEqual(values, [1, 2, 3], 'object values');
  t.end();
});

// Run tests when executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const { run } = await import('../index.ts');
  const exitCode = await run();
  process.exit(exitCode);
}
