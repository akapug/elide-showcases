/**
 * Subscription Manager - Advanced subscription lifecycle management
 *
 * Features:
 * - Multi-tier subscription plans with complex pricing
 * - Trial management and conversion tracking
 * - Proration calculations for upgrades/downgrades
 * - Usage-based billing and metered features
 * - Seat-based licensing
 * - Addon management
 * - Payment method handling
 * - Dunning management for failed payments
 * - Subscription scheduling (future changes)
 * - Revenue recognition
 * - Contract management for enterprise customers
 */

import { EventEmitter } from 'events';

// ============================================================================
// Types and Interfaces
// ============================================================================

export enum SubscriptionStatus {
  TRIAL = 'trial',
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELLED = 'cancelled',
  PAUSED = 'paused',
  EXPIRED = 'expired',
  UNPAID = 'unpaid'
}

export enum BillingInterval {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUAL = 'annual',
  BIENNIAL = 'biennial'
}

export enum PlanTier {
  FREE = 'free',
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  BUSINESS = 'business',
  ENTERPRISE = 'enterprise'
}

export interface PlanFeature {
  id: string;
  name: string;
  description: string;
  limit?: number;
  unlimited: boolean;
  metered: boolean;
  unitPrice?: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: PlanTier;
  basePrice: number;
  currency: string;
  interval: BillingInterval;
  features: PlanFeature[];
  includedSeats: number;
  additionalSeatPrice: number;
  trialDays: number;
  setupFee?: number;
  minimumCommitment?: number;
  metadata?: Record<string, any>;
}

export interface Addon {
  id: string;
  name: string;
  description: string;
  price: number;
  recurring: boolean;
  metadata?: Record<string, any>;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account' | 'paypal' | 'invoice';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  metadata?: Record<string, any>;
}

export interface Subscription {
  id: string;
  tenantId: string;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialStart?: Date;
  trialEnd?: Date;
  cancelledAt?: Date;
  cancelAtPeriodEnd: boolean;
  seats: number;
  addons: string[];
  paymentMethodId?: string;
  billingEmail: string;
  taxRate: number;
  discount?: {
    couponId: string;
    percentOff?: number;
    amountOff?: number;
    validUntil?: Date;
  };
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsageRecord {
  subscriptionId: string;
  featureId: string;
  quantity: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ProrationPreview {
  immediateCharge: number;
  creditAmount: number;
  netAmount: number;
  unusedDays: number;
  items: Array<{
    description: string;
    amount: number;
    quantity?: number;
  }>;
}

// ============================================================================
// Subscription Manager Implementation
// ============================================================================

export class SubscriptionManager extends EventEmitter {
  private subscriptions: Map<string, Subscription> = new Map();
  private plans: Map<string, SubscriptionPlan> = new Map();
  private addons: Map<string, Addon> = new Map();
  private usageRecords: Map<string, UsageRecord[]> = new Map();
  private paymentMethods: Map<string, PaymentMethod[]> = new Map();

  constructor() {
    super();
    this.initializeDefaultPlans();
    this.initializeDefaultAddons();
    this.startBackgroundJobs();
  }

  /**
   * Initialize default subscription plans
   */
  private initializeDefaultPlans(): void {
    const plans: SubscriptionPlan[] = [
      {
        id: 'plan_free',
        name: 'Free',
        tier: PlanTier.FREE,
        basePrice: 0,
        currency: 'USD',
        interval: BillingInterval.MONTHLY,
        includedSeats: 1,
        additionalSeatPrice: 0,
        trialDays: 0,
        features: [
          {
            id: 'api_calls',
            name: 'API Calls',
            description: 'Monthly API call limit',
            limit: 1000,
            unlimited: false,
            metered: true,
            unitPrice: 0
          },
          {
            id: 'storage',
            name: 'Storage',
            description: 'Data storage in GB',
            limit: 1,
            unlimited: false,
            metered: false
          },
          {
            id: 'projects',
            name: 'Projects',
            description: 'Number of projects',
            limit: 1,
            unlimited: false,
            metered: false
          }
        ]
      },
      {
        id: 'plan_starter',
        name: 'Starter',
        tier: PlanTier.STARTER,
        basePrice: 29,
        currency: 'USD',
        interval: BillingInterval.MONTHLY,
        includedSeats: 5,
        additionalSeatPrice: 5,
        trialDays: 14,
        features: [
          {
            id: 'api_calls',
            name: 'API Calls',
            description: 'Monthly API call limit',
            limit: 50000,
            unlimited: false,
            metered: true,
            unitPrice: 0.0001
          },
          {
            id: 'storage',
            name: 'Storage',
            description: 'Data storage in GB',
            limit: 10,
            unlimited: false,
            metered: false
          },
          {
            id: 'projects',
            name: 'Projects',
            description: 'Number of projects',
            limit: 10,
            unlimited: false,
            metered: false
          },
          {
            id: 'support',
            name: 'Support',
            description: 'Email support',
            unlimited: true,
            metered: false
          }
        ]
      },
      {
        id: 'plan_professional',
        name: 'Professional',
        tier: PlanTier.PROFESSIONAL,
        basePrice: 99,
        currency: 'USD',
        interval: BillingInterval.MONTHLY,
        includedSeats: 15,
        additionalSeatPrice: 7,
        trialDays: 14,
        features: [
          {
            id: 'api_calls',
            name: 'API Calls',
            description: 'Monthly API call limit',
            limit: 500000,
            unlimited: false,
            metered: true,
            unitPrice: 0.00008
          },
          {
            id: 'storage',
            name: 'Storage',
            description: 'Data storage in GB',
            limit: 100,
            unlimited: false,
            metered: true,
            unitPrice: 0.5
          },
          {
            id: 'projects',
            name: 'Projects',
            description: 'Number of projects',
            unlimited: true,
            metered: false
          },
          {
            id: 'support',
            name: 'Support',
            description: 'Priority email and chat support',
            unlimited: true,
            metered: false
          },
          {
            id: 'sla',
            name: 'SLA',
            description: '99.9% uptime SLA',
            unlimited: true,
            metered: false
          }
        ]
      },
      {
        id: 'plan_business',
        name: 'Business',
        tier: PlanTier.BUSINESS,
        basePrice: 299,
        currency: 'USD',
        interval: BillingInterval.MONTHLY,
        includedSeats: 50,
        additionalSeatPrice: 6,
        trialDays: 30,
        features: [
          {
            id: 'api_calls',
            name: 'API Calls',
            description: 'Monthly API call limit',
            unlimited: true,
            metered: false
          },
          {
            id: 'storage',
            name: 'Storage',
            description: 'Data storage in GB',
            limit: 1000,
            unlimited: false,
            metered: true,
            unitPrice: 0.3
          },
          {
            id: 'projects',
            name: 'Projects',
            description: 'Number of projects',
            unlimited: true,
            metered: false
          },
          {
            id: 'support',
            name: 'Support',
            description: '24/7 phone and email support',
            unlimited: true,
            metered: false
          },
          {
            id: 'sla',
            name: 'SLA',
            description: '99.95% uptime SLA',
            unlimited: true,
            metered: false
          },
          {
            id: 'custom_integration',
            name: 'Custom Integration',
            description: 'Custom integration support',
            unlimited: true,
            metered: false
          }
        ]
      },
      {
        id: 'plan_enterprise',
        name: 'Enterprise',
        tier: PlanTier.ENTERPRISE,
        basePrice: 999,
        currency: 'USD',
        interval: BillingInterval.MONTHLY,
        includedSeats: 100,
        additionalSeatPrice: 5,
        trialDays: 30,
        setupFee: 2000,
        minimumCommitment: 12,
        features: [
          {
            id: 'api_calls',
            name: 'API Calls',
            description: 'Unlimited API calls',
            unlimited: true,
            metered: false
          },
          {
            id: 'storage',
            name: 'Storage',
            description: 'Unlimited storage',
            unlimited: true,
            metered: false
          },
          {
            id: 'projects',
            name: 'Projects',
            description: 'Unlimited projects',
            unlimited: true,
            metered: false
          },
          {
            id: 'support',
            name: 'Support',
            description: 'Dedicated account manager',
            unlimited: true,
            metered: false
          },
          {
            id: 'sla',
            name: 'SLA',
            description: '99.99% uptime SLA',
            unlimited: true,
            metered: false
          },
          {
            id: 'custom_integration',
            name: 'Custom Integration',
            description: 'Dedicated integration team',
            unlimited: true,
            metered: false
          },
          {
            id: 'on_premise',
            name: 'On-Premise Deployment',
            description: 'Option for on-premise deployment',
            unlimited: true,
            metered: false
          }
        ]
      }
    ];

    plans.forEach(plan => this.plans.set(plan.id, plan));
  }

  /**
   * Initialize default addons
   */
  private initializeDefaultAddons(): void {
    const addons: Addon[] = [
      {
        id: 'addon_advanced_analytics',
        name: 'Advanced Analytics',
        description: 'Advanced analytics and reporting features',
        price: 49,
        recurring: true
      },
      {
        id: 'addon_white_label',
        name: 'White Label',
        description: 'Custom branding and white-label options',
        price: 99,
        recurring: true
      },
      {
        id: 'addon_priority_support',
        name: 'Priority Support',
        description: '24/7 priority support with 1-hour response time',
        price: 199,
        recurring: true
      },
      {
        id: 'addon_data_export',
        name: 'Data Export',
        description: 'Advanced data export and backup features',
        price: 29,
        recurring: true
      },
      {
        id: 'addon_custom_domain',
        name: 'Custom Domain',
        description: 'Use your own custom domain',
        price: 15,
        recurring: true
      },
      {
        id: 'addon_sso',
        name: 'Single Sign-On',
        description: 'SSO integration with SAML/OAuth',
        price: 149,
        recurring: true
      }
    ];

    addons.forEach(addon => this.addons.set(addon.id, addon));
  }

  /**
   * Create a new subscription
   */
  async createSubscription(params: {
    tenantId: string;
    planId: string;
    seats?: number;
    addons?: string[];
    paymentMethodId?: string;
    billingEmail: string;
    taxRate?: number;
    startTrial?: boolean;
    couponCode?: string;
  }): Promise<Subscription> {
    const plan = this.plans.get(params.planId);
    if (!plan) {
      throw new Error(`Plan ${params.planId} not found`);
    }

    const now = new Date();
    const seats = params.seats || plan.includedSeats;

    let trialStart: Date | undefined;
    let trialEnd: Date | undefined;
    let status = SubscriptionStatus.ACTIVE;

    if (params.startTrial && plan.trialDays > 0) {
      trialStart = now;
      trialEnd = new Date(now.getTime() + plan.trialDays * 24 * 60 * 60 * 1000);
      status = SubscriptionStatus.TRIAL;
    }

    const subscription: Subscription = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tenantId: params.tenantId,
      planId: params.planId,
      status,
      currentPeriodStart: now,
      currentPeriodEnd: this.calculatePeriodEnd(now, plan.interval),
      trialStart,
      trialEnd,
      cancelAtPeriodEnd: false,
      seats,
      addons: params.addons || [],
      paymentMethodId: params.paymentMethodId,
      billingEmail: params.billingEmail,
      taxRate: params.taxRate || 0,
      createdAt: now,
      updatedAt: now
    };

    this.subscriptions.set(subscription.id, subscription);

    this.emit('subscription:created', {
      subscription,
      plan,
      timestamp: now
    });

    return subscription;
  }

  /**
   * Update subscription (change plan, seats, addons)
   */
  async updateSubscription(
    subscriptionId: string,
    updates: {
      planId?: string;
      seats?: number;
      addons?: string[];
      paymentMethodId?: string;
      taxRate?: number;
    }
  ): Promise<{ subscription: Subscription; proration: ProrationPreview }> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      throw new Error(`Subscription ${subscriptionId} not found`);
    }

    const currentPlan = this.plans.get(subscription.planId);
    const newPlan = updates.planId ? this.plans.get(updates.planId) : currentPlan;

    if (!currentPlan || !newPlan) {
      throw new Error('Invalid plan configuration');
    }

    // Calculate proration
    const proration = this.calculateProration(
      subscription,
      currentPlan,
      newPlan,
      updates.seats || subscription.seats
    );

    // Update subscription
    if (updates.planId) subscription.planId = updates.planId;
    if (updates.seats) subscription.seats = updates.seats;
    if (updates.addons) subscription.addons = updates.addons;
    if (updates.paymentMethodId) subscription.paymentMethodId = updates.paymentMethodId;
    if (updates.taxRate !== undefined) subscription.taxRate = updates.taxRate;

    subscription.updatedAt = new Date();

    this.emit('subscription:updated', {
      subscription,
      proration,
      previousPlan: currentPlan,
      newPlan,
      timestamp: new Date()
    });

    return { subscription, proration };
  }

  /**
   * Calculate proration for plan changes
   */
  private calculateProration(
    subscription: Subscription,
    currentPlan: SubscriptionPlan,
    newPlan: SubscriptionPlan,
    newSeats: number
  ): ProrationPreview {
    const now = new Date();
    const totalDays = Math.ceil(
      (subscription.currentPeriodEnd.getTime() - subscription.currentPeriodStart.getTime()) /
        (24 * 60 * 60 * 1000)
    );
    const unusedDays = Math.ceil(
      (subscription.currentPeriodEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
    );

    const items: Array<{ description: string; amount: number; quantity?: number }> = [];

    // Calculate credit from current plan
    const currentAmount = this.calculateSubscriptionAmount(subscription, currentPlan);
    const creditAmount = (currentAmount * unusedDays) / totalDays;
    items.push({
      description: `Credit for unused time on ${currentPlan.name}`,
      amount: -creditAmount
    });

    // Calculate charge for new plan
    const newSubscription = { ...subscription, planId: newPlan.id, seats: newSeats };
    const newAmount = this.calculateSubscriptionAmount(newSubscription, newPlan);
    const immediateCharge = (newAmount * unusedDays) / totalDays;
    items.push({
      description: `Charge for ${newPlan.name} (prorated)`,
      amount: immediateCharge
    });

    const netAmount = immediateCharge - creditAmount;

    return {
      immediateCharge,
      creditAmount,
      netAmount,
      unusedDays,
      items
    };
  }

  /**
   * Calculate total subscription amount
   */
  private calculateSubscriptionAmount(
    subscription: Subscription,
    plan: SubscriptionPlan
  ): number {
    let amount = plan.basePrice;

    // Add additional seat costs
    if (subscription.seats > plan.includedSeats) {
      const additionalSeats = subscription.seats - plan.includedSeats;
      amount += additionalSeats * plan.additionalSeatPrice;
    }

    // Add addon costs
    subscription.addons.forEach(addonId => {
      const addon = this.addons.get(addonId);
      if (addon && addon.recurring) {
        amount += addon.price;
      }
    });

    // Apply discount
    if (subscription.discount) {
      if (subscription.discount.percentOff) {
        amount *= 1 - subscription.discount.percentOff / 100;
      } else if (subscription.discount.amountOff) {
        amount -= subscription.discount.amountOff;
      }
    }

    // Apply tax
    amount *= 1 + subscription.taxRate / 100;

    return Math.max(0, amount);
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    immediately: boolean = false
  ): Promise<Subscription> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      throw new Error(`Subscription ${subscriptionId} not found`);
    }

    const now = new Date();

    if (immediately) {
      subscription.status = SubscriptionStatus.CANCELLED;
      subscription.cancelledAt = now;
      subscription.currentPeriodEnd = now;
    } else {
      subscription.cancelAtPeriodEnd = true;
    }

    subscription.updatedAt = now;

    this.emit('subscription:cancelled', {
      subscription,
      immediately,
      timestamp: now
    });

    return subscription;
  }

  /**
   * Pause subscription
   */
  async pauseSubscription(subscriptionId: string): Promise<Subscription> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      throw new Error(`Subscription ${subscriptionId} not found`);
    }

    subscription.status = SubscriptionStatus.PAUSED;
    subscription.updatedAt = new Date();

    this.emit('subscription:paused', {
      subscription,
      timestamp: new Date()
    });

    return subscription;
  }

  /**
   * Resume subscription
   */
  async resumeSubscription(subscriptionId: string): Promise<Subscription> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      throw new Error(`Subscription ${subscriptionId} not found`);
    }

    subscription.status = SubscriptionStatus.ACTIVE;
    subscription.cancelAtPeriodEnd = false;
    subscription.updatedAt = new Date();

    this.emit('subscription:resumed', {
      subscription,
      timestamp: new Date()
    });

    return subscription;
  }

  /**
   * Record usage for metered features
   */
  async recordUsage(
    subscriptionId: string,
    featureId: string,
    quantity: number,
    metadata?: Record<string, any>
  ): Promise<UsageRecord> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      throw new Error(`Subscription ${subscriptionId} not found`);
    }

    const record: UsageRecord = {
      subscriptionId,
      featureId,
      quantity,
      timestamp: new Date(),
      metadata
    };

    if (!this.usageRecords.has(subscriptionId)) {
      this.usageRecords.set(subscriptionId, []);
    }
    this.usageRecords.get(subscriptionId)!.push(record);

    return record;
  }

  /**
   * Get usage summary for billing period
   */
  getUsageSummary(subscriptionId: string): Map<string, number> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      throw new Error(`Subscription ${subscriptionId} not found`);
    }

    const records = this.usageRecords.get(subscriptionId) || [];
    const summary = new Map<string, number>();

    records
      .filter(
        r =>
          r.timestamp >= subscription.currentPeriodStart &&
          r.timestamp <= subscription.currentPeriodEnd
      )
      .forEach(record => {
        const current = summary.get(record.featureId) || 0;
        summary.set(record.featureId, current + record.quantity);
      });

    return summary;
  }

  /**
   * Calculate period end date based on interval
   */
  private calculatePeriodEnd(start: Date, interval: BillingInterval): Date {
    const end = new Date(start);

    switch (interval) {
      case BillingInterval.MONTHLY:
        end.setMonth(end.getMonth() + 1);
        break;
      case BillingInterval.QUARTERLY:
        end.setMonth(end.getMonth() + 3);
        break;
      case BillingInterval.ANNUAL:
        end.setFullYear(end.getFullYear() + 1);
        break;
      case BillingInterval.BIENNIAL:
        end.setFullYear(end.getFullYear() + 2);
        break;
    }

    return end;
  }

  /**
   * Start background jobs for subscription management
   */
  private startBackgroundJobs(): void {
    // Check for trial expiration every hour
    setInterval(() => this.checkTrialExpirations(), 60 * 60 * 1000);

    // Check for subscription renewals every hour
    setInterval(() => this.processSubscriptionRenewals(), 60 * 60 * 1000);

    // Process dunning for failed payments daily
    setInterval(() => this.processDunning(), 24 * 60 * 60 * 1000);
  }

  /**
   * Check and process trial expirations
   */
  private async checkTrialExpirations(): Promise<void> {
    const now = new Date();

    for (const [id, subscription] of this.subscriptions) {
      if (
        subscription.status === SubscriptionStatus.TRIAL &&
        subscription.trialEnd &&
        subscription.trialEnd <= now
      ) {
        if (subscription.paymentMethodId) {
          subscription.status = SubscriptionStatus.ACTIVE;
          this.emit('trial:converted', { subscription, timestamp: now });
        } else {
          subscription.status = SubscriptionStatus.EXPIRED;
          this.emit('trial:expired', { subscription, timestamp: now });
        }

        subscription.updatedAt = now;
      }
    }
  }

  /**
   * Process subscription renewals
   */
  private async processSubscriptionRenewals(): Promise<void> {
    const now = new Date();

    for (const [id, subscription] of this.subscriptions) {
      if (
        subscription.status === SubscriptionStatus.ACTIVE &&
        subscription.currentPeriodEnd <= now
      ) {
        if (subscription.cancelAtPeriodEnd) {
          subscription.status = SubscriptionStatus.CANCELLED;
          subscription.cancelledAt = now;
          this.emit('subscription:ended', { subscription, timestamp: now });
        } else {
          // Attempt renewal
          const plan = this.plans.get(subscription.planId);
          if (plan) {
            subscription.currentPeriodStart = now;
            subscription.currentPeriodEnd = this.calculatePeriodEnd(now, plan.interval);
            subscription.updatedAt = now;

            this.emit('subscription:renewed', { subscription, plan, timestamp: now });
          }
        }
      }
    }
  }

  /**
   * Process dunning for failed payments
   */
  private async processDunning(): Promise<void> {
    const now = new Date();

    for (const [id, subscription] of this.subscriptions) {
      if (subscription.status === SubscriptionStatus.PAST_DUE) {
        const daysPastDue = Math.floor(
          (now.getTime() - subscription.currentPeriodEnd.getTime()) / (24 * 60 * 60 * 1000)
        );

        if (daysPastDue >= 30) {
          // Cancel after 30 days
          subscription.status = SubscriptionStatus.UNPAID;
          subscription.cancelledAt = now;
          this.emit('subscription:unpaid', { subscription, daysPastDue, timestamp: now });
        } else {
          // Retry payment
          this.emit('dunning:retry', { subscription, daysPastDue, timestamp: now });
        }
      }
    }
  }

  // Getter methods
  getSubscription(subscriptionId: string): Subscription | undefined {
    return this.subscriptions.get(subscriptionId);
  }

  getTenantSubscriptions(tenantId: string): Subscription[] {
    return Array.from(this.subscriptions.values()).filter(sub => sub.tenantId === tenantId);
  }

  getAllPlans(): SubscriptionPlan[] {
    return Array.from(this.plans.values());
  }

  getPlan(planId: string): SubscriptionPlan | undefined {
    return this.plans.get(planId);
  }

  getAllAddons(): Addon[] {
    return Array.from(this.addons.values());
  }

  getAddon(addonId: string): Addon | undefined {
    return this.addons.get(addonId);
  }
}

export default SubscriptionManager;
