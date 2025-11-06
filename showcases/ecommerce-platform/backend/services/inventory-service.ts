/**
 * Inventory Service
 *
 * Provides advanced inventory management features:
 * - Stock level monitoring
 * - Reorder alerts
 * - Inventory metrics and analytics
 * - Stock reservation management
 * - Inventory value calculations
 */

import { Database, InventoryRecord, Product } from '../db/database.ts';
import { Decimal } from '../../shared/decimal.ts';
import { formatBytes } from '../../shared/bytes.ts';

export interface InventoryMetrics {
  stockLevel: 'healthy' | 'low' | 'critical' | 'out-of-stock';
  daysOfStock: number;
  turnoverRate: number;
  stockValue: number;
  availabilityPercentage: number;
  needsReorder: boolean;
}

export interface InventoryAlert {
  productId: string;
  productName: string;
  alertType: 'low-stock' | 'out-of-stock' | 'overstocked';
  currentStock: number;
  recommendedAction: string;
  priority: 'high' | 'medium' | 'low';
}

export class InventoryService {
  constructor(private db: Database) {}

  /**
   * Calculate inventory metrics for a product
   */
  calculateInventoryMetrics(inventory: InventoryRecord): InventoryMetrics {
    const product = this.db.getProduct(inventory.productId);

    if (!product) {
      throw new Error('Product not found');
    }

    // Determine stock level
    let stockLevel: InventoryMetrics['stockLevel'];
    if (inventory.available === 0) {
      stockLevel = 'out-of-stock';
    } else if (inventory.available <= inventory.reorderLevel) {
      stockLevel = 'critical';
    } else if (inventory.available <= inventory.reorderLevel * 2) {
      stockLevel = 'low';
    } else {
      stockLevel = 'healthy';
    }

    // Estimate days of stock (assuming average daily sales of 2 units)
    const averageDailySales = 2;
    const daysOfStock = Math.floor(inventory.available / averageDailySales);

    // Calculate turnover rate (simplified)
    const turnoverRate = inventory.stock > 0 ? inventory.reserved / inventory.stock : 0;

    // Calculate stock value using Decimal for precision
    const stockValue = new Decimal(product.price).times(inventory.stock).toNumber();

    // Calculate availability percentage
    const availabilityPercentage = inventory.stock > 0
      ? (inventory.available / inventory.stock) * 100
      : 0;

    // Determine if reorder is needed
    const needsReorder = inventory.available <= inventory.reorderLevel;

    return {
      stockLevel,
      daysOfStock,
      turnoverRate,
      stockValue,
      availabilityPercentage,
      needsReorder,
    };
  }

  /**
   * Get inventory alerts for all products
   */
  getInventoryAlerts(): InventoryAlert[] {
    const products = this.db.getProducts();
    const alerts: InventoryAlert[] = [];

    for (const product of products) {
      const inventory = this.db.getInventoryForProduct(product.id);
      if (!inventory) continue;

      const metrics = this.calculateInventoryMetrics(inventory);

      // Out of stock alert
      if (inventory.available === 0) {
        alerts.push({
          productId: product.id,
          productName: product.name,
          alertType: 'out-of-stock',
          currentStock: inventory.available,
          recommendedAction: `Reorder ${inventory.reorderQuantity} units immediately`,
          priority: 'high',
        });
      }
      // Low stock alert
      else if (metrics.needsReorder) {
        alerts.push({
          productId: product.id,
          productName: product.name,
          alertType: 'low-stock',
          currentStock: inventory.available,
          recommendedAction: `Reorder ${inventory.reorderQuantity} units soon`,
          priority: metrics.stockLevel === 'critical' ? 'high' : 'medium',
        });
      }
      // Overstocked alert (more than 3x reorder quantity)
      else if (inventory.available > inventory.reorderQuantity * 3) {
        alerts.push({
          productId: product.id,
          productName: product.name,
          alertType: 'overstocked',
          currentStock: inventory.available,
          recommendedAction: 'Consider promotional pricing to reduce stock',
          priority: 'low',
        });
      }
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    alerts.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return alerts;
  }

  /**
   * Calculate total inventory value
   */
  calculateTotalInventoryValue(): {
    totalValue: number;
    totalUnits: number;
    averageValuePerUnit: number;
    byCategory: Record<string, number>;
  } {
    const products = this.db.getProducts();
    let totalValue = new Decimal(0);
    let totalUnits = 0;
    const byCategory: Record<string, Decimal> = {};

    for (const product of products) {
      const productValue = new Decimal(product.price).times(product.stock);
      totalValue = totalValue.plus(productValue);
      totalUnits += product.stock;

      // Track by category
      if (!byCategory[product.category]) {
        byCategory[product.category] = new Decimal(0);
      }
      byCategory[product.category] = byCategory[product.category].plus(productValue);
    }

    const averageValuePerUnit = totalUnits > 0
      ? totalValue.dividedBy(totalUnits).toNumber()
      : 0;

    // Convert category values to numbers
    const byCategoryNumbers: Record<string, number> = {};
    for (const [category, value] of Object.entries(byCategory)) {
      byCategoryNumbers[category] = value.toNumber();
    }

    return {
      totalValue: totalValue.toNumber(),
      totalUnits,
      averageValuePerUnit,
      byCategory: byCategoryNumbers,
    };
  }

  /**
   * Forecast stock needs based on current trends
   */
  forecastStockNeeds(productId: string, days: number = 30): {
    productId: string;
    currentStock: number;
    forecastedSales: number;
    forecastedStockLevel: number;
    reorderRecommendation: boolean;
    recommendedOrderQuantity: number;
  } {
    const product = this.db.getProduct(productId);
    const inventory = this.db.getInventoryForProduct(productId);

    if (!product || !inventory) {
      throw new Error('Product or inventory not found');
    }

    // Simplified forecast (assuming 2 units per day average)
    const averageDailySales = 2;
    const forecastedSales = averageDailySales * days;
    const forecastedStockLevel = Math.max(0, inventory.available - forecastedSales);

    const reorderRecommendation = forecastedStockLevel <= inventory.reorderLevel;
    const recommendedOrderQuantity = reorderRecommendation
      ? Math.max(inventory.reorderQuantity, forecastedSales - inventory.available)
      : 0;

    return {
      productId,
      currentStock: inventory.available,
      forecastedSales,
      forecastedStockLevel,
      reorderRecommendation,
      recommendedOrderQuantity,
    };
  }

  /**
   * Get inventory health report
   */
  getInventoryHealthReport(): {
    overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
    totalProducts: number;
    healthyProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    overstockedProducts: number;
    totalValue: number;
    alerts: InventoryAlert[];
  } {
    const products = this.db.getProducts();
    const alerts = this.getInventoryAlerts();
    const valueData = this.calculateTotalInventoryValue();

    let healthyProducts = 0;
    let lowStockProducts = 0;
    let outOfStockProducts = 0;
    let overstockedProducts = 0;

    for (const product of products) {
      const inventory = this.db.getInventoryForProduct(product.id);
      if (!inventory) continue;

      const metrics = this.calculateInventoryMetrics(inventory);

      switch (metrics.stockLevel) {
        case 'healthy':
          healthyProducts++;
          break;
        case 'low':
          lowStockProducts++;
          break;
        case 'critical':
          lowStockProducts++;
          break;
        case 'out-of-stock':
          outOfStockProducts++;
          break;
      }

      if (inventory.available > inventory.reorderQuantity * 3) {
        overstockedProducts++;
      }
    }

    // Calculate overall health
    const healthPercentage = (healthyProducts / products.length) * 100;
    let overallHealth: 'excellent' | 'good' | 'fair' | 'poor';

    if (healthPercentage >= 80) {
      overallHealth = 'excellent';
    } else if (healthPercentage >= 60) {
      overallHealth = 'good';
    } else if (healthPercentage >= 40) {
      overallHealth = 'fair';
    } else {
      overallHealth = 'poor';
    }

    return {
      overallHealth,
      totalProducts: products.length,
      healthyProducts,
      lowStockProducts,
      outOfStockProducts,
      overstockedProducts,
      totalValue: valueData.totalValue,
      alerts,
    };
  }

  /**
   * Generate reorder report
   */
  generateReorderReport(): {
    itemsNeedingReorder: number;
    totalReorderCost: number;
    urgentItems: number;
    items: Array<{
      productId: string;
      productName: string;
      currentStock: number;
      reorderLevel: number;
      recommendedQuantity: number;
      estimatedCost: number;
      priority: 'urgent' | 'normal';
    }>;
  } {
    const lowStockProducts = this.db.getLowStockProducts();
    let totalReorderCost = new Decimal(0);
    let urgentItems = 0;

    const items = lowStockProducts.map(product => {
      const inventory = this.db.getInventoryForProduct(product.id);
      if (!inventory) {
        throw new Error('Inventory not found');
      }

      const recommendedQuantity = inventory.reorderQuantity;
      const estimatedCost = new Decimal(product.price).times(recommendedQuantity).toNumber();
      totalReorderCost = totalReorderCost.plus(estimatedCost);

      const priority = inventory.available === 0 ? 'urgent' : 'normal';
      if (priority === 'urgent') urgentItems++;

      return {
        productId: product.id,
        productName: product.name,
        currentStock: inventory.available,
        reorderLevel: inventory.reorderLevel,
        recommendedQuantity,
        estimatedCost,
        priority,
      };
    });

    // Sort by priority then by name
    items.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority === 'urgent' ? -1 : 1;
      }
      return a.productName.localeCompare(b.productName);
    });

    return {
      itemsNeedingReorder: items.length,
      totalReorderCost: totalReorderCost.toNumber(),
      urgentItems,
      items,
    };
  }
}
