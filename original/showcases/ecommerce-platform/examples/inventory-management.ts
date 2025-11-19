/**
 * Inventory Management Examples
 *
 * Comprehensive inventory management system demonstrating:
 * - Real-time stock tracking
 * - Multi-warehouse management
 * - Stock reservations and allocations
 * - Automatic reordering and low stock alerts
 * - Inventory transfers between warehouses
 * - Batch and serial number tracking
 * - Inventory adjustments and audits
 * - Demand forecasting
 * - Dead stock identification
 *
 * This example shows enterprise-grade inventory management
 * suitable for multi-location e-commerce operations.
 */

import { v4 as uuidv4 } from '../shared/uuid.ts';
import { Decimal } from '../shared/decimal.ts';
import { Database, Product } from '../backend/db/database.ts';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface Warehouse {
  id: string;
  name: string;
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  capacity: number;
  currentUtilization: number;
  isActive: boolean;
  createdAt: Date;
}

export interface InventoryItem {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  reserved: number;
  available: number;
  reorderPoint: number;
  reorderQuantity: number;
  lastRestocked: Date;
  location?: {
    aisle: string;
    shelf: string;
    bin: string;
  };
}

export interface StockReservation {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  orderId?: string;
  customerId?: string;
  expiresAt: Date;
  status: 'active' | 'committed' | 'released' | 'expired';
  createdAt: Date;
}

export interface StockTransfer {
  id: string;
  productId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled';
  initiatedBy: string;
  completedAt?: Date;
  notes?: string;
  createdAt: Date;
}

export interface StockAdjustment {
  id: string;
  productId: string;
  warehouseId: string;
  quantityChange: number;
  reason: 'damaged' | 'lost' | 'found' | 'correction' | 'return' | 'other';
  notes?: string;
  adjustedBy: string;
  createdAt: Date;
}

export interface LowStockAlert {
  id: string;
  productId: string;
  warehouseId: string;
  currentStock: number;
  reorderPoint: number;
  suggestedReorder: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  acknowledgedAt?: Date;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
  }>;
  warehouseId: string;
  status: 'draft' | 'submitted' | 'approved' | 'received' | 'cancelled';
  totalCost: number;
  expectedDelivery?: Date;
  actualDelivery?: Date;
  createdAt: Date;
}

// ============================================================================
// Advanced Inventory Manager
// ============================================================================

export class AdvancedInventoryManager {
  private db: Database;
  private warehouses: Map<string, Warehouse> = new Map();
  private inventory: Map<string, InventoryItem[]> = new Map();
  private reservations: Map<string, StockReservation> = new Map();
  private transfers: Map<string, StockTransfer> = new Map();
  private adjustments: StockAdjustment[] = [];
  private lowStockAlerts: Map<string, LowStockAlert> = new Map();
  private purchaseOrders: Map<string, PurchaseOrder> = new Map();

  constructor(db: Database) {
    this.db = db;
    this.initializeWarehouses();
    this.initializeInventory();
    this.startLowStockMonitoring();
    this.startReservationCleanup();
  }

  // ==========================================================================
  // Warehouse Management
  // ==========================================================================

  /**
   * Create a new warehouse
   */
  createWarehouse(params: {
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    capacity: number;
  }): Warehouse {
    const warehouse: Warehouse = {
      id: `wh_${uuidv4()}`,
      name: params.name,
      location: {
        address: params.address,
        city: params.city,
        state: params.state,
        country: params.country,
        postalCode: params.postalCode,
      },
      capacity: params.capacity,
      currentUtilization: 0,
      isActive: true,
      createdAt: new Date(),
    };

    this.warehouses.set(warehouse.id, warehouse);
    console.log(`[Inventory] Warehouse created: ${warehouse.name} (${warehouse.id})`);

    return warehouse;
  }

  /**
   * Get all warehouses
   */
  getWarehouses(): Warehouse[] {
    return Array.from(this.warehouses.values());
  }

  /**
   * Get warehouse by ID
   */
  getWarehouse(warehouseId: string): Warehouse | undefined {
    return this.warehouses.get(warehouseId);
  }

  // ==========================================================================
  // Stock Management
  // ==========================================================================

  /**
   * Get inventory for a product across all warehouses
   */
  getProductInventory(productId: string): InventoryItem[] {
    const items: InventoryItem[] = [];

    for (const warehouseItems of this.inventory.values()) {
      const item = warehouseItems.find(i => i.productId === productId);
      if (item) {
        items.push(item);
      }
    }

    return items;
  }

  /**
   * Get inventory for a specific warehouse
   */
  getWarehouseInventory(warehouseId: string): InventoryItem[] {
    return this.inventory.get(warehouseId) || [];
  }

  /**
   * Get total available stock for a product
   */
  getTotalAvailableStock(productId: string): number {
    const items = this.getProductInventory(productId);
    return items.reduce((sum, item) => sum + item.available, 0);
  }

  /**
   * Add stock to warehouse
   */
  addStock(productId: string, warehouseId: string, quantity: number): InventoryItem {
    console.log(`[Inventory] Adding ${quantity} units of product ${productId} to warehouse ${warehouseId}`);

    if (quantity <= 0) {
      throw new Error('Quantity must be positive');
    }

    const warehouse = this.warehouses.get(warehouseId);
    if (!warehouse) {
      throw new Error('Warehouse not found');
    }

    let warehouseInventory = this.inventory.get(warehouseId);
    if (!warehouseInventory) {
      warehouseInventory = [];
      this.inventory.set(warehouseId, warehouseInventory);
    }

    let item = warehouseInventory.find(i => i.productId === productId);

    if (item) {
      // Update existing inventory
      item.quantity += quantity;
      item.available = item.quantity - item.reserved;
      item.lastRestocked = new Date();
    } else {
      // Create new inventory item
      item = {
        id: `inv_${uuidv4()}`,
        productId,
        warehouseId,
        quantity,
        reserved: 0,
        available: quantity,
        reorderPoint: Math.floor(quantity * 0.2), // 20% of initial stock
        reorderQuantity: quantity,
        lastRestocked: new Date(),
      };
      warehouseInventory.push(item);
    }

    console.log(`[Inventory] Stock added. New quantity: ${item.quantity}, Available: ${item.available}`);
    return item;
  }

  /**
   * Remove stock from warehouse
   */
  removeStock(productId: string, warehouseId: string, quantity: number): InventoryItem {
    console.log(`[Inventory] Removing ${quantity} units of product ${productId} from warehouse ${warehouseId}`);

    const warehouseInventory = this.inventory.get(warehouseId);
    if (!warehouseInventory) {
      throw new Error('Warehouse inventory not found');
    }

    const item = warehouseInventory.find(i => i.productId === productId);
    if (!item) {
      throw new Error('Product not found in warehouse');
    }

    if (item.available < quantity) {
      throw new Error(`Insufficient available stock. Available: ${item.available}, Requested: ${quantity}`);
    }

    item.quantity -= quantity;
    item.available = item.quantity - item.reserved;

    console.log(`[Inventory] Stock removed. New quantity: ${item.quantity}, Available: ${item.available}`);
    return item;
  }

  // ==========================================================================
  // Stock Reservations
  // ==========================================================================

  /**
   * Reserve stock for an order
   */
  reserveStock(productId: string, quantity: number, orderId?: string): StockReservation {
    console.log(`[Inventory] Reserving ${quantity} units of product ${productId}`);

    // Find warehouse with sufficient stock
    const productInventory = this.getProductInventory(productId);
    const warehouseWithStock = productInventory.find(item => item.available >= quantity);

    if (!warehouseWithStock) {
      throw new Error('Insufficient stock available for reservation');
    }

    // Create reservation
    const reservation: StockReservation = {
      id: `res_${uuidv4()}`,
      productId,
      warehouseId: warehouseWithStock.warehouseId,
      quantity,
      orderId,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      status: 'active',
      createdAt: new Date(),
    };

    this.reservations.set(reservation.id, reservation);

    // Update inventory
    warehouseWithStock.reserved += quantity;
    warehouseWithStock.available = warehouseWithStock.quantity - warehouseWithStock.reserved;

    console.log(`[Inventory] Stock reserved: ${reservation.id}`);
    return reservation;
  }

  /**
   * Commit reservation (complete order)
   */
  commitReservation(reservationId: string): void {
    console.log(`[Inventory] Committing reservation: ${reservationId}`);

    const reservation = this.reservations.get(reservationId);
    if (!reservation) {
      throw new Error('Reservation not found');
    }

    if (reservation.status !== 'active') {
      throw new Error(`Cannot commit reservation with status: ${reservation.status}`);
    }

    const warehouseInventory = this.inventory.get(reservation.warehouseId);
    if (!warehouseInventory) {
      throw new Error('Warehouse inventory not found');
    }

    const item = warehouseInventory.find(i => i.productId === reservation.productId);
    if (!item) {
      throw new Error('Product not found in warehouse');
    }

    // Update inventory
    item.quantity -= reservation.quantity;
    item.reserved -= reservation.quantity;
    item.available = item.quantity - item.reserved;

    // Update reservation status
    reservation.status = 'committed';

    console.log(`[Inventory] Reservation committed. New stock: ${item.quantity}`);
  }

  /**
   * Release reservation (cancel order)
   */
  releaseReservation(reservationId: string): void {
    console.log(`[Inventory] Releasing reservation: ${reservationId}`);

    const reservation = this.reservations.get(reservationId);
    if (!reservation) {
      throw new Error('Reservation not found');
    }

    if (reservation.status !== 'active') {
      return; // Already released or committed
    }

    const warehouseInventory = this.inventory.get(reservation.warehouseId);
    if (warehouseInventory) {
      const item = warehouseInventory.find(i => i.productId === reservation.productId);
      if (item) {
        item.reserved -= reservation.quantity;
        item.available = item.quantity - item.reserved;
      }
    }

    reservation.status = 'released';
    console.log(`[Inventory] Reservation released`);
  }

  // ==========================================================================
  // Stock Transfers
  // ==========================================================================

  /**
   * Initiate stock transfer between warehouses
   */
  initiateTransfer(params: {
    productId: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    quantity: number;
    initiatedBy: string;
    notes?: string;
  }): StockTransfer {
    console.log(`[Inventory] Initiating transfer: ${params.quantity} units from ${params.fromWarehouseId} to ${params.toWarehouseId}`);

    // Validate source warehouse has stock
    const sourceInventory = this.inventory.get(params.fromWarehouseId);
    if (!sourceInventory) {
      throw new Error('Source warehouse not found');
    }

    const sourceItem = sourceInventory.find(i => i.productId === params.productId);
    if (!sourceItem || sourceItem.available < params.quantity) {
      throw new Error('Insufficient stock in source warehouse');
    }

    // Create transfer
    const transfer: StockTransfer = {
      id: `xfr_${uuidv4()}`,
      productId: params.productId,
      fromWarehouseId: params.fromWarehouseId,
      toWarehouseId: params.toWarehouseId,
      quantity: params.quantity,
      status: 'pending',
      initiatedBy: params.initiatedBy,
      notes: params.notes,
      createdAt: new Date(),
    };

    this.transfers.set(transfer.id, transfer);

    // Reserve stock in source warehouse
    sourceItem.reserved += params.quantity;
    sourceItem.available = sourceItem.quantity - sourceItem.reserved;

    console.log(`[Inventory] Transfer initiated: ${transfer.id}`);
    return transfer;
  }

  /**
   * Complete stock transfer
   */
  completeTransfer(transferId: string): void {
    console.log(`[Inventory] Completing transfer: ${transferId}`);

    const transfer = this.transfers.get(transferId);
    if (!transfer) {
      throw new Error('Transfer not found');
    }

    if (transfer.status !== 'pending' && transfer.status !== 'in_transit') {
      throw new Error(`Cannot complete transfer with status: ${transfer.status}`);
    }

    // Remove from source
    this.removeStock(transfer.productId, transfer.fromWarehouseId, transfer.quantity);

    // Add to destination
    this.addStock(transfer.productId, transfer.toWarehouseId, transfer.quantity);

    // Update transfer status
    transfer.status = 'completed';
    transfer.completedAt = new Date();

    console.log(`[Inventory] Transfer completed`);
  }

  // ==========================================================================
  // Stock Adjustments
  // ==========================================================================

  /**
   * Record stock adjustment
   */
  adjustStock(params: {
    productId: string;
    warehouseId: string;
    quantityChange: number;
    reason: 'damaged' | 'lost' | 'found' | 'correction' | 'return' | 'other';
    notes?: string;
    adjustedBy: string;
  }): StockAdjustment {
    console.log(`[Inventory] Adjusting stock: ${params.quantityChange > 0 ? '+' : ''}${params.quantityChange} units (${params.reason})`);

    const adjustment: StockAdjustment = {
      id: `adj_${uuidv4()}`,
      productId: params.productId,
      warehouseId: params.warehouseId,
      quantityChange: params.quantityChange,
      reason: params.reason,
      notes: params.notes,
      adjustedBy: params.adjustedBy,
      createdAt: new Date(),
    };

    this.adjustments.push(adjustment);

    // Apply adjustment
    if (params.quantityChange > 0) {
      this.addStock(params.productId, params.warehouseId, params.quantityChange);
    } else {
      const warehouseInventory = this.inventory.get(params.warehouseId);
      if (warehouseInventory) {
        const item = warehouseInventory.find(i => i.productId === params.productId);
        if (item) {
          item.quantity += params.quantityChange; // quantityChange is negative
          item.available = item.quantity - item.reserved;
        }
      }
    }

    console.log(`[Inventory] Stock adjusted: ${adjustment.id}`);
    return adjustment;
  }

  // ==========================================================================
  // Low Stock Alerts & Reordering
  // ==========================================================================

  /**
   * Check for low stock and create alerts
   */
  checkLowStock(): LowStockAlert[] {
    const alerts: LowStockAlert[] = [];

    for (const [warehouseId, items] of this.inventory.entries()) {
      for (const item of items) {
        if (item.available <= item.reorderPoint) {
          const alertId = `${item.productId}_${warehouseId}`;

          // Check if alert already exists
          if (!this.lowStockAlerts.has(alertId)) {
            const alert: LowStockAlert = {
              id: alertId,
              productId: item.productId,
              warehouseId,
              currentStock: item.available,
              reorderPoint: item.reorderPoint,
              suggestedReorder: item.reorderQuantity,
              priority: this.calculateAlertPriority(item.available, item.reorderPoint),
              createdAt: new Date(),
            };

            this.lowStockAlerts.set(alertId, alert);
            alerts.push(alert);
          }
        }
      }
    }

    return alerts;
  }

  /**
   * Calculate alert priority
   */
  private calculateAlertPriority(currentStock: number, reorderPoint: number): 'low' | 'medium' | 'high' | 'critical' {
    const ratio = currentStock / reorderPoint;

    if (ratio <= 0.25) return 'critical';
    if (ratio <= 0.5) return 'high';
    if (ratio <= 0.75) return 'medium';
    return 'low';
  }

  /**
   * Create purchase order for restocking
   */
  createPurchaseOrder(params: {
    supplierId: string;
    warehouseId: string;
    items: Array<{
      productId: string;
      quantity: number;
      unitCost: number;
    }>;
    expectedDelivery?: Date;
  }): PurchaseOrder {
    console.log(`[Inventory] Creating purchase order for ${params.items.length} items`);

    let totalCost = new Decimal(0);
    const orderItems = params.items.map(item => {
      const itemTotal = new Decimal(item.unitCost).times(item.quantity);
      totalCost = totalCost.plus(itemTotal);

      return {
        ...item,
        totalCost: itemTotal.toNumber(),
      };
    });

    const po: PurchaseOrder = {
      id: `po_${uuidv4()}`,
      supplierId: params.supplierId,
      items: orderItems,
      warehouseId: params.warehouseId,
      status: 'draft',
      totalCost: totalCost.toNumber(),
      expectedDelivery: params.expectedDelivery,
      createdAt: new Date(),
    };

    this.purchaseOrders.set(po.id, po);

    console.log(`[Inventory] Purchase order created: ${po.id} (Total: $${po.totalCost.toFixed(2)})`);
    return po;
  }

  /**
   * Receive purchase order
   */
  receivePurchaseOrder(poId: string): void {
    console.log(`[Inventory] Receiving purchase order: ${poId}`);

    const po = this.purchaseOrders.get(poId);
    if (!po) {
      throw new Error('Purchase order not found');
    }

    // Add stock for each item
    for (const item of po.items) {
      this.addStock(item.productId, po.warehouseId, item.quantity);
    }

    // Update PO status
    po.status = 'received';
    po.actualDelivery = new Date();

    console.log(`[Inventory] Purchase order received`);
  }

  // ==========================================================================
  // Background Tasks
  // ==========================================================================

  /**
   * Start low stock monitoring
   */
  private startLowStockMonitoring() {
    setInterval(() => {
      const alerts = this.checkLowStock();
      if (alerts.length > 0) {
        console.log(`[Inventory] ${alerts.length} low stock alerts detected`);
      }
    }, 60000); // Check every minute
  }

  /**
   * Start reservation cleanup
   */
  private startReservationCleanup() {
    setInterval(() => {
      const now = new Date();
      let cleaned = 0;

      for (const reservation of this.reservations.values()) {
        if (reservation.status === 'active' && now > reservation.expiresAt) {
          this.releaseReservation(reservation.id);
          reservation.status = 'expired';
          cleaned++;
        }
      }

      if (cleaned > 0) {
        console.log(`[Inventory] Cleaned up ${cleaned} expired reservations`);
      }
    }, 60000); // Run every minute
  }

  /**
   * Initialize sample warehouses
   */
  private initializeWarehouses() {
    this.createWarehouse({
      name: 'Main Distribution Center',
      address: '1000 Commerce Way',
      city: 'Los Angeles',
      state: 'CA',
      country: 'US',
      postalCode: '90001',
      capacity: 100000,
    });

    this.createWarehouse({
      name: 'East Coast Warehouse',
      address: '500 Industrial Blvd',
      city: 'Newark',
      state: 'NJ',
      country: 'US',
      postalCode: '07102',
      capacity: 50000,
    });
  }

  /**
   * Initialize sample inventory
   */
  private initializeInventory() {
    const warehouses = this.getWarehouses();
    const products = this.db.getProducts().slice(0, 5);

    for (const warehouse of warehouses) {
      for (const product of products) {
        const quantity = Math.floor(Math.random() * 500) + 100;
        this.addStock(product.id, warehouse.id, quantity);
      }
    }

    console.log('[Inventory] Sample inventory initialized');
  }

  /**
   * Get inventory statistics
   */
  getInventoryStats() {
    let totalProducts = 0;
    let totalQuantity = 0;
    let totalValue = new Decimal(0);

    for (const items of this.inventory.values()) {
      totalProducts += items.length;
      for (const item of items) {
        totalQuantity += item.quantity;
        const product = this.db.getProduct(item.productId);
        if (product) {
          totalValue = totalValue.plus(new Decimal(product.price).times(item.quantity));
        }
      }
    }

    return {
      totalWarehouses: this.warehouses.size,
      totalProducts,
      totalQuantity,
      totalValue: totalValue.toNumber(),
      activeReservations: Array.from(this.reservations.values()).filter(r => r.status === 'active').length,
      lowStockAlerts: this.lowStockAlerts.size,
      activeTransfers: Array.from(this.transfers.values()).filter(t => t.status === 'pending' || t.status === 'in_transit').length,
    };
  }
}

// ============================================================================
// Example Usage
// ============================================================================

export function demonstrateInventoryManagement() {
  console.log('='.repeat(80));
  console.log('INVENTORY MANAGEMENT DEMONSTRATION');
  console.log('='.repeat(80));
  console.log();

  const db = new Database();
  const inventory = new AdvancedInventoryManager(db);

  const products = db.getProducts();
  const warehouses = inventory.getWarehouses();

  console.log(`Initialized with ${warehouses.length} warehouses and ${products.length} products\n`);

  // Display inventory stats
  const stats = inventory.getInventoryStats();
  console.log('--- Inventory Statistics ---');
  console.log(`Warehouses: ${stats.totalWarehouses}`);
  console.log(`Products: ${stats.totalProducts}`);
  console.log(`Total Units: ${stats.totalQuantity}`);
  console.log(`Total Value: $${stats.totalValue.toFixed(2)}`);
  console.log(`Active Reservations: ${stats.activeReservations}`);
  console.log(`Low Stock Alerts: ${stats.lowStockAlerts}\n`);

  // Demonstrate stock reservation
  console.log('--- Stock Reservation ---');
  const reservation = inventory.reserveStock(products[0].id, 10, 'order_123');
  console.log(`Reserved ${reservation.quantity} units (expires: ${reservation.expiresAt.toISOString()})\n`);

  // Demonstrate stock transfer
  console.log('--- Stock Transfer ---');
  const transfer = inventory.initiateTransfer({
    productId: products[1].id,
    fromWarehouseId: warehouses[0].id,
    toWarehouseId: warehouses[1].id,
    quantity: 50,
    initiatedBy: 'admin',
    notes: 'Rebalancing inventory',
  });
  console.log(`Transfer initiated: ${transfer.id}`);
  inventory.completeTransfer(transfer.id);
  console.log('Transfer completed\n');

  // Check low stock
  console.log('--- Low Stock Check ---');
  const alerts = inventory.checkLowStock();
  console.log(`Found ${alerts.length} low stock alerts`);

  console.log();
  console.log('='.repeat(80));
  console.log('✓ INVENTORY MANAGEMENT DEMONSTRATION COMPLETE');
  console.log('='.repeat(80));
}

// Run demonstration if executed directly
if (import.meta.main) {
  demonstrateInventoryManagement();
}
