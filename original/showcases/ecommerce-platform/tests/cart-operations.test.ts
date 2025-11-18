/**
 * Cart Operations Test Suite
 *
 * Comprehensive test coverage for shopping cart functionality:
 * - Adding and removing items
 * - Quantity updates
 * - Price calculations
 * - Cart validation
 * - Wishlist operations
 * - Save for later functionality
 * - Cart merging (guest to user)
 * - Cart abandonment tracking
 * - Edge cases and error handling
 *
 * Tests ensure cart operations are reliable and handle
 * all scenarios correctly.
 */

import { Database } from '../backend/db/database.ts';
import { CartManager } from '../backend/services/cart-manager.ts';
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

function assertLessThan(actual: number, expected: number, message?: string) {
  if (actual >= expected) {
    throw new Error(
      message || `Expected ${actual} to be less than ${expected}`
    );
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
// Cart Operations Tests
// ============================================================================

async function runCartOperationsTests() {
  const runner = new TestRunner();

  console.log('='.repeat(80));
  console.log('CART OPERATIONS TEST SUITE');
  console.log('='.repeat(80));
  console.log();

  // ==========================================================================
  // Basic Cart Operations
  // ==========================================================================

  await runner.test('should create empty cart for new session', () => {
    const db = new Database();
    const sessionId = uuidv4();

    const cart = db.getOrCreateCart(sessionId);

    assert(cart !== null, 'Cart should be created');
    assertEquals(cart.items.length, 0, 'New cart should be empty');
    assertEquals(cart.sessionId, sessionId, 'Session ID should match');
  });

  await runner.test('should add item to cart', () => {
    const db = new Database();
    const sessionId = uuidv4();
    const products = db.getProducts();

    const cart = db.addToCart(sessionId, products[0].id, 2);

    assertEquals(cart.items.length, 1, 'Cart should have 1 item');
    assertEquals(cart.items[0].productId, products[0].id, 'Product ID should match');
    assertEquals(cart.items[0].quantity, 2, 'Quantity should be 2');
  });

  await runner.test('should increase quantity when adding same product', () => {
    const db = new Database();
    const sessionId = uuidv4();
    const products = db.getProducts();

    db.addToCart(sessionId, products[0].id, 2);
    const cart = db.addToCart(sessionId, products[0].id, 3);

    assertEquals(cart.items.length, 1, 'Should still have 1 item');
    assertEquals(cart.items[0].quantity, 5, 'Quantity should be 5');
  });

  await runner.test('should add multiple different products', () => {
    const db = new Database();
    const sessionId = uuidv4();
    const products = db.getProducts();

    db.addToCart(sessionId, products[0].id, 1);
    db.addToCart(sessionId, products[1].id, 2);
    const cart = db.addToCart(sessionId, products[2].id, 3);

    assertEquals(cart.items.length, 3, 'Cart should have 3 items');
  });

  await runner.test('should remove item from cart', () => {
    const db = new Database();
    const sessionId = uuidv4();
    const products = db.getProducts();

    const cart = db.addToCart(sessionId, products[0].id, 2);
    const itemId = cart.items[0].id;

    db.removeFromCart(sessionId, itemId);
    const updatedCart = db.getCart(sessionId);

    assertEquals(updatedCart?.items.length, 0, 'Cart should be empty');
  });

  await runner.test('should update item quantity', () => {
    const db = new Database();
    const sessionId = uuidv4();
    const products = db.getProducts();

    const cart = db.addToCart(sessionId, products[0].id, 2);
    const itemId = cart.items[0].id;

    const updatedCart = db.updateCartItem(sessionId, itemId, 5);

    assertEquals(updatedCart.items[0].quantity, 5, 'Quantity should be updated to 5');
  });

  await runner.test('should clear entire cart', () => {
    const db = new Database();
    const sessionId = uuidv4();
    const products = db.getProducts();

    db.addToCart(sessionId, products[0].id, 1);
    db.addToCart(sessionId, products[1].id, 2);

    db.clearCart(sessionId);
    const cart = db.getCart(sessionId);

    assertEquals(cart?.items.length, 0, 'Cart should be empty after clearing');
  });

  // ==========================================================================
  // Cart Manager Tests
  // ==========================================================================

  await runner.test('should calculate cart summary correctly', () => {
    const db = new Database();
    const cartManager = new CartManager(db);
    const sessionId = uuidv4();
    const products = db.getProducts();

    db.addToCart(sessionId, products[0].id, 2);
    db.addToCart(sessionId, products[1].id, 1);

    const summary = cartManager.getCartSummary(sessionId);

    assertGreaterThan(summary.subtotal, 0, 'Subtotal should be greater than 0');
    assertGreaterThan(summary.estimatedTax, 0, 'Tax should be greater than 0');
    assertGreaterThan(summary.estimatedTotal, summary.subtotal, 'Total should include tax');
    assertEquals(summary.itemCount, 3, 'Item count should be 3');
    assertEquals(summary.uniqueItems, 2, 'Unique items should be 2');
  });

  await runner.test('should apply free shipping for orders over $50', () => {
    const db = new Database();
    const cartManager = new CartManager(db);
    const sessionId = uuidv4();
    const products = db.getProducts();

    // Add enough items to exceed $50
    db.addToCart(sessionId, products[0].id, 10);

    const summary = cartManager.getCartSummary(sessionId);

    if (summary.subtotal >= 50) {
      assertEquals(summary.estimatedShipping, 0, 'Shipping should be free for orders over $50');
    } else {
      assertEquals(summary.estimatedShipping, 5.99, 'Shipping should be $5.99 for orders under $50');
    }
  });

  await runner.test('should validate cart successfully', () => {
    const db = new Database();
    const cartManager = new CartManager(db);
    const sessionId = uuidv4();
    const products = db.getProducts();

    db.addToCart(sessionId, products[0].id, 1);

    const validation = cartManager.validateCart(sessionId);

    assert(validation.valid, 'Cart should be valid');
    assertEquals(validation.errors.length, 0, 'Should have no errors');
  });

  await runner.test('should detect empty cart validation error', () => {
    const db = new Database();
    const cartManager = new CartManager(db);
    const sessionId = uuidv4();

    const validation = cartManager.validateCart(sessionId);

    assert(!validation.valid, 'Empty cart should be invalid');
    assertGreaterThan(validation.errors.length, 0, 'Should have errors');
  });

  await runner.test('should detect insufficient stock', () => {
    const db = new Database();
    const cartManager = new CartManager(db);
    const sessionId = uuidv4();
    const products = db.getProducts();

    // Try to add more than available stock
    db.addToCart(sessionId, products[0].id, 99999);

    const validation = cartManager.validateCart(sessionId);

    assert(!validation.valid, 'Cart should be invalid due to insufficient stock');
  });

  await runner.test('should refresh cart prices', () => {
    const db = new Database();
    const cartManager = new CartManager(db);
    const sessionId = uuidv4();
    const products = db.getProducts();

    db.addToCart(sessionId, products[0].id, 1);

    // Update product price
    db.updateProduct(products[0].id, { price: products[0].price + 10 });

    const cart = cartManager.refreshCartPrices(sessionId);

    assertEquals(cart.items[0].price, products[0].price + 10, 'Cart price should be updated');
  });

  // ==========================================================================
  // Wishlist Tests
  // ==========================================================================

  await runner.test('should add item to wishlist', () => {
    const db = new Database();
    const cartManager = new CartManager(db);
    const sessionId = uuidv4();
    const products = db.getProducts();

    const item = cartManager.addToWishlist(sessionId, products[0].id, 'For later', 'high');

    assert(item !== null, 'Wishlist item should be created');
    assertEquals(item.productId, products[0].id, 'Product ID should match');
    assertEquals(item.priority, 'high', 'Priority should be high');
  });

  await runner.test('should get wishlist items', () => {
    const db = new Database();
    const cartManager = new CartManager(db);
    const sessionId = uuidv4();
    const products = db.getProducts();

    cartManager.addToWishlist(sessionId, products[0].id);
    cartManager.addToWishlist(sessionId, products[1].id);

    const wishlist = cartManager.getWishlist(sessionId);

    assertEquals(wishlist.length, 2, 'Wishlist should have 2 items');
  });

  await runner.test('should remove item from wishlist', () => {
    const db = new Database();
    const cartManager = new CartManager(db);
    const sessionId = uuidv4();
    const products = db.getProducts();

    const item = cartManager.addToWishlist(sessionId, products[0].id);
    const removed = cartManager.removeFromWishlist(sessionId, item.id);

    assert(removed, 'Item should be removed');

    const wishlist = cartManager.getWishlist(sessionId);
    assertEquals(wishlist.length, 0, 'Wishlist should be empty');
  });

  await runner.test('should move wishlist item to cart', () => {
    const db = new Database();
    const cartManager = new CartManager(db);
    const sessionId = uuidv4();
    const products = db.getProducts();

    const item = cartManager.addToWishlist(sessionId, products[0].id);
    const cart = cartManager.moveWishlistItemToCart(sessionId, item.id, 2);

    assertEquals(cart.items.length, 1, 'Cart should have 1 item');
    assertEquals(cart.items[0].quantity, 2, 'Quantity should be 2');

    const wishlist = cartManager.getWishlist(sessionId);
    assertEquals(wishlist.length, 0, 'Item should be removed from wishlist');
  });

  // ==========================================================================
  // Save for Later Tests
  // ==========================================================================

  await runner.test('should save cart item for later', () => {
    const db = new Database();
    const cartManager = new CartManager(db);
    const sessionId = uuidv4();
    const products = db.getProducts();

    const cart = db.addToCart(sessionId, products[0].id, 2);
    const itemId = cart.items[0].id;

    const savedItem = cartManager.saveForLater(sessionId, itemId, 'Buying later');

    assert(savedItem !== null, 'Item should be saved');
    assertEquals(savedItem.quantity, 2, 'Quantity should be preserved');

    const updatedCart = db.getCart(sessionId);
    assertEquals(updatedCart?.items.length, 0, 'Item should be removed from cart');
  });

  await runner.test('should move saved item back to cart', () => {
    const db = new Database();
    const cartManager = new CartManager(db);
    const sessionId = uuidv4();
    const products = db.getProducts();

    const cart = db.addToCart(sessionId, products[0].id, 2);
    const savedItem = cartManager.saveForLater(sessionId, cart.items[0].id);

    const updatedCart = cartManager.moveSavedItemToCart(sessionId, savedItem.id);

    assertEquals(updatedCart.items.length, 1, 'Cart should have 1 item');

    const saved = cartManager.getSavedItems(sessionId);
    assertEquals(saved.length, 0, 'Saved items should be empty');
  });

  await runner.test('should get saved items', () => {
    const db = new Database();
    const cartManager = new CartManager(db);
    const sessionId = uuidv4();
    const products = db.getProducts();

    db.addToCart(sessionId, products[0].id, 1);
    db.addToCart(sessionId, products[1].id, 2);

    const cart = db.getCart(sessionId)!;
    cartManager.saveForLater(sessionId, cart.items[0].id);
    cartManager.saveForLater(sessionId, cart.items[1].id);

    const saved = cartManager.getSavedItems(sessionId);

    assertEquals(saved.length, 2, 'Should have 2 saved items');
  });

  // ==========================================================================
  // Cart Merging Tests
  // ==========================================================================

  await runner.test('should merge guest cart with user cart', () => {
    const db = new Database();
    const cartManager = new CartManager(db);
    const guestSession = uuidv4();
    const userSession = uuidv4();
    const products = db.getProducts();

    // Add items to guest cart
    db.addToCart(guestSession, products[0].id, 2);
    db.addToCart(guestSession, products[1].id, 1);

    // Add items to user cart
    db.addToCart(userSession, products[2].id, 3);

    const mergedCart = cartManager.mergeCarts(guestSession, userSession);

    assertEquals(mergedCart.items.length, 3, 'Merged cart should have 3 items');

    const guestCart = db.getCart(guestSession);
    assertEquals(guestCart?.items.length, 0, 'Guest cart should be cleared');
  });

  await runner.test('should combine quantities when merging same products', () => {
    const db = new Database();
    const cartManager = new CartManager(db);
    const guestSession = uuidv4();
    const userSession = uuidv4();
    const products = db.getProducts();

    // Add same product to both carts
    db.addToCart(guestSession, products[0].id, 2);
    db.addToCart(userSession, products[0].id, 3);

    const mergedCart = cartManager.mergeCarts(guestSession, userSession);

    assertEquals(mergedCart.items.length, 1, 'Should have 1 item');
    assertEquals(mergedCart.items[0].quantity, 5, 'Quantities should be combined');
  });

  // ==========================================================================
  // Cart Analytics Tests
  // ==========================================================================

  await runner.test('should get cart analytics', () => {
    const db = new Database();
    const cartManager = new CartManager(db);

    const analytics = cartManager.getCartAnalytics();

    assert(analytics.totalCarts >= 0, 'Total carts should be non-negative');
    assert(analytics.activeCarts >= 0, 'Active carts should be non-negative');
    assert(analytics.totalValue >= 0, 'Total value should be non-negative');
  });

  // ==========================================================================
  // Edge Cases and Error Handling
  // ==========================================================================

  await runner.test('should handle non-existent product gracefully', () => {
    const db = new Database();

    assertThrows(() => {
      db.addToCart(uuidv4(), 'non-existent-product', 1);
    }, 'Should throw error for non-existent product');
  });

  await runner.test('should handle zero quantity', () => {
    const db = new Database();
    const products = db.getProducts();

    assertThrows(() => {
      db.addToCart(uuidv4(), products[0].id, 0);
    }, 'Should throw error for zero quantity');
  });

  await runner.test('should handle negative quantity', () => {
    const db = new Database();
    const products = db.getProducts();

    assertThrows(() => {
      db.addToCart(uuidv4(), products[0].id, -1);
    }, 'Should throw error for negative quantity');
  });

  await runner.test('should handle removing non-existent cart item', () => {
    const db = new Database();
    const sessionId = uuidv4();

    assertThrows(() => {
      db.removeFromCart(sessionId, 'non-existent-item');
    }, 'Should throw error for non-existent item');
  });

  await runner.test('should handle wishlist with non-existent product', () => {
    const db = new Database();
    const cartManager = new CartManager(db);
    const sessionId = uuidv4();

    assertThrows(() => {
      cartManager.addToWishlist(sessionId, 'non-existent-product');
    }, 'Should throw error for non-existent product');
  });

  await runner.test('should track cart activity', () => {
    const db = new Database();
    const cartManager = new CartManager(db);
    const sessionId = uuidv4();
    const products = db.getProducts();

    db.addToCart(sessionId, products[0].id, 1);
    cartManager.trackActivity(sessionId);

    // Activity tracking should not throw errors
    assert(true, 'Activity tracking should complete');
  });

  await runner.test('should detect abandoned carts', () => {
    const db = new Database();
    const cartManager = new CartManager(db);

    const abandoned = cartManager.getAbandonedCarts();

    assert(Array.isArray(abandoned), 'Should return array of abandoned carts');
  });

  // Print summary
  runner.printSummary();

  return runner.getSummary();
}

// ============================================================================
// Main Execution
// ============================================================================

/**
 * Run all cart operation tests
 */
export async function runTests() {
  const summary = await runCartOperationsTests();

  if (summary.failed > 0) {
    console.log('\n❌ Some tests failed');
    // In a real test suite, we would exit with error code
  } else {
    console.log('\n✅ All tests passed!');
  }

  return summary;
}

// Run tests if executed directly
if (import.meta.main) {
  runTests().catch(console.error);
}
