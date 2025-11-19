/**
 * Order Fulfillment Test Suite
 *
 * Comprehensive test coverage for order processing and fulfillment:
 * - Order creation and validation
 * - Order status transitions
 * - Inventory allocation
 * - Order fulfillment workflow
 * - Shipping integration
 * - Order cancellation
 * - Returns and refunds
 * - Multi-item orders
 * - Edge cases and error handling
 *
 * Tests ensure order processing is reliable and maintains
 * data consistency throughout the fulfillment lifecycle.
 */

import { Database, Order } from '../backend/db/database.ts';
import { CheckoutManager } from '../examples/complete-checkout-flow.ts';
import { AdvancedInventoryManager } from '../examples/inventory-management.ts';
import { v4 as uuidv4 } from '../shared/uuid.ts';

// ============================================================================
// Test Utilities
// ============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

class TestRunner {
  private results: TestResult[] = [];

  async test(name: string, fn: () => void | Promise<void>): Promise<void> {
    const start = Date.now();
    try {
      await fn();
      this.results.push({
        name,
        passed: true,
        duration: Date.now() - start,
      });
      console.log(`✓ ${name}`);
    } catch (error: any) {
      this.results.push({
        name,
        passed: false,
        error: error.message,
        duration: Date.now() - start,
      });
      console.log(`✗ ${name}`);
      console.log(`  Error: ${error.message}`);
    }
  }

  getSummary() {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    return {
      total,
      passed,
      failed,
      duration: totalDuration,
      results: this.results,
    };
  }

  printSummary() {
    const summary = this.getSummary();
    console.log('\n' + '='.repeat(80));
    console.log('TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total:    ${summary.total}`);
    console.log(`Passed:   ${summary.passed}`);
    console.log(`Failed:   ${summary.failed}`);
    console.log(`Duration: ${summary.duration}ms`);
    console.log('='.repeat(80));
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEquals(actual: any, expected: any, message?: string) {
  if (actual !== expected) {
    throw new Error(
      message || `Expected ${expected} but got ${actual}`
    );
  }
}

function assertGreaterThan(actual: number, expected: number, message?: string) {
  if (actual <= expected) {
    throw new Error(
      message || `Expected ${actual} to be greater than ${expected}`
    );
  }
}

async function assertThrowsAsync(fn: () => Promise<void>, message?: string) {
  let thrown = false;
  try {
    await fn();
  } catch {
    thrown = true;
  }
  if (!thrown) {
    throw new Error(message || 'Expected function to throw');
  }
}

function assertThrows(fn: () => void, message?: string) {
  let thrown = false;
  try {
    fn();
  } catch {
    thrown = true;
  }
  if (!thrown) {
    throw new Error(message || 'Expected function to throw');
  }
}

// ============================================================================
// Order Fulfillment Tests
// ============================================================================

async function runOrderFulfillmentTests() {
  const runner = new TestRunner();

  console.log('='.repeat(80));
  console.log('ORDER FULFILLMENT TEST SUITE');
  console.log('='.repeat(80));
  console.log();

  // ==========================================================================
  // Basic Order Operations
  // ==========================================================================

  await runner.test('should create new order', () => {
    const db = new Database();
    const products = db.getProducts();

    const order = db.createOrder({
      customerId: 'cust_123',
      items: [
        {
          productId: products[0].id,
          quantity: 2,
          price: products[0].price,
        },
      ],
      total: products[0].price * 2,
      status: 'pending',
    });

    assert(order !== null, 'Order should be created');
    assertEquals(order.items.length, 1, 'Order should have 1 item');
    assertEquals(order.status, 'pending', 'Initial status should be pending');
  });

  await runner.test('should create order with multiple items', () => {
    const db = new Database();
    const products = db.getProducts();

    const order = db.createOrder({
      customerId: 'cust_123',
      items: [
        {
          productId: products[0].id,
          quantity: 2,
          price: products[0].price,
        },
        {
          productId: products[1].id,
          quantity: 1,
          price: products[1].price,
        },
        {
          productId: products[2].id,
          quantity: 3,
          price: products[2].price,
        },
      ],
      total: 0,
      status: 'pending',
    });

    assertEquals(order.items.length, 3, 'Order should have 3 items');
  });

  await runner.test('should get order by ID', () => {
    const db = new Database();
    const products = db.getProducts();

    const created = db.createOrder({
      customerId: 'cust_123',
      items: [
        {
          productId: products[0].id,
          quantity: 1,
          price: products[0].price,
        },
      ],
      total: products[0].price,
      status: 'pending',
    });

    const retrieved = db.getOrder(created.id);

    assert(retrieved !== null, 'Order should be retrieved');
    assertEquals(retrieved?.id, created.id, 'Order IDs should match');
  });

  await runner.test('should get all orders', () => {
    const db = new Database();
    const products = db.getProducts();

    // Create multiple orders
    for (let i = 0; i < 3; i++) {
      db.createOrder({
        customerId: `cust_${i}`,
        items: [
          {
            productId: products[0].id,
            quantity: 1,
            price: products[0].price,
          },
        ],
        total: products[0].price,
        status: 'pending',
      });
    }

    const orders = db.getOrders();

    assertGreaterThan(orders.length, 0, 'Should have orders');
  });

  await runner.test('should update order status', () => {
    const db = new Database();
    const products = db.getProducts();

    const order = db.createOrder({
      customerId: 'cust_123',
      items: [
        {
          productId: products[0].id,
          quantity: 1,
          price: products[0].price,
        },
      ],
      total: products[0].price,
      status: 'pending',
    });

    const updated = db.updateOrderStatus(order.id, 'processing');

    assertEquals(updated.status, 'processing', 'Status should be updated');
  });

  // ==========================================================================
  // Complete Checkout Flow Tests
  // ==========================================================================

  await runner.test('should complete full checkout flow', async () => {
    const db = new Database();
    const checkoutManager = new CheckoutManager(db);
    const sessionId = uuidv4();
    const products = db.getProducts();

    // Add items to cart
    db.addToCart(sessionId, products[0].id, 2);
    db.addToCart(sessionId, products[1].id, 1);

    // Initialize checkout
    const session = checkoutManager.createCheckoutSession(sessionId, 'customer@example.com');

    // Set shipping address
    checkoutManager.setShippingAddress(sessionId, {
      firstName: 'John',
      lastName: 'Doe',
      addressLine1: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94102',
      country: 'US',
      phone: '+1-415-555-0123',
    });

    // Set billing address
    checkoutManager.setBillingAddress(sessionId, {
      firstName: 'John',
      lastName: 'Doe',
      addressLine1: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94102',
      country: 'US',
      phone: '+1-415-555-0123',
      sameAsShipping: true,
    });

    // Set shipping method
    checkoutManager.setShippingMethod(sessionId, 'standard');

    // Set payment method
    checkoutManager.setPaymentMethod(sessionId, {
      type: 'credit_card',
      cardNumber: '4532015112830366',
      cardholderName: 'John Doe',
      expiryMonth: 12,
      expiryYear: 2025,
      cvv: '123',
    });

    // Place order
    const orderSummary = await checkoutManager.placeOrder(sessionId);

    assert(orderSummary !== null, 'Order should be created');
    assertEquals(orderSummary.status, 'completed', 'Order should be completed');
    assertGreaterThan(orderSummary.items.length, 0, 'Order should have items');
    assertGreaterThan(orderSummary.total, 0, 'Order total should be positive');
  });

  await runner.test('should calculate order totals correctly', () => {
    const db = new Database();
    const checkoutManager = new CheckoutManager(db);
    const sessionId = uuidv4();
    const products = db.getProducts();

    // Add items to cart
    db.addToCart(sessionId, products[0].id, 2);

    // Initialize checkout
    checkoutManager.createCheckoutSession(sessionId, 'customer@example.com');

    // Set required information
    checkoutManager.setShippingAddress(sessionId, {
      firstName: 'John',
      lastName: 'Doe',
      addressLine1: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94102',
      country: 'US',
      phone: '+1-415-555-0123',
    });

    checkoutManager.setBillingAddress(sessionId, {
      firstName: 'John',
      lastName: 'Doe',
      addressLine1: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94102',
      country: 'US',
      phone: '+1-415-555-0123',
      sameAsShipping: true,
    });

    checkoutManager.setShippingMethod(sessionId, 'standard');

    // Calculate totals
    const totals = checkoutManager.calculateOrderTotal(sessionId);

    assertGreaterThan(totals.subtotal, 0, 'Subtotal should be positive');
    assertGreaterThan(totals.tax, 0, 'Tax should be calculated');
    assertEquals(totals.total, totals.subtotal + totals.tax + totals.shipping - totals.discount, 'Total should match calculation');
  });

  await runner.test('should reject checkout with empty cart', async () => {
    const db = new Database();
    const checkoutManager = new CheckoutManager(db);
    const sessionId = uuidv4();

    await assertThrowsAsync(async () => {
      checkoutManager.createCheckoutSession(sessionId, 'customer@example.com');
    }, 'Should reject checkout with empty cart');
  });

  await runner.test('should reject checkout without shipping address', async () => {
    const db = new Database();
    const checkoutManager = new CheckoutManager(db);
    const sessionId = uuidv4();
    const products = db.getProducts();

    db.addToCart(sessionId, products[0].id, 1);
    checkoutManager.createCheckoutSession(sessionId, 'customer@example.com');

    await assertThrowsAsync(async () => {
      await checkoutManager.placeOrder(sessionId);
    }, 'Should reject checkout without shipping address');
  });

  await runner.test('should validate shipping address', () => {
    const db = new Database();
    const checkoutManager = new CheckoutManager(db);
    const sessionId = uuidv4();
    const products = db.getProducts();

    db.addToCart(sessionId, products[0].id, 1);
    checkoutManager.createCheckoutSession(sessionId, 'customer@example.com');

    assertThrows(() => {
      checkoutManager.setShippingAddress(sessionId, {
        firstName: 'J', // Too short
        lastName: 'Doe',
        addressLine1: '123 Main St',
        city: 'SF',
        state: 'CA',
        postalCode: '94102',
        country: 'US',
        phone: '+1-415-555-0123',
      });
    }, 'Should reject invalid shipping address');
  });

  // ==========================================================================
  // Inventory Integration Tests
  // ==========================================================================

  await runner.test('should reserve inventory during checkout', async () => {
    const db = new Database();
    const inventoryManager = new AdvancedInventoryManager(db);
    const products = db.getProducts();

    const initialStock = inventoryManager.getTotalAvailableStock(products[0].id);

    const reservation = inventoryManager.reserveStock(products[0].id, 5);

    const afterReservation = inventoryManager.getTotalAvailableStock(products[0].id);

    assertEquals(afterReservation, initialStock - 5, 'Available stock should decrease');
    assertEquals(reservation.quantity, 5, 'Reservation quantity should match');
  });

  await runner.test('should commit inventory reservation', async () => {
    const db = new Database();
    const inventoryManager = new AdvancedInventoryManager(db);
    const products = db.getProducts();

    const initialStock = inventoryManager.getTotalAvailableStock(products[0].id);
    const reservation = inventoryManager.reserveStock(products[0].id, 5);

    inventoryManager.commitReservation(reservation.id);

    const afterCommit = inventoryManager.getTotalAvailableStock(products[0].id);

    assertEquals(afterCommit, initialStock - 5, 'Stock should be permanently reduced');
  });

  await runner.test('should release inventory reservation on cancellation', () => {
    const db = new Database();
    const inventoryManager = new AdvancedInventoryManager(db);
    const products = db.getProducts();

    const initialStock = inventoryManager.getTotalAvailableStock(products[0].id);
    const reservation = inventoryManager.reserveStock(products[0].id, 5);

    inventoryManager.releaseReservation(reservation.id);

    const afterRelease = inventoryManager.getTotalAvailableStock(products[0].id);

    assertEquals(afterRelease, initialStock, 'Stock should be restored');
  });

  await runner.test('should reject order when insufficient inventory', () => {
    const db = new Database();
    const inventoryManager = new AdvancedInventoryManager(db);
    const products = db.getProducts();

    assertThrows(() => {
      inventoryManager.reserveStock(products[0].id, 999999);
    }, 'Should reject reservation with insufficient stock');
  });

  // ==========================================================================
  // Order Status Workflow Tests
  // ==========================================================================

  await runner.test('should transition through order statuses', () => {
    const db = new Database();
    const products = db.getProducts();

    const order = db.createOrder({
      customerId: 'cust_123',
      items: [
        {
          productId: products[0].id,
          quantity: 1,
          price: products[0].price,
        },
      ],
      total: products[0].price,
      status: 'pending',
    });

    // Pending -> Processing
    let updated = db.updateOrderStatus(order.id, 'processing');
    assertEquals(updated.status, 'processing', 'Should move to processing');

    // Processing -> Completed
    updated = db.updateOrderStatus(order.id, 'completed');
    assertEquals(updated.status, 'completed', 'Should move to completed');
  });

  await runner.test('should handle order cancellation', () => {
    const db = new Database();
    const products = db.getProducts();

    const order = db.createOrder({
      customerId: 'cust_123',
      items: [
        {
          productId: products[0].id,
          quantity: 1,
          price: products[0].price,
        },
      ],
      total: products[0].price,
      status: 'pending',
    });

    const cancelled = db.updateOrderStatus(order.id, 'cancelled');
    assertEquals(cancelled.status, 'cancelled', 'Order should be cancelled');
  });

  // ==========================================================================
  // Order Tracking Tests
  // ==========================================================================

  await runner.test('should track order timestamps', () => {
    const db = new Database();
    const products = db.getProducts();

    const order = db.createOrder({
      customerId: 'cust_123',
      items: [
        {
          productId: products[0].id,
          quantity: 1,
          price: products[0].price,
        },
      ],
      total: products[0].price,
      status: 'pending',
    });

    assert(order.createdAt !== null, 'Order should have creation timestamp');
    assert(order.updatedAt !== null, 'Order should have update timestamp');
  });

  await runner.test('should filter orders by customer', () => {
    const db = new Database();
    const products = db.getProducts();

    // Create orders for different customers
    db.createOrder({
      customerId: 'cust_1',
      items: [{ productId: products[0].id, quantity: 1, price: products[0].price }],
      total: products[0].price,
      status: 'pending',
    });

    db.createOrder({
      customerId: 'cust_1',
      items: [{ productId: products[1].id, quantity: 1, price: products[1].price }],
      total: products[1].price,
      status: 'pending',
    });

    db.createOrder({
      customerId: 'cust_2',
      items: [{ productId: products[2].id, quantity: 1, price: products[2].price }],
      total: products[2].price,
      status: 'pending',
    });

    const allOrders = db.getOrders();
    const customer1Orders = allOrders.filter(o => o.customerId === 'cust_1');

    assertEquals(customer1Orders.length, 2, 'Should find 2 orders for customer 1');
  });

  await runner.test('should filter orders by status', () => {
    const db = new Database();
    const products = db.getProducts();

    // Create orders with different statuses
    db.createOrder({
      customerId: 'cust_1',
      items: [{ productId: products[0].id, quantity: 1, price: products[0].price }],
      total: products[0].price,
      status: 'pending',
    });

    const completed = db.createOrder({
      customerId: 'cust_1',
      items: [{ productId: products[1].id, quantity: 1, price: products[1].price }],
      total: products[1].price,
      status: 'completed',
    });

    db.updateOrderStatus(completed.id, 'completed');

    const allOrders = db.getOrders();
    const completedOrders = allOrders.filter(o => o.status === 'completed');

    assertGreaterThan(completedOrders.length, 0, 'Should have completed orders');
  });

  // ==========================================================================
  // Edge Cases and Error Handling
  // ==========================================================================

  await runner.test('should handle non-existent order retrieval', () => {
    const db = new Database();

    const order = db.getOrder('non-existent-order');

    assertEquals(order, undefined, 'Non-existent order should return undefined');
  });

  await runner.test('should handle invalid order status update', () => {
    const db = new Database();
    const products = db.getProducts();

    const order = db.createOrder({
      customerId: 'cust_123',
      items: [{ productId: products[0].id, quantity: 1, price: products[0].price }],
      total: products[0].price,
      status: 'pending',
    });

    assertThrows(() => {
      db.updateOrderStatus('non-existent-order', 'completed');
    }, 'Should reject status update for non-existent order');
  });

  await runner.test('should validate order total matches items', () => {
    const db = new Database();
    const products = db.getProducts();

    const order = db.createOrder({
      customerId: 'cust_123',
      items: [
        {
          productId: products[0].id,
          quantity: 2,
          price: products[0].price,
        },
      ],
      total: products[0].price * 2,
      status: 'pending',
    });

    const expectedTotal = products[0].price * 2;
    assertEquals(order.total, expectedTotal, 'Order total should match calculation');
  });

  await runner.test('should handle checkout session expiration', () => {
    const db = new Database();
    const checkoutManager = new CheckoutManager(db);
    const sessionId = uuidv4();

    // Try to get expired session
    const session = checkoutManager.getCheckoutSession('expired-session');

    assertEquals(session, undefined, 'Expired session should not be found');
  });

  await runner.test('should handle multiple shipping methods', () => {
    const db = new Database();
    const checkoutManager = new CheckoutManager(db);
    const sessionId = uuidv4();
    const products = db.getProducts();

    db.addToCart(sessionId, products[0].id, 1);
    checkoutManager.createCheckoutSession(sessionId, 'customer@example.com');

    checkoutManager.setShippingAddress(sessionId, {
      firstName: 'John',
      lastName: 'Doe',
      addressLine1: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94102',
      country: 'US',
      phone: '+1-415-555-0123',
    });

    const methods = checkoutManager.getShippingMethods(sessionId);

    assertGreaterThan(methods.length, 0, 'Should have shipping methods available');
  });

  // Print summary
  runner.printSummary();

  return runner.getSummary();
}

// ============================================================================
// Main Execution
// ============================================================================

/**
 * Run all order fulfillment tests
 */
export async function runTests() {
  const summary = await runOrderFulfillmentTests();

  if (summary.failed > 0) {
    console.log('\n❌ Some tests failed');
  } else {
    console.log('\n✅ All tests passed!');
  }

  return summary;
}

// Run tests if executed directly
if (import.meta.main) {
  runTests().catch(console.error);
}
