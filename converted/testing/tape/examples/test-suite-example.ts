#!/usr/bin/env elide

/**
 * Test Suite Example
 *
 * Demonstrates organizing tests with Tape on Elide.
 * Note: Tape doesn't have built-in module/suite grouping like QUnit,
 * but tests can be organized with naming conventions and comments.
 */

import test from '../index.ts';

// User Management Tests
test('User Management: create user', (t) => {
  const user = {
    name: 'Alice',
    email: 'alice@example.com',
    age: 30,
  };

  t.ok(user.name, 'user has a name');
  t.ok(user.email, 'user has an email');
  t.ok(user.age > 0, 'user age is positive');
  t.end();
});

test('User Management: update user', (t) => {
  const user = {
    name: 'Alice',
    email: 'alice@example.com',
  };

  user.email = 'alice.smith@example.com';

  t.equal(user.email, 'alice.smith@example.com', 'email was updated');
  t.end();
});

test('User Management: delete user', (t) => {
  let user: any = {
    name: 'Alice',
    email: 'alice@example.com',
  };

  user = null;

  t.strictEqual(user, null, 'user was deleted');
  t.end();
});

// Authentication Tests
test('Authentication: login with valid credentials', (t) => {
  const credentials = {
    username: 'alice',
    password: 'secret123',
  };

  const isValid = credentials.username.length > 0 && credentials.password.length >= 8;

  t.ok(isValid, 'credentials are valid');
  t.end();
});

test('Authentication: login with invalid credentials', (t) => {
  const credentials = {
    username: '',
    password: '123',
  };

  const isValid = credentials.username.length > 0 && credentials.password.length >= 8;

  t.notOk(isValid, 'credentials are invalid');
  t.end();
});

test('Authentication: logout', (t) => {
  let isLoggedIn = true;

  // Simulate logout
  isLoggedIn = false;

  t.notOk(isLoggedIn, 'user is logged out');
  t.end();
});

// Shopping Cart Tests
test('Shopping Cart: add single item', (t) => {
  const cart: any[] = [];
  cart.push({ id: 1, name: 'Widget', price: 9.99 });

  t.equal(cart.length, 1, 'cart has one item');
  t.end();
});

test('Shopping Cart: add multiple items', (t) => {
  const cart: any[] = [];
  cart.push({ id: 1, name: 'Widget', price: 9.99 });
  cart.push({ id: 2, name: 'Gadget', price: 19.99 });

  t.equal(cart.length, 2, 'cart has two items');
  t.end();
});

test('Shopping Cart: remove item by id', (t) => {
  const cart = [
    { id: 1, name: 'Widget', price: 9.99 },
    { id: 2, name: 'Gadget', price: 19.99 },
  ];

  const filtered = cart.filter(item => item.id !== 1);

  t.equal(filtered.length, 1, 'one item removed');
  t.equal(filtered[0].id, 2, 'correct item remains');
  t.end();
});

test('Shopping Cart: calculate total price', (t) => {
  const cart = [
    { id: 1, name: 'Widget', price: 9.99 },
    { id: 2, name: 'Gadget', price: 19.99 },
  ];

  const total = cart.reduce((sum, item) => sum + item.price, 0);

  t.equal(total, 29.98, 'total price is correct');
  t.end();
});

test('Shopping Cart: empty cart has zero total', (t) => {
  const cart: any[] = [];
  const total = cart.reduce((sum, item) => sum + item.price, 0);

  t.equal(total, 0, 'empty cart total is zero');
  t.end();
});

// Array Operations
test('Array Operations: map', (t) => {
  const numbers = [1, 2, 3, 4];
  const doubled = numbers.map(n => n * 2);

  t.deepEqual(doubled, [2, 4, 6, 8], 'numbers doubled');
  t.end();
});

test('Array Operations: filter', (t) => {
  const numbers = [1, 2, 3, 4, 5, 6];
  const evens = numbers.filter(n => n % 2 === 0);

  t.deepEqual(evens, [2, 4, 6], 'filtered even numbers');
  t.end();
});

test('Array Operations: reduce', (t) => {
  const numbers = [1, 2, 3, 4];
  const sum = numbers.reduce((acc, n) => acc + n, 0);

  t.equal(sum, 10, 'sum of numbers');
  t.end();
});

// String Operations
test('String Operations: concatenation', (t) => {
  const result = 'Hello' + ' ' + 'World';
  t.equal(result, 'Hello World', 'strings concatenated');
  t.end();
});

test('String Operations: template literals', (t) => {
  const name = 'Alice';
  const greeting = `Hello, ${name}!`;
  t.equal(greeting, 'Hello, Alice!', 'template literal works');
  t.end();
});

test('String Operations: string methods', (t) => {
  const text = '  hello world  ';
  t.equal(text.trim(), 'hello world', 'trim removes whitespace');
  t.equal(text.trim().toUpperCase(), 'HELLO WORLD', 'chained methods');
  t.end();
});

// Object Operations
test('Object Operations: property access', (t) => {
  const person = { name: 'Alice', age: 30 };
  t.equal(person.name, 'Alice', 'dot notation');
  t.equal(person['age'], 30, 'bracket notation');
  t.end();
});

test('Object Operations: Object.keys', (t) => {
  const obj = { a: 1, b: 2, c: 3 };
  const keys = Object.keys(obj);
  t.deepEqual(keys, ['a', 'b', 'c'], 'object keys');
  t.end();
});

test('Object Operations: Object.values', (t) => {
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
