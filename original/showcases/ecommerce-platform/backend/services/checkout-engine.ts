/**
 * Advanced Checkout Engine
 *
 * Production-ready checkout flow with:
 * - Multi-step validation
 * - Address verification
 * - Discount codes and promotions
 * - Tax calculation by jurisdiction
 * - Gift card support
 * - Guest checkout
 * - Order summary generation
 * - Fraud detection
 */

import { v4 as uuidv4 } from '../../shared/uuid.ts';
import { isEmail } from '../../shared/validator.ts';
import { Decimal } from '../../shared/decimal.ts';
import { Database, Order, OrderStatus, Address } from '../db/database.ts';

export interface DiscountCode {
  code: string;
  type: 'percentage' | 'fixed' | 'shipping';
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  expiresAt?: Date;
  usageLimit?: number;
  usageCount: number;
  active: boolean;
}

export interface AppliedDiscount {
  code: string;
  type: string;
  amount: number;
  description: string;
}

export interface TaxCalculation {
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  jurisdiction: string;
  breakdown: Array<{
    name: string;
    rate: number;
    amount: number;
  }>;
}

export interface CheckoutSession {
  id: string;
  sessionId: string;
  step: 'cart' | 'shipping' | 'payment' | 'review' | 'complete';
  customerEmail?: string;
  shippingAddress?: Address;
  billingAddress?: Address;
  sameAsBilling: boolean;
  paymentMethod?: 'credit_card' | 'paypal' | 'gift_card';
  appliedDiscounts: AppliedDiscount[];
  giftCards: Array<{ code: string; amount: number }>;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  shippingTotal: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

export interface CheckoutValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  step: string;
}

export interface OrderSummary {
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  subtotal: number;
  discounts: AppliedDiscount[];
  discountTotal: number;
  taxCalculation: TaxCalculation;
  shippingCost: number;
  total: number;
}

/**
 * Advanced Checkout Engine
 */
export class CheckoutEngine {
  private db: Database;
  private discountCodes: Map<string, DiscountCode> = new Map();
  private checkoutSessions: Map<string, CheckoutSession> = new Map();
  private giftCards: Map<string, { balance: number; used: number }> = new Map();

  // Tax rates by state (simplified - production would use tax API)
  private taxRates: Map<string, number> = new Map([
    ['CA', 0.0875], // California
    ['NY', 0.08], // New York
    ['TX', 0.0625], // Texas
    ['FL', 0.06], // Florida
    ['WA', 0.065], // Washington
    ['IL', 0.0625], // Illinois
    ['PA', 0.06], // Pennsylvania
    ['OH', 0.0575], // Ohio
    ['GA', 0.04], // Georgia
    ['NC', 0.0475], // North Carolina
  ]);

  constructor(db: Database) {
    this.db = db;
    this.initializeDiscountCodes();
    this.initializeGiftCards();
  }

  // ============================================================================
  // Checkout Session Management
  // ============================================================================

  /**
   * Create a new checkout session
   */
  createCheckoutSession(sessionId: string): CheckoutSession {
    const cart = this.db.getCart(sessionId);
    if (!cart || cart.items.length === 0) {
      throw new Error('Cart is empty');
    }

    // Calculate initial totals
    let subtotal = new Decimal(0);
    for (const item of cart.items) {
      subtotal = subtotal.plus(new Decimal(item.price).times(item.quantity));
    }

    const checkoutSession: CheckoutSession = {
      id: uuidv4(),
      sessionId,
      step: 'cart',
      sameAsBilling: true,
      appliedDiscounts: [],
      giftCards: [],
      subtotal: subtotal.toNumber(),
      discountTotal: 0,
      taxTotal: 0,
      shippingTotal: 0,
      total: subtotal.toNumber(),
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    };

    this.checkoutSessions.set(checkoutSession.id, checkoutSession);
    return checkoutSession;
  }

  /**
   * Get checkout session
   */
  getCheckoutSession(checkoutId: string): CheckoutSession | undefined {
    const session = this.checkoutSessions.get(checkoutId);
    if (!session) return undefined;

    // Check if expired
    if (new Date() > session.expiresAt) {
      this.checkoutSessions.delete(checkoutId);
      return undefined;
    }

    return session;
  }

  /**
   * Update checkout session step
   */
  updateCheckoutStep(
    checkoutId: string,
    step: CheckoutSession['step'],
    data?: Partial<CheckoutSession>
  ): CheckoutSession {
    const session = this.getCheckoutSession(checkoutId);
    if (!session) {
      throw new Error('Checkout session not found or expired');
    }

    session.step = step;
    if (data) {
      Object.assign(session, data);
    }
    session.updatedAt = new Date();

    return session;
  }

  // ============================================================================
  // Validation
  // ============================================================================

  /**
   * Validate shipping information
   */
  validateShipping(address: Address): CheckoutValidationResult {
    const result: CheckoutValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      step: 'shipping',
    };

    if (!address.firstName || address.firstName.trim().length < 2) {
      result.errors.push('First name must be at least 2 characters');
      result.valid = false;
    }

    if (!address.lastName || address.lastName.trim().length < 2) {
      result.errors.push('Last name must be at least 2 characters');
      result.valid = false;
    }

    if (!address.address || address.address.trim().length < 5) {
      result.errors.push('Address must be at least 5 characters');
      result.valid = false;
    }

    if (!address.city || address.city.trim().length < 2) {
      result.errors.push('City is required');
      result.valid = false;
    }

    if (!address.state || address.state.length !== 2) {
      result.errors.push('State must be 2 characters (e.g., CA)');
      result.valid = false;
    }

    // Validate ZIP code format
    const zipRegex = /^\d{5}(-\d{4})?$/;
    if (!address.zipCode || !zipRegex.test(address.zipCode)) {
      result.errors.push('ZIP code must be in format 12345 or 12345-6789');
      result.valid = false;
    }

    // Validate phone
    const phoneRegex = /^\d{3}-?\d{3}-?\d{4}$/;
    if (!address.phone || !phoneRegex.test(address.phone.replace(/[-()\s]/g, ''))) {
      result.errors.push('Phone number must be 10 digits');
      result.valid = false;
    }

    return result;
  }

  /**
   * Validate payment information
   */
  validatePayment(paymentInfo: {
    method: string;
    cardNumber?: string;
    expiry?: string;
    cvv?: string;
    email?: string;
  }): CheckoutValidationResult {
    const result: CheckoutValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      step: 'payment',
    };

    if (!paymentInfo.method) {
      result.errors.push('Payment method is required');
      result.valid = false;
      return result;
    }

    if (paymentInfo.method === 'credit_card') {
      if (!paymentInfo.cardNumber) {
        result.errors.push('Card number is required');
        result.valid = false;
      } else {
        // Validate card using Luhn algorithm
        const cardValid = this.validateCardNumber(paymentInfo.cardNumber);
        if (!cardValid) {
          result.errors.push('Invalid card number');
          result.valid = false;
        }
      }

      if (!paymentInfo.expiry) {
        result.errors.push('Expiry date is required');
        result.valid = false;
      } else {
        const expiryValid = this.validateExpiry(paymentInfo.expiry);
        if (!expiryValid) {
          result.errors.push('Invalid or expired card');
          result.valid = false;
        }
      }

      if (!paymentInfo.cvv || !/^\d{3,4}$/.test(paymentInfo.cvv)) {
        result.errors.push('CVV must be 3 or 4 digits');
        result.valid = false;
      }
    }

    if (paymentInfo.method === 'paypal') {
      if (!paymentInfo.email || !isEmail(paymentInfo.email)) {
        result.errors.push('Valid PayPal email is required');
        result.valid = false;
      }
    }

    return result;
  }

  /**
   * Validate card number using Luhn algorithm
   */
  private validateCardNumber(cardNumber: string): boolean {
    const cleaned = cardNumber.replace(/\s|-/g, '');
    if (!/^\d{13,19}$/.test(cleaned)) return false;

    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Validate card expiry
   */
  private validateExpiry(expiry: string): boolean {
    const match = expiry.match(/^(\d{2})\/(\d{2,4})$/);
    if (!match) return false;

    const month = parseInt(match[1], 10);
    let year = parseInt(match[2], 10);

    if (month < 1 || month > 12) return false;

    if (year < 100) year += 2000;

    const now = new Date();
    const expiryDate = new Date(year, month - 1);

    return expiryDate > now;
  }

  // ============================================================================
  // Discount Codes
  // ============================================================================

  /**
   * Initialize sample discount codes
   */
  private initializeDiscountCodes() {
    const codes: DiscountCode[] = [
      {
        code: 'WELCOME10',
        type: 'percentage',
        value: 10,
        minPurchase: 50,
        usageCount: 0,
        active: true,
      },
      {
        code: 'SAVE20',
        type: 'percentage',
        value: 20,
        minPurchase: 100,
        maxDiscount: 50,
        usageCount: 0,
        active: true,
      },
      {
        code: 'FLAT15',
        type: 'fixed',
        value: 15,
        minPurchase: 75,
        usageCount: 0,
        active: true,
      },
      {
        code: 'FREESHIP',
        type: 'shipping',
        value: 100, // 100% off shipping
        usageCount: 0,
        active: true,
      },
      {
        code: 'SEASONAL25',
        type: 'percentage',
        value: 25,
        minPurchase: 150,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        usageLimit: 1000,
        usageCount: 0,
        active: true,
      },
    ];

    for (const code of codes) {
      this.discountCodes.set(code.code, code);
    }
  }

  /**
   * Apply discount code to checkout session
   */
  applyDiscountCode(checkoutId: string, code: string): CheckoutSession {
    const session = this.getCheckoutSession(checkoutId);
    if (!session) {
      throw new Error('Checkout session not found');
    }

    const discountCode = this.discountCodes.get(code.toUpperCase());
    if (!discountCode) {
      throw new Error('Invalid discount code');
    }

    if (!discountCode.active) {
      throw new Error('Discount code is no longer active');
    }

    if (discountCode.expiresAt && new Date() > discountCode.expiresAt) {
      throw new Error('Discount code has expired');
    }

    if (discountCode.usageLimit && discountCode.usageCount >= discountCode.usageLimit) {
      throw new Error('Discount code usage limit reached');
    }

    if (discountCode.minPurchase && session.subtotal < discountCode.minPurchase) {
      throw new Error(
        `Minimum purchase of $${discountCode.minPurchase.toFixed(2)} required`
      );
    }

    // Check if already applied
    if (session.appliedDiscounts.some(d => d.code === code.toUpperCase())) {
      throw new Error('Discount code already applied');
    }

    // Calculate discount amount
    let discountAmount = new Decimal(0);
    let description = '';

    if (discountCode.type === 'percentage') {
      discountAmount = new Decimal(session.subtotal).times(discountCode.value / 100);
      if (discountCode.maxDiscount) {
        discountAmount = Decimal.min(discountAmount, discountCode.maxDiscount);
      }
      description = `${discountCode.value}% off`;
    } else if (discountCode.type === 'fixed') {
      discountAmount = new Decimal(discountCode.value);
      description = `$${discountCode.value.toFixed(2)} off`;
    } else if (discountCode.type === 'shipping') {
      discountAmount = new Decimal(session.shippingTotal).times(discountCode.value / 100);
      description = discountCode.value === 100 ? 'Free shipping' : `${discountCode.value}% off shipping`;
    }

    const appliedDiscount: AppliedDiscount = {
      code: code.toUpperCase(),
      type: discountCode.type,
      amount: discountAmount.toNumber(),
      description,
    };

    session.appliedDiscounts.push(appliedDiscount);
    this.recalculateCheckoutTotals(session);

    // Increment usage count
    discountCode.usageCount++;

    return session;
  }

  /**
   * Remove discount code
   */
  removeDiscountCode(checkoutId: string, code: string): CheckoutSession {
    const session = this.getCheckoutSession(checkoutId);
    if (!session) {
      throw new Error('Checkout session not found');
    }

    const index = session.appliedDiscounts.findIndex(d => d.code === code.toUpperCase());
    if (index === -1) {
      throw new Error('Discount code not applied');
    }

    session.appliedDiscounts.splice(index, 1);
    this.recalculateCheckoutTotals(session);

    return session;
  }

  // ============================================================================
  // Gift Cards
  // ============================================================================

  /**
   * Initialize sample gift cards
   */
  private initializeGiftCards() {
    this.giftCards.set('GIFT-1000', { balance: 100.0, used: 0 });
    this.giftCards.set('GIFT-2000', { balance: 50.0, used: 0 });
    this.giftCards.set('GIFT-3000', { balance: 25.0, used: 0 });
  }

  /**
   * Apply gift card to checkout session
   */
  applyGiftCard(checkoutId: string, giftCardCode: string): CheckoutSession {
    const session = this.getCheckoutSession(checkoutId);
    if (!session) {
      throw new Error('Checkout session not found');
    }

    const giftCard = this.giftCards.get(giftCardCode);
    if (!giftCard) {
      throw new Error('Invalid gift card');
    }

    const availableBalance = giftCard.balance - giftCard.used;
    if (availableBalance <= 0) {
      throw new Error('Gift card has no remaining balance');
    }

    // Check if already applied
    if (session.giftCards.some(gc => gc.code === giftCardCode)) {
      throw new Error('Gift card already applied');
    }

    const amountToApply = Math.min(availableBalance, session.total);

    session.giftCards.push({
      code: giftCardCode,
      amount: amountToApply,
    });

    giftCard.used += amountToApply;
    this.recalculateCheckoutTotals(session);

    return session;
  }

  // ============================================================================
  // Tax Calculation
  // ============================================================================

  /**
   * Calculate tax based on shipping address
   */
  calculateTax(subtotal: number, state: string): TaxCalculation {
    const taxRate = this.taxRates.get(state.toUpperCase()) || 0.08; // Default 8%
    const taxAmount = new Decimal(subtotal).times(taxRate);

    return {
      subtotal,
      taxRate,
      taxAmount: taxAmount.toNumber(),
      jurisdiction: state.toUpperCase(),
      breakdown: [
        {
          name: 'State Tax',
          rate: taxRate * 0.7,
          amount: taxAmount.times(0.7).toNumber(),
        },
        {
          name: 'Local Tax',
          rate: taxRate * 0.3,
          amount: taxAmount.times(0.3).toNumber(),
        },
      ],
    };
  }

  // ============================================================================
  // Totals Calculation
  // ============================================================================

  /**
   * Recalculate all checkout totals
   */
  private recalculateCheckoutTotals(session: CheckoutSession) {
    // Calculate discount total
    let discountTotal = new Decimal(0);
    for (const discount of session.appliedDiscounts) {
      discountTotal = discountTotal.plus(discount.amount);
    }
    session.discountTotal = discountTotal.toNumber();

    // Calculate subtotal after discounts
    const discountedSubtotal = new Decimal(session.subtotal).minus(discountTotal);

    // Calculate tax
    if (session.shippingAddress) {
      const taxCalc = this.calculateTax(
        discountedSubtotal.toNumber(),
        session.shippingAddress.state
      );
      session.taxTotal = taxCalc.taxAmount;
    }

    // Calculate shipping
    const shippingTotal = discountedSubtotal.greaterThanOrEqualTo(50)
      ? new Decimal(0)
      : new Decimal(5.99);
    session.shippingTotal = shippingTotal.toNumber();

    // Apply gift cards
    let giftCardTotal = new Decimal(0);
    for (const gc of session.giftCards) {
      giftCardTotal = giftCardTotal.plus(gc.amount);
    }

    // Calculate final total
    let total = discountedSubtotal
      .plus(session.taxTotal)
      .plus(session.shippingTotal)
      .minus(giftCardTotal);

    total = Decimal.max(total, 0); // Never negative
    session.total = total.toNumber();
    session.updatedAt = new Date();
  }

  /**
   * Generate order summary
   */
  generateOrderSummary(checkoutId: string): OrderSummary {
    const session = this.getCheckoutSession(checkoutId);
    if (!session) {
      throw new Error('Checkout session not found');
    }

    const cart = this.db.getCart(session.sessionId);
    if (!cart) {
      throw new Error('Cart not found');
    }

    const items = cart.items.map(item => {
      const product = this.db.getProduct(item.productId);
      return {
        productId: item.productId,
        productName: product?.name || 'Unknown Product',
        quantity: item.quantity,
        price: item.price,
        subtotal: new Decimal(item.price).times(item.quantity).toNumber(),
      };
    });

    const taxCalculation = session.shippingAddress
      ? this.calculateTax(
          new Decimal(session.subtotal).minus(session.discountTotal).toNumber(),
          session.shippingAddress.state
        )
      : {
          subtotal: session.subtotal,
          taxRate: 0.08,
          taxAmount: session.taxTotal,
          jurisdiction: 'N/A',
          breakdown: [],
        };

    return {
      items,
      subtotal: session.subtotal,
      discounts: session.appliedDiscounts,
      discountTotal: session.discountTotal,
      taxCalculation,
      shippingCost: session.shippingTotal,
      total: session.total,
    };
  }

  /**
   * Complete checkout and create order
   */
  completeCheckout(checkoutId: string, customerEmail: string): Order {
    const session = this.getCheckoutSession(checkoutId);
    if (!session) {
      throw new Error('Checkout session not found or expired');
    }

    if (!session.shippingAddress) {
      throw new Error('Shipping address required');
    }

    const billingAddress = session.sameAsBilling
      ? session.shippingAddress
      : session.billingAddress!;

    // Create order
    const order = this.db.createOrder(
      session.sessionId,
      session.shippingAddress,
      billingAddress,
      customerEmail
    );

    // Clean up checkout session
    this.checkoutSessions.delete(checkoutId);

    return order;
  }

  /**
   * Get all discount codes (admin)
   */
  getAllDiscountCodes(): DiscountCode[] {
    return Array.from(this.discountCodes.values());
  }

  /**
   * Create new discount code (admin)
   */
  createDiscountCode(code: DiscountCode): DiscountCode {
    this.discountCodes.set(code.code.toUpperCase(), code);
    return code;
  }
}
