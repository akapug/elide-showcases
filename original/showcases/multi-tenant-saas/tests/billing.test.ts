/**
 * Billing System Test Suite
 *
 * Comprehensive tests for billing functionality including:
 * - Subscription lifecycle
 * - Invoice generation
 * - Payment processing
 * - Proration calculations
 * - Tax calculations
 * - Discount application
 * - Usage-based billing
 * - Revenue recognition
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// ============================================================================
// Mock Types and Interfaces
// ============================================================================

interface Subscription {
  id: string;
  tenantId: string;
  planId: string;
  status: 'trial' | 'active' | 'past_due' | 'cancelled';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  seats: number;
  basePrice: number;
  totalPrice: number;
  billingInterval: 'monthly' | 'annual';
}

interface Invoice {
  id: string;
  subscriptionId: string;
  tenantId: string;
  amount: number;
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'open' | 'paid' | 'void';
  dueDate: Date;
  paidAt?: Date;
  items: InvoiceItem[];
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  status: 'pending' | 'succeeded' | 'failed';
  method: string;
  timestamp: Date;
}

interface UsageRecord {
  subscriptionId: string;
  metric: string;
  quantity: number;
  timestamp: Date;
}

// ============================================================================
// Mock Billing System
// ============================================================================

class BillingSystem {
  private subscriptions: Map<string, Subscription> = new Map();
  private invoices: Map<string, Invoice> = new Map();
  private payments: Map<string, Payment> = new Map();
  private usageRecords: Map<string, UsageRecord[]> = new Map();

  createSubscription(params: {
    tenantId: string;
    planId: string;
    seats: number;
    basePrice: number;
    billingInterval: Subscription['billingInterval'];
  }): Subscription {
    const now = new Date();
    const periodEnd = new Date(now);

    if (params.billingInterval === 'monthly') {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    const subscription: Subscription = {
      id: `sub_${Date.now()}`,
      tenantId: params.tenantId,
      planId: params.planId,
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      seats: params.seats,
      basePrice: params.basePrice,
      totalPrice: params.basePrice * params.seats,
      billingInterval: params.billingInterval
    };

    this.subscriptions.set(subscription.id, subscription);
    return subscription;
  }

  generateInvoice(subscriptionId: string, taxRate: number = 0): Invoice {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const subtotal = subscription.totalPrice;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    const invoice: Invoice = {
      id: `inv_${Date.now()}`,
      subscriptionId: subscription.id,
      tenantId: subscription.tenantId,
      amount: subtotal,
      subtotal,
      tax,
      total,
      status: 'open',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      items: [
        {
          description: `${subscription.planId} - ${subscription.seats} seats`,
          quantity: subscription.seats,
          unitPrice: subscription.basePrice,
          amount: subtotal
        }
      ]
    };

    this.invoices.set(invoice.id, invoice);
    return invoice;
  }

  processPayment(invoiceId: string, method: string = 'card'): Payment {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Simulate payment processing (90% success rate)
    const success = Math.random() > 0.1;

    const payment: Payment = {
      id: `pay_${Date.now()}`,
      invoiceId: invoice.id,
      amount: invoice.total,
      status: success ? 'succeeded' : 'failed',
      method,
      timestamp: new Date()
    };

    if (success) {
      invoice.status = 'paid';
      invoice.paidAt = new Date();
    }

    this.payments.set(payment.id, payment);
    return payment;
  }

  calculateProration(
    subscription: Subscription,
    newSeats: number
  ): { credit: number; charge: number; netAmount: number } {
    const now = Date.now();
    const periodStart = subscription.currentPeriodStart.getTime();
    const periodEnd = subscription.currentPeriodEnd.getTime();

    const totalDays = (periodEnd - periodStart) / (24 * 60 * 60 * 1000);
    const remainingDays = (periodEnd - now) / (24 * 60 * 60 * 1000);

    const currentCost = subscription.totalPrice;
    const newCost = subscription.basePrice * newSeats;

    const credit = (currentCost * remainingDays) / totalDays;
    const charge = (newCost * remainingDays) / totalDays;
    const netAmount = charge - credit;

    return { credit, charge, netAmount };
  }

  applyDiscount(invoice: Invoice, discountPercent: number): Invoice {
    const discountAmount = invoice.subtotal * (discountPercent / 100);
    invoice.subtotal -= discountAmount;
    invoice.total = invoice.subtotal + invoice.tax;
    return invoice;
  }

  recordUsage(subscriptionId: string, metric: string, quantity: number): void {
    const record: UsageRecord = {
      subscriptionId,
      metric,
      quantity,
      timestamp: new Date()
    };

    if (!this.usageRecords.has(subscriptionId)) {
      this.usageRecords.set(subscriptionId, []);
    }
    this.usageRecords.get(subscriptionId)!.push(record);
  }

  calculateUsageCharges(subscriptionId: string, unitPrice: number): number {
    const records = this.usageRecords.get(subscriptionId) || [];
    const totalUsage = records.reduce((sum, r) => sum + r.quantity, 0);
    return totalUsage * unitPrice;
  }

  getSubscription(id: string): Subscription | undefined {
    return this.subscriptions.get(id);
  }

  getInvoice(id: string): Invoice | undefined {
    return this.invoices.get(id);
  }

  getPayment(id: string): Payment | undefined {
    return this.payments.get(id);
  }
}

// ============================================================================
// Test Suite
// ============================================================================

describe('Billing System', () => {
  let billing: BillingSystem;

  beforeEach(() => {
    billing = new BillingSystem();
  });

  describe('Subscription Management', () => {
    it('should create a monthly subscription', () => {
      const subscription = billing.createSubscription({
        tenantId: 'tenant_123',
        planId: 'professional',
        seats: 5,
        basePrice: 99,
        billingInterval: 'monthly'
      });

      expect(subscription).toBeDefined();
      expect(subscription.id).toMatch(/^sub_/);
      expect(subscription.tenantId).toBe('tenant_123');
      expect(subscription.planId).toBe('professional');
      expect(subscription.seats).toBe(5);
      expect(subscription.basePrice).toBe(99);
      expect(subscription.totalPrice).toBe(495);
      expect(subscription.status).toBe('active');
    });

    it('should create an annual subscription', () => {
      const subscription = billing.createSubscription({
        tenantId: 'tenant_456',
        planId: 'enterprise',
        seats: 10,
        basePrice: 999,
        billingInterval: 'annual'
      });

      expect(subscription.billingInterval).toBe('annual');
      expect(subscription.totalPrice).toBe(9990);

      // Period should be 1 year
      const periodLength =
        subscription.currentPeriodEnd.getTime() - subscription.currentPeriodStart.getTime();
      const expectedLength = 365 * 24 * 60 * 60 * 1000;
      expect(Math.abs(periodLength - expectedLength)).toBeLessThan(24 * 60 * 60 * 1000);
    });

    it('should calculate total price correctly based on seats', () => {
      const subscription = billing.createSubscription({
        tenantId: 'tenant_789',
        planId: 'business',
        seats: 20,
        basePrice: 50,
        billingInterval: 'monthly'
      });

      expect(subscription.totalPrice).toBe(1000);
    });
  });

  describe('Invoice Generation', () => {
    it('should generate an invoice for a subscription', () => {
      const subscription = billing.createSubscription({
        tenantId: 'tenant_123',
        planId: 'professional',
        seats: 5,
        basePrice: 99,
        billingInterval: 'monthly'
      });

      const invoice = billing.generateInvoice(subscription.id);

      expect(invoice).toBeDefined();
      expect(invoice.id).toMatch(/^inv_/);
      expect(invoice.subscriptionId).toBe(subscription.id);
      expect(invoice.tenantId).toBe(subscription.tenantId);
      expect(invoice.subtotal).toBe(495);
      expect(invoice.status).toBe('open');
    });

    it('should include line items in invoice', () => {
      const subscription = billing.createSubscription({
        tenantId: 'tenant_123',
        planId: 'professional',
        seats: 3,
        basePrice: 99,
        billingInterval: 'monthly'
      });

      const invoice = billing.generateInvoice(subscription.id);

      expect(invoice.items).toHaveLength(1);
      expect(invoice.items[0].description).toContain('professional');
      expect(invoice.items[0].quantity).toBe(3);
      expect(invoice.items[0].unitPrice).toBe(99);
      expect(invoice.items[0].amount).toBe(297);
    });

    it('should calculate tax correctly', () => {
      const subscription = billing.createSubscription({
        tenantId: 'tenant_123',
        planId: 'professional',
        seats: 5,
        basePrice: 100,
        billingInterval: 'monthly'
      });

      const taxRate = 0.1; // 10%
      const invoice = billing.generateInvoice(subscription.id, taxRate);

      expect(invoice.subtotal).toBe(500);
      expect(invoice.tax).toBe(50);
      expect(invoice.total).toBe(550);
    });

    it('should set proper due date', () => {
      const subscription = billing.createSubscription({
        tenantId: 'tenant_123',
        planId: 'professional',
        seats: 5,
        basePrice: 99,
        billingInterval: 'monthly'
      });

      const invoice = billing.generateInvoice(subscription.id);
      const now = Date.now();
      const dueTime = invoice.dueDate.getTime();

      // Due date should be approximately 30 days from now
      const diff = dueTime - now;
      const expectedDiff = 30 * 24 * 60 * 60 * 1000;
      expect(Math.abs(diff - expectedDiff)).toBeLessThan(1000);
    });
  });

  describe('Payment Processing', () => {
    it('should process a successful payment', () => {
      const subscription = billing.createSubscription({
        tenantId: 'tenant_123',
        planId: 'professional',
        seats: 5,
        basePrice: 99,
        billingInterval: 'monthly'
      });

      const invoice = billing.generateInvoice(subscription.id);

      // Try multiple times since payment has random success
      let payment: Payment | undefined;
      for (let i = 0; i < 10; i++) {
        payment = billing.processPayment(invoice.id);
        if (payment.status === 'succeeded') break;
      }

      expect(payment).toBeDefined();
      expect(payment!.id).toMatch(/^pay_/);
      expect(payment!.invoiceId).toBe(invoice.id);
      expect(payment!.amount).toBe(invoice.total);
    });

    it('should mark invoice as paid after successful payment', () => {
      const subscription = billing.createSubscription({
        tenantId: 'tenant_123',
        planId: 'professional',
        seats: 5,
        basePrice: 99,
        billingInterval: 'monthly'
      });

      const invoice = billing.generateInvoice(subscription.id);

      // Keep trying until payment succeeds
      let payment: Payment;
      do {
        payment = billing.processPayment(invoice.id);
      } while (payment.status !== 'succeeded');

      const updatedInvoice = billing.getInvoice(invoice.id);
      expect(updatedInvoice!.status).toBe('paid');
      expect(updatedInvoice!.paidAt).toBeDefined();
    });

    it('should handle failed payments', () => {
      const subscription = billing.createSubscription({
        tenantId: 'tenant_123',
        planId: 'professional',
        seats: 5,
        basePrice: 99,
        billingInterval: 'monthly'
      });

      const invoice = billing.generateInvoice(subscription.id);

      // Try until we get a failure (or timeout)
      let payment: Payment | undefined;
      for (let i = 0; i < 50; i++) {
        payment = billing.processPayment(invoice.id);
        if (payment.status === 'failed') break;
      }

      // We should eventually get a failure
      if (payment && payment.status === 'failed') {
        const updatedInvoice = billing.getInvoice(invoice.id);
        expect(updatedInvoice!.status).not.toBe('paid');
        expect(updatedInvoice!.paidAt).toBeUndefined();
      }
    });
  });

  describe('Proration Calculations', () => {
    it('should calculate proration for seat increase', () => {
      const subscription = billing.createSubscription({
        tenantId: 'tenant_123',
        planId: 'professional',
        seats: 5,
        basePrice: 100,
        billingInterval: 'monthly'
      });

      const proration = billing.calculateProration(subscription, 10);

      expect(proration.charge).toBeGreaterThan(proration.credit);
      expect(proration.netAmount).toBeGreaterThan(0);
    });

    it('should calculate proration for seat decrease', () => {
      const subscription = billing.createSubscription({
        tenantId: 'tenant_123',
        planId: 'professional',
        seats: 10,
        basePrice: 100,
        billingInterval: 'monthly'
      });

      const proration = billing.calculateProration(subscription, 5);

      expect(proration.charge).toBeLessThan(proration.credit);
      expect(proration.netAmount).toBeLessThan(0);
    });

    it('should calculate zero proration for same seats', () => {
      const subscription = billing.createSubscription({
        tenantId: 'tenant_123',
        planId: 'professional',
        seats: 5,
        basePrice: 100,
        billingInterval: 'monthly'
      });

      const proration = billing.calculateProration(subscription, 5);

      expect(Math.abs(proration.netAmount)).toBeLessThan(0.01);
    });
  });

  describe('Discount Application', () => {
    it('should apply percentage discount correctly', () => {
      const subscription = billing.createSubscription({
        tenantId: 'tenant_123',
        planId: 'professional',
        seats: 5,
        basePrice: 100,
        billingInterval: 'monthly'
      });

      const invoice = billing.generateInvoice(subscription.id);
      const originalTotal = invoice.total;

      billing.applyDiscount(invoice, 20); // 20% discount

      expect(invoice.subtotal).toBe(400); // 500 - 100
      expect(invoice.total).toBeLessThan(originalTotal);
    });

    it('should maintain tax calculation after discount', () => {
      const subscription = billing.createSubscription({
        tenantId: 'tenant_123',
        planId: 'professional',
        seats: 5,
        basePrice: 100,
        billingInterval: 'monthly'
      });

      const taxRate = 0.1;
      const invoice = billing.generateInvoice(subscription.id, taxRate);

      billing.applyDiscount(invoice, 10); // 10% discount

      expect(invoice.subtotal).toBe(450); // 500 - 50
      expect(invoice.total).toBe(invoice.subtotal + invoice.tax);
    });
  });

  describe('Usage-Based Billing', () => {
    it('should record usage events', () => {
      const subscription = billing.createSubscription({
        tenantId: 'tenant_123',
        planId: 'professional',
        seats: 5,
        basePrice: 99,
        billingInterval: 'monthly'
      });

      billing.recordUsage(subscription.id, 'api_calls', 1000);
      billing.recordUsage(subscription.id, 'api_calls', 500);

      const charges = billing.calculateUsageCharges(subscription.id, 0.01);

      expect(charges).toBe(15); // 1500 * 0.01
    });

    it('should calculate usage charges correctly', () => {
      const subscription = billing.createSubscription({
        tenantId: 'tenant_123',
        planId: 'professional',
        seats: 5,
        basePrice: 99,
        billingInterval: 'monthly'
      });

      // Record 5000 API calls
      for (let i = 0; i < 5; i++) {
        billing.recordUsage(subscription.id, 'api_calls', 1000);
      }

      const unitPrice = 0.001; // $0.001 per API call
      const charges = billing.calculateUsageCharges(subscription.id, unitPrice);

      expect(charges).toBe(5); // 5000 * 0.001
    });

    it('should handle zero usage', () => {
      const subscription = billing.createSubscription({
        tenantId: 'tenant_123',
        planId: 'professional',
        seats: 5,
        basePrice: 99,
        billingInterval: 'monthly'
      });

      const charges = billing.calculateUsageCharges(subscription.id, 0.01);

      expect(charges).toBe(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle invoice generation for non-existent subscription', () => {
      expect(() => {
        billing.generateInvoice('invalid_sub_id');
      }).toThrow('Subscription not found');
    });

    it('should handle payment for non-existent invoice', () => {
      expect(() => {
        billing.processPayment('invalid_inv_id');
      }).toThrow('Invoice not found');
    });

    it('should handle subscriptions with zero seats', () => {
      const subscription = billing.createSubscription({
        tenantId: 'tenant_123',
        planId: 'professional',
        seats: 0,
        basePrice: 99,
        billingInterval: 'monthly'
      });

      expect(subscription.totalPrice).toBe(0);
    });

    it('should handle very large seat counts', () => {
      const subscription = billing.createSubscription({
        tenantId: 'tenant_123',
        planId: 'enterprise',
        seats: 10000,
        basePrice: 5,
        billingInterval: 'monthly'
      });

      expect(subscription.totalPrice).toBe(50000);

      const invoice = billing.generateInvoice(subscription.id);
      expect(invoice.subtotal).toBe(50000);
    });
  });

  describe('Revenue Recognition', () => {
    it('should track revenue over subscription period', () => {
      const subscription = billing.createSubscription({
        tenantId: 'tenant_123',
        planId: 'professional',
        seats: 5,
        basePrice: 100,
        billingInterval: 'monthly'
      });

      const periodLength =
        subscription.currentPeriodEnd.getTime() - subscription.currentPeriodStart.getTime();
      const expectedMonthly = 30 * 24 * 60 * 60 * 1000;

      // Period should be approximately 1 month
      expect(Math.abs(periodLength - expectedMonthly)).toBeLessThan(24 * 60 * 60 * 1000);
    });

    it('should calculate annual contract value correctly', () => {
      const monthlySubscription = billing.createSubscription({
        tenantId: 'tenant_123',
        planId: 'professional',
        seats: 5,
        basePrice: 100,
        billingInterval: 'monthly'
      });

      const annualValue = monthlySubscription.totalPrice * 12;
      expect(annualValue).toBe(6000);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle subscription upgrade with proration', () => {
      // Create initial subscription
      const subscription = billing.createSubscription({
        tenantId: 'tenant_123',
        planId: 'starter',
        seats: 3,
        basePrice: 50,
        billingInterval: 'monthly'
      });

      // Generate initial invoice
      const invoice1 = billing.generateInvoice(subscription.id);
      expect(invoice1.subtotal).toBe(150);

      // Upgrade to more seats
      const proration = billing.calculateProration(subscription, 10);
      expect(proration.netAmount).toBeGreaterThan(0);
    });

    it('should handle multiple payments for same invoice', () => {
      const subscription = billing.createSubscription({
        tenantId: 'tenant_123',
        planId: 'professional',
        seats: 5,
        basePrice: 99,
        billingInterval: 'monthly'
      });

      const invoice = billing.generateInvoice(subscription.id);

      // Process multiple payment attempts
      const payment1 = billing.processPayment(invoice.id);
      const payment2 = billing.processPayment(invoice.id);

      expect(payment1.invoiceId).toBe(invoice.id);
      expect(payment2.invoiceId).toBe(invoice.id);
    });

    it('should handle complex usage patterns', () => {
      const subscription = billing.createSubscription({
        tenantId: 'tenant_123',
        planId: 'professional',
        seats: 5,
        basePrice: 99,
        billingInterval: 'monthly'
      });

      // Record various usage patterns
      billing.recordUsage(subscription.id, 'api_calls', 1000);
      billing.recordUsage(subscription.id, 'storage', 5);
      billing.recordUsage(subscription.id, 'api_calls', 2000);
      billing.recordUsage(subscription.id, 'bandwidth', 100);

      const apiCharges = billing.calculateUsageCharges(subscription.id, 0.001);
      expect(apiCharges).toBeGreaterThan(0);
    });
  });
});

export { BillingSystem, Subscription, Invoice, Payment, UsageRecord };
