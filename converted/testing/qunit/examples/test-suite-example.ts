#!/usr/bin/env elide

/**
 * Test Suite Example with Modules
 *
 * Demonstrates organizing tests into modules with hooks.
 */

import { QUnit, module, test } from '../index.ts';

// Module with hooks
module('User Management', {
  before(assert) {
    console.log('Setting up user management tests...');
  },

  beforeEach(assert) {
    // Setup before each test
  },

  afterEach(assert) {
    // Cleanup after each test
  },

  after(assert) {
    console.log('User management tests complete');
  },
}, () => {
  test('create user', (assert) => {
    const user = {
      name: 'Alice',
      email: 'alice@example.com',
      age: 30,
    };

    assert.ok(user.name, 'user has a name');
    assert.ok(user.email, 'user has an email');
    assert.ok(user.age > 0, 'user age is positive');
  });

  test('update user', (assert) => {
    const user = {
      name: 'Alice',
      email: 'alice@example.com',
    };

    user.email = 'alice.smith@example.com';

    assert.equal(user.email, 'alice.smith@example.com', 'email was updated');
  });

  test('delete user', (assert) => {
    let user: any = {
      name: 'Alice',
      email: 'alice@example.com',
    };

    user = null;

    assert.strictEqual(user, null, 'user was deleted');
  });
});

// Another module
module('Authentication', () => {
  test('login with valid credentials', (assert) => {
    const credentials = {
      username: 'alice',
      password: 'secret123',
    };

    const isValid = credentials.username.length > 0 && credentials.password.length >= 8;

    assert.true(isValid, 'credentials are valid');
  });

  test('login with invalid credentials', (assert) => {
    const credentials = {
      username: '',
      password: '123',
    };

    const isValid = credentials.username.length > 0 && credentials.password.length >= 8;

    assert.false(isValid, 'credentials are invalid');
  });

  test('logout', (assert) => {
    let isLoggedIn = true;

    // Simulate logout
    isLoggedIn = false;

    assert.false(isLoggedIn, 'user is logged out');
  });
});

// Nested modules
module('Shopping Cart', () => {
  module('Add Items', () => {
    test('add single item', (assert) => {
      const cart: any[] = [];
      cart.push({ id: 1, name: 'Widget', price: 9.99 });

      assert.equal(cart.length, 1, 'cart has one item');
    });

    test('add multiple items', (assert) => {
      const cart: any[] = [];
      cart.push({ id: 1, name: 'Widget', price: 9.99 });
      cart.push({ id: 2, name: 'Gadget', price: 19.99 });

      assert.equal(cart.length, 2, 'cart has two items');
    });
  });

  module('Remove Items', () => {
    test('remove item by id', (assert) => {
      const cart = [
        { id: 1, name: 'Widget', price: 9.99 },
        { id: 2, name: 'Gadget', price: 19.99 },
      ];

      const filtered = cart.filter(item => item.id !== 1);

      assert.equal(filtered.length, 1, 'one item removed');
      assert.equal(filtered[0].id, 2, 'correct item remains');
    });
  });

  module('Calculate Total', () => {
    test('calculate total price', (assert) => {
      const cart = [
        { id: 1, name: 'Widget', price: 9.99 },
        { id: 2, name: 'Gadget', price: 19.99 },
      ];

      const total = cart.reduce((sum, item) => sum + item.price, 0);

      assert.equal(total, 29.98, 'total price is correct');
    });

    test('empty cart has zero total', (assert) => {
      const cart: any[] = [];
      const total = cart.reduce((sum, item) => sum + item.price, 0);

      assert.equal(total, 0, 'empty cart total is zero');
    });
  });
});

// Module with shared state
let sharedCounter = 0;

module('Shared State', {
  beforeEach(assert) {
    sharedCounter = 0;
  },
}, () => {
  test('increment counter', (assert) => {
    sharedCounter++;
    assert.equal(sharedCounter, 1, 'counter is 1');
  });

  test('counter resets between tests', (assert) => {
    assert.equal(sharedCounter, 0, 'counter reset to 0');
  });
});

// Run tests if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  const results = await QUnit.run();
  QUnit.printResults(results);
  process.exit(results.failed > 0 ? 1 : 0);
}
