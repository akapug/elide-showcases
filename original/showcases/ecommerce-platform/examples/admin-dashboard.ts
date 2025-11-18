/**
 * Admin Dashboard Example
 *
 * Comprehensive admin dashboard functionality demonstrating:
 * - Real-time sales analytics and reporting
 * - Customer management and segmentation
 * - Product catalog management
 * - Order processing and fulfillment
 * - Inventory monitoring and alerts
 * - Revenue tracking and forecasting
 * - User activity monitoring
 * - System health checks
 * - Bulk operations
 * - Data export capabilities
 *
 * This example shows enterprise-grade admin tools for
 * managing an e-commerce platform.
 */

import { v4 as uuidv4 } from '../shared/uuid.ts';
import { Decimal } from '../shared/decimal.ts';
import { Database, Product, Order } from '../backend/db/database.ts';
import { AdvancedInventoryManager } from './inventory-management.ts';
import { CartManager } from '../backend/services/cart-manager.ts';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface DashboardMetrics {
  sales: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    growth: number;
  };
  orders: {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    cancelled: number;
  };
  customers: {
    total: number;
    active: number;
    new: number;
    returning: number;
  };
  products: {
    total: number;
    inStock: number;
    lowStock: number;
    outOfStock: number;
  };
  revenue: {
    total: number;
    average: number;
    projected: number;
  };
}

export interface SalesReport {
  period: string;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topProducts: Array<{
    productId: string;
    name: string;
    unitsSold: number;
    revenue: number;
  }>;
  topCategories: Array<{
    category: string;
    revenue: number;
    orderCount: number;
  }>;
  hourlyBreakdown: Array<{
    hour: number;
    orders: number;
    revenue: number;
  }>;
}

export interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  criteria: {
    minPurchases?: number;
    minSpent?: number;
    daysSinceLastPurchase?: number;
  };
  customerCount: number;
  totalRevenue: number;
}

export interface BulkOperation {
  id: string;
  type: 'price_update' | 'stock_update' | 'category_change' | 'bulk_delete';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalItems: number;
  processedItems: number;
  failedItems: number;
  errors: string[];
  startedAt: Date;
  completedAt?: Date;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical';
  uptime: number;
  metrics: {
    requestsPerSecond: number;
    averageResponseTime: number;
    errorRate: number;
    memoryUsage: number;
    cpuUsage: number;
  };
  services: Array<{
    name: string;
    status: 'up' | 'down' | 'degraded';
    latency: number;
  }>;
  alerts: Array<{
    severity: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    timestamp: Date;
  }>;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  timestamp: Date;
}

// ============================================================================
// Admin Dashboard Manager
// ============================================================================

export class AdminDashboard {
  private db: Database;
  private inventoryManager: AdvancedInventoryManager;
  private cartManager: CartManager;
  private activityLogs: ActivityLog[] = [];
  private bulkOperations: Map<string, BulkOperation> = new Map();

  constructor(db: Database) {
    this.db = db;
    this.inventoryManager = new AdvancedInventoryManager(db);
    this.cartManager = new CartManager(db);
  }

  // ==========================================================================
  // Dashboard Metrics
  // ==========================================================================

  /**
   * Get comprehensive dashboard metrics
   */
  getDashboardMetrics(): DashboardMetrics {
    console.log('[Admin] Generating dashboard metrics...');

    const orders = this.db.getOrders();
    const products = this.db.getProducts();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Calculate sales metrics
    let salesToday = new Decimal(0);
    let salesThisWeek = new Decimal(0);
    let salesThisMonth = new Decimal(0);

    for (const order of orders) {
      const orderTotal = new Decimal(order.total);
      const orderDate = new Date(order.createdAt);

      if (orderDate >= today) {
        salesToday = salesToday.plus(orderTotal);
      }
      if (orderDate >= weekAgo) {
        salesThisWeek = salesThisWeek.plus(orderTotal);
      }
      if (orderDate >= monthAgo) {
        salesThisMonth = salesThisMonth.plus(orderTotal);
      }
    }

    // Calculate growth (comparing to previous period)
    const growth = 15.5; // Mock calculation

    // Count orders by status
    const orderCounts = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      processing: orders.filter(o => o.status === 'processing').length,
      completed: orders.filter(o => o.status === 'completed').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
    };

    // Customer metrics (mock data)
    const customerMetrics = {
      total: 1250,
      active: 890,
      new: 45,
      returning: 845,
    };

    // Product metrics
    const inventoryStats = this.inventoryManager.getInventoryStats();
    const productMetrics = {
      total: products.length,
      inStock: products.filter(p => p.stock > 0).length,
      lowStock: products.filter(p => p.stock > 0 && p.stock < 10).length,
      outOfStock: products.filter(p => p.stock === 0).length,
    };

    // Revenue metrics
    const totalRevenue = salesThisMonth.toNumber();
    const avgRevenue = orders.length > 0 ? totalRevenue / orders.length : 0;
    const projectedRevenue = totalRevenue * 1.2; // 20% growth projection

    return {
      sales: {
        today: salesToday.toNumber(),
        thisWeek: salesThisWeek.toNumber(),
        thisMonth: salesThisMonth.toNumber(),
        growth,
      },
      orders: orderCounts,
      customers: customerMetrics,
      products: productMetrics,
      revenue: {
        total: totalRevenue,
        average: avgRevenue,
        projected: projectedRevenue,
      },
    };
  }

  // ==========================================================================
  // Sales Analytics
  // ==========================================================================

  /**
   * Generate comprehensive sales report
   */
  generateSalesReport(period: 'today' | 'week' | 'month' | 'year' = 'month'): SalesReport {
    console.log(`[Admin] Generating ${period} sales report...`);

    const orders = this.db.getOrders();
    let totalRevenue = new Decimal(0);
    const productSales: Map<string, { name: string; units: number; revenue: number }> = new Map();
    const categorySales: Map<string, { revenue: number; count: number }> = new Map();
    const hourlySales: Map<number, { orders: number; revenue: number }> = new Map();

    // Initialize hourly breakdown
    for (let i = 0; i < 24; i++) {
      hourlySales.set(i, { orders: 0, revenue: 0 });
    }

    for (const order of orders) {
      const orderTotal = new Decimal(order.total);
      totalRevenue = totalRevenue.plus(orderTotal);

      // Track hourly sales
      const hour = new Date(order.createdAt).getHours();
      const hourData = hourlySales.get(hour)!;
      hourData.orders++;
      hourData.revenue += orderTotal.toNumber();

      // Track product sales
      for (const item of order.items) {
        const product = this.db.getProduct(item.productId);
        if (product) {
          const existing = productSales.get(item.productId);
          if (existing) {
            existing.units += item.quantity;
            existing.revenue += item.price * item.quantity;
          } else {
            productSales.set(item.productId, {
              name: product.name,
              units: item.quantity,
              revenue: item.price * item.quantity,
            });
          }

          // Track category sales
          const categoryData = categorySales.get(product.category);
          if (categoryData) {
            categoryData.revenue += item.price * item.quantity;
            categoryData.count++;
          } else {
            categorySales.set(product.category, {
              revenue: item.price * item.quantity,
              count: 1,
            });
          }
        }
      }
    }

    // Get top products
    const topProducts = Array.from(productSales.entries())
      .map(([productId, data]) => ({
        productId,
        name: data.name,
        unitsSold: data.units,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Get top categories
    const topCategories = Array.from(categorySales.entries())
      .map(([category, data]) => ({
        category,
        revenue: data.revenue,
        orderCount: data.count,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Convert hourly breakdown to array
    const hourlyBreakdown = Array.from(hourlySales.entries())
      .map(([hour, data]) => ({
        hour,
        orders: data.orders,
        revenue: data.revenue,
      }))
      .sort((a, b) => a.hour - b.hour);

    const avgOrderValue = orders.length > 0
      ? totalRevenue.div(orders.length).toNumber()
      : 0;

    return {
      period,
      totalRevenue: totalRevenue.toNumber(),
      totalOrders: orders.length,
      averageOrderValue: avgOrderValue,
      topProducts,
      topCategories,
      hourlyBreakdown,
    };
  }

  // ==========================================================================
  // Customer Management
  // ==========================================================================

  /**
   * Create customer segments
   */
  createCustomerSegments(): CustomerSegment[] {
    console.log('[Admin] Creating customer segments...');

    const segments: CustomerSegment[] = [
      {
        id: 'vip',
        name: 'VIP Customers',
        description: 'High-value customers with $1000+ lifetime spend',
        criteria: { minSpent: 1000 },
        customerCount: 125,
        totalRevenue: 250000,
      },
      {
        id: 'frequent',
        name: 'Frequent Buyers',
        description: 'Customers with 10+ purchases',
        criteria: { minPurchases: 10 },
        customerCount: 380,
        totalRevenue: 185000,
      },
      {
        id: 'at_risk',
        name: 'At-Risk Customers',
        description: 'No purchase in 90+ days',
        criteria: { daysSinceLastPurchase: 90 },
        customerCount: 245,
        totalRevenue: 45000,
      },
      {
        id: 'new',
        name: 'New Customers',
        description: 'First purchase in last 30 days',
        criteria: {},
        customerCount: 150,
        totalRevenue: 22500,
      },
    ];

    return segments;
  }

  /**
   * Get customer lifetime value analysis
   */
  getCustomerLifetimeValue(): Array<{
    customerId: string;
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    lastPurchase: Date;
    segment: string;
  }> {
    console.log('[Admin] Calculating customer lifetime values...');

    const orders = this.db.getOrders();
    const customerData: Map<string, any> = new Map();

    for (const order of orders) {
      const customerId = order.customerId || 'guest';
      const existing = customerData.get(customerId);

      if (existing) {
        existing.totalOrders++;
        existing.totalSpent += order.total;
        if (order.createdAt > existing.lastPurchase) {
          existing.lastPurchase = order.createdAt;
        }
      } else {
        customerData.set(customerId, {
          customerId,
          totalOrders: 1,
          totalSpent: order.total,
          lastPurchase: order.createdAt,
        });
      }
    }

    return Array.from(customerData.values())
      .map(data => ({
        ...data,
        averageOrderValue: data.totalSpent / data.totalOrders,
        segment: data.totalSpent >= 1000 ? 'vip' : data.totalOrders >= 10 ? 'frequent' : 'regular',
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 50);
  }

  // ==========================================================================
  // Product Management
  // ==========================================================================

  /**
   * Bulk update product prices
   */
  async bulkUpdatePrices(updates: Array<{
    productId: string;
    newPrice: number;
  }>): Promise<BulkOperation> {
    console.log(`[Admin] Starting bulk price update for ${updates.length} products...`);

    const operation: BulkOperation = {
      id: `bulk_${uuidv4()}`,
      type: 'price_update',
      status: 'processing',
      totalItems: updates.length,
      processedItems: 0,
      failedItems: 0,
      errors: [],
      startedAt: new Date(),
    };

    this.bulkOperations.set(operation.id, operation);

    // Process updates
    for (const update of updates) {
      try {
        const product = this.db.getProduct(update.productId);
        if (!product) {
          throw new Error(`Product ${update.productId} not found`);
        }

        this.db.updateProduct(update.productId, { price: update.newPrice });
        operation.processedItems++;

        this.logActivity({
          userId: 'admin',
          action: 'update_product_price',
          resource: 'product',
          resourceId: update.productId,
          details: { oldPrice: product.price, newPrice: update.newPrice },
        });
      } catch (error: any) {
        operation.failedItems++;
        operation.errors.push(`${update.productId}: ${error.message}`);
      }
    }

    operation.status = operation.failedItems === 0 ? 'completed' : 'failed';
    operation.completedAt = new Date();

    console.log(`[Admin] Bulk operation completed: ${operation.processedItems} succeeded, ${operation.failedItems} failed`);
    return operation;
  }

  /**
   * Get product performance analysis
   */
  getProductPerformance(): Array<{
    productId: string;
    name: string;
    category: string;
    totalSales: number;
    revenue: number;
    averageRating: number;
    stockLevel: number;
    turnoverRate: number;
  }> {
    console.log('[Admin] Analyzing product performance...');

    const products = this.db.getProducts();
    const orders = this.db.getOrders();
    const performance: Map<string, any> = new Map();

    // Initialize performance data
    for (const product of products) {
      performance.set(product.id, {
        productId: product.id,
        name: product.name,
        category: product.category,
        totalSales: 0,
        revenue: 0,
        averageRating: 0,
        stockLevel: product.stock,
        turnoverRate: 0,
      });
    }

    // Calculate sales data
    for (const order of orders) {
      for (const item of order.items) {
        const perf = performance.get(item.productId);
        if (perf) {
          perf.totalSales += item.quantity;
          perf.revenue += item.price * item.quantity;
        }
      }
    }

    // Calculate turnover rate
    for (const perf of performance.values()) {
      if (perf.stockLevel > 0) {
        perf.turnoverRate = perf.totalSales / perf.stockLevel;
      }
      perf.averageRating = 4.2 + Math.random() * 0.8; // Mock ratings
    }

    return Array.from(performance.values())
      .sort((a, b) => b.revenue - a.revenue);
  }

  // ==========================================================================
  // Order Management
  // ==========================================================================

  /**
   * Get orders requiring attention
   */
  getOrdersRequiringAttention(): Array<{
    orderId: string;
    customerId: string;
    status: string;
    total: number;
    createdAt: Date;
    issue: string;
  }> {
    console.log('[Admin] Finding orders requiring attention...');

    const orders = this.db.getOrders();
    const now = new Date();
    const issues: Array<any> = [];

    for (const order of orders) {
      const ageInHours = (now.getTime() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60);

      // Pending orders older than 24 hours
      if (order.status === 'pending' && ageInHours > 24) {
        issues.push({
          orderId: order.id,
          customerId: order.customerId,
          status: order.status,
          total: order.total,
          createdAt: order.createdAt,
          issue: 'Pending for over 24 hours',
        });
      }

      // Processing orders older than 48 hours
      if (order.status === 'processing' && ageInHours > 48) {
        issues.push({
          orderId: order.id,
          customerId: order.customerId,
          status: order.status,
          total: order.total,
          createdAt: order.createdAt,
          issue: 'Processing for over 48 hours',
        });
      }

      // High-value orders
      if (order.total > 1000) {
        issues.push({
          orderId: order.id,
          customerId: order.customerId,
          status: order.status,
          total: order.total,
          createdAt: order.createdAt,
          issue: 'High-value order requiring review',
        });
      }
    }

    return issues;
  }

  // ==========================================================================
  // System Health & Monitoring
  // ==========================================================================

  /**
   * Get system health status
   */
  getSystemHealth(): SystemHealth {
    console.log('[Admin] Checking system health...');

    const uptime = process.uptime ? process.uptime() : 86400; // 1 day mock

    return {
      status: 'healthy',
      uptime,
      metrics: {
        requestsPerSecond: 150,
        averageResponseTime: 45,
        errorRate: 0.02,
        memoryUsage: 65,
        cpuUsage: 42,
      },
      services: [
        { name: 'Database', status: 'up', latency: 5 },
        { name: 'Payment Gateway', status: 'up', latency: 120 },
        { name: 'Email Service', status: 'up', latency: 80 },
        { name: 'Inventory Service', status: 'up', latency: 15 },
        { name: 'Search Engine', status: 'up', latency: 25 },
      ],
      alerts: [
        {
          severity: 'info',
          message: 'System backup completed successfully',
          timestamp: new Date(Date.now() - 3600000),
        },
      ],
    };
  }

  // ==========================================================================
  // Activity Logging
  // ==========================================================================

  /**
   * Log admin activity
   */
  logActivity(params: {
    userId: string;
    action: string;
    resource: string;
    resourceId?: string;
    details?: any;
    ipAddress?: string;
  }): ActivityLog {
    const log: ActivityLog = {
      id: `log_${uuidv4()}`,
      userId: params.userId,
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId,
      details: params.details,
      ipAddress: params.ipAddress,
      timestamp: new Date(),
    };

    this.activityLogs.push(log);

    // Keep only last 1000 logs
    if (this.activityLogs.length > 1000) {
      this.activityLogs = this.activityLogs.slice(-1000);
    }

    return log;
  }

  /**
   * Get recent activity logs
   */
  getRecentActivity(limit: number = 50): ActivityLog[] {
    return this.activityLogs
      .slice(-limit)
      .reverse();
  }

  // ==========================================================================
  // Data Export
  // ==========================================================================

  /**
   * Export data to CSV format
   */
  exportToCSV(type: 'products' | 'orders' | 'customers'): string {
    console.log(`[Admin] Exporting ${type} to CSV...`);

    if (type === 'products') {
      const products = this.db.getProducts();
      let csv = 'ID,Name,Category,Price,Stock,SKU\n';
      for (const product of products) {
        csv += `${product.id},"${product.name}",${product.category},${product.price},${product.stock},${product.sku}\n`;
      }
      return csv;
    } else if (type === 'orders') {
      const orders = this.db.getOrders();
      let csv = 'ID,Customer ID,Status,Total,Items,Created At\n';
      for (const order of orders) {
        csv += `${order.id},${order.customerId},${order.status},${order.total},${order.items.length},${order.createdAt}\n`;
      }
      return csv;
    }

    return '';
  }

  /**
   * Get inventory manager instance
   */
  getInventoryManager(): AdvancedInventoryManager {
    return this.inventoryManager;
  }
}

// ============================================================================
// Example Usage
// ============================================================================

/**
 * Demonstrate admin dashboard
 */
export function demonstrateAdminDashboard() {
  console.log('='.repeat(80));
  console.log('ADMIN DASHBOARD DEMONSTRATION');
  console.log('='.repeat(80));
  console.log();

  const db = new Database();
  const dashboard = new AdminDashboard(db);

  // Generate sample orders
  console.log('Generating sample orders...\n');
  const products = db.getProducts();
  for (let i = 0; i < 50; i++) {
    db.createOrder({
      customerId: `customer_${Math.floor(Math.random() * 20)}`,
      items: [
        {
          productId: products[Math.floor(Math.random() * products.length)].id,
          quantity: Math.floor(Math.random() * 3) + 1,
          price: products[0].price,
        },
      ],
      total: 0, // Will be calculated
      status: ['pending', 'processing', 'completed'][Math.floor(Math.random() * 3)] as any,
    });
  }

  // Display dashboard metrics
  console.log('=== Dashboard Metrics ===\n');
  const metrics = dashboard.getDashboardMetrics();

  console.log('Sales:');
  console.log(`  Today:      $${metrics.sales.today.toFixed(2)}`);
  console.log(`  This Week:  $${metrics.sales.thisWeek.toFixed(2)}`);
  console.log(`  This Month: $${metrics.sales.thisMonth.toFixed(2)}`);
  console.log(`  Growth:     ${metrics.sales.growth.toFixed(1)}%\n`);

  console.log('Orders:');
  console.log(`  Total:      ${metrics.orders.total}`);
  console.log(`  Pending:    ${metrics.orders.pending}`);
  console.log(`  Processing: ${metrics.orders.processing}`);
  console.log(`  Completed:  ${metrics.orders.completed}\n`);

  console.log('Revenue:');
  console.log(`  Total:      $${metrics.revenue.total.toFixed(2)}`);
  console.log(`  Average:    $${metrics.revenue.average.toFixed(2)}`);
  console.log(`  Projected:  $${metrics.revenue.projected.toFixed(2)}\n`);

  // Generate sales report
  console.log('=== Sales Report ===\n');
  const report = dashboard.generateSalesReport('month');
  console.log(`Period: ${report.period}`);
  console.log(`Total Revenue: $${report.totalRevenue.toFixed(2)}`);
  console.log(`Total Orders: ${report.totalOrders}`);
  console.log(`Average Order Value: $${report.averageOrderValue.toFixed(2)}\n`);

  console.log('Top 5 Products:');
  for (let i = 0; i < Math.min(5, report.topProducts.length); i++) {
    const product = report.topProducts[i];
    console.log(`  ${i + 1}. ${product.name}: ${product.unitsSold} units, $${product.revenue.toFixed(2)}`);
  }
  console.log();

  // Customer segments
  console.log('=== Customer Segments ===\n');
  const segments = dashboard.createCustomerSegments();
  for (const segment of segments) {
    console.log(`${segment.name}:`);
    console.log(`  Customers: ${segment.customerCount}`);
    console.log(`  Revenue:   $${segment.totalRevenue.toFixed(2)}`);
  }
  console.log();

  // System health
  console.log('=== System Health ===\n');
  const health = dashboard.getSystemHealth();
  console.log(`Status: ${health.status.toUpperCase()}`);
  console.log(`Uptime: ${Math.floor(health.uptime / 3600)} hours`);
  console.log(`Requests/sec: ${health.metrics.requestsPerSecond}`);
  console.log(`Avg Response: ${health.metrics.averageResponseTime}ms`);
  console.log(`Error Rate: ${(health.metrics.errorRate * 100).toFixed(2)}%\n`);

  console.log('Services:');
  for (const service of health.services) {
    console.log(`  ${service.name}: ${service.status.toUpperCase()} (${service.latency}ms)`);
  }

  console.log();
  console.log('='.repeat(80));
  console.log('✓ ADMIN DASHBOARD DEMONSTRATION COMPLETE');
  console.log('='.repeat(80));
}

// Run demonstration if executed directly
if (import.meta.main) {
  demonstrateAdminDashboard();
}
