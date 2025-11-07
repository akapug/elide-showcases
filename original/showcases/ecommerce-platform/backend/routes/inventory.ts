/**
 * Inventory Routes
 *
 * Handles inventory management:
 * - Get inventory status
 * - Get product inventory
 * - Update stock levels
 * - Get low stock alerts
 * - Reserve/release stock
 */

import { RequestContext, Response } from '../server.ts';
import { Database } from '../db/database.ts';
import { InventoryService } from '../services/inventory-service.ts';

export class InventoryRoutes {
  private inventoryService: InventoryService;

  constructor(private db: Database) {
    this.inventoryService = new InventoryService(db);
  }

  /**
   * Handle inventory routes
   */
  async handle(ctx: RequestContext): Promise<Response> {
    const { method, path } = ctx;

    // GET /api/inventory - Get inventory status
    if (path === '/api/inventory' && method === 'GET') {
      return this.getInventoryStatus();
    }

    // GET /api/inventory/low-stock - Get low stock products
    if (path === '/api/inventory/low-stock' && method === 'GET') {
      return this.getLowStockProducts();
    }

    // GET /api/inventory/:id - Get product inventory
    if (path.match(/^\/api\/inventory\/[^/]+$/) && method === 'GET') {
      const productId = path.split('/')[3];
      return this.getProductInventory(productId);
    }

    // PUT /api/inventory/:id - Update stock
    if (path.match(/^\/api\/inventory\/[^/]+$/) && method === 'PUT') {
      const productId = path.split('/')[3];
      return this.updateStock(productId, ctx);
    }

    // POST /api/inventory/:id/reserve - Reserve stock
    if (path.match(/^\/api\/inventory\/[^/]+\/reserve$/) && method === 'POST') {
      const productId = path.split('/')[3];
      return this.reserveStock(productId, ctx);
    }

    // POST /api/inventory/:id/release - Release stock
    if (path.match(/^\/api\/inventory\/[^/]+\/release$/) && method === 'POST') {
      const productId = path.split('/')[3];
      return this.releaseStock(productId, ctx);
    }

    return this.errorResponse(404, 'Inventory endpoint not found');
  }

  /**
   * Get overall inventory status
   */
  private getInventoryStatus(): Response {
    try {
      const inventory = this.db.getInventory();
      const products = this.db.getProducts();

      // Calculate statistics
      const totalProducts = products.length;
      const totalStock = inventory.reduce((sum, inv) => sum + inv.stock, 0);
      const totalAvailable = inventory.reduce((sum, inv) => sum + inv.available, 0);
      const totalReserved = inventory.reduce((sum, inv) => sum + inv.reserved, 0);
      const lowStockCount = this.db.getLowStockProducts().length;
      const outOfStockCount = products.filter(p => p.stock === 0).length;

      // Group by category
      const byCategory: Record<string, any> = {};
      for (const product of products) {
        if (!byCategory[product.category]) {
          byCategory[product.category] = {
            count: 0,
            totalStock: 0,
            totalValue: 0,
          };
        }

        byCategory[product.category].count++;
        byCategory[product.category].totalStock += product.stock;
        byCategory[product.category].totalValue += product.price * product.stock;
      }

      return this.jsonResponse(200, {
        summary: {
          totalProducts,
          totalStock,
          totalAvailable,
          totalReserved,
          lowStockCount,
          outOfStockCount,
        },
        byCategory,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return this.errorResponse(500, 'Failed to get inventory status', error);
    }
  }

  /**
   * Get low stock products
   */
  private getLowStockProducts(): Response {
    try {
      const lowStockProducts = this.db.getLowStockProducts();

      const enriched = lowStockProducts.map(product => {
        const inventory = this.db.getInventoryForProduct(product.id);
        return {
          product,
          inventory,
          needsReorder: inventory && inventory.available <= inventory.reorderLevel,
          reorderQuantity: inventory?.reorderQuantity,
        };
      });

      return this.jsonResponse(200, {
        products: enriched,
        count: enriched.length,
        alert: enriched.length > 0 ? 'Low stock alert' : 'All products adequately stocked',
      });
    } catch (error) {
      return this.errorResponse(500, 'Failed to get low stock products', error);
    }
  }

  /**
   * Get product-specific inventory
   */
  private getProductInventory(productId: string): Response {
    const product = this.db.getProduct(productId);
    if (!product) {
      return this.errorResponse(404, 'Product not found');
    }

    const inventory = this.db.getInventoryForProduct(productId);
    if (!inventory) {
      return this.errorResponse(404, 'Inventory record not found');
    }

    // Calculate additional metrics
    const metrics = this.inventoryService.calculateInventoryMetrics(inventory);

    return this.jsonResponse(200, {
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        price: product.price,
      },
      inventory,
      metrics,
    });
  }

  /**
   * Update stock levels
   */
  private updateStock(productId: string, ctx: RequestContext): Response {
    const { stock, action = 'set' } = ctx.body || {};

    // Validation
    if (stock === undefined || typeof stock !== 'number' || stock < 0) {
      return this.errorResponse(400, 'Stock must be a non-negative number');
    }

    if (!['set', 'add', 'subtract'].includes(action)) {
      return this.errorResponse(400, 'Invalid action. Use: set, add, or subtract');
    }

    try {
      const product = this.db.getProduct(productId);
      if (!product) {
        return this.errorResponse(404, 'Product not found');
      }

      let newStock: number;

      switch (action) {
        case 'set':
          newStock = stock;
          break;
        case 'add':
          newStock = product.stock + stock;
          break;
        case 'subtract':
          newStock = Math.max(0, product.stock - stock);
          break;
        default:
          newStock = stock;
      }

      const inventory = this.db.updateStock(productId, newStock);

      if (!inventory) {
        return this.errorResponse(500, 'Failed to update stock');
      }

      return this.jsonResponse(200, {
        message: 'Stock updated successfully',
        product: {
          id: product.id,
          name: product.name,
          sku: product.sku,
        },
        inventory,
        action,
        previousStock: product.stock,
        newStock,
      });
    } catch (error) {
      return this.errorResponse(500, 'Failed to update stock', error);
    }
  }

  /**
   * Reserve stock (e.g., during checkout)
   */
  private reserveStock(productId: string, ctx: RequestContext): Response {
    const { quantity } = ctx.body || {};

    if (typeof quantity !== 'number' || quantity < 1) {
      return this.errorResponse(400, 'Quantity must be a positive number');
    }

    try {
      const success = this.db.reserveStock(productId, quantity);

      if (!success) {
        return this.errorResponse(400, 'Insufficient stock to reserve');
      }

      const inventory = this.db.getInventoryForProduct(productId);

      return this.jsonResponse(200, {
        message: 'Stock reserved successfully',
        inventory,
        reserved: quantity,
      });
    } catch (error) {
      return this.errorResponse(500, 'Failed to reserve stock', error);
    }
  }

  /**
   * Release reserved stock
   */
  private releaseStock(productId: string, ctx: RequestContext): Response {
    const { quantity } = ctx.body || {};

    if (typeof quantity !== 'number' || quantity < 1) {
      return this.errorResponse(400, 'Quantity must be a positive number');
    }

    try {
      const success = this.db.releaseStock(productId, quantity);

      if (!success) {
        return this.errorResponse(400, 'Failed to release stock');
      }

      const inventory = this.db.getInventoryForProduct(productId);

      return this.jsonResponse(200, {
        message: 'Stock released successfully',
        inventory,
        released: quantity,
      });
    } catch (error) {
      return this.errorResponse(500, 'Failed to release stock', error);
    }
  }

  /**
   * Helper: Create JSON response
   */
  private jsonResponse(status: number, body: any): Response {
    return {
      status,
      headers: { 'Content-Type': 'application/json' },
      body,
    };
  }

  /**
   * Helper: Create error response
   */
  private errorResponse(status: number, message: string, details?: any): Response {
    return this.jsonResponse(status, {
      error: message,
      status,
      details,
      timestamp: new Date().toISOString(),
    });
  }
}
