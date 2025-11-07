/**
 * Multi-Tenant SaaS Backend
 *
 * This server implements a production-ready multi-tenant SaaS platform with:
 * - Tenant isolation (data, configuration, resources)
 * - Per-tenant configuration and customization
 * - Usage tracking and metering
 * - Billing integration (subscription management)
 * - Admin panel API
 * - Tenant provisioning and lifecycle management
 *
 * @module multi-tenant-saas
 */

import { serve } from "elide/http";

/**
 * Tenant subscription plans
 */
enum SubscriptionPlan {
  FREE = 'free',
  STARTER = 'starter',
  PRO = 'pro',
  ENTERPRISE = 'enterprise'
}

/**
 * Tenant status
 */
enum TenantStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  TRIAL = 'trial',
  CANCELED = 'canceled'
}

/**
 * Billing cycle
 */
enum BillingCycle {
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}

/**
 * Tenant information
 */
interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  plan: SubscriptionPlan;
  billingCycle: BillingCycle;
  customDomain?: string;
  config: TenantConfig;
  limits: TenantLimits;
  createdAt: number;
  trialEndsAt?: number;
  subscriptionEndsAt?: number;
}

/**
 * Tenant configuration
 */
interface TenantConfig {
  branding: {
    primaryColor: string;
    logo?: string;
    favicon?: string;
  };
  features: {
    [key: string]: boolean;
  };
  settings: {
    [key: string]: any;
  };
}

/**
 * Tenant usage limits
 */
interface TenantLimits {
  maxUsers: number;
  maxProjects: number;
  maxStorage: number; // bytes
  maxApiCalls: number; // per day
  maxBandwidth: number; // bytes per month
}

/**
 * User information
 */
interface User {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'member';
  createdAt: number;
}

/**
 * Usage metrics
 */
interface UsageMetrics {
  tenantId: string;
  period: string; // YYYY-MM
  apiCalls: number;
  storage: number;
  bandwidth: number;
  activeUsers: number;
  timestamp: number;
}

/**
 * Billing event
 */
interface BillingEvent {
  id: string;
  tenantId: string;
  type: 'subscription_created' | 'subscription_updated' | 'payment_succeeded' | 'payment_failed';
  amount: number;
  currency: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Invoice
 */
interface Invoice {
  id: string;
  tenantId: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void';
  dueDate: number;
  paidAt?: number;
  items: InvoiceItem[];
  createdAt: number;
}

/**
 * Invoice item
 */
interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

/**
 * Plan pricing
 */
const PLAN_PRICING = {
  [SubscriptionPlan.FREE]: {
    monthly: 0,
    yearly: 0,
    limits: {
      maxUsers: 3,
      maxProjects: 5,
      maxStorage: 1024 * 1024 * 1024, // 1 GB
      maxApiCalls: 1000,
      maxBandwidth: 10 * 1024 * 1024 * 1024 // 10 GB
    }
  },
  [SubscriptionPlan.STARTER]: {
    monthly: 29,
    yearly: 290,
    limits: {
      maxUsers: 10,
      maxProjects: 25,
      maxStorage: 10 * 1024 * 1024 * 1024, // 10 GB
      maxApiCalls: 10000,
      maxBandwidth: 100 * 1024 * 1024 * 1024 // 100 GB
    }
  },
  [SubscriptionPlan.PRO]: {
    monthly: 99,
    yearly: 990,
    limits: {
      maxUsers: 50,
      maxProjects: 100,
      maxStorage: 100 * 1024 * 1024 * 1024, // 100 GB
      maxApiCalls: 100000,
      maxBandwidth: 1024 * 1024 * 1024 * 1024 // 1 TB
    }
  },
  [SubscriptionPlan.ENTERPRISE]: {
    monthly: 499,
    yearly: 4990,
    limits: {
      maxUsers: -1, // unlimited
      maxProjects: -1,
      maxStorage: -1,
      maxApiCalls: -1,
      maxBandwidth: -1
    }
  }
};

/**
 * Tenant manager
 */
class TenantManager {
  private tenants: Map<string, Tenant>;
  private tenantsBySlug: Map<string, string>; // slug -> id

  constructor() {
    this.tenants = new Map();
    this.tenantsBySlug = new Map();
    this.seedData();
  }

  /**
   * Seed demo data
   */
  private seedData(): void {
    const demoTenant = this.create({
      name: 'Demo Company',
      slug: 'demo',
      plan: SubscriptionPlan.PRO,
      billingCycle: BillingCycle.MONTHLY
    });
  }

  /**
   * Create new tenant
   */
  create(data: {
    name: string;
    slug: string;
    plan: SubscriptionPlan;
    billingCycle: BillingCycle;
    customDomain?: string;
  }): Tenant {
    // Check if slug is available
    if (this.tenantsBySlug.has(data.slug)) {
      throw new Error('Slug already taken');
    }

    const id = this.generateId();
    const limits = PLAN_PRICING[data.plan].limits;

    const tenant: Tenant = {
      id,
      name: data.name,
      slug: data.slug,
      status: TenantStatus.TRIAL,
      plan: data.plan,
      billingCycle: data.billingCycle,
      customDomain: data.customDomain,
      config: {
        branding: {
          primaryColor: '#3B82F6'
        },
        features: {},
        settings: {}
      },
      limits,
      createdAt: Date.now(),
      trialEndsAt: Date.now() + 14 * 24 * 60 * 60 * 1000 // 14 days
    };

    this.tenants.set(id, tenant);
    this.tenantsBySlug.set(data.slug, id);

    return tenant;
  }

  /**
   * Get tenant by ID
   */
  get(id: string): Tenant | undefined {
    return this.tenants.get(id);
  }

  /**
   * Get tenant by slug
   */
  getBySlug(slug: string): Tenant | undefined {
    const id = this.tenantsBySlug.get(slug);
    return id ? this.tenants.get(id) : undefined;
  }

  /**
   * Get tenant by custom domain
   */
  getByDomain(domain: string): Tenant | undefined {
    for (const tenant of this.tenants.values()) {
      if (tenant.customDomain === domain) {
        return tenant;
      }
    }
    return undefined;
  }

  /**
   * Update tenant
   */
  update(id: string, updates: Partial<Tenant>): Tenant {
    const tenant = this.tenants.get(id);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Update slug mapping if changed
    if (updates.slug && updates.slug !== tenant.slug) {
      this.tenantsBySlug.delete(tenant.slug);
      this.tenantsBySlug.set(updates.slug, id);
    }

    Object.assign(tenant, updates);
    return tenant;
  }

  /**
   * Delete tenant
   */
  delete(id: string): boolean {
    const tenant = this.tenants.get(id);
    if (!tenant) return false;

    this.tenantsBySlug.delete(tenant.slug);
    return this.tenants.delete(id);
  }

  /**
   * Change subscription plan
   */
  changePlan(id: string, plan: SubscriptionPlan, billingCycle: BillingCycle): Tenant {
    const tenant = this.tenants.get(id);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    tenant.plan = plan;
    tenant.billingCycle = billingCycle;
    tenant.limits = PLAN_PRICING[plan].limits;

    return tenant;
  }

  /**
   * Activate tenant
   */
  activate(id: string): Tenant {
    return this.update(id, {
      status: TenantStatus.ACTIVE,
      subscriptionEndsAt: this.calculateSubscriptionEnd(id)
    });
  }

  /**
   * Suspend tenant
   */
  suspend(id: string, reason?: string): Tenant {
    return this.update(id, { status: TenantStatus.SUSPENDED });
  }

  /**
   * Cancel tenant subscription
   */
  cancel(id: string): Tenant {
    return this.update(id, { status: TenantStatus.CANCELED });
  }

  /**
   * Calculate subscription end date
   */
  private calculateSubscriptionEnd(id: string): number {
    const tenant = this.tenants.get(id);
    if (!tenant) throw new Error('Tenant not found');

    const now = Date.now();
    if (tenant.billingCycle === BillingCycle.MONTHLY) {
      return now + 30 * 24 * 60 * 60 * 1000; // 30 days
    } else {
      return now + 365 * 24 * 60 * 60 * 1000; // 365 days
    }
  }

  /**
   * Get all tenants
   */
  getAll(): Tenant[] {
    return Array.from(this.tenants.values());
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Usage tracker
 */
class UsageTracker {
  private metrics: Map<string, UsageMetrics>;

  constructor() {
    this.metrics = new Map();
  }

  /**
   * Track API call
   */
  trackApiCall(tenantId: string): void {
    const period = this.getCurrentPeriod();
    const key = `${tenantId}:${period}`;

    let metrics = this.metrics.get(key);
    if (!metrics) {
      metrics = {
        tenantId,
        period,
        apiCalls: 0,
        storage: 0,
        bandwidth: 0,
        activeUsers: 0,
        timestamp: Date.now()
      };
      this.metrics.set(key, metrics);
    }

    metrics.apiCalls++;
  }

  /**
   * Track storage usage
   */
  trackStorage(tenantId: string, bytes: number): void {
    const period = this.getCurrentPeriod();
    const key = `${tenantId}:${period}`;

    const metrics = this.getOrCreateMetrics(key, tenantId, period);
    metrics.storage += bytes;
  }

  /**
   * Track bandwidth usage
   */
  trackBandwidth(tenantId: string, bytes: number): void {
    const period = this.getCurrentPeriod();
    const key = `${tenantId}:${period}`;

    const metrics = this.getOrCreateMetrics(key, tenantId, period);
    metrics.bandwidth += bytes;
  }

  /**
   * Get usage for tenant
   */
  getUsage(tenantId: string, period?: string): UsageMetrics | undefined {
    period = period || this.getCurrentPeriod();
    return this.metrics.get(`${tenantId}:${period}`);
  }

  /**
   * Check if tenant has exceeded limits
   */
  checkLimits(tenantId: string, limits: TenantLimits): {
    exceeded: boolean;
    violations: string[];
  } {
    const usage = this.getUsage(tenantId);
    if (!usage) {
      return { exceeded: false, violations: [] };
    }

    const violations: string[] = [];

    if (limits.maxApiCalls !== -1 && usage.apiCalls > limits.maxApiCalls) {
      violations.push('API call limit exceeded');
    }

    if (limits.maxStorage !== -1 && usage.storage > limits.maxStorage) {
      violations.push('Storage limit exceeded');
    }

    if (limits.maxBandwidth !== -1 && usage.bandwidth > limits.maxBandwidth) {
      violations.push('Bandwidth limit exceeded');
    }

    return {
      exceeded: violations.length > 0,
      violations
    };
  }

  /**
   * Get current period (YYYY-MM)
   */
  private getCurrentPeriod(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  /**
   * Get or create metrics
   */
  private getOrCreateMetrics(key: string, tenantId: string, period: string): UsageMetrics {
    let metrics = this.metrics.get(key);
    if (!metrics) {
      metrics = {
        tenantId,
        period,
        apiCalls: 0,
        storage: 0,
        bandwidth: 0,
        activeUsers: 0,
        timestamp: Date.now()
      };
      this.metrics.set(key, metrics);
    }
    return metrics;
  }
}

/**
 * Billing manager
 */
class BillingManager {
  private events: Map<string, BillingEvent[]>;
  private invoices: Map<string, Invoice[]>;

  constructor() {
    this.events = new Map();
    this.invoices = new Map();
  }

  /**
   * Create subscription
   */
  createSubscription(tenant: Tenant): void {
    const event: BillingEvent = {
      id: this.generateId(),
      tenantId: tenant.id,
      type: 'subscription_created',
      amount: this.calculateAmount(tenant),
      currency: 'USD',
      timestamp: Date.now(),
      metadata: {
        plan: tenant.plan,
        billingCycle: tenant.billingCycle
      }
    };

    this.addEvent(event);
    this.generateInvoice(tenant);
  }

  /**
   * Update subscription
   */
  updateSubscription(tenant: Tenant, oldPlan: SubscriptionPlan): void {
    const event: BillingEvent = {
      id: this.generateId(),
      tenantId: tenant.id,
      type: 'subscription_updated',
      amount: this.calculateProration(tenant, oldPlan),
      currency: 'USD',
      timestamp: Date.now(),
      metadata: {
        oldPlan,
        newPlan: tenant.plan,
        billingCycle: tenant.billingCycle
      }
    };

    this.addEvent(event);
  }

  /**
   * Process payment
   */
  processPayment(tenantId: string, amount: number): boolean {
    // Simulate payment processing
    const success = Math.random() > 0.1; // 90% success rate

    const event: BillingEvent = {
      id: this.generateId(),
      tenantId,
      type: success ? 'payment_succeeded' : 'payment_failed',
      amount,
      currency: 'USD',
      timestamp: Date.now()
    };

    this.addEvent(event);

    if (success) {
      this.markInvoiceAsPaid(tenantId);
    }

    return success;
  }

  /**
   * Generate invoice
   */
  generateInvoice(tenant: Tenant): Invoice {
    const amount = this.calculateAmount(tenant);

    const invoice: Invoice = {
      id: this.generateId(),
      tenantId: tenant.id,
      amount,
      currency: 'USD',
      status: 'open',
      dueDate: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      items: [
        {
          description: `${tenant.plan} Plan - ${tenant.billingCycle}`,
          quantity: 1,
          unitPrice: amount,
          amount
        }
      ],
      createdAt: Date.now()
    };

    if (!this.invoices.has(tenant.id)) {
      this.invoices.set(tenant.id, []);
    }

    this.invoices.get(tenant.id)!.push(invoice);

    return invoice;
  }

  /**
   * Get invoices for tenant
   */
  getInvoices(tenantId: string): Invoice[] {
    return this.invoices.get(tenantId) || [];
  }

  /**
   * Get billing events for tenant
   */
  getEvents(tenantId: string): BillingEvent[] {
    return this.events.get(tenantId) || [];
  }

  /**
   * Calculate subscription amount
   */
  private calculateAmount(tenant: Tenant): number {
    const pricing = PLAN_PRICING[tenant.plan];
    return tenant.billingCycle === BillingCycle.MONTHLY
      ? pricing.monthly
      : pricing.yearly;
  }

  /**
   * Calculate proration for plan change
   */
  private calculateProration(tenant: Tenant, oldPlan: SubscriptionPlan): number {
    const newAmount = this.calculateAmount(tenant);
    const oldAmount = PLAN_PRICING[oldPlan][tenant.billingCycle];

    // Simplified proration calculation
    return newAmount - oldAmount;
  }

  /**
   * Mark invoice as paid
   */
  private markInvoiceAsPaid(tenantId: string): void {
    const invoices = this.invoices.get(tenantId);
    if (!invoices) return;

    const openInvoice = invoices.find(inv => inv.status === 'open');
    if (openInvoice) {
      openInvoice.status = 'paid';
      openInvoice.paidAt = Date.now();
    }
  }

  /**
   * Add billing event
   */
  private addEvent(event: BillingEvent): void {
    if (!this.events.has(event.tenantId)) {
      this.events.set(event.tenantId, []);
    }

    this.events.get(event.tenantId)!.push(event);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * User manager
 */
class UserManager {
  private users: Map<string, User>;
  private usersByTenant: Map<string, Set<string>>;

  constructor() {
    this.users = new Map();
    this.usersByTenant = new Map();
  }

  /**
   * Create user
   */
  create(tenantId: string, data: { email: string; name: string; role: User['role'] }): User {
    const user: User = {
      id: this.generateId(),
      tenantId,
      email: data.email,
      name: data.name,
      role: data.role,
      createdAt: Date.now()
    };

    this.users.set(user.id, user);

    if (!this.usersByTenant.has(tenantId)) {
      this.usersByTenant.set(tenantId, new Set());
    }
    this.usersByTenant.get(tenantId)!.add(user.id);

    return user;
  }

  /**
   * Get users for tenant
   */
  getByTenant(tenantId: string): User[] {
    const userIds = this.usersByTenant.get(tenantId);
    if (!userIds) return [];

    return Array.from(userIds)
      .map(id => this.users.get(id)!)
      .filter(user => user !== undefined);
  }

  /**
   * Get user count for tenant
   */
  countByTenant(tenantId: string): number {
    return this.usersByTenant.get(tenantId)?.size || 0;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Initialize managers
const tenantManager = new TenantManager();
const usageTracker = new UsageTracker();
const billingManager = new BillingManager();
const userManager = new UserManager();

/**
 * Tenant context middleware
 */
function getTenantFromRequest(request: Request): Tenant | null {
  const url = new URL(request.url);

  // Try to get tenant from subdomain
  const host = request.headers.get('host') || '';
  const subdomain = host.split('.')[0];

  if (subdomain && subdomain !== 'localhost' && subdomain !== 'www') {
    return tenantManager.getBySlug(subdomain) || null;
  }

  // Try to get tenant from custom domain
  const tenant = tenantManager.getByDomain(host);
  if (tenant) return tenant;

  // Try to get tenant from header
  const tenantHeader = request.headers.get('x-tenant-id');
  if (tenantHeader) {
    return tenantManager.get(tenantHeader) || null;
  }

  return null;
}

/**
 * HTTP request handler
 */
async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);

  // Admin API endpoints
  if (url.pathname.startsWith('/admin')) {
    return handleAdminRequest(request);
  }

  // Tenant API endpoints
  const tenant = getTenantFromRequest(request);

  if (!tenant) {
    return new Response(JSON.stringify({ error: 'Tenant not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Check tenant status
  if (tenant.status !== TenantStatus.ACTIVE && tenant.status !== TenantStatus.TRIAL) {
    return new Response(JSON.stringify({ error: 'Tenant suspended' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Track API call
  usageTracker.trackApiCall(tenant.id);

  // Check usage limits
  const limitCheck = usageTracker.checkLimits(tenant.id, tenant.limits);
  if (limitCheck.exceeded) {
    return new Response(JSON.stringify({
      error: 'Usage limits exceeded',
      violations: limitCheck.violations
    }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return handleTenantRequest(request, tenant);
}

/**
 * Handle admin requests
 */
async function handleAdminRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);

  // List all tenants
  if (url.pathname === '/admin/tenants' && request.method === 'GET') {
    const tenants = tenantManager.getAll();
    return new Response(JSON.stringify(tenants), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Create tenant
  if (url.pathname === '/admin/tenants' && request.method === 'POST') {
    const data = await request.json();
    const tenant = tenantManager.create(data);
    billingManager.createSubscription(tenant);

    return new Response(JSON.stringify(tenant), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Get tenant
  if (url.pathname.match(/^\/admin\/tenants\/[^\/]+$/) && request.method === 'GET') {
    const tenantId = url.pathname.split('/').pop()!;
    const tenant = tenantManager.get(tenantId);

    if (!tenant) {
      return new Response(JSON.stringify({ error: 'Tenant not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(tenant), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Update tenant subscription
  if (url.pathname.match(/^\/admin\/tenants\/[^\/]+\/subscription$/) && request.method === 'PUT') {
    const tenantId = url.pathname.split('/')[3];
    const data = await request.json();

    const tenant = tenantManager.get(tenantId);
    if (!tenant) {
      return new Response(JSON.stringify({ error: 'Tenant not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const oldPlan = tenant.plan;
    tenantManager.changePlan(tenantId, data.plan, data.billingCycle);
    billingManager.updateSubscription(tenant, oldPlan);

    return new Response(JSON.stringify(tenant), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Get tenant usage
  if (url.pathname.match(/^\/admin\/tenants\/[^\/]+\/usage$/) && request.method === 'GET') {
    const tenantId = url.pathname.split('/')[3];
    const usage = usageTracker.getUsage(tenantId);

    return new Response(JSON.stringify(usage || {}), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Get tenant invoices
  if (url.pathname.match(/^\/admin\/tenants\/[^\/]+\/invoices$/) && request.method === 'GET') {
    const tenantId = url.pathname.split('/')[3];
    const invoices = billingManager.getInvoices(tenantId);

    return new Response(JSON.stringify(invoices), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response('Not found', { status: 404 });
}

/**
 * Handle tenant-specific requests
 */
async function handleTenantRequest(request: Request, tenant: Tenant): Promise<Response> {
  const url = new URL(request.url);

  // Get tenant info
  if (url.pathname === '/api/tenant') {
    return new Response(JSON.stringify({
      id: tenant.id,
      name: tenant.name,
      plan: tenant.plan,
      config: tenant.config
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Get tenant usage
  if (url.pathname === '/api/usage') {
    const usage = usageTracker.getUsage(tenant.id);
    return new Response(JSON.stringify({
      usage: usage || {},
      limits: tenant.limits
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Health check
  if (url.pathname === '/health') {
    return new Response(JSON.stringify({
      status: 'healthy',
      tenant: tenant.slug
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response('Not found', { status: 404 });
}

// Start server
serve({
  port: 3000,
  fetch: handleRequest
});

console.log('Multi-Tenant SaaS Backend running on http://localhost:3000');
console.log('\nAdmin endpoints:');
console.log('  GET    /admin/tenants');
console.log('  POST   /admin/tenants');
console.log('  GET    /admin/tenants/:id');
console.log('  PUT    /admin/tenants/:id/subscription');
console.log('  GET    /admin/tenants/:id/usage');
console.log('  GET    /admin/tenants/:id/invoices');
console.log('\nTenant endpoints (requires X-Tenant-Id header):');
console.log('  GET    /api/tenant');
console.log('  GET    /api/usage');
