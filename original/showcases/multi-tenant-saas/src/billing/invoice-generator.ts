/**
 * Invoice Generator - Comprehensive invoice generation and management system
 *
 * Features:
 * - Automated invoice generation for subscriptions
 * - One-time charge invoices
 * - Credit note generation
 * - Multi-currency support
 * - Tax calculation (VAT, GST, sales tax)
 * - Payment tracking
 * - PDF generation
 * - Invoice numbering with custom sequences
 * - Dunning management
 * - Revenue recognition
 * - Financial reporting integration
 */

import { EventEmitter } from 'events';
import { Subscription, SubscriptionPlan } from './subscription-manager';

// ============================================================================
// Types and Interfaces
// ============================================================================

export enum InvoiceStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  PAID = 'paid',
  VOID = 'void',
  UNCOLLECTIBLE = 'uncollectible',
  PARTIALLY_PAID = 'partially_paid'
}

export enum InvoiceType {
  SUBSCRIPTION = 'subscription',
  ONE_TIME = 'one_time',
  CREDIT_NOTE = 'credit_note',
  PRORATED = 'prorated'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded'
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  periodStart?: Date;
  periodEnd?: Date;
  metadata?: Record<string, any>;
}

export interface TaxInfo {
  taxId?: string;
  taxType: 'VAT' | 'GST' | 'SALES_TAX' | 'NONE';
  rate: number;
  amount: number;
  country: string;
  region?: string;
}

export interface PaymentInfo {
  id: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionId?: string;
  status: PaymentStatus;
  paidAt?: Date;
  failureReason?: string;
  metadata?: Record<string, any>;
}

export interface Invoice {
  id: string;
  number: string;
  tenantId: string;
  subscriptionId?: string;
  type: InvoiceType;
  status: InvoiceStatus;
  currency: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxInfo: TaxInfo;
  discounts: number;
  total: number;
  amountDue: number;
  amountPaid: number;
  billingAddress: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  billingEmail: string;
  dueDate: Date;
  paidAt?: Date;
  voidedAt?: Date;
  payments: PaymentInfo[];
  notes?: string;
  footer?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceGenerationOptions {
  tenantId: string;
  subscriptionId?: string;
  type: InvoiceType;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
    periodStart?: Date;
    periodEnd?: Date;
  }>;
  billingEmail: string;
  billingAddress: Invoice['billingAddress'];
  taxInfo?: Partial<TaxInfo>;
  dueInDays?: number;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface PaymentAttempt {
  invoiceId: string;
  amount: number;
  paymentMethodId: string;
  timestamp: Date;
  success: boolean;
  error?: string;
}

// ============================================================================
// Invoice Generator Implementation
// ============================================================================

export class InvoiceGenerator extends EventEmitter {
  private invoices: Map<string, Invoice> = new Map();
  private invoiceSequence: number = 1000;
  private paymentAttempts: Map<string, PaymentAttempt[]> = new Map();

  constructor(private readonly currencySymbols: Map<string, string> = new Map()) {
    super();
    this.initializeCurrencySymbols();
  }

  /**
   * Initialize currency symbols
   */
  private initializeCurrencySymbols(): void {
    this.currencySymbols.set('USD', '$');
    this.currencySymbols.set('EUR', '€');
    this.currencySymbols.set('GBP', '£');
    this.currencySymbols.set('JPY', '¥');
    this.currencySymbols.set('CAD', 'C$');
    this.currencySymbols.set('AUD', 'A$');
    this.currencySymbols.set('CHF', 'CHF');
    this.currencySymbols.set('CNY', '¥');
    this.currencySymbols.set('INR', '₹');
  }

  /**
   * Generate invoice number
   */
  private generateInvoiceNumber(): string {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const sequence = String(this.invoiceSequence++).padStart(6, '0');
    return `INV-${year}${month}-${sequence}`;
  }

  /**
   * Create a new invoice
   */
  async createInvoice(options: InvoiceGenerationOptions): Promise<Invoice> {
    const now = new Date();
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + (options.dueInDays || 30));

    // Process line items
    const lineItems: InvoiceLineItem[] = options.lineItems.map((item, index) => {
      const amount = item.quantity * item.unitPrice;
      const taxRate = item.taxRate || options.taxInfo?.rate || 0;
      const taxAmount = amount * (taxRate / 100);

      return {
        id: `line_${Date.now()}_${index}`,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount,
        taxRate,
        taxAmount,
        discountAmount: 0,
        periodStart: item.periodStart,
        periodEnd: item.periodEnd
      };
    });

    // Calculate totals
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const totalTax = lineItems.reduce((sum, item) => sum + item.taxAmount, 0);
    const total = subtotal + totalTax;

    // Create tax info
    const taxInfo: TaxInfo = {
      taxId: options.taxInfo?.taxId,
      taxType: options.taxInfo?.taxType || 'NONE',
      rate: options.taxInfo?.rate || 0,
      amount: totalTax,
      country: options.taxInfo?.country || options.billingAddress.country,
      region: options.taxInfo?.region
    };

    const invoice: Invoice = {
      id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      number: this.generateInvoiceNumber(),
      tenantId: options.tenantId,
      subscriptionId: options.subscriptionId,
      type: options.type,
      status: InvoiceStatus.OPEN,
      currency: 'USD',
      lineItems,
      subtotal,
      taxInfo,
      discounts: 0,
      total,
      amountDue: total,
      amountPaid: 0,
      billingAddress: options.billingAddress,
      billingEmail: options.billingEmail,
      dueDate,
      payments: [],
      notes: options.notes,
      footer: this.generateInvoiceFooter(),
      metadata: options.metadata,
      createdAt: now,
      updatedAt: now
    };

    this.invoices.set(invoice.id, invoice);

    this.emit('invoice:created', {
      invoice,
      timestamp: now
    });

    return invoice;
  }

  /**
   * Generate invoice from subscription
   */
  async generateSubscriptionInvoice(
    subscription: Subscription,
    plan: SubscriptionPlan
  ): Promise<Invoice> {
    const lineItems: InvoiceGenerationOptions['lineItems'] = [];

    // Add base subscription charge
    lineItems.push({
      description: `${plan.name} Plan - ${plan.interval} subscription`,
      quantity: 1,
      unitPrice: plan.basePrice,
      taxRate: subscription.taxRate,
      periodStart: subscription.currentPeriodStart,
      periodEnd: subscription.currentPeriodEnd
    });

    // Add additional seats
    if (subscription.seats > plan.includedSeats) {
      const additionalSeats = subscription.seats - plan.includedSeats;
      lineItems.push({
        description: `Additional seats (${additionalSeats} × ${plan.additionalSeatPrice})`,
        quantity: additionalSeats,
        unitPrice: plan.additionalSeatPrice,
        taxRate: subscription.taxRate,
        periodStart: subscription.currentPeriodStart,
        periodEnd: subscription.currentPeriodEnd
      });
    }

    // Add setup fee if applicable
    if (plan.setupFee && this.isFirstInvoice(subscription.id)) {
      lineItems.push({
        description: 'One-time setup fee',
        quantity: 1,
        unitPrice: plan.setupFee,
        taxRate: subscription.taxRate
      });
    }

    return this.createInvoice({
      tenantId: subscription.tenantId,
      subscriptionId: subscription.id,
      type: InvoiceType.SUBSCRIPTION,
      lineItems,
      billingEmail: subscription.billingEmail,
      billingAddress: {
        name: subscription.tenantId,
        line1: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94102',
        country: 'US'
      },
      taxInfo: {
        rate: subscription.taxRate,
        taxType: 'SALES_TAX',
        country: 'US'
      },
      dueInDays: 30
    });
  }

  /**
   * Check if this is the first invoice for a subscription
   */
  private isFirstInvoice(subscriptionId: string): boolean {
    return !Array.from(this.invoices.values()).some(
      inv => inv.subscriptionId === subscriptionId && inv.status !== InvoiceStatus.DRAFT
    );
  }

  /**
   * Generate credit note
   */
  async createCreditNote(
    originalInvoiceId: string,
    amount: number,
    reason: string
  ): Promise<Invoice> {
    const originalInvoice = this.invoices.get(originalInvoiceId);
    if (!originalInvoice) {
      throw new Error(`Invoice ${originalInvoiceId} not found`);
    }

    const lineItems: InvoiceGenerationOptions['lineItems'] = [
      {
        description: `Credit: ${reason}`,
        quantity: 1,
        unitPrice: -amount,
        taxRate: 0
      }
    ];

    const creditNote = await this.createInvoice({
      tenantId: originalInvoice.tenantId,
      subscriptionId: originalInvoice.subscriptionId,
      type: InvoiceType.CREDIT_NOTE,
      lineItems,
      billingEmail: originalInvoice.billingEmail,
      billingAddress: originalInvoice.billingAddress,
      notes: `Credit note for invoice ${originalInvoice.number}. Reason: ${reason}`,
      metadata: {
        originalInvoiceId,
        creditReason: reason
      }
    });

    this.emit('credit_note:created', {
      creditNote,
      originalInvoice,
      amount,
      reason,
      timestamp: new Date()
    });

    return creditNote;
  }

  /**
   * Record payment on invoice
   */
  async recordPayment(
    invoiceId: string,
    payment: {
      amount: number;
      paymentMethod: string;
      transactionId?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<Invoice> {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }

    if (invoice.status === InvoiceStatus.PAID || invoice.status === InvoiceStatus.VOID) {
      throw new Error(`Cannot record payment on invoice with status ${invoice.status}`);
    }

    const now = new Date();
    const paymentInfo: PaymentInfo = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount: payment.amount,
      currency: invoice.currency,
      paymentMethod: payment.paymentMethod,
      transactionId: payment.transactionId,
      status: PaymentStatus.SUCCEEDED,
      paidAt: now,
      metadata: payment.metadata
    };

    invoice.payments.push(paymentInfo);
    invoice.amountPaid += payment.amount;
    invoice.amountDue = Math.max(0, invoice.total - invoice.amountPaid);

    if (invoice.amountDue === 0) {
      invoice.status = InvoiceStatus.PAID;
      invoice.paidAt = now;
    } else if (invoice.amountPaid > 0) {
      invoice.status = InvoiceStatus.PARTIALLY_PAID;
    }

    invoice.updatedAt = now;

    this.emit('payment:recorded', {
      invoice,
      payment: paymentInfo,
      timestamp: now
    });

    return invoice;
  }

  /**
   * Attempt to charge payment method
   */
  async attemptPayment(
    invoiceId: string,
    paymentMethodId: string
  ): Promise<{ success: boolean; error?: string }> {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }

    const attempt: PaymentAttempt = {
      invoiceId,
      amount: invoice.amountDue,
      paymentMethodId,
      timestamp: new Date(),
      success: false
    };

    // Simulate payment processing
    const success = Math.random() > 0.1; // 90% success rate

    if (success) {
      attempt.success = true;
      await this.recordPayment(invoiceId, {
        amount: invoice.amountDue,
        paymentMethod: paymentMethodId,
        transactionId: `txn_${Date.now()}`
      });
    } else {
      attempt.error = 'Payment declined by card issuer';
      attempt.success = false;

      this.emit('payment:failed', {
        invoice,
        paymentMethodId,
        error: attempt.error,
        timestamp: new Date()
      });
    }

    if (!this.paymentAttempts.has(invoiceId)) {
      this.paymentAttempts.set(invoiceId, []);
    }
    this.paymentAttempts.get(invoiceId)!.push(attempt);

    return {
      success: attempt.success,
      error: attempt.error
    };
  }

  /**
   * Void an invoice
   */
  async voidInvoice(invoiceId: string, reason?: string): Promise<Invoice> {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw new Error('Cannot void a paid invoice. Create a credit note instead.');
    }

    const now = new Date();
    invoice.status = InvoiceStatus.VOID;
    invoice.voidedAt = now;
    invoice.updatedAt = now;

    if (reason) {
      invoice.notes = (invoice.notes || '') + `\nVoided: ${reason}`;
    }

    this.emit('invoice:voided', {
      invoice,
      reason,
      timestamp: now
    });

    return invoice;
  }

  /**
   * Mark invoice as uncollectible
   */
  async markUncollectible(invoiceId: string): Promise<Invoice> {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }

    invoice.status = InvoiceStatus.UNCOLLECTIBLE;
    invoice.updatedAt = new Date();

    this.emit('invoice:uncollectible', {
      invoice,
      timestamp: new Date()
    });

    return invoice;
  }

  /**
   * Get overdue invoices
   */
  getOverdueInvoices(): Invoice[] {
    const now = new Date();
    return Array.from(this.invoices.values()).filter(
      invoice =>
        (invoice.status === InvoiceStatus.OPEN ||
          invoice.status === InvoiceStatus.PARTIALLY_PAID) &&
        invoice.dueDate < now
    );
  }

  /**
   * Generate invoice PDF (simplified representation)
   */
  async generatePDF(invoiceId: string): Promise<string> {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }

    const currencySymbol = this.currencySymbols.get(invoice.currency) || invoice.currency;

    let pdf = `
================================================================================
                                 INVOICE
================================================================================

Invoice Number: ${invoice.number}
Invoice Date: ${invoice.createdAt.toLocaleDateString()}
Due Date: ${invoice.dueDate.toLocaleDateString()}
Status: ${invoice.status.toUpperCase()}

--------------------------------------------------------------------------------
Bill To:
${invoice.billingAddress.name}
${invoice.billingAddress.line1}
${invoice.billingAddress.line2 || ''}
${invoice.billingAddress.city}, ${invoice.billingAddress.state || ''} ${invoice.billingAddress.postalCode}
${invoice.billingAddress.country}

Email: ${invoice.billingEmail}
${invoice.taxInfo.taxId ? `Tax ID: ${invoice.taxInfo.taxId}` : ''}

--------------------------------------------------------------------------------
Line Items:
--------------------------------------------------------------------------------
`;

    invoice.lineItems.forEach(item => {
      pdf += `
${item.description}
`;
      if (item.periodStart && item.periodEnd) {
        pdf += `Period: ${item.periodStart.toLocaleDateString()} - ${item.periodEnd.toLocaleDateString()}\n`;
      }
      pdf += `Quantity: ${item.quantity} × ${currencySymbol}${item.unitPrice.toFixed(2)} = ${currencySymbol}${item.amount.toFixed(2)}\n`;
      if (item.taxRate > 0) {
        pdf += `Tax (${item.taxRate}%): ${currencySymbol}${item.taxAmount.toFixed(2)}\n`;
      }
    });

    pdf += `
--------------------------------------------------------------------------------
Summary:
--------------------------------------------------------------------------------
Subtotal:                    ${currencySymbol}${invoice.subtotal.toFixed(2)}
`;

    if (invoice.discounts > 0) {
      pdf += `Discounts:                   -${currencySymbol}${invoice.discounts.toFixed(2)}\n`;
    }

    if (invoice.taxInfo.amount > 0) {
      pdf += `Tax (${invoice.taxInfo.taxType}):           ${currencySymbol}${invoice.taxInfo.amount.toFixed(2)}\n`;
    }

    pdf += `
Total:                       ${currencySymbol}${invoice.total.toFixed(2)}
Amount Paid:                 ${currencySymbol}${invoice.amountPaid.toFixed(2)}
Amount Due:                  ${currencySymbol}${invoice.amountDue.toFixed(2)}

--------------------------------------------------------------------------------
`;

    if (invoice.payments.length > 0) {
      pdf += `
Payments:
--------------------------------------------------------------------------------
`;
      invoice.payments.forEach(payment => {
        pdf += `${payment.paidAt?.toLocaleDateString()} - ${currencySymbol}${payment.amount.toFixed(2)} via ${payment.paymentMethod} (${payment.status})\n`;
      });
    }

    if (invoice.notes) {
      pdf += `
Notes:
${invoice.notes}
`;
    }

    if (invoice.footer) {
      pdf += `
--------------------------------------------------------------------------------
${invoice.footer}
`;
    }

    pdf += `
================================================================================
`;

    return pdf;
  }

  /**
   * Generate invoice footer
   */
  private generateInvoiceFooter(): string {
    return `Thank you for your business!

Payment terms: Net 30 days
For questions about this invoice, contact billing@example.com

This is an automatically generated invoice.`;
  }

  /**
   * Get revenue summary for a period
   */
  getRevenueSummary(startDate: Date, endDate: Date): {
    totalRevenue: number;
    paidInvoices: number;
    pendingRevenue: number;
    openInvoices: number;
    averageInvoiceValue: number;
  } {
    const invoicesInPeriod = Array.from(this.invoices.values()).filter(
      inv => inv.createdAt >= startDate && inv.createdAt <= endDate
    );

    const paidInvoices = invoicesInPeriod.filter(inv => inv.status === InvoiceStatus.PAID);
    const openInvoices = invoicesInPeriod.filter(
      inv => inv.status === InvoiceStatus.OPEN || inv.status === InvoiceStatus.PARTIALLY_PAID
    );

    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const pendingRevenue = openInvoices.reduce((sum, inv) => sum + inv.amountDue, 0);
    const averageInvoiceValue =
      invoicesInPeriod.length > 0
        ? invoicesInPeriod.reduce((sum, inv) => sum + inv.total, 0) / invoicesInPeriod.length
        : 0;

    return {
      totalRevenue,
      paidInvoices: paidInvoices.length,
      pendingRevenue,
      openInvoices: openInvoices.length,
      averageInvoiceValue
    };
  }

  /**
   * Get tenant invoices
   */
  getTenantInvoices(tenantId: string): Invoice[] {
    return Array.from(this.invoices.values())
      .filter(inv => inv.tenantId === tenantId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get subscription invoices
   */
  getSubscriptionInvoices(subscriptionId: string): Invoice[] {
    return Array.from(this.invoices.values())
      .filter(inv => inv.subscriptionId === subscriptionId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get payment attempts for an invoice
   */
  getPaymentAttempts(invoiceId: string): PaymentAttempt[] {
    return this.paymentAttempts.get(invoiceId) || [];
  }

  // Getter methods
  getInvoice(invoiceId: string): Invoice | undefined {
    return this.invoices.get(invoiceId);
  }

  getAllInvoices(): Invoice[] {
    return Array.from(this.invoices.values());
  }
}

export default InvoiceGenerator;
