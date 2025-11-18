/**
 * Complete Checkout Flow Example
 *
 * Demonstrates a full end-to-end checkout process including:
 * - Cart validation and preparation
 * - Shipping address collection and validation
 * - Shipping method selection
 * - Payment processing with multiple providers
 * - Order creation and confirmation
 * - Email notifications
 * - Error handling and recovery
 * - Inventory management integration
 *
 * This example shows how all e-commerce components work together
 * to create a seamless checkout experience.
 */

import { v4 as uuidv4 } from '../shared/uuid.ts';
import { isEmail } from '../shared/validator.ts';
import { Decimal } from '../shared/decimal.ts';
import { Database } from '../backend/db/database.ts';
import { CartManager } from '../backend/services/cart-manager.ts';
import { processPayment, PaymentRequest } from '../backend/services/payment-service.ts';
import { sendOrderConfirmation } from '../backend/services/email-service.ts';
import { InventoryService } from '../backend/services/inventory-service.ts';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

export interface BillingAddress extends ShippingAddress {
  sameAsShipping: boolean;
}

export interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDays: number;
  carrier: string;
}

export interface PaymentMethod {
  type: 'credit_card' | 'debit_card' | 'paypal' | 'apple_pay' | 'google_pay';
  cardNumber?: string;
  cardholderName?: string;
  expiryMonth?: number;
  expiryYear?: number;
  cvv?: string;
  paypalEmail?: string;
  token?: string; // For tokenized payments
}

export interface CheckoutSession {
  sessionId: string;
  customerId?: string;
  email: string;
  shippingAddress?: ShippingAddress;
  billingAddress?: BillingAddress;
  shippingMethod?: ShippingMethod;
  paymentMethod?: PaymentMethod;
  currentStep: 'cart' | 'shipping' | 'payment' | 'review' | 'complete';
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

export interface OrderSummary {
  orderId: string;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  shippingAddress: ShippingAddress;
  billingAddress: BillingAddress;
  shippingMethod: ShippingMethod;
  paymentMethod: {
    type: string;
    last4?: string;
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
}

export interface CheckoutError {
  step: string;
  code: string;
  message: string;
  recoverable: boolean;
  details?: any;
}

// ============================================================================
// Checkout Manager Class
// ============================================================================

export class CheckoutManager {
  private db: Database;
  private cartManager: CartManager;
  private inventoryService: InventoryService;
  private sessions: Map<string, CheckoutSession> = new Map();
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private readonly TAX_RATE = 0.085; // 8.5%

  constructor(db: Database) {
    this.db = db;
    this.cartManager = new CartManager(db);
    this.inventoryService = new InventoryService(db);
    this.startSessionCleanup();
  }

  // ==========================================================================
  // Session Management
  // ==========================================================================

  /**
   * Initialize a new checkout session
   */
  createCheckoutSession(sessionId: string, email: string): CheckoutSession {
    // Validate email
    if (!isEmail(email)) {
      throw new Error('Invalid email address');
    }

    // Validate cart has items
    const cart = this.db.getCart(sessionId);
    if (!cart || cart.items.length === 0) {
      throw new Error('Cart is empty');
    }

    // Validate cart contents
    const validation = this.cartManager.validateCart(sessionId);
    if (!validation.valid) {
      throw new Error(`Cart validation failed: ${validation.errors.join(', ')}`);
    }

    const now = new Date();
    const session: CheckoutSession = {
      sessionId,
      email,
      currentStep: 'cart',
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date(now.getTime() + this.SESSION_TIMEOUT),
    };

    this.sessions.set(sessionId, session);

    console.log(`[Checkout] Session created for ${email}`);
    return session;
  }

  /**
   * Get existing checkout session
   */
  getCheckoutSession(sessionId: string): CheckoutSession | undefined {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return undefined;
    }

    // Check if expired
    if (new Date() > session.expiresAt) {
      this.sessions.delete(sessionId);
      return undefined;
    }

    return session;
  }

  /**
   * Update session with new data
   */
  private updateSession(sessionId: string, updates: Partial<CheckoutSession>) {
    const session = this.getCheckoutSession(sessionId);
    if (!session) {
      throw new Error('Checkout session not found or expired');
    }

    Object.assign(session, updates, {
      updatedAt: new Date(),
    });
  }

  // ==========================================================================
  // Step 1: Cart Review and Validation
  // ==========================================================================

  /**
   * Review cart and prepare for checkout
   */
  reviewCart(sessionId: string): {
    valid: boolean;
    cart: any;
    summary: any;
    issues: string[];
  } {
    console.log('[Checkout Step 1] Reviewing cart...');

    const cart = this.db.getCart(sessionId);
    if (!cart || cart.items.length === 0) {
      return {
        valid: false,
        cart: null,
        summary: null,
        issues: ['Cart is empty'],
      };
    }

    // Validate cart
    const validation = this.cartManager.validateCart(sessionId);
    const summary = this.cartManager.getCartSummary(sessionId);

    // Refresh prices
    if (validation.priceChanges.length > 0) {
      this.cartManager.refreshCartPrices(sessionId);
      console.log(`[Checkout] Updated prices for ${validation.priceChanges.length} items`);
    }

    return {
      valid: validation.valid,
      cart,
      summary,
      issues: [...validation.errors, ...validation.warnings],
    };
  }

  // ==========================================================================
  // Step 2: Shipping Information
  // ==========================================================================

  /**
   * Set shipping address
   */
  setShippingAddress(sessionId: string, address: ShippingAddress): CheckoutSession {
    console.log('[Checkout Step 2] Setting shipping address...');

    // Validate address
    this.validateAddress(address);

    // Update session
    this.updateSession(sessionId, {
      shippingAddress: address,
      currentStep: 'shipping',
    });

    console.log(`[Checkout] Shipping address set: ${address.city}, ${address.state}`);
    return this.getCheckoutSession(sessionId)!;
  }

  /**
   * Set billing address
   */
  setBillingAddress(sessionId: string, address: BillingAddress): CheckoutSession {
    console.log('[Checkout Step 2] Setting billing address...');

    if (!address.sameAsShipping) {
      this.validateAddress(address);
    }

    this.updateSession(sessionId, {
      billingAddress: address,
    });

    console.log('[Checkout] Billing address set');
    return this.getCheckoutSession(sessionId)!;
  }

  /**
   * Validate address fields
   */
  private validateAddress(address: ShippingAddress | BillingAddress) {
    const errors: string[] = [];

    if (!address.firstName || address.firstName.length < 2) {
      errors.push('First name must be at least 2 characters');
    }

    if (!address.lastName || address.lastName.length < 2) {
      errors.push('Last name must be at least 2 characters');
    }

    if (!address.addressLine1 || address.addressLine1.length < 5) {
      errors.push('Address line 1 is required');
    }

    if (!address.city || address.city.length < 2) {
      errors.push('City is required');
    }

    if (!address.state || address.state.length !== 2) {
      errors.push('State must be 2-letter code');
    }

    if (!address.postalCode || !/^\d{5}(-\d{4})?$/.test(address.postalCode)) {
      errors.push('Invalid postal code');
    }

    if (!address.country || address.country.length !== 2) {
      errors.push('Country must be 2-letter code');
    }

    if (!address.phone || !/^\+?[\d\s\-\(\)]+$/.test(address.phone)) {
      errors.push('Invalid phone number');
    }

    if (errors.length > 0) {
      throw new Error(`Address validation failed: ${errors.join(', ')}`);
    }
  }

  // ==========================================================================
  // Step 3: Shipping Method Selection
  // ==========================================================================

  /**
   * Get available shipping methods
   */
  getShippingMethods(sessionId: string): ShippingMethod[] {
    const session = this.getCheckoutSession(sessionId);
    if (!session || !session.shippingAddress) {
      throw new Error('Shipping address required');
    }

    const summary = this.cartManager.getCartSummary(sessionId);
    const subtotal = new Decimal(summary.subtotal);

    const methods: ShippingMethod[] = [
      {
        id: 'standard',
        name: 'Standard Shipping',
        description: '5-7 business days',
        price: subtotal.greaterThanOrEqualTo(50) ? 0 : 5.99,
        estimatedDays: 6,
        carrier: 'USPS',
      },
      {
        id: 'expedited',
        name: 'Expedited Shipping',
        description: '2-3 business days',
        price: subtotal.greaterThanOrEqualTo(100) ? 9.99 : 14.99,
        estimatedDays: 2,
        carrier: 'UPS',
      },
      {
        id: 'overnight',
        name: 'Overnight Shipping',
        description: 'Next business day',
        price: 29.99,
        estimatedDays: 1,
        carrier: 'FedEx',
      },
    ];

    // International shipping
    if (session.shippingAddress.country !== 'US') {
      methods.push({
        id: 'international',
        name: 'International Shipping',
        description: '10-15 business days',
        price: 39.99,
        estimatedDays: 12,
        carrier: 'DHL',
      });
    }

    return methods;
  }

  /**
   * Select shipping method
   */
  setShippingMethod(sessionId: string, methodId: string): CheckoutSession {
    console.log('[Checkout Step 3] Setting shipping method...');

    const methods = this.getShippingMethods(sessionId);
    const method = methods.find(m => m.id === methodId);

    if (!method) {
      throw new Error('Invalid shipping method');
    }

    this.updateSession(sessionId, {
      shippingMethod: method,
      currentStep: 'payment',
    });

    console.log(`[Checkout] Shipping method set: ${method.name}`);
    return this.getCheckoutSession(sessionId)!;
  }

  // ==========================================================================
  // Step 4: Payment Processing
  // ==========================================================================

  /**
   * Set payment method
   */
  setPaymentMethod(sessionId: string, paymentMethod: PaymentMethod): CheckoutSession {
    console.log('[Checkout Step 4] Setting payment method...');

    // Validate payment method
    this.validatePaymentMethod(paymentMethod);

    this.updateSession(sessionId, {
      paymentMethod,
      currentStep: 'review',
    });

    console.log(`[Checkout] Payment method set: ${paymentMethod.type}`);
    return this.getCheckoutSession(sessionId)!;
  }

  /**
   * Validate payment method
   */
  private validatePaymentMethod(method: PaymentMethod) {
    if (method.type === 'credit_card' || method.type === 'debit_card') {
      if (!method.cardNumber || !method.cvv || !method.expiryMonth || !method.expiryYear) {
        throw new Error('Card details are incomplete');
      }

      // Validate card number (basic Luhn check would be done here)
      if (!/^\d{13,19}$/.test(method.cardNumber.replace(/\s/g, ''))) {
        throw new Error('Invalid card number');
      }

      // Validate CVV
      if (!/^\d{3,4}$/.test(method.cvv)) {
        throw new Error('Invalid CVV');
      }

      // Validate expiry
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      if (method.expiryYear < currentYear ||
          (method.expiryYear === currentYear && method.expiryMonth < currentMonth)) {
        throw new Error('Card has expired');
      }
    } else if (method.type === 'paypal') {
      if (!method.paypalEmail || !isEmail(method.paypalEmail)) {
        throw new Error('Invalid PayPal email');
      }
    }
  }

  // ==========================================================================
  // Step 5: Order Review and Placement
  // ==========================================================================

  /**
   * Calculate order totals
   */
  calculateOrderTotal(sessionId: string): {
    subtotal: number;
    tax: number;
    shipping: number;
    discount: number;
    total: number;
  } {
    const session = this.getCheckoutSession(sessionId);
    if (!session) {
      throw new Error('Checkout session not found');
    }

    const cartSummary = this.cartManager.getCartSummary(sessionId);
    const subtotal = new Decimal(cartSummary.subtotal);

    // Calculate tax
    const tax = subtotal.times(this.TAX_RATE);

    // Get shipping cost
    const shipping = new Decimal(session.shippingMethod?.price || 0);

    // Calculate discount (if any)
    const discount = new Decimal(0); // Would apply coupon codes here

    // Calculate total
    const total = subtotal.plus(tax).plus(shipping).minus(discount);

    return {
      subtotal: subtotal.toNumber(),
      tax: tax.toNumber(),
      shipping: shipping.toNumber(),
      discount: discount.toNumber(),
      total: total.toNumber(),
    };
  }

  /**
   * Place order and process payment
   */
  async placeOrder(sessionId: string): Promise<OrderSummary> {
    console.log('[Checkout Step 5] Placing order...');

    const session = this.getCheckoutSession(sessionId);
    if (!session) {
      throw new Error('Checkout session not found or expired');
    }

    // Validate all required information
    if (!session.shippingAddress) {
      throw new Error('Shipping address required');
    }
    if (!session.billingAddress) {
      throw new Error('Billing address required');
    }
    if (!session.shippingMethod) {
      throw new Error('Shipping method required');
    }
    if (!session.paymentMethod) {
      throw new Error('Payment method required');
    }

    // Final cart validation
    const validation = this.cartManager.validateCart(sessionId);
    if (!validation.valid) {
      throw new Error(`Cart validation failed: ${validation.errors.join(', ')}`);
    }

    // Calculate totals
    const totals = this.calculateOrderTotal(sessionId);

    // Reserve inventory
    console.log('[Checkout] Reserving inventory...');
    const cart = this.db.getCart(sessionId);
    if (!cart) {
      throw new Error('Cart not found');
    }

    try {
      for (const item of cart.items) {
        await this.inventoryService.reserveStock(item.productId, item.quantity);
      }
    } catch (error) {
      throw new Error(`Inventory reservation failed: ${error.message}`);
    }

    // Process payment
    console.log('[Checkout] Processing payment...');
    let paymentResult;

    try {
      const paymentRequest: PaymentRequest = {
        orderId: uuidv4(),
        amount: totals.total,
        currency: 'USD',
        customerEmail: session.email,
        paymentMethod: {
          cardNumber: session.paymentMethod.cardNumber || '',
          expiry: `${session.paymentMethod.expiryMonth}/${session.paymentMethod.expiryYear}`,
          cvv: session.paymentMethod.cvv || '',
        },
      };

      paymentResult = await processPayment(paymentRequest);
    } catch (error) {
      // Release reserved inventory
      console.log('[Checkout] Payment failed, releasing inventory...');
      for (const item of cart.items) {
        await this.inventoryService.releaseReservation(item.productId, item.quantity);
      }
      throw new Error(`Payment processing failed: ${error.message}`);
    }

    // Create order
    console.log('[Checkout] Creating order...');
    const orderId = paymentResult.transactionId;

    const orderSummary: OrderSummary = {
      orderId,
      subtotal: totals.subtotal,
      tax: totals.tax,
      shipping: totals.shipping,
      discount: totals.discount,
      total: totals.total,
      items: cart.items.map(item => {
        const product = this.db.getProduct(item.productId);
        return {
          productId: item.productId,
          name: product?.name || 'Unknown Product',
          quantity: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity,
        };
      }),
      shippingAddress: session.shippingAddress,
      billingAddress: session.billingAddress,
      shippingMethod: session.shippingMethod,
      paymentMethod: {
        type: session.paymentMethod.type,
        last4: session.paymentMethod.cardNumber?.slice(-4),
      },
      status: 'completed',
      createdAt: new Date(),
    };

    // Commit inventory changes
    console.log('[Checkout] Committing inventory changes...');
    for (const item of cart.items) {
      await this.inventoryService.commitReservation(item.productId, item.quantity);
    }

    // Clear cart
    this.db.clearCart(sessionId);

    // Send confirmation email
    console.log('[Checkout] Sending confirmation email...');
    await sendOrderConfirmation(session.email, {
      orderId,
      customerName: `${session.shippingAddress.firstName} ${session.shippingAddress.lastName}`,
      items: cart.items,
      total: totals.total,
    });

    // Update session
    this.updateSession(sessionId, {
      currentStep: 'complete',
    });

    // Clean up session after a delay
    setTimeout(() => {
      this.sessions.delete(sessionId);
    }, 60000); // 1 minute

    console.log(`[Checkout] ✓ Order placed successfully: ${orderId}`);
    return orderSummary;
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Start background session cleanup
   */
  private startSessionCleanup() {
    setInterval(() => {
      const now = new Date();
      let cleaned = 0;

      for (const [sessionId, session] of this.sessions.entries()) {
        if (now > session.expiresAt) {
          this.sessions.delete(sessionId);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        console.log(`[Checkout] Cleaned up ${cleaned} expired sessions`);
      }
    }, 5 * 60 * 1000); // Run every 5 minutes
  }

  /**
   * Get checkout statistics
   */
  getCheckoutStats() {
    return {
      activeSessions: this.sessions.size,
      sessionsByStep: {
        cart: Array.from(this.sessions.values()).filter(s => s.currentStep === 'cart').length,
        shipping: Array.from(this.sessions.values()).filter(s => s.currentStep === 'shipping').length,
        payment: Array.from(this.sessions.values()).filter(s => s.currentStep === 'payment').length,
        review: Array.from(this.sessions.values()).filter(s => s.currentStep === 'review').length,
        complete: Array.from(this.sessions.values()).filter(s => s.currentStep === 'complete').length,
      },
    };
  }
}

// ============================================================================
// Example Usage
// ============================================================================

/**
 * Example: Complete checkout flow
 */
export async function demonstrateCheckoutFlow() {
  console.log('='.repeat(80));
  console.log('COMPLETE CHECKOUT FLOW DEMONSTRATION');
  console.log('='.repeat(80));
  console.log();

  const db = new Database();
  const checkoutManager = new CheckoutManager(db);

  // Prepare cart
  const sessionId = uuidv4();
  console.log(`Session ID: ${sessionId}\n`);

  // Add items to cart
  const products = db.getProducts();
  db.addToCart(sessionId, products[0].id, 2);
  db.addToCart(sessionId, products[1].id, 1);

  console.log('Cart prepared with 3 items\n');

  // Step 1: Initialize checkout
  console.log('--- Step 1: Initialize Checkout ---');
  const session = checkoutManager.createCheckoutSession(sessionId, 'customer@example.com');
  console.log(`✓ Checkout session created for ${session.email}\n`);

  // Step 2: Review cart
  console.log('--- Step 2: Review Cart ---');
  const cartReview = checkoutManager.reviewCart(sessionId);
  console.log(`✓ Cart valid: ${cartReview.valid}`);
  console.log(`  Items: ${cartReview.summary.uniqueItems}`);
  console.log(`  Subtotal: $${cartReview.summary.subtotal.toFixed(2)}\n`);

  // Step 3: Set shipping address
  console.log('--- Step 3: Set Shipping Address ---');
  const shippingAddress: ShippingAddress = {
    firstName: 'John',
    lastName: 'Doe',
    addressLine1: '123 Main St',
    city: 'San Francisco',
    state: 'CA',
    postalCode: '94102',
    country: 'US',
    phone: '+1-415-555-0123',
  };
  checkoutManager.setShippingAddress(sessionId, shippingAddress);
  console.log('✓ Shipping address set\n');

  // Step 4: Set billing address (same as shipping)
  console.log('--- Step 4: Set Billing Address ---');
  const billingAddress: BillingAddress = {
    ...shippingAddress,
    sameAsShipping: true,
  };
  checkoutManager.setBillingAddress(sessionId, billingAddress);
  console.log('✓ Billing address set (same as shipping)\n');

  // Step 5: Get and select shipping method
  console.log('--- Step 5: Select Shipping Method ---');
  const shippingMethods = checkoutManager.getShippingMethods(sessionId);
  console.log(`Available methods: ${shippingMethods.length}`);
  for (const method of shippingMethods) {
    console.log(`  - ${method.name}: $${method.price.toFixed(2)} (${method.estimatedDays} days)`);
  }
  checkoutManager.setShippingMethod(sessionId, 'standard');
  console.log('✓ Standard shipping selected\n');

  // Step 6: Set payment method
  console.log('--- Step 6: Set Payment Method ---');
  const paymentMethod: PaymentMethod = {
    type: 'credit_card',
    cardNumber: '4532015112830366',
    cardholderName: 'John Doe',
    expiryMonth: 12,
    expiryYear: 2025,
    cvv: '123',
  };
  checkoutManager.setPaymentMethod(sessionId, paymentMethod);
  console.log('✓ Payment method set\n');

  // Step 7: Calculate totals
  console.log('--- Step 7: Review Order ---');
  const totals = checkoutManager.calculateOrderTotal(sessionId);
  console.log(`Subtotal:  $${totals.subtotal.toFixed(2)}`);
  console.log(`Tax:       $${totals.tax.toFixed(2)}`);
  console.log(`Shipping:  $${totals.shipping.toFixed(2)}`);
  console.log(`Discount:  -$${totals.discount.toFixed(2)}`);
  console.log(`Total:     $${totals.total.toFixed(2)}\n`);

  // Step 8: Place order
  console.log('--- Step 8: Place Order ---');
  const order = await checkoutManager.placeOrder(sessionId);
  console.log(`✓ Order placed successfully!`);
  console.log(`  Order ID: ${order.orderId}`);
  console.log(`  Status: ${order.status}`);
  console.log(`  Items: ${order.items.length}`);
  console.log(`  Total: $${order.total.toFixed(2)}\n`);

  // Display checkout statistics
  const stats = checkoutManager.getCheckoutStats();
  console.log('--- Checkout Statistics ---');
  console.log(`Active sessions: ${stats.activeSessions}`);
  console.log('Sessions by step:');
  for (const [step, count] of Object.entries(stats.sessionsByStep)) {
    console.log(`  ${step}: ${count}`);
  }

  console.log();
  console.log('='.repeat(80));
  console.log('✓ CHECKOUT FLOW COMPLETED SUCCESSFULLY');
  console.log('='.repeat(80));

  return order;
}

// Run demonstration if executed directly
if (import.meta.main) {
  demonstrateCheckoutFlow().catch(console.error);
}
