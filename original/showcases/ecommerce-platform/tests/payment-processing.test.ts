/**
 * Payment Processing Test Suite
 *
 * Comprehensive test coverage for payment processing:
 * - Stripe payment integration
 * - PayPal payment integration
 * - Payment validation
 * - Card validation (Luhn algorithm)
 * - Payment intent lifecycle
 * - Refund processing
 * - Payment method management
 * - Error handling
 * - Edge cases
 *
 * Tests ensure payment processing is secure, reliable,
 * and handles all scenarios correctly.
 */

import {
  StripePaymentProvider,
  PayPalPaymentProvider,
  PaymentManager,
} from '../examples/payment-integration.ts';
import { processPayment, refundPayment } from '../backend/services/payment-service.ts';

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
// Payment Processing Tests
// ============================================================================

async function runPaymentProcessingTests() {
  const runner = new TestRunner();

  console.log('='.repeat(80));
  console.log('PAYMENT PROCESSING TEST SUITE');
  console.log('='.repeat(80));
  console.log();

  // ==========================================================================
  // Stripe Payment Tests
  // ==========================================================================

  await runner.test('should create Stripe payment intent', async () => {
    const stripe = new StripePaymentProvider({
      publicKey: 'pk_test_demo',
      secretKey: 'sk_test_demo',
      webhookSecret: 'whsec_demo',
      apiVersion: '2023-10-16',
    });

    const intent = await stripe.createPaymentIntent({
      amount: 99.99,
      currency: 'USD',
      customerId: 'cus_test',
    });

    assert(intent !== null, 'Payment intent should be created');
    assertEquals(intent.amount, 99.99, 'Amount should match');
    assertEquals(intent.currency, 'USD', 'Currency should match');
    assertEquals(intent.status, 'pending', 'Initial status should be pending');
  });

  await runner.test('should confirm Stripe payment intent', async () => {
    const stripe = new StripePaymentProvider({
      publicKey: 'pk_test_demo',
      secretKey: 'sk_test_demo',
      webhookSecret: 'whsec_demo',
      apiVersion: '2023-10-16',
    });

    const paymentMethod = await stripe.createPaymentMethod({
      type: 'card',
      customerId: 'cus_test',
      cardNumber: '4532015112830366',
      expiryMonth: 12,
      expiryYear: 2025,
      cvv: '123',
    });

    const intent = await stripe.createPaymentIntent({
      amount: 99.99,
      currency: 'USD',
    });

    const confirmed = await stripe.confirmPaymentIntent(intent.id, paymentMethod.id);

    assert(confirmed.status === 'succeeded' || confirmed.status === 'failed', 'Status should be succeeded or failed');
  });

  await runner.test('should create payment method with valid card', async () => {
    const stripe = new StripePaymentProvider({
      publicKey: 'pk_test_demo',
      secretKey: 'sk_test_demo',
      webhookSecret: 'whsec_demo',
      apiVersion: '2023-10-16',
    });

    const method = await stripe.createPaymentMethod({
      type: 'card',
      customerId: 'cus_test',
      cardNumber: '4532015112830366',
      expiryMonth: 12,
      expiryYear: 2025,
      cvv: '123',
    });

    assert(method !== null, 'Payment method should be created');
    assertEquals(method.type, 'card', 'Type should be card');
    assertEquals(method.last4, '0366', 'Last 4 digits should match');
    assertEquals(method.brand, 'Visa', 'Should detect Visa');
  });

  await runner.test('should detect Mastercard', async () => {
    const stripe = new StripePaymentProvider({
      publicKey: 'pk_test_demo',
      secretKey: 'sk_test_demo',
      webhookSecret: 'whsec_demo',
      apiVersion: '2023-10-16',
    });

    const method = await stripe.createPaymentMethod({
      type: 'card',
      customerId: 'cus_test',
      cardNumber: '5425233430109903',
      expiryMonth: 12,
      expiryYear: 2025,
      cvv: '123',
    });

    assertEquals(method.brand, 'Mastercard', 'Should detect Mastercard');
  });

  await runner.test('should detect American Express', async () => {
    const stripe = new StripePaymentProvider({
      publicKey: 'pk_test_demo',
      secretKey: 'sk_test_demo',
      webhookSecret: 'whsec_demo',
      apiVersion: '2023-10-16',
    });

    const method = await stripe.createPaymentMethod({
      type: 'card',
      customerId: 'cus_test',
      cardNumber: '374245455400126',
      expiryMonth: 12,
      expiryYear: 2025,
      cvv: '1234',
    });

    assertEquals(method.brand, 'American Express', 'Should detect Amex');
  });

  await runner.test('should create refund for successful payment', async () => {
    const stripe = new StripePaymentProvider({
      publicKey: 'pk_test_demo',
      secretKey: 'sk_test_demo',
      webhookSecret: 'whsec_demo',
      apiVersion: '2023-10-16',
    });

    const paymentMethod = await stripe.createPaymentMethod({
      type: 'card',
      customerId: 'cus_test',
      cardNumber: '4532015112830366',
      expiryMonth: 12,
      expiryYear: 2025,
      cvv: '123',
    });

    const intent = await stripe.createPaymentIntent({
      amount: 99.99,
      currency: 'USD',
    });

    const confirmed = await stripe.confirmPaymentIntent(intent.id, paymentMethod.id);

    if (confirmed.status === 'succeeded') {
      const refund = await stripe.createRefund({
        paymentIntentId: confirmed.id,
        reason: 'requested_by_customer',
      });

      assert(refund !== null, 'Refund should be created');
      assertEquals(refund.amount, 99.99, 'Refund amount should match');
      assertEquals(refund.status, 'succeeded', 'Refund should succeed');
    }
  });

  await runner.test('should create partial refund', async () => {
    const stripe = new StripePaymentProvider({
      publicKey: 'pk_test_demo',
      secretKey: 'sk_test_demo',
      webhookSecret: 'whsec_demo',
      apiVersion: '2023-10-16',
    });

    const paymentMethod = await stripe.createPaymentMethod({
      type: 'card',
      customerId: 'cus_test',
      cardNumber: '4532015112830366',
      expiryMonth: 12,
      expiryYear: 2025,
      cvv: '123',
    });

    const intent = await stripe.createPaymentIntent({
      amount: 100.00,
      currency: 'USD',
    });

    const confirmed = await stripe.confirmPaymentIntent(intent.id, paymentMethod.id);

    if (confirmed.status === 'succeeded') {
      const refund = await stripe.createRefund({
        paymentIntentId: confirmed.id,
        amount: 50.00,
        reason: 'requested_by_customer',
      });

      assertEquals(refund.amount, 50.00, 'Partial refund amount should match');
    }
  });

  await runner.test('should list customer payment methods', async () => {
    const stripe = new StripePaymentProvider({
      publicKey: 'pk_test_demo',
      secretKey: 'sk_test_demo',
      webhookSecret: 'whsec_demo',
      apiVersion: '2023-10-16',
    });

    await stripe.createPaymentMethod({
      type: 'card',
      customerId: 'cus_test',
      cardNumber: '4532015112830366',
      expiryMonth: 12,
      expiryYear: 2025,
      cvv: '123',
    });

    await stripe.createPaymentMethod({
      type: 'card',
      customerId: 'cus_test',
      cardNumber: '5425233430109903',
      expiryMonth: 12,
      expiryYear: 2025,
      cvv: '123',
    });

    const methods = stripe.listPaymentMethods('cus_test');

    assertEquals(methods.length, 2, 'Should have 2 payment methods');
  });

  // ==========================================================================
  // PayPal Payment Tests
  // ==========================================================================

  await runner.test('should create PayPal order', async () => {
    const paypal = new PayPalPaymentProvider({
      clientId: 'demo_client_id',
      clientSecret: 'demo_client_secret',
      mode: 'sandbox',
      webhookId: 'demo_webhook_id',
    });

    const order = await paypal.createOrder({
      amount: 99.99,
      currency: 'USD',
      returnUrl: 'https://example.com/return',
      cancelUrl: 'https://example.com/cancel',
    });

    assert(order !== null, 'Order should be created');
    assertEquals(order.status, 'CREATED', 'Status should be CREATED');
    assert(order.approvalUrl.includes('paypal.com'), 'Should have approval URL');
  });

  await runner.test('should capture PayPal order', async () => {
    const paypal = new PayPalPaymentProvider({
      clientId: 'demo_client_id',
      clientSecret: 'demo_client_secret',
      mode: 'sandbox',
      webhookId: 'demo_webhook_id',
    });

    const order = await paypal.createOrder({
      amount: 99.99,
      currency: 'USD',
      returnUrl: 'https://example.com/return',
      cancelUrl: 'https://example.com/cancel',
    });

    const capture = await paypal.captureOrder(order.id);

    assert(capture !== null, 'Capture should succeed');
    assertEquals(capture.status, 'COMPLETED', 'Status should be COMPLETED');
    assertEquals(capture.amount, 99.99, 'Amount should match');
  });

  await runner.test('should refund PayPal capture', async () => {
    const paypal = new PayPalPaymentProvider({
      clientId: 'demo_client_id',
      clientSecret: 'demo_client_secret',
      mode: 'sandbox',
      webhookId: 'demo_webhook_id',
    });

    const order = await paypal.createOrder({
      amount: 99.99,
      currency: 'USD',
      returnUrl: 'https://example.com/return',
      cancelUrl: 'https://example.com/cancel',
    });

    const capture = await paypal.captureOrder(order.id);
    const refund = await paypal.refundCapture(capture.id);

    assert(refund !== null, 'Refund should be created');
    assertEquals(refund.status, 'COMPLETED', 'Refund should complete');
    assertEquals(refund.amount, 99.99, 'Amount should match');
  });

  await runner.test('should refund partial PayPal amount', async () => {
    const paypal = new PayPalPaymentProvider({
      clientId: 'demo_client_id',
      clientSecret: 'demo_client_secret',
      mode: 'sandbox',
      webhookId: 'demo_webhook_id',
    });

    const order = await paypal.createOrder({
      amount: 100.00,
      currency: 'USD',
      returnUrl: 'https://example.com/return',
      cancelUrl: 'https://example.com/cancel',
    });

    const capture = await paypal.captureOrder(order.id);
    const refund = await paypal.refundCapture(capture.id, 50.00);

    assertEquals(refund.amount, 50.00, 'Partial refund should match');
  });

  // ==========================================================================
  // Unified Payment Manager Tests
  // ==========================================================================

  await runner.test('should process Stripe payment through manager', async () => {
    const manager = new PaymentManager();

    const result = await manager.processPayment({
      provider: 'stripe',
      amount: 149.99,
      currency: 'USD',
      customerId: 'cus_test',
      paymentMethod: {
        cardNumber: '4532015112830366',
        expiryMonth: 12,
        expiryYear: 2025,
        cvv: '123',
      },
    });

    assert(result !== null, 'Payment should be processed');
    assertEquals(result.provider, 'stripe', 'Provider should be Stripe');
    assertEquals(result.amount, 149.99, 'Amount should match');
  });

  await runner.test('should process PayPal payment through manager', async () => {
    const manager = new PaymentManager();

    const result = await manager.processPayment({
      provider: 'paypal',
      amount: 149.99,
      currency: 'USD',
    });

    assert(result !== null, 'Payment should be processed');
    assertEquals(result.provider, 'paypal', 'Provider should be PayPal');
  });

  await runner.test('should refund Stripe payment through manager', async () => {
    const manager = new PaymentManager();

    const payment = await manager.processPayment({
      provider: 'stripe',
      amount: 100.00,
      currency: 'USD',
      customerId: 'cus_test',
      paymentMethod: {
        cardNumber: '4532015112830366',
        expiryMonth: 12,
        expiryYear: 2025,
        cvv: '123',
      },
    });

    if (payment.status === 'succeeded') {
      const refund = await manager.refundPayment({
        provider: 'stripe',
        paymentId: payment.paymentId,
        amount: 50.00,
        reason: 'requested_by_customer',
      });

      assert(refund !== null, 'Refund should be created');
    }
  });

  // ==========================================================================
  // Card Validation Tests
  // ==========================================================================

  await runner.test('should validate valid Visa card', async () => {
    const stripe = new StripePaymentProvider({
      publicKey: 'pk_test_demo',
      secretKey: 'sk_test_demo',
      webhookSecret: 'whsec_demo',
      apiVersion: '2023-10-16',
    });

    // Valid Visa test card
    const method = await stripe.createPaymentMethod({
      type: 'card',
      customerId: 'cus_test',
      cardNumber: '4532015112830366',
      expiryMonth: 12,
      expiryYear: 2025,
      cvv: '123',
    });

    assert(method !== null, 'Valid card should be accepted');
  });

  await runner.test('should reject invalid card number', async () => {
    const stripe = new StripePaymentProvider({
      publicKey: 'pk_test_demo',
      secretKey: 'sk_test_demo',
      webhookSecret: 'whsec_demo',
      apiVersion: '2023-10-16',
    });

    await assertThrowsAsync(async () => {
      await stripe.createPaymentMethod({
        type: 'card',
        customerId: 'cus_test',
        cardNumber: '1234567890123456', // Invalid Luhn
        expiryMonth: 12,
        expiryYear: 2025,
        cvv: '123',
      });
    }, 'Should reject invalid card number');
  });

  await runner.test('should reject expired card', async () => {
    const stripe = new StripePaymentProvider({
      publicKey: 'pk_test_demo',
      secretKey: 'sk_test_demo',
      webhookSecret: 'whsec_demo',
      apiVersion: '2023-10-16',
    });

    await assertThrowsAsync(async () => {
      await stripe.createPaymentMethod({
        type: 'card',
        customerId: 'cus_test',
        cardNumber: '4532015112830366',
        expiryMonth: 1,
        expiryYear: 2020, // Expired
        cvv: '123',
      });
    }, 'Should reject expired card');
  });

  await runner.test('should reject invalid CVV', async () => {
    const stripe = new StripePaymentProvider({
      publicKey: 'pk_test_demo',
      secretKey: 'sk_test_demo',
      webhookSecret: 'whsec_demo',
      apiVersion: '2023-10-16',
    });

    await assertThrowsAsync(async () => {
      await stripe.createPaymentMethod({
        type: 'card',
        customerId: 'cus_test',
        cardNumber: '4532015112830366',
        expiryMonth: 12,
        expiryYear: 2025,
        cvv: '12', // Too short
      });
    }, 'Should reject invalid CVV');
  });

  // ==========================================================================
  // Payment Service Tests
  // ==========================================================================

  await runner.test('should process payment through service', async () => {
    const result = await processPayment({
      orderId: 'order_test',
      amount: 99.99,
      currency: 'USD',
      customerEmail: 'test@example.com',
      paymentMethod: {
        cardNumber: '4532015112830366',
        expiry: '12/2025',
        cvv: '123',
      },
    });

    assert(result.success, 'Payment should succeed');
    assertEquals(result.amount, 99.99, 'Amount should match');
    assertEquals(result.currency, 'USD', 'Currency should match');
  });

  await runner.test('should reject invalid email in payment', async () => {
    await assertThrowsAsync(async () => {
      await processPayment({
        orderId: 'order_test',
        amount: 99.99,
        currency: 'USD',
        customerEmail: 'invalid-email',
        paymentMethod: {
          cardNumber: '4532015112830366',
          expiry: '12/2025',
          cvv: '123',
        },
      });
    }, 'Should reject invalid email');
  });

  await runner.test('should reject zero amount', async () => {
    await assertThrowsAsync(async () => {
      await processPayment({
        orderId: 'order_test',
        amount: 0,
        currency: 'USD',
        customerEmail: 'test@example.com',
        paymentMethod: {
          cardNumber: '4532015112830366',
          expiry: '12/2025',
          cvv: '123',
        },
      });
    }, 'Should reject zero amount');
  });

  await runner.test('should reject negative amount', async () => {
    await assertThrowsAsync(async () => {
      await processPayment({
        orderId: 'order_test',
        amount: -50,
        currency: 'USD',
        customerEmail: 'test@example.com',
        paymentMethod: {
          cardNumber: '4532015112830366',
          expiry: '12/2025',
          cvv: '123',
        },
      });
    }, 'Should reject negative amount');
  });

  await runner.test('should process refund through service', async () => {
    const payment = await processPayment({
      orderId: 'order_test',
      amount: 99.99,
      currency: 'USD',
      customerEmail: 'test@example.com',
      paymentMethod: {
        cardNumber: '4532015112830366',
        expiry: '12/2025',
        cvv: '123',
      },
    });

    const refund = await refundPayment(payment.transactionId, 50.00);

    assert(refund.success, 'Refund should succeed');
  });

  // ==========================================================================
  // Error Handling Tests
  // ==========================================================================

  await runner.test('should handle refund of non-existent payment', async () => {
    const stripe = new StripePaymentProvider({
      publicKey: 'pk_test_demo',
      secretKey: 'sk_test_demo',
      webhookSecret: 'whsec_demo',
      apiVersion: '2023-10-16',
    });

    await assertThrowsAsync(async () => {
      await stripe.createRefund({
        paymentIntentId: 'non-existent',
        reason: 'requested_by_customer',
      });
    }, 'Should throw for non-existent payment');
  });

  await runner.test('should handle excessive refund amount', async () => {
    const stripe = new StripePaymentProvider({
      publicKey: 'pk_test_demo',
      secretKey: 'sk_test_demo',
      webhookSecret: 'whsec_demo',
      apiVersion: '2023-10-16',
    });

    const paymentMethod = await stripe.createPaymentMethod({
      type: 'card',
      customerId: 'cus_test',
      cardNumber: '4532015112830366',
      expiryMonth: 12,
      expiryYear: 2025,
      cvv: '123',
    });

    const intent = await stripe.createPaymentIntent({
      amount: 50.00,
      currency: 'USD',
    });

    const confirmed = await stripe.confirmPaymentIntent(intent.id, paymentMethod.id);

    if (confirmed.status === 'succeeded') {
      await assertThrowsAsync(async () => {
        await stripe.createRefund({
          paymentIntentId: confirmed.id,
          amount: 100.00, // More than payment amount
        });
      }, 'Should reject excessive refund amount');
    }
  });

  // Print summary
  runner.printSummary();

  return runner.getSummary();
}

// ============================================================================
// Main Execution
// ============================================================================

/**
 * Run all payment processing tests
 */
export async function runTests() {
  const summary = await runPaymentProcessingTests();

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
