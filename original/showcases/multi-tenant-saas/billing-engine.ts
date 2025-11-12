/**
 * Billing Engine - Comprehensive subscription and payment management
 *
 * Features:
 * - Stripe integration
 * - Subscription lifecycle management
 * - Invoice generation
 * - Payment processing
 * - Proration calculations
 * - Dunning management
 * - Usage-based billing
 * - Tax calculations
 *
 * @module billing-engine
 */

export enum SubscriptionStatus {
  ACTIVE = 'active',
  TRIALING = 'trialing',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  UNPAID = 'unpaid',
  INCOMPLETE = 'incomplete'
}

export enum PaymentStatus {
  SUCCEEDED = 'succeeded',
  PENDING = 'pending',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  DISPUTED = 'disputed'
}

export interface StripeConfig {
  secretKey: string;
  webhookSecret: string;
  publishableKey: string;
}

export interface BillingCustomer {
  id: string;
  tenantId: string;
  stripeCustomerId: string;
  email: string;
  name: string;
  paymentMethodId?: string;
  metadata?: Record<string, any>;
}

export interface Subscription {
  id: string;
  tenantId: string;
  stripeSubscriptionId: string;
  customerId: string;
  plan: string;
  status: SubscriptionStatus;
  billingCycle: 'monthly' | 'yearly';
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  trialEnd?: number;
  metadata?: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

export interface Invoice {
  id: string;
  tenantId: string;
  stripeInvoiceId: string;
  subscriptionId: string;
  amount: number;
  amountPaid: number;
  amountDue: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  dueDate: number;
  paidAt?: number;
  attemptCount: number;
  lines: InvoiceLine[];
  tax?: number;
  discount?: number;
  metadata?: Record<string, any>;
  createdAt: number;
}

export interface InvoiceLine {
  id: string;
  description: string;
  amount: number;
  quantity: number;
  unitPrice: number;
  type: 'subscription' | 'usage' | 'one_time' | 'proration';
  period?: {
    start: number;
    end: number;
  };
}

export interface Payment {
  id: string;
  tenantId: string;
  stripePaymentIntentId: string;
  invoiceId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethodId: string;
  failureReason?: string;
  refundedAmount?: number;
  metadata?: Record<string, any>;
  createdAt: number;
  paidAt?: number;
}

export interface UsageRecord {
  tenantId: string;
  subscriptionItemId: string;
  quantity: number;
  timestamp: number;
  action: 'increment' | 'set';
}

/**
 * Billing Engine
 * Handles all billing operations with Stripe integration
 */
export class BillingEngine {
  private customers: Map<string, BillingCustomer>;
  private subscriptions: Map<string, Subscription>;
  private invoices: Map<string, Invoice[]>;
  private payments: Map<string, Payment[]>;
  private stripeConfig: StripeConfig;

  constructor(stripeConfig: StripeConfig) {
    this.customers = new Map();
    this.subscriptions = new Map();
    this.invoices = new Map();
    this.payments = new Map();
    this.stripeConfig = stripeConfig;
  }

  /**
   * Create or retrieve customer
   */
  async createCustomer(data: {
    tenantId: string;
    email: string;
    name: string;
    paymentMethodId?: string;
    metadata?: Record<string, any>;
  }): Promise<BillingCustomer> {
    // Create Stripe customer
    const stripeCustomer = await this.stripeCreateCustomer({
      email: data.email,
      name: data.name,
      payment_method: data.paymentMethodId,
      metadata: { tenantId: data.tenantId, ...data.metadata }
    });

    const customer: BillingCustomer = {
      id: this.generateId('cus'),
      tenantId: data.tenantId,
      stripeCustomerId: stripeCustomer.id,
      email: data.email,
      name: data.name,
      paymentMethodId: data.paymentMethodId,
      metadata: data.metadata
    };

    this.customers.set(customer.id, customer);
    return customer;
  }

  /**
   * Create subscription
   */
  async createSubscription(data: {
    tenantId: string;
    customerId: string;
    plan: string;
    billingCycle: 'monthly' | 'yearly';
    trialDays?: number;
    metadata?: Record<string, any>;
  }): Promise<Subscription> {
    const customer = this.customers.get(data.customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Create Stripe subscription
    const stripeSubscription = await this.stripeCreateSubscription({
      customer: customer.stripeCustomerId,
      items: [{ price: this.getPriceId(data.plan, data.billingCycle) }],
      trial_period_days: data.trialDays,
      metadata: { tenantId: data.tenantId, ...data.metadata }
    });

    const subscription: Subscription = {
      id: this.generateId('sub'),
      tenantId: data.tenantId,
      stripeSubscriptionId: stripeSubscription.id,
      customerId: data.customerId,
      plan: data.plan,
      status: data.trialDays ? SubscriptionStatus.TRIALING : SubscriptionStatus.ACTIVE,
      billingCycle: data.billingCycle,
      currentPeriodStart: stripeSubscription.current_period_start * 1000,
      currentPeriodEnd: stripeSubscription.current_period_end * 1000,
      cancelAtPeriodEnd: false,
      trialEnd: data.trialDays ? Date.now() + data.trialDays * 24 * 60 * 60 * 1000 : undefined,
      metadata: data.metadata,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.subscriptions.set(subscription.id, subscription);
    return subscription;
  }

  /**
   * Update subscription (change plan)
   */
  async updateSubscription(
    subscriptionId: string,
    updates: {
      plan?: string;
      billingCycle?: 'monthly' | 'yearly';
      quantity?: number;
    }
  ): Promise<Subscription> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Calculate proration
    const proration = await this.calculateProration(subscription, updates);

    // Update Stripe subscription
    await this.stripeUpdateSubscription(subscription.stripeSubscriptionId, {
      items: [{
        price: this.getPriceId(
          updates.plan || subscription.plan,
          updates.billingCycle || subscription.billingCycle
        ),
        quantity: updates.quantity
      }],
      proration_behavior: 'create_prorations'
    });

    // Update local subscription
    if (updates.plan) subscription.plan = updates.plan;
    if (updates.billingCycle) subscription.billingCycle = updates.billingCycle;
    subscription.updatedAt = Date.now();

    return subscription;
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    options?: {
      immediately?: boolean;
      reason?: string;
    }
  ): Promise<Subscription> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    if (options?.immediately) {
      // Cancel immediately
      await this.stripeCancelSubscription(subscription.stripeSubscriptionId);
      subscription.status = SubscriptionStatus.CANCELED;
    } else {
      // Cancel at period end
      await this.stripeUpdateSubscription(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true
      });
      subscription.cancelAtPeriodEnd = true;
    }

    subscription.updatedAt = Date.now();
    return subscription;
  }

  /**
   * Reactivate canceled subscription
   */
  async reactivateSubscription(subscriptionId: string): Promise<Subscription> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    if (!subscription.cancelAtPeriodEnd) {
      throw new Error('Subscription is not set to cancel');
    }

    // Reactivate Stripe subscription
    await this.stripeUpdateSubscription(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false
    });

    subscription.cancelAtPeriodEnd = false;
    subscription.status = SubscriptionStatus.ACTIVE;
    subscription.updatedAt = Date.now();

    return subscription;
  }

  /**
   * Generate invoice
   */
  async generateInvoice(tenantId: string, subscriptionId: string): Promise<Invoice> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Create Stripe invoice
    const stripeInvoice = await this.stripeCreateInvoice({
      customer: subscription.stripeSubscriptionId,
      subscription: subscription.stripeSubscriptionId,
      auto_advance: true
    });

    const invoice: Invoice = {
      id: this.generateId('inv'),
      tenantId,
      stripeInvoiceId: stripeInvoice.id,
      subscriptionId,
      amount: stripeInvoice.total,
      amountPaid: stripeInvoice.amount_paid,
      amountDue: stripeInvoice.amount_due,
      currency: stripeInvoice.currency,
      status: stripeInvoice.status as any,
      dueDate: stripeInvoice.due_date * 1000,
      attemptCount: stripeInvoice.attempt_count,
      lines: this.parseInvoiceLines(stripeInvoice.lines),
      tax: stripeInvoice.tax,
      discount: stripeInvoice.discount,
      createdAt: Date.now()
    };

    if (!this.invoices.has(tenantId)) {
      this.invoices.set(tenantId, []);
    }
    this.invoices.get(tenantId)!.push(invoice);

    return invoice;
  }

  /**
   * Process payment
   */
  async processPayment(
    tenantId: string,
    invoiceId: string,
    paymentMethodId: string
  ): Promise<Payment> {
    const invoices = this.invoices.get(tenantId) || [];
    const invoice = invoices.find(inv => inv.id === invoiceId);

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Process payment with Stripe
    const paymentIntent = await this.stripeCreatePaymentIntent({
      amount: invoice.amountDue,
      currency: invoice.currency,
      payment_method: paymentMethodId,
      confirm: true,
      metadata: { tenantId, invoiceId }
    });

    const payment: Payment = {
      id: this.generateId('pay'),
      tenantId,
      stripePaymentIntentId: paymentIntent.id,
      invoiceId,
      amount: invoice.amountDue,
      currency: invoice.currency,
      status: this.mapPaymentStatus(paymentIntent.status),
      paymentMethodId,
      createdAt: Date.now()
    };

    if (payment.status === PaymentStatus.SUCCEEDED) {
      payment.paidAt = Date.now();
      invoice.status = 'paid';
      invoice.paidAt = Date.now();
      invoice.amountPaid = invoice.amount;
    }

    if (!this.payments.has(tenantId)) {
      this.payments.set(tenantId, []);
    }
    this.payments.get(tenantId)!.push(payment);

    return payment;
  }

  /**
   * Handle failed payment (dunning)
   */
  async handleFailedPayment(tenantId: string, invoiceId: string): Promise<void> {
    const invoices = this.invoices.get(tenantId) || [];
    const invoice = invoices.find(inv => inv.id === invoiceId);

    if (!invoice) return;

    invoice.attemptCount++;

    // Dunning strategy
    if (invoice.attemptCount === 1) {
      // Send first reminder email
      await this.sendPaymentFailureEmail(tenantId, invoice, 'first_attempt');
    } else if (invoice.attemptCount === 3) {
      // Send final warning
      await this.sendPaymentFailureEmail(tenantId, invoice, 'final_warning');
    } else if (invoice.attemptCount >= 5) {
      // Suspend tenant
      await this.suspendTenant(tenantId);
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(
    paymentId: string,
    amount?: number,
    reason?: string
  ): Promise<Payment> {
    const payment = this.findPayment(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    const refundAmount = amount || payment.amount;

    // Create Stripe refund
    await this.stripeCreateRefund({
      payment_intent: payment.stripePaymentIntentId,
      amount: refundAmount,
      reason: reason as any
    });

    payment.status = PaymentStatus.REFUNDED;
    payment.refundedAmount = refundAmount;

    return payment;
  }

  /**
   * Record usage for metered billing
   */
  async recordUsage(record: UsageRecord): Promise<void> {
    // Report usage to Stripe
    await this.stripeReportUsage(record.subscriptionItemId, {
      quantity: record.quantity,
      timestamp: Math.floor(record.timestamp / 1000),
      action: record.action
    });
  }

  /**
   * Calculate proration for plan change
   */
  private async calculateProration(
    subscription: Subscription,
    updates: { plan?: string; billingCycle?: string }
  ): Promise<number> {
    const now = Date.now();
    const periodStart = subscription.currentPeriodStart;
    const periodEnd = subscription.currentPeriodEnd;
    const totalDays = (periodEnd - periodStart) / (24 * 60 * 60 * 1000);
    const remainingDays = (periodEnd - now) / (24 * 60 * 60 * 1000);

    // Get old and new pricing
    const oldPrice = this.getPlanPrice(subscription.plan, subscription.billingCycle);
    const newPrice = this.getPlanPrice(
      updates.plan || subscription.plan,
      (updates.billingCycle as any) || subscription.billingCycle
    );

    // Calculate prorated amounts
    const unusedAmount = (oldPrice / totalDays) * remainingDays;
    const newAmount = (newPrice / totalDays) * remainingDays;

    return newAmount - unusedAmount;
  }

  /**
   * Calculate tax based on location
   */
  async calculateTax(
    amount: number,
    country: string,
    state?: string
  ): Promise<number> {
    // Tax rates by location (simplified)
    const taxRates: Record<string, number> = {
      'US-CA': 0.0725, // California
      'US-NY': 0.0875, // New York
      'US-TX': 0.0625, // Texas
      'GB': 0.20,      // UK VAT
      'DE': 0.19,      // Germany VAT
      'FR': 0.20       // France VAT
    };

    const taxKey = state ? `${country}-${state}` : country;
    const rate = taxRates[taxKey] || 0;

    return amount * rate;
  }

  /**
   * Get invoices for tenant
   */
  getInvoices(tenantId: string): Invoice[] {
    return this.invoices.get(tenantId) || [];
  }

  /**
   * Get payments for tenant
   */
  getPayments(tenantId: string): Payment[] {
    return this.payments.get(tenantId) || [];
  }

  /**
   * Get subscription by tenant
   */
  getSubscription(tenantId: string): Subscription | undefined {
    for (const sub of this.subscriptions.values()) {
      if (sub.tenantId === tenantId) {
        return sub;
      }
    }
    return undefined;
  }

  // Stripe API mock methods (replace with actual Stripe API calls)
  private async stripeCreateCustomer(data: any): Promise<any> {
    return { id: `cus_${this.randomId()}`, ...data };
  }

  private async stripeCreateSubscription(data: any): Promise<any> {
    return {
      id: `sub_${this.randomId()}`,
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      ...data
    };
  }

  private async stripeUpdateSubscription(id: string, data: any): Promise<any> {
    return { id, ...data };
  }

  private async stripeCancelSubscription(id: string): Promise<any> {
    return { id, status: 'canceled' };
  }

  private async stripeCreateInvoice(data: any): Promise<any> {
    return {
      id: `inv_${this.randomId()}`,
      total: 9900,
      amount_paid: 0,
      amount_due: 9900,
      currency: 'usd',
      status: 'open',
      due_date: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
      attempt_count: 0,
      lines: { data: [] },
      ...data
    };
  }

  private async stripeCreatePaymentIntent(data: any): Promise<any> {
    return {
      id: `pi_${this.randomId()}`,
      status: 'succeeded',
      ...data
    };
  }

  private async stripeCreateRefund(data: any): Promise<any> {
    return { id: `re_${this.randomId()}`, ...data };
  }

  private async stripeReportUsage(subscriptionItemId: string, data: any): Promise<void> {
    console.log(`Reporting usage for ${subscriptionItemId}:`, data);
  }

  // Helper methods
  private getPriceId(plan: string, cycle: string): string {
    return `price_${plan}_${cycle}`;
  }

  private getPlanPrice(plan: string, cycle: string): number {
    const prices: Record<string, Record<string, number>> = {
      free: { monthly: 0, yearly: 0 },
      starter: { monthly: 2900, yearly: 29000 },
      pro: { monthly: 9900, yearly: 99000 },
      enterprise: { monthly: 49900, yearly: 499000 }
    };
    return prices[plan]?.[cycle] || 0;
  }

  private parseInvoiceLines(lines: any): InvoiceLine[] {
    return (lines?.data || []).map((line: any) => ({
      id: line.id,
      description: line.description,
      amount: line.amount,
      quantity: line.quantity,
      unitPrice: line.unit_amount,
      type: line.type
    }));
  }

  private mapPaymentStatus(stripeStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      succeeded: PaymentStatus.SUCCEEDED,
      processing: PaymentStatus.PENDING,
      requires_payment_method: PaymentStatus.FAILED
    };
    return statusMap[stripeStatus] || PaymentStatus.PENDING;
  }

  private findPayment(paymentId: string): Payment | undefined {
    for (const payments of this.payments.values()) {
      const payment = payments.find(p => p.id === paymentId);
      if (payment) return payment;
    }
    return undefined;
  }

  private async sendPaymentFailureEmail(
    tenantId: string,
    invoice: Invoice,
    type: string
  ): Promise<void> {
    console.log(`Sending ${type} payment failure email for tenant ${tenantId}`);
  }

  private async suspendTenant(tenantId: string): Promise<void> {
    console.log(`Suspending tenant ${tenantId} due to failed payments`);
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${this.randomId()}`;
  }

  private randomId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
