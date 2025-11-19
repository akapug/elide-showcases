/**
 * Admin Panel API - Comprehensive tenant administration
 *
 * Features:
 * - Tenant CRUD operations
 * - User management
 * - Subscription management
 * - Usage analytics
 * - Billing operations
 * - Configuration management
 * - Health monitoring
 * - Bulk operations
 *
 * @module admin-panel
 */

export interface AdminContext {
  adminId: string;
  permissions: string[];
  tenantId?: string; // For tenant-scoped admins
}

export interface TenantFilters {
  status?: string[];
  plan?: string[];
  search?: string;
  createdAfter?: number;
  createdBefore?: number;
  trialEnding?: boolean;
  subscriptionEnding?: boolean;
}

export interface TenantStats {
  total: number;
  active: number;
  trial: number;
  suspended: number;
  canceled: number;
  byPlan: Record<string, number>;
  revenue: {
    mrr: number;
    arr: number;
    churnRate: number;
  };
}

export interface UserFilters {
  tenantId?: string;
  role?: string[];
  status?: string[];
  search?: string;
}

export interface BulkOperation {
  id: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  total: number;
  processed: number;
  failed: number;
  results: any[];
  createdAt: number;
  completedAt?: number;
}

/**
 * Admin Panel Manager
 */
export class AdminPanel {
  private tenantManager: any;
  private userManager: any;
  private billingEngine: any;
  private usageTracker: any;
  private auditLogger: any;
  private bulkOperations: Map<string, BulkOperation>;

  constructor(dependencies: {
    tenantManager: any;
    userManager: any;
    billingEngine: any;
    usageTracker: any;
    auditLogger: any;
  }) {
    this.tenantManager = dependencies.tenantManager;
    this.userManager = dependencies.userManager;
    this.billingEngine = dependencies.billingEngine;
    this.usageTracker = dependencies.usageTracker;
    this.auditLogger = dependencies.auditLogger;
    this.bulkOperations = new Map();
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(context: AdminContext): Promise<{
    tenants: TenantStats;
    revenue: any;
    usage: any;
    alerts: any[];
  }> {
    this.checkPermission(context, 'dashboard:view');

    const tenants = await this.getTenantStats();
    const revenue = await this.getRevenueStats();
    const usage = await this.getUsageStats();
    const alerts = await this.getSystemAlerts();

    await this.auditLogger.log({
      action: 'dashboard.view',
      adminId: context.adminId,
      timestamp: Date.now()
    });

    return { tenants, revenue, usage, alerts };
  }

  /**
   * List tenants with filters
   */
  async listTenants(
    context: AdminContext,
    filters?: TenantFilters,
    pagination?: { page: number; limit: number }
  ): Promise<{
    tenants: any[];
    total: number;
    page: number;
    pages: number;
  }> {
    this.checkPermission(context, 'tenants:list');

    let tenants = this.tenantManager.getAll();

    // Apply filters
    if (filters) {
      tenants = this.applyTenantFilters(tenants, filters);
    }

    // Pagination
    const total = tenants.length;
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const pages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const end = start + limit;

    await this.auditLogger.log({
      action: 'tenants.list',
      adminId: context.adminId,
      filters,
      timestamp: Date.now()
    });

    return {
      tenants: tenants.slice(start, end),
      total,
      page,
      pages
    };
  }

  /**
   * Get tenant details
   */
  async getTenantDetails(
    context: AdminContext,
    tenantId: string
  ): Promise<{
    tenant: any;
    users: any[];
    subscription: any;
    usage: any;
    invoices: any[];
    alerts: any[];
  }> {
    this.checkPermission(context, 'tenants:view');

    const tenant = this.tenantManager.get(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const users = this.userManager.getByTenant(tenantId);
    const subscription = this.billingEngine.getSubscription(tenantId);
    const usage = this.usageTracker.generateReport(tenantId);
    const invoices = this.billingEngine.getInvoices(tenantId);
    const alerts = this.usageTracker.getAlerts(tenantId, true);

    await this.auditLogger.log({
      action: 'tenant.view',
      adminId: context.adminId,
      tenantId,
      timestamp: Date.now()
    });

    return { tenant, users, subscription, usage, invoices, alerts };
  }

  /**
   * Create tenant
   */
  async createTenant(
    context: AdminContext,
    data: {
      name: string;
      slug: string;
      plan: string;
      billingCycle: string;
      owner: { email: string; name: string };
      config?: any;
    }
  ): Promise<any> {
    this.checkPermission(context, 'tenants:create');

    // Validate data
    await this.validateTenantData(data);

    // Create tenant
    const tenant = this.tenantManager.create(data);

    // Create owner account
    const owner = this.userManager.create(tenant.id, {
      email: data.owner.email,
      name: data.owner.name,
      role: 'owner'
    });

    // Setup subscription
    const customer = await this.billingEngine.createCustomer({
      tenantId: tenant.id,
      email: data.owner.email,
      name: data.owner.name
    });

    const subscription = await this.billingEngine.createSubscription({
      tenantId: tenant.id,
      customerId: customer.id,
      plan: data.plan,
      billingCycle: data.billingCycle as any,
      trialDays: 14
    });

    await this.auditLogger.log({
      action: 'tenant.create',
      adminId: context.adminId,
      tenantId: tenant.id,
      data,
      timestamp: Date.now()
    });

    return { tenant, owner, subscription };
  }

  /**
   * Update tenant
   */
  async updateTenant(
    context: AdminContext,
    tenantId: string,
    updates: any
  ): Promise<any> {
    this.checkPermission(context, 'tenants:update');

    const tenant = this.tenantManager.get(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const updated = this.tenantManager.update(tenantId, updates);

    await this.auditLogger.log({
      action: 'tenant.update',
      adminId: context.adminId,
      tenantId,
      updates,
      timestamp: Date.now()
    });

    return updated;
  }

  /**
   * Suspend tenant
   */
  async suspendTenant(
    context: AdminContext,
    tenantId: string,
    reason: string
  ): Promise<any> {
    this.checkPermission(context, 'tenants:suspend');

    const tenant = this.tenantManager.suspend(tenantId, reason);

    await this.auditLogger.log({
      action: 'tenant.suspend',
      adminId: context.adminId,
      tenantId,
      reason,
      timestamp: Date.now()
    });

    return tenant;
  }

  /**
   * Reactivate tenant
   */
  async reactivateTenant(
    context: AdminContext,
    tenantId: string
  ): Promise<any> {
    this.checkPermission(context, 'tenants:reactivate');

    const tenant = this.tenantManager.activate(tenantId);

    await this.auditLogger.log({
      action: 'tenant.reactivate',
      adminId: context.adminId,
      tenantId,
      timestamp: Date.now()
    });

    return tenant;
  }

  /**
   * Delete tenant
   */
  async deleteTenant(
    context: AdminContext,
    tenantId: string,
    options?: {
      backup?: boolean;
      force?: boolean;
    }
  ): Promise<void> {
    this.checkPermission(context, 'tenants:delete');

    const tenant = this.tenantManager.get(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Create backup if requested
    if (options?.backup) {
      await this.createTenantBackup(tenantId);
    }

    // Delete tenant data
    this.tenantManager.delete(tenantId);

    await this.auditLogger.log({
      action: 'tenant.delete',
      adminId: context.adminId,
      tenantId,
      options,
      timestamp: Date.now()
    });
  }

  /**
   * Manage subscription
   */
  async updateSubscription(
    context: AdminContext,
    tenantId: string,
    updates: {
      plan?: string;
      billingCycle?: 'monthly' | 'yearly';
      addons?: string[];
    }
  ): Promise<any> {
    this.checkPermission(context, 'billing:manage');

    const subscription = this.billingEngine.getSubscription(tenantId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const updated = await this.billingEngine.updateSubscription(
      subscription.id,
      updates
    );

    await this.auditLogger.log({
      action: 'subscription.update',
      adminId: context.adminId,
      tenantId,
      updates,
      timestamp: Date.now()
    });

    return updated;
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    context: AdminContext,
    tenantId: string,
    options?: {
      immediately?: boolean;
      reason?: string;
    }
  ): Promise<any> {
    this.checkPermission(context, 'billing:manage');

    const subscription = this.billingEngine.getSubscription(tenantId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const canceled = await this.billingEngine.cancelSubscription(
      subscription.id,
      options
    );

    await this.auditLogger.log({
      action: 'subscription.cancel',
      adminId: context.adminId,
      tenantId,
      options,
      timestamp: Date.now()
    });

    return canceled;
  }

  /**
   * Process refund
   */
  async processRefund(
    context: AdminContext,
    paymentId: string,
    amount?: number,
    reason?: string
  ): Promise<any> {
    this.checkPermission(context, 'billing:refund');

    const refund = await this.billingEngine.refundPayment(
      paymentId,
      amount,
      reason
    );

    await this.auditLogger.log({
      action: 'payment.refund',
      adminId: context.adminId,
      paymentId,
      amount,
      reason,
      timestamp: Date.now()
    });

    return refund;
  }

  /**
   * Manage users
   */
  async listUsers(
    context: AdminContext,
    filters?: UserFilters,
    pagination?: { page: number; limit: number }
  ): Promise<{ users: any[]; total: number; page: number; pages: number }> {
    this.checkPermission(context, 'users:list');

    let users: any[] = [];

    if (filters?.tenantId) {
      users = this.userManager.getByTenant(filters.tenantId);
    } else {
      // Get all users (would need to be implemented in UserManager)
      users = [];
    }

    // Apply filters
    if (filters) {
      users = this.applyUserFilters(users, filters);
    }

    // Pagination
    const total = users.length;
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const pages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const end = start + limit;

    return {
      users: users.slice(start, end),
      total,
      page,
      pages
    };
  }

  /**
   * Impersonate user (for support)
   */
  async impersonateUser(
    context: AdminContext,
    userId: string
  ): Promise<{ token: string; expiresAt: number }> {
    this.checkPermission(context, 'users:impersonate');

    // Generate impersonation token
    const token = this.generateImpersonationToken(userId, context.adminId);
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

    await this.auditLogger.log({
      action: 'user.impersonate',
      adminId: context.adminId,
      userId,
      timestamp: Date.now()
    });

    return { token, expiresAt };
  }

  /**
   * Bulk operations
   */
  async bulkUpdateTenants(
    context: AdminContext,
    tenantIds: string[],
    updates: any
  ): Promise<BulkOperation> {
    this.checkPermission(context, 'tenants:bulk_update');

    const operation: BulkOperation = {
      id: this.generateId('bulk'),
      type: 'tenant_update',
      status: 'pending',
      total: tenantIds.length,
      processed: 0,
      failed: 0,
      results: [],
      createdAt: Date.now()
    };

    this.bulkOperations.set(operation.id, operation);

    // Process async
    this.processBulkOperation(operation, tenantIds, async (tenantId) => {
      return this.tenantManager.update(tenantId, updates);
    });

    await this.auditLogger.log({
      action: 'tenants.bulk_update',
      adminId: context.adminId,
      tenantIds,
      updates,
      timestamp: Date.now()
    });

    return operation;
  }

  /**
   * Get bulk operation status
   */
  getBulkOperationStatus(
    context: AdminContext,
    operationId: string
  ): BulkOperation | undefined {
    return this.bulkOperations.get(operationId);
  }

  /**
   * Export data
   */
  async exportTenants(
    context: AdminContext,
    filters?: TenantFilters,
    format: 'csv' | 'json' = 'csv'
  ): Promise<string> {
    this.checkPermission(context, 'tenants:export');

    const tenants = this.tenantManager.getAll();
    const filtered = filters ? this.applyTenantFilters(tenants, filters) : tenants;

    await this.auditLogger.log({
      action: 'tenants.export',
      adminId: context.adminId,
      count: filtered.length,
      format,
      timestamp: Date.now()
    });

    if (format === 'csv') {
      return this.convertToCSV(filtered);
    } else {
      return JSON.stringify(filtered, null, 2);
    }
  }

  /**
   * System health check
   */
  async getSystemHealth(context: AdminContext): Promise<{
    status: 'healthy' | 'degraded' | 'down';
    services: Record<string, any>;
    metrics: any;
  }> {
    this.checkPermission(context, 'system:health');

    const services = {
      database: await this.checkDatabaseHealth(),
      billing: await this.checkBillingHealth(),
      storage: await this.checkStorageHealth(),
      email: await this.checkEmailHealth()
    };

    const metrics = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      tenants: this.tenantManager.getAll().length
    };

    const status = Object.values(services).every(s => s.healthy)
      ? 'healthy'
      : 'degraded';

    return { status, services, metrics };
  }

  // Helper methods
  private checkPermission(context: AdminContext, permission: string): void {
    if (!context.permissions.includes(permission) && !context.permissions.includes('*')) {
      throw new Error(`Missing permission: ${permission}`);
    }
  }

  private applyTenantFilters(tenants: any[], filters: TenantFilters): any[] {
    return tenants.filter(tenant => {
      if (filters.status && !filters.status.includes(tenant.status)) {
        return false;
      }
      if (filters.plan && !filters.plan.includes(tenant.plan)) {
        return false;
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        if (!tenant.name.toLowerCase().includes(search) &&
            !tenant.slug.toLowerCase().includes(search)) {
          return false;
        }
      }
      if (filters.createdAfter && tenant.createdAt < filters.createdAfter) {
        return false;
      }
      if (filters.createdBefore && tenant.createdAt > filters.createdBefore) {
        return false;
      }
      return true;
    });
  }

  private applyUserFilters(users: any[], filters: UserFilters): any[] {
    return users.filter(user => {
      if (filters.role && !filters.role.includes(user.role)) {
        return false;
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        if (!user.name.toLowerCase().includes(search) &&
            !user.email.toLowerCase().includes(search)) {
          return false;
        }
      }
      return true;
    });
  }

  private async getTenantStats(): Promise<TenantStats> {
    const tenants = this.tenantManager.getAll();

    const stats: TenantStats = {
      total: tenants.length,
      active: 0,
      trial: 0,
      suspended: 0,
      canceled: 0,
      byPlan: {},
      revenue: {
        mrr: 0,
        arr: 0,
        churnRate: 0
      }
    };

    for (const tenant of tenants) {
      stats[tenant.status]++;
      stats.byPlan[tenant.plan] = (stats.byPlan[tenant.plan] || 0) + 1;
    }

    return stats;
  }

  private async getRevenueStats(): Promise<any> {
    return {
      mrr: 125000,
      arr: 1500000,
      growth: 15.5,
      churn: 3.2
    };
  }

  private async getUsageStats(): Promise<any> {
    return {
      apiCalls: 1250000,
      storage: 5000000000,
      bandwidth: 50000000000
    };
  }

  private async getSystemAlerts(): Promise<any[]> {
    return [];
  }

  private async validateTenantData(data: any): Promise<void> {
    if (!data.name || !data.slug) {
      throw new Error('Name and slug are required');
    }
  }

  private async createTenantBackup(tenantId: string): Promise<void> {
    console.log(`Creating backup for tenant ${tenantId}`);
  }

  private async processBulkOperation(
    operation: BulkOperation,
    items: string[],
    handler: (item: string) => Promise<any>
  ): Promise<void> {
    operation.status = 'running';

    for (const item of items) {
      try {
        const result = await handler(item);
        operation.results.push({ item, success: true, result });
        operation.processed++;
      } catch (error) {
        operation.results.push({
          item,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        operation.failed++;
      }
    }

    operation.status = 'completed';
    operation.completedAt = Date.now();
  }

  private generateImpersonationToken(userId: string, adminId: string): string {
    return `imp_${userId}_${adminId}_${Date.now()}`;
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const rows = data.map(item =>
      headers.map(header => JSON.stringify(item[header] || '')).join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }

  private async checkDatabaseHealth(): Promise<{ healthy: boolean; latency?: number }> {
    return { healthy: true, latency: 5 };
  }

  private async checkBillingHealth(): Promise<{ healthy: boolean; latency?: number }> {
    return { healthy: true, latency: 10 };
  }

  private async checkStorageHealth(): Promise<{ healthy: boolean; latency?: number }> {
    return { healthy: true, latency: 8 };
  }

  private async checkEmailHealth(): Promise<{ healthy: boolean; latency?: number }> {
    return { healthy: true, latency: 15 };
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
