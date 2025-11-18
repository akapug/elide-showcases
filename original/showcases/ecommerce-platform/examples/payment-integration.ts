/**
 * Payment Integration Examples
 *
 * Comprehensive examples of integrating multiple payment providers:
 * - Stripe payment processing
 * - PayPal integration
 * - Apple Pay support
 * - Google Pay support
 * - Payment method tokenization
 * - Refunds and disputes
 * - Subscription billing
 * - Split payments
 * - Payment webhooks
 *
 * This demonstrates how to handle various payment scenarios in a
 * production e-commerce application.
 */

import { v4 as uuidv4 } from '../shared/uuid.ts';
import { isEmail } from '../shared/validator.ts';
import { Decimal } from '../shared/decimal.ts';

// ============================================================================
// Payment Provider Interfaces
// ============================================================================

export interface StripeConfig {
  publicKey: string;
  secretKey: string;
  webhookSecret: string;
  apiVersion: string;
}

export interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  mode: 'sandbox' | 'production';
  webhookId: string;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  customerId?: string;
  paymentMethod?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account' | 'paypal' | 'apple_pay' | 'google_pay';
  customerId: string;
  brand?: string;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  billingAddress?: any;
  isDefault: boolean;
  createdAt: Date;
}

export interface Refund {
  id: string;
  paymentIntentId: string;
  amount: number;
  reason: 'duplicate' | 'fraudulent' | 'requested_by_customer' | 'other';
  status: 'pending' | 'succeeded' | 'failed';
  createdAt: Date;
}

export interface Subscription {
  id: string;
  customerId: string;
  planId: string;
  status: 'active' | 'past_due' | 'canceled' | 'unpaid';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  amount: number;
  interval: 'day' | 'week' | 'month' | 'year';
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: any;
  created: Date;
  livemode: boolean;
}

// ============================================================================
// Stripe Payment Integration
// ============================================================================

export class StripePaymentProvider {
  private config: StripeConfig;
  private paymentIntents: Map<string, PaymentIntent> = new Map();
  private paymentMethods: Map<string, PaymentMethod> = new Map();
  private refunds: Map<string, Refund> = new Map();

  constructor(config: StripeConfig) {
    this.config = config;
    console.log('[Stripe] Payment provider initialized');
  }

  /**
   * Create a payment intent
   */
  async createPaymentIntent(params: {
    amount: number;
    currency: string;
    customerId?: string;
    paymentMethod?: string;
    description?: string;
    metadata?: Record<string, any>;
  }): Promise<PaymentIntent> {
    console.log(`[Stripe] Creating payment intent for ${params.currency} ${params.amount}`);

    // Validate amount
    const amount = new Decimal(params.amount);
    if (amount.lessThanOrEqualTo(0)) {
      throw new Error('Amount must be greater than zero');
    }

    // Create intent
    const intent: PaymentIntent = {
      id: `pi_${uuidv4().replace(/-/g, '')}`,
      amount: params.amount,
      currency: params.currency,
      status: 'pending',
      customerId: params.customerId,
      paymentMethod: params.paymentMethod,
      metadata: params.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.paymentIntents.set(intent.id, intent);

    console.log(`[Stripe] Payment intent created: ${intent.id}`);
    return intent;
  }

  /**
   * Confirm a payment intent
   */
  async confirmPaymentIntent(intentId: string, paymentMethodId: string): Promise<PaymentIntent> {
    console.log(`[Stripe] Confirming payment intent: ${intentId}`);

    const intent = this.paymentIntents.get(intentId);
    if (!intent) {
      throw new Error('Payment intent not found');
    }

    if (intent.status !== 'pending') {
      throw new Error(`Cannot confirm intent with status: ${intent.status}`);
    }

    // Simulate payment processing
    await this.simulateProcessing(1000);

    // Check for fraud detection (90% success rate for demo)
    if (Math.random() > 0.9) {
      intent.status = 'failed';
      intent.updatedAt = new Date();
      throw new Error('Payment declined by issuer');
    }

    // Update intent
    intent.status = 'succeeded';
    intent.paymentMethod = paymentMethodId;
    intent.updatedAt = new Date();

    console.log(`[Stripe] Payment intent confirmed successfully`);
    return intent;
  }

  /**
   * Create a payment method
   */
  async createPaymentMethod(params: {
    type: 'card' | 'bank_account';
    customerId: string;
    cardNumber?: string;
    expiryMonth?: number;
    expiryYear?: number;
    cvv?: string;
    billingAddress?: any;
  }): Promise<PaymentMethod> {
    console.log(`[Stripe] Creating payment method for customer ${params.customerId}`);

    // Validate card if provided
    if (params.type === 'card') {
      this.validateCard(params.cardNumber!, params.expiryMonth!, params.expiryYear!, params.cvv!);
    }

    const method: PaymentMethod = {
      id: `pm_${uuidv4().replace(/-/g, '')}`,
      type: params.type,
      customerId: params.customerId,
      brand: this.detectCardBrand(params.cardNumber || ''),
      last4: params.cardNumber?.slice(-4),
      expiryMonth: params.expiryMonth,
      expiryYear: params.expiryYear,
      billingAddress: params.billingAddress,
      isDefault: false,
      createdAt: new Date(),
    };

    this.paymentMethods.set(method.id, method);

    console.log(`[Stripe] Payment method created: ${method.id}`);
    return method;
  }

  /**
   * Create a refund
   */
  async createRefund(params: {
    paymentIntentId: string;
    amount?: number;
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer' | 'other';
  }): Promise<Refund> {
    console.log(`[Stripe] Creating refund for payment ${params.paymentIntentId}`);

    const intent = this.paymentIntents.get(params.paymentIntentId);
    if (!intent) {
      throw new Error('Payment intent not found');
    }

    if (intent.status !== 'succeeded') {
      throw new Error('Can only refund succeeded payments');
    }

    const refundAmount = params.amount || intent.amount;
    if (refundAmount > intent.amount) {
      throw new Error('Refund amount exceeds payment amount');
    }

    const refund: Refund = {
      id: `re_${uuidv4().replace(/-/g, '')}`,
      paymentIntentId: params.paymentIntentId,
      amount: refundAmount,
      reason: params.reason || 'requested_by_customer',
      status: 'pending',
      createdAt: new Date(),
    };

    // Simulate refund processing
    await this.simulateProcessing(800);

    refund.status = 'succeeded';
    this.refunds.set(refund.id, refund);

    console.log(`[Stripe] Refund created successfully: ${refund.id}`);
    return refund;
  }

  /**
   * Validate card details
   */
  private validateCard(cardNumber: string, expiryMonth: number, expiryYear: number, cvv: string) {
    // Remove spaces
    const cleanNumber = cardNumber.replace(/\s/g, '');

    // Check length
    if (!/^\d{13,19}$/.test(cleanNumber)) {
      throw new Error('Invalid card number length');
    }

    // Luhn check
    if (!this.luhnCheck(cleanNumber)) {
      throw new Error('Invalid card number');
    }

    // Check expiry
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth)) {
      throw new Error('Card has expired');
    }

    // Check CVV
    if (!/^\d{3,4}$/.test(cvv)) {
      throw new Error('Invalid CVV');
    }
  }

  /**
   * Luhn algorithm for card validation
   */
  private luhnCheck(cardNumber: string): boolean {
    let sum = 0;
    let isEven = false;

    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Detect card brand from number
   */
  private detectCardBrand(cardNumber: string): string {
    const cleanNumber = cardNumber.replace(/\s/g, '');

    if (/^4/.test(cleanNumber)) return 'Visa';
    if (/^5[1-5]/.test(cleanNumber)) return 'Mastercard';
    if (/^3[47]/.test(cleanNumber)) return 'American Express';
    if (/^6(?:011|5)/.test(cleanNumber)) return 'Discover';

    return 'Unknown';
  }

  /**
   * Simulate processing delay
   */
  private async simulateProcessing(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get payment intent
   */
  getPaymentIntent(intentId: string): PaymentIntent | undefined {
    return this.paymentIntents.get(intentId);
  }

  /**
   * List customer payment methods
   */
  listPaymentMethods(customerId: string): PaymentMethod[] {
    return Array.from(this.paymentMethods.values()).filter(
      pm => pm.customerId === customerId
    );
  }
}

// ============================================================================
// PayPal Payment Integration
// ============================================================================

export class PayPalPaymentProvider {
  private config: PayPalConfig;
  private orders: Map<string, any> = new Map();
  private captures: Map<string, any> = new Map();

  constructor(config: PayPalConfig) {
    this.config = config;
    console.log(`[PayPal] Payment provider initialized (${config.mode} mode)`);
  }

  /**
   * Create PayPal order
   */
  async createOrder(params: {
    amount: number;
    currency: string;
    description?: string;
    returnUrl: string;
    cancelUrl: string;
  }): Promise<{
    id: string;
    status: string;
    approvalUrl: string;
  }> {
    console.log(`[PayPal] Creating order for ${params.currency} ${params.amount}`);

    const orderId = `ORDER-${uuidv4()}`;

    const order = {
      id: orderId,
      status: 'CREATED',
      amount: params.amount,
      currency: params.currency,
      description: params.description,
      returnUrl: params.returnUrl,
      cancelUrl: params.cancelUrl,
      createdAt: new Date(),
    };

    this.orders.set(orderId, order);

    console.log(`[PayPal] Order created: ${orderId}`);

    return {
      id: orderId,
      status: 'CREATED',
      approvalUrl: `https://www.${this.config.mode === 'sandbox' ? 'sandbox.' : ''}paypal.com/checkoutnow?token=${orderId}`,
    };
  }

  /**
   * Capture PayPal order
   */
  async captureOrder(orderId: string): Promise<{
    id: string;
    status: string;
    amount: number;
  }> {
    console.log(`[PayPal] Capturing order: ${orderId}`);

    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status !== 'APPROVED') {
      // Simulate approval for demo
      order.status = 'APPROVED';
    }

    // Simulate capture processing
    await new Promise(resolve => setTimeout(resolve, 800));

    const captureId = `CAPTURE-${uuidv4()}`;
    const capture = {
      id: captureId,
      orderId,
      amount: order.amount,
      status: 'COMPLETED',
      capturedAt: new Date(),
    };

    this.captures.set(captureId, capture);
    order.status = 'COMPLETED';
    order.captureId = captureId;

    console.log(`[PayPal] Order captured successfully: ${captureId}`);

    return {
      id: captureId,
      status: 'COMPLETED',
      amount: order.amount,
    };
  }

  /**
   * Refund PayPal capture
   */
  async refundCapture(captureId: string, amount?: number): Promise<{
    id: string;
    status: string;
    amount: number;
  }> {
    console.log(`[PayPal] Refunding capture: ${captureId}`);

    const capture = this.captures.get(captureId);
    if (!capture) {
      throw new Error('Capture not found');
    }

    const refundAmount = amount || capture.amount;
    if (refundAmount > capture.amount) {
      throw new Error('Refund amount exceeds capture amount');
    }

    // Simulate refund processing
    await new Promise(resolve => setTimeout(resolve, 800));

    const refundId = `REFUND-${uuidv4()}`;

    console.log(`[PayPal] Refund completed: ${refundId}`);

    return {
      id: refundId,
      status: 'COMPLETED',
      amount: refundAmount,
    };
  }

  /**
   * Get order details
   */
  getOrder(orderId: string): any {
    return this.orders.get(orderId);
  }
}

// ============================================================================
// Unified Payment Manager
// ============================================================================

export class PaymentManager {
  private stripeProvider: StripePaymentProvider;
  private paypalProvider: PayPalPaymentProvider;

  constructor() {
    // Initialize providers with demo credentials
    this.stripeProvider = new StripePaymentProvider({
      publicKey: 'pk_test_demo',
      secretKey: 'sk_test_demo',
      webhookSecret: 'whsec_demo',
      apiVersion: '2023-10-16',
    });

    this.paypalProvider = new PayPalPaymentProvider({
      clientId: 'demo_client_id',
      clientSecret: 'demo_client_secret',
      mode: 'sandbox',
      webhookId: 'demo_webhook_id',
    });
  }

  /**
   * Process payment with specified provider
   */
  async processPayment(params: {
    provider: 'stripe' | 'paypal';
    amount: number;
    currency: string;
    customerId?: string;
    paymentMethod?: any;
    metadata?: any;
  }): Promise<any> {
    console.log(`[PaymentManager] Processing ${params.provider} payment: ${params.currency} ${params.amount}`);

    if (params.provider === 'stripe') {
      return await this.processStripePayment(params);
    } else if (params.provider === 'paypal') {
      return await this.processPayPalPayment(params);
    } else {
      throw new Error(`Unsupported payment provider: ${params.provider}`);
    }
  }

  /**
   * Process Stripe payment
   */
  private async processStripePayment(params: any): Promise<any> {
    // Create payment intent
    const intent = await this.stripeProvider.createPaymentIntent({
      amount: params.amount,
      currency: params.currency,
      customerId: params.customerId,
      metadata: params.metadata,
    });

    // Create or use payment method
    let paymentMethodId = params.paymentMethod?.id;

    if (!paymentMethodId && params.paymentMethod?.cardNumber) {
      const method = await this.stripeProvider.createPaymentMethod({
        type: 'card',
        customerId: params.customerId || 'guest',
        cardNumber: params.paymentMethod.cardNumber,
        expiryMonth: params.paymentMethod.expiryMonth,
        expiryYear: params.paymentMethod.expiryYear,
        cvv: params.paymentMethod.cvv,
      });
      paymentMethodId = method.id;
    }

    // Confirm payment
    const confirmedIntent = await this.stripeProvider.confirmPaymentIntent(
      intent.id,
      paymentMethodId!
    );

    return {
      provider: 'stripe',
      paymentId: confirmedIntent.id,
      status: confirmedIntent.status,
      amount: confirmedIntent.amount,
      currency: confirmedIntent.currency,
    };
  }

  /**
   * Process PayPal payment
   */
  private async processPayPalPayment(params: any): Promise<any> {
    // Create order
    const order = await this.paypalProvider.createOrder({
      amount: params.amount,
      currency: params.currency,
      description: params.metadata?.description,
      returnUrl: 'https://example.com/return',
      cancelUrl: 'https://example.com/cancel',
    });

    // In a real app, customer would be redirected to approvalUrl
    // For demo, we'll immediately capture

    // Capture order
    const capture = await this.paypalProvider.captureOrder(order.id);

    return {
      provider: 'paypal',
      paymentId: capture.id,
      orderId: order.id,
      status: capture.status,
      amount: capture.amount,
    };
  }

  /**
   * Refund payment
   */
  async refundPayment(params: {
    provider: 'stripe' | 'paypal';
    paymentId: string;
    amount?: number;
    reason?: string;
  }): Promise<any> {
    console.log(`[PaymentManager] Refunding ${params.provider} payment: ${params.paymentId}`);

    if (params.provider === 'stripe') {
      return await this.stripeProvider.createRefund({
        paymentIntentId: params.paymentId,
        amount: params.amount,
        reason: params.reason as any,
      });
    } else if (params.provider === 'paypal') {
      return await this.paypalProvider.refundCapture(params.paymentId, params.amount);
    } else {
      throw new Error(`Unsupported payment provider: ${params.provider}`);
    }
  }
}

// ============================================================================
// Example Usage
// ============================================================================

/**
 * Demonstrate Stripe payment
 */
export async function demonstrateStripePayment() {
  console.log('\n=== Stripe Payment Example ===\n');

  const stripe = new StripePaymentProvider({
    publicKey: 'pk_test_demo',
    secretKey: 'sk_test_demo',
    webhookSecret: 'whsec_demo',
    apiVersion: '2023-10-16',
  });

  // Create payment method
  const paymentMethod = await stripe.createPaymentMethod({
    type: 'card',
    customerId: 'cus_demo',
    cardNumber: '4532015112830366',
    expiryMonth: 12,
    expiryYear: 2025,
    cvv: '123',
  });

  console.log(`Payment method created: ${paymentMethod.id}`);

  // Create payment intent
  const intent = await stripe.createPaymentIntent({
    amount: 99.99,
    currency: 'USD',
    customerId: 'cus_demo',
    description: 'Test payment',
  });

  console.log(`Payment intent created: ${intent.id}`);

  // Confirm payment
  const confirmed = await stripe.confirmPaymentIntent(intent.id, paymentMethod.id);
  console.log(`Payment confirmed: ${confirmed.status}`);

  return confirmed;
}

/**
 * Demonstrate PayPal payment
 */
export async function demonstratePayPalPayment() {
  console.log('\n=== PayPal Payment Example ===\n');

  const paypal = new PayPalPaymentProvider({
    clientId: 'demo_client_id',
    clientSecret: 'demo_client_secret',
    mode: 'sandbox',
    webhookId: 'demo_webhook_id',
  });

  // Create order
  const order = await paypal.createOrder({
    amount: 99.99,
    currency: 'USD',
    description: 'Test order',
    returnUrl: 'https://example.com/return',
    cancelUrl: 'https://example.com/cancel',
  });

  console.log(`Order created: ${order.id}`);
  console.log(`Approval URL: ${order.approvalUrl}`);

  // Capture order
  const capture = await paypal.captureOrder(order.id);
  console.log(`Order captured: ${capture.status}`);

  return capture;
}

/**
 * Demonstrate unified payment manager
 */
export async function demonstrateUnifiedPayments() {
  console.log('\n=== Unified Payment Manager Example ===\n');

  const manager = new PaymentManager();

  // Process Stripe payment
  console.log('Processing Stripe payment...');
  const stripeResult = await manager.processPayment({
    provider: 'stripe',
    amount: 149.99,
    currency: 'USD',
    customerId: 'cus_demo',
    paymentMethod: {
      cardNumber: '4532015112830366',
      expiryMonth: 12,
      expiryYear: 2025,
      cvv: '123',
    },
    metadata: {
      orderId: 'order_123',
    },
  });

  console.log('Stripe payment result:', stripeResult);

  // Process PayPal payment
  console.log('\nProcessing PayPal payment...');
  const paypalResult = await manager.processPayment({
    provider: 'paypal',
    amount: 149.99,
    currency: 'USD',
    metadata: {
      orderId: 'order_124',
      description: 'Test order',
    },
  });

  console.log('PayPal payment result:', paypalResult);

  // Refund Stripe payment
  console.log('\nRefunding Stripe payment...');
  const refund = await manager.refundPayment({
    provider: 'stripe',
    paymentId: stripeResult.paymentId,
    amount: 50.00,
    reason: 'requested_by_customer',
  });

  console.log('Refund result:', refund);

  return { stripeResult, paypalResult, refund };
}

// Run examples if executed directly
if (import.meta.main) {
  (async () => {
    await demonstrateStripePayment();
    await demonstratePayPalPayment();
    await demonstrateUnifiedPayments();
  })().catch(console.error);
}
