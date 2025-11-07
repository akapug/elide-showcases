/**
 * E-commerce Platform Integration Tests
 *
 * Comprehensive test suite covering:
 * - Product catalog operations
 * - Shopping cart functionality
 * - Order processing and checkout
 * - Inventory management
 * - Payment service integration
 * - Email service integration
 * - Input validation
 * - Edge cases and error handling
 *
 * Run with: elide run tests/integration-test.ts
 */

import { EcommerceServer } from '../backend/server.ts';
import { OrderStatus } from '../backend/db/database.ts';

// Test utilities
let testsPassed = 0;
let testsFailed = 0;
let currentSuite = '';

function suite(name: string) {
  currentSuite = name;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TEST SUITE: ${name}`);
  console.log('='.repeat(60));
}

function test(name: string, fn: () => Promise<void> | void) {
  return async () => {
    try {
      await fn();
      console.log(`✓ ${name}`);
      testsPassed++;
    } catch (error) {
      console.log(`✗ ${name}`);
      console.error(`  Error: ${error instanceof Error ? error.message : String(error)}`);
      testsFailed++;
    }
  };
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEqual(actual: any, expected: any, message: string) {
  if (actual !== expected) {
    throw new Error(`${message} - Expected: ${expected}, Got: ${actual}`);
  }
}

function assertGreaterThan(actual: number, expected: number, message: string) {
  if (actual <= expected) {
    throw new Error(`${message} - Expected > ${expected}, Got: ${actual}`);
  }
}

// Main test runner
export async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   E-commerce Platform Integration Tests                 ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  const server = new EcommerceServer();
  await server.initialize();
  const db = server.getDatabase();

  // ============================================================================
  // Product Tests
  // ============================================================================

  suite('Product Catalog Tests');

  await test('List all products', async () => {
    const res = await server.handleRequest({
      method: 'GET',
      url: '/api/products?limit=100',
      headers: {},
    });

    assertEqual(res.status, 200, 'Response status should be 200');
    assert(res.body.products.length > 0, 'Should return products');
    assert(res.body.pagination, 'Should include pagination info');
  })();

  await test('Get single product by ID', async () => {
    const products = db.getProducts();
    const productId = products[0].id;

    const res = await server.handleRequest({
      method: 'GET',
      url: `/api/products/${productId}`,
      headers: {},
    });

    assertEqual(res.status, 200, 'Response status should be 200');
    assertEqual(res.body.product.id, productId, 'Should return correct product');
    assert(res.body.inventory, 'Should include inventory info');
  })();

  await test('Filter products by category', async () => {
    const res = await server.handleRequest({
      method: 'GET',
      url: '/api/products?category=electronics',
      headers: {},
    });

    assertEqual(res.status, 200, 'Response status should be 200');
    assert(res.body.products.length > 0, 'Should return electronics products');
    assert(
      res.body.products.every((p: any) => p.category === 'electronics'),
      'All products should be electronics'
    );
  })();

  await test('Filter products by price range', async () => {
    const res = await server.handleRequest({
      method: 'GET',
      url: '/api/products?minPrice=50&maxPrice=100',
      headers: {},
    });

    assertEqual(res.status, 200, 'Response status should be 200');
    assert(
      res.body.products.every((p: any) => p.price >= 50 && p.price <= 100),
      'All products should be in price range'
    );
  })();

  await test('Filter in-stock products only', async () => {
    const res = await server.handleRequest({
      method: 'GET',
      url: '/api/products?inStock=true',
      headers: {},
    });

    assertEqual(res.status, 200, 'Response status should be 200');
    assert(
      res.body.products.every((p: any) => p.stock > 0),
      'All products should be in stock'
    );
  })();

  await test('Sort products by price ascending', async () => {
    const res = await server.handleRequest({
      method: 'GET',
      url: '/api/products?sortBy=price&sortOrder=asc&limit=10',
      headers: {},
    });

    assertEqual(res.status, 200, 'Response status should be 200');
    const prices = res.body.products.map((p: any) => p.price);
    const sorted = [...prices].sort((a, b) => a - b);
    assert(
      JSON.stringify(prices) === JSON.stringify(sorted),
      'Products should be sorted by price ascending'
    );
  })();

  await test('Pagination works correctly', async () => {
    const res = await server.handleRequest({
      method: 'GET',
      url: '/api/products?page=1&limit=5',
      headers: {},
    });

    assertEqual(res.status, 200, 'Response status should be 200');
    assertEqual(res.body.products.length, 5, 'Should return 5 products');
    assertEqual(res.body.pagination.page, 1, 'Should be page 1');
    assertEqual(res.body.pagination.limit, 5, 'Should have limit 5');
  })();

  await test('Non-existent product returns 404', async () => {
    const res = await server.handleRequest({
      method: 'GET',
      url: '/api/products/nonexistent-id',
      headers: {},
    });

    assertEqual(res.status, 404, 'Response status should be 404');
    assert(res.body.error, 'Should return error message');
  })();

  // ============================================================================
  // Shopping Cart Tests
  // ============================================================================

  suite('Shopping Cart Tests');

  await test('Get empty cart', async () => {
    const res = await server.handleRequest({
      method: 'GET',
      url: '/api/cart',
      headers: {},
    });

    assertEqual(res.status, 200, 'Response status should be 200');
    assert(res.body.cart, 'Should return cart object');
    assertEqual(res.body.cart.items.length, 0, 'Cart should be empty');
  })();

  await test('Add item to cart', async () => {
    const products = db.getProducts();
    const product = products[0];

    const res = await server.handleRequest({
      method: 'POST',
      url: '/api/cart/items',
      headers: {},
      body: {
        productId: product.id,
        quantity: 2,
      },
    });

    assertEqual(res.status, 200, 'Response status should be 200');
    assertEqual(res.body.cart.items.length, 1, 'Cart should have 1 item');
    assertEqual(res.body.cart.items[0].quantity, 2, 'Item quantity should be 2');
    assertGreaterThan(res.body.totals.subtotal, 0, 'Subtotal should be positive');
  })();

  await test('Add multiple items to cart', async () => {
    const products = db.getProducts();

    // Add first product
    await server.handleRequest({
      method: 'POST',
      url: '/api/cart/items',
      headers: { cookie: 'elide-shop-session=test-session-1' },
      body: {
        productId: products[0].id,
        quantity: 1,
      },
    });

    // Add second product
    const res = await server.handleRequest({
      method: 'POST',
      url: '/api/cart/items',
      headers: { cookie: 'elide-shop-session=test-session-1' },
      body: {
        productId: products[1].id,
        quantity: 2,
      },
    });

    assertEqual(res.status, 200, 'Response status should be 200');
    assertGreaterThan(res.body.cart.items.length, 1, 'Cart should have multiple items');
  })();

  await test('Cannot add item with insufficient stock', async () => {
    const products = db.getProducts();
    const product = products[0];

    const res = await server.handleRequest({
      method: 'POST',
      url: '/api/cart/items',
      headers: {},
      body: {
        productId: product.id,
        quantity: 10000, // More than available
      },
    });

    assertEqual(res.status, 400, 'Response status should be 400');
    assert(res.body.error, 'Should return error message');
  })();

  await test('Cart totals include tax and shipping', async () => {
    const products = db.getProducts();
    const product = products[0];

    const res = await server.handleRequest({
      method: 'POST',
      url: '/api/cart/items',
      headers: { cookie: 'elide-shop-session=test-session-2' },
      body: {
        productId: product.id,
        quantity: 1,
      },
    });

    assertEqual(res.status, 200, 'Response status should be 200');
    assert(res.body.totals.subtotal, 'Should have subtotal');
    assert(res.body.totals.tax, 'Should have tax');
    assert(res.body.totals.shipping !== undefined, 'Should have shipping');
    assert(res.body.totals.total, 'Should have total');
    assertGreaterThan(
      res.body.totals.total,
      res.body.totals.subtotal,
      'Total should be greater than subtotal'
    );
  })();

  await test('Free shipping over $50', async () => {
    const products = db.getProducts();
    const expensiveProduct = products.find(p => p.price > 50);

    if (expensiveProduct) {
      const res = await server.handleRequest({
        method: 'POST',
        url: '/api/cart/items',
        headers: { cookie: 'elide-shop-session=test-session-3' },
        body: {
          productId: expensiveProduct.id,
          quantity: 1,
        },
      });

      assertEqual(res.status, 200, 'Response status should be 200');
      assertEqual(res.body.totals.shipping, 0, 'Shipping should be free');
    }
  })();

  await test('Clear cart', async () => {
    // Add item first
    const products = db.getProducts();
    await server.handleRequest({
      method: 'POST',
      url: '/api/cart/items',
      headers: { cookie: 'elide-shop-session=test-session-4' },
      body: {
        productId: products[0].id,
        quantity: 1,
      },
    });

    // Clear cart
    const res = await server.handleRequest({
      method: 'DELETE',
      url: '/api/cart',
      headers: { cookie: 'elide-shop-session=test-session-4' },
    });

    assertEqual(res.status, 200, 'Response status should be 200');
    assertEqual(res.body.cart.items.length, 0, 'Cart should be empty');
    assertEqual(res.body.totals.total, 0, 'Total should be 0');
  })();

  // ============================================================================
  // Order Tests
  // ============================================================================

  suite('Order Processing Tests');

  await test('Create order with valid data', async () => {
    // Add items to cart
    const products = db.getProducts();
    await server.handleRequest({
      method: 'POST',
      url: '/api/cart/items',
      headers: { cookie: 'elide-shop-session=order-test-1' },
      body: {
        productId: products[0].id,
        quantity: 1,
      },
    });

    // Create order
    const res = await server.handleRequest({
      method: 'POST',
      url: '/api/orders',
      headers: { cookie: 'elide-shop-session=order-test-1' },
      body: {
        customerEmail: 'test@example.com',
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          address: '123 Main St',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94102',
          phone: '555-1234',
        },
        paymentMethod: {
          cardNumber: '4242424242424242',
          expiry: '12/25',
          cvv: '123',
        },
        sameAsBilling: true,
      },
    });

    assertEqual(res.status, 201, 'Response status should be 201');
    assert(res.body.order, 'Should return order object');
    assert(res.body.order.orderNumber, 'Should have order number');
    assert(res.body.order.id, 'Should have order ID');
    assertGreaterThan(res.body.order.total, 0, 'Order total should be positive');
  })();

  await test('Cannot create order without items', async () => {
    const res = await server.handleRequest({
      method: 'POST',
      url: '/api/orders',
      headers: { cookie: 'elide-shop-session=empty-order' },
      body: {
        customerEmail: 'test@example.com',
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          address: '123 Main St',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94102',
          phone: '555-1234',
        },
        paymentMethod: {
          cardNumber: '4242424242424242',
          expiry: '12/25',
          cvv: '123',
        },
        sameAsBilling: true,
      },
    });

    assert(res.status >= 400, 'Should return error status');
    assert(res.body.error, 'Should return error message');
  })();

  await test('Order validation requires valid email', async () => {
    const products = db.getProducts();
    await server.handleRequest({
      method: 'POST',
      url: '/api/cart/items',
      headers: { cookie: 'elide-shop-session=invalid-email' },
      body: {
        productId: products[0].id,
        quantity: 1,
      },
    });

    const res = await server.handleRequest({
      method: 'POST',
      url: '/api/orders',
      headers: { cookie: 'elide-shop-session=invalid-email' },
      body: {
        customerEmail: 'invalid-email',
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          address: '123 Main St',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94102',
          phone: '555-1234',
        },
        paymentMethod: {
          cardNumber: '4242424242424242',
          expiry: '12/25',
          cvv: '123',
        },
        sameAsBilling: true,
      },
    });

    assertEqual(res.status, 400, 'Response status should be 400');
    assert(res.body.error, 'Should return error message');
  })();

  await test('Order validation requires valid ZIP code', async () => {
    const products = db.getProducts();
    await server.handleRequest({
      method: 'POST',
      url: '/api/cart/items',
      headers: { cookie: 'elide-shop-session=invalid-zip' },
      body: {
        productId: products[0].id,
        quantity: 1,
      },
    });

    const res = await server.handleRequest({
      method: 'POST',
      url: '/api/orders',
      headers: { cookie: 'elide-shop-session=invalid-zip' },
      body: {
        customerEmail: 'test@example.com',
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          address: '123 Main St',
          city: 'San Francisco',
          state: 'CA',
          zipCode: 'INVALID',
          phone: '555-1234',
        },
        paymentMethod: {
          cardNumber: '4242424242424242',
          expiry: '12/25',
          cvv: '123',
        },
        sameAsBilling: true,
      },
    });

    assertEqual(res.status, 400, 'Response status should be 400');
    assert(res.body.error, 'Should return error message');
  })();

  await test('Get order by ID', async () => {
    const orders = db.getOrders();
    if (orders.length > 0) {
      const orderId = orders[0].id;

      const res = await server.handleRequest({
        method: 'GET',
        url: `/api/orders/${orderId}`,
        headers: {},
      });

      assertEqual(res.status, 200, 'Response status should be 200');
      assertEqual(res.body.order.id, orderId, 'Should return correct order');
    }
  })();

  await test('List all orders', async () => {
    const res = await server.handleRequest({
      method: 'GET',
      url: '/api/orders',
      headers: {},
    });

    assertEqual(res.status, 200, 'Response status should be 200');
    assert(Array.isArray(res.body.orders), 'Should return orders array');
  })();

  // ============================================================================
  // Inventory Tests
  // ============================================================================

  suite('Inventory Management Tests');

  await test('Get inventory status', async () => {
    const res = await server.handleRequest({
      method: 'GET',
      url: '/api/inventory',
      headers: {},
    });

    assertEqual(res.status, 200, 'Response status should be 200');
    assert(res.body.summary, 'Should return summary');
    assertGreaterThan(res.body.summary.totalProducts, 0, 'Should have products');
    assertGreaterThan(res.body.summary.totalStock, 0, 'Should have stock');
  })();

  await test('Get product inventory', async () => {
    const products = db.getProducts();
    const productId = products[0].id;

    const res = await server.handleRequest({
      method: 'GET',
      url: `/api/inventory/${productId}`,
      headers: {},
    });

    assertEqual(res.status, 200, 'Response status should be 200');
    assert(res.body.product, 'Should return product info');
    assert(res.body.inventory, 'Should return inventory info');
    assert(res.body.metrics, 'Should return metrics');
  })();

  await test('Get low stock products', async () => {
    const res = await server.handleRequest({
      method: 'GET',
      url: '/api/inventory/low-stock',
      headers: {},
    });

    assertEqual(res.status, 200, 'Response status should be 200');
    assert(Array.isArray(res.body.products), 'Should return products array');
  })();

  await test('Update product stock', async () => {
    const products = db.getProducts();
    const productId = products[0].id;

    const res = await server.handleRequest({
      method: 'PUT',
      url: `/api/inventory/${productId}`,
      headers: {},
      body: {
        stock: 100,
        action: 'set',
      },
    });

    assertEqual(res.status, 200, 'Response status should be 200');
    assertEqual(res.body.newStock, 100, 'Stock should be updated to 100');
  })();

  // ============================================================================
  // General API Tests
  // ============================================================================

  suite('General API Tests');

  await test('Health check endpoint', async () => {
    const res = await server.handleRequest({
      method: 'GET',
      url: '/health',
      headers: {},
    });

    assertEqual(res.status, 200, 'Response status should be 200');
    assertEqual(res.body.status, 'healthy', 'Status should be healthy');
  })();

  await test('API info endpoint', async () => {
    const res = await server.handleRequest({
      method: 'GET',
      url: '/api',
      headers: {},
    });

    assertEqual(res.status, 200, 'Response status should be 200');
    assert(res.body.name, 'Should have API name');
    assert(res.body.version, 'Should have API version');
    assert(res.body.endpoints, 'Should have endpoints info');
  })();

  await test('Non-existent endpoint returns 404', async () => {
    const res = await server.handleRequest({
      method: 'GET',
      url: '/api/nonexistent',
      headers: {},
    });

    assertEqual(res.status, 404, 'Response status should be 404');
    assert(res.body.error, 'Should return error message');
  })();

  await test('CORS headers are set', async () => {
    const res = await server.handleRequest({
      method: 'GET',
      url: '/api',
      headers: {},
    });

    assert(res.headers['Access-Control-Allow-Origin'], 'Should have CORS origin header');
    assert(res.headers['Access-Control-Allow-Methods'], 'Should have CORS methods header');
  })();

  // ============================================================================
  // Results Summary
  // ============================================================================

  console.log('\n' + '='.repeat(60));
  console.log('TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${testsPassed + testsFailed}`);
  console.log(`✓ Passed: ${testsPassed}`);
  console.log(`✗ Failed: ${testsFailed}`);
  console.log(`Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
  console.log('='.repeat(60));

  if (testsFailed > 0) {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
    process.exit(1);
  } else {
    console.log('\n✓ All tests passed successfully!');
  }
}

// Run tests if executed directly
if (import.meta.url.includes('integration-test.ts')) {
  main().catch(console.error);
}
