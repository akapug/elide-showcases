/**
 * In-Memory Database for E-commerce Platform
 *
 * Provides in-memory storage for products, carts, orders, and inventory.
 * In a production environment, this would be replaced with a real database
 * like PostgreSQL, MongoDB, or MySQL.
 *
 * Features:
 * - Product catalog management
 * - Session-based shopping carts
 * - Order history and management
 * - Real-time inventory tracking
 * - Sample data generation
 */

import { v4 as uuidv4 } from '../../shared/uuid.ts';
import { Decimal } from '../../shared/decimal.ts';

/**
 * Product interface
 */
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  sku: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Cart item interface
 */
export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  addedAt: Date;
}

/**
 * Shopping cart interface
 */
export interface Cart {
  sessionId: string;
  items: CartItem[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Order interface
 */
export interface Order {
  id: string;
  orderNumber: string;
  sessionId: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  shippingAddress: Address;
  billingAddress: Address;
  customerEmail: string;
  paymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Order item interface
 */
export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

/**
 * Address interface
 */
export interface Address {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
}

/**
 * Order status enum
 */
export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

/**
 * Inventory record interface
 */
export interface InventoryRecord {
  productId: string;
  stock: number;
  reserved: number;
  available: number;
  reorderLevel: number;
  reorderQuantity: number;
  lastRestocked?: Date;
}

/**
 * In-memory database
 */
export class Database {
  private products: Map<string, Product> = new Map();
  private carts: Map<string, Cart> = new Map();
  private orders: Map<string, Order> = new Map();
  private inventory: Map<string, InventoryRecord> = new Map();

  /**
   * Initialize database with sample data
   */
  async initialize() {
    console.log('Initializing database...');
    this.seedProducts();
    console.log(`✓ Added ${this.products.size} products`);
    console.log(`✓ Initialized inventory tracking`);
  }

  /**
   * Seed sample products
   */
  private seedProducts() {
    const categories = ['electronics', 'clothing', 'home', 'sports', 'books'];
    const now = new Date();

    const productsData = [
      { name: 'Wireless Headphones', category: 'electronics', price: 79.99, stock: 25 },
      { name: 'Smart Watch', category: 'electronics', price: 249.99, stock: 15 },
      { name: 'Laptop Stand', category: 'electronics', price: 39.99, stock: 50 },
      { name: 'Mechanical Keyboard', category: 'electronics', price: 129.99, stock: 30 },
      { name: 'USB-C Hub', category: 'electronics', price: 49.99, stock: 40 },
      { name: '4K Monitor', category: 'electronics', price: 399.99, stock: 12 },
      { name: 'Webcam HD', category: 'electronics', price: 89.99, stock: 20 },
      { name: 'Wireless Mouse', category: 'electronics', price: 29.99, stock: 60 },
      { name: 'Cotton T-Shirt', category: 'clothing', price: 24.99, stock: 100 },
      { name: 'Denim Jeans', category: 'clothing', price: 59.99, stock: 80 },
      { name: 'Running Shoes', category: 'clothing', price: 89.99, stock: 45 },
      { name: 'Winter Jacket', category: 'clothing', price: 149.99, stock: 25 },
      { name: 'Baseball Cap', category: 'clothing', price: 19.99, stock: 75 },
      { name: 'Hoodie', category: 'clothing', price: 49.99, stock: 55 },
      { name: 'Sneakers', category: 'clothing', price: 79.99, stock: 40 },
      { name: 'Dress Shirt', category: 'clothing', price: 44.99, stock: 35 },
      { name: 'Coffee Maker', category: 'home', price: 79.99, stock: 30 },
      { name: 'Desk Lamp', category: 'home', price: 34.99, stock: 45 },
      { name: 'Area Rug', category: 'home', price: 129.99, stock: 20 },
      { name: 'Storage Bins', category: 'home', price: 29.99, stock: 70 },
      { name: 'Wall Clock', category: 'home', price: 44.99, stock: 35 },
      { name: 'Throw Pillows', category: 'home', price: 24.99, stock: 90 },
      { name: 'Kitchen Mixer', category: 'home', price: 199.99, stock: 15 },
      { name: 'Vacuum Cleaner', category: 'home', price: 159.99, stock: 18 },
      { name: 'Yoga Mat', category: 'sports', price: 29.99, stock: 60 },
      { name: 'Dumbbells Set', category: 'sports', price: 89.99, stock: 25 },
      { name: 'Bicycle Helmet', category: 'sports', price: 49.99, stock: 35 },
      { name: 'Water Bottle', category: 'sports', price: 19.99, stock: 100 },
      { name: 'Resistance Bands', category: 'sports', price: 24.99, stock: 80 },
      { name: 'Tennis Racket', category: 'sports', price: 119.99, stock: 20 },
      { name: 'Basketball', category: 'sports', price: 34.99, stock: 45 },
      { name: 'Jump Rope', category: 'sports', price: 14.99, stock: 90 },
      { name: 'Programming Book', category: 'books', price: 39.99, stock: 50 },
      { name: 'Cookbook', category: 'books', price: 29.99, stock: 40 },
      { name: 'Mystery Novel', category: 'books', price: 14.99, stock: 100 },
      { name: 'Travel Guide', category: 'books', price: 24.99, stock: 35 },
      { name: 'Art Book', category: 'books', price: 44.99, stock: 25 },
      { name: 'Science Fiction', category: 'books', price: 19.99, stock: 70 },
      { name: 'Biography', category: 'books', price: 27.99, stock: 45 },
      { name: 'Self-Help Book', category: 'books', price: 22.99, stock: 60 },
    ];

    productsData.forEach((data, index) => {
      const product: Product = {
        id: `prod-${uuidv4().substring(0, 8)}`,
        name: data.name,
        description: `High-quality ${data.name.toLowerCase()} with excellent features and durability. Perfect for everyday use or special occasions.`,
        price: data.price,
        category: data.category,
        stock: data.stock,
        sku: `SKU-${String(index + 1).padStart(4, '0')}`,
        createdAt: now,
        updatedAt: now,
      };

      this.products.set(product.id, product);

      // Initialize inventory record
      this.inventory.set(product.id, {
        productId: product.id,
        stock: data.stock,
        reserved: 0,
        available: data.stock,
        reorderLevel: Math.floor(data.stock * 0.2),
        reorderQuantity: Math.floor(data.stock * 0.5),
      });
    });
  }

  // ============================================================================
  // Products
  // ============================================================================

  getProducts(): Product[] {
    return Array.from(this.products.values());
  }

  getProduct(id: string): Product | undefined {
    return this.products.get(id);
  }

  createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
    const newProduct: Product = {
      ...product,
      id: `prod-${uuidv4().substring(0, 8)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.products.set(newProduct.id, newProduct);

    // Initialize inventory
    this.inventory.set(newProduct.id, {
      productId: newProduct.id,
      stock: product.stock,
      reserved: 0,
      available: product.stock,
      reorderLevel: Math.floor(product.stock * 0.2),
      reorderQuantity: Math.floor(product.stock * 0.5),
    });

    return newProduct;
  }

  updateProduct(id: string, updates: Partial<Product>): Product | undefined {
    const product = this.products.get(id);
    if (!product) return undefined;

    const updated = {
      ...product,
      ...updates,
      id: product.id, // Prevent ID change
      updatedAt: new Date(),
    };

    this.products.set(id, updated);

    // Update inventory if stock changed
    if (updates.stock !== undefined) {
      const inventory = this.inventory.get(id);
      if (inventory) {
        inventory.stock = updates.stock;
        inventory.available = updates.stock - inventory.reserved;
      }
    }

    return updated;
  }

  deleteProduct(id: string): boolean {
    const deleted = this.products.delete(id);
    if (deleted) {
      this.inventory.delete(id);
    }
    return deleted;
  }

  searchProducts(query: string): Product[] {
    const lowerQuery = query.toLowerCase();
    return this.getProducts().filter(p =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.description.toLowerCase().includes(lowerQuery) ||
      p.category.toLowerCase().includes(lowerQuery)
    );
  }

  filterProducts(filters: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
  }): Product[] {
    let products = this.getProducts();

    if (filters.category) {
      products = products.filter(p => p.category === filters.category);
    }

    if (filters.minPrice !== undefined) {
      products = products.filter(p => p.price >= filters.minPrice!);
    }

    if (filters.maxPrice !== undefined) {
      products = products.filter(p => p.price <= filters.maxPrice!);
    }

    if (filters.inStock) {
      products = products.filter(p => p.stock > 0);
    }

    return products;
  }

  // ============================================================================
  // Shopping Cart
  // ============================================================================

  getCart(sessionId: string): Cart | undefined {
    return this.carts.get(sessionId);
  }

  getOrCreateCart(sessionId: string): Cart {
    let cart = this.carts.get(sessionId);
    if (!cart) {
      cart = {
        sessionId,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.carts.set(sessionId, cart);
    }
    return cart;
  }

  addToCart(sessionId: string, productId: string, quantity: number): Cart {
    const cart = this.getOrCreateCart(sessionId);
    const product = this.products.get(productId);

    if (!product) {
      throw new Error('Product not found');
    }

    if (product.stock < quantity) {
      throw new Error('Insufficient stock');
    }

    const existingItem = cart.items.find(item => item.productId === productId);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        id: uuidv4(),
        productId,
        quantity,
        price: product.price,
        addedAt: new Date(),
      });
    }

    cart.updatedAt = new Date();
    return cart;
  }

  updateCartItem(sessionId: string, itemId: string, quantity: number): Cart {
    const cart = this.getCart(sessionId);
    if (!cart) {
      throw new Error('Cart not found');
    }

    const item = cart.items.find(i => i.id === itemId);
    if (!item) {
      throw new Error('Cart item not found');
    }

    if (quantity === 0) {
      cart.items = cart.items.filter(i => i.id !== itemId);
    } else {
      const product = this.products.get(item.productId);
      if (product && product.stock < quantity) {
        throw new Error('Insufficient stock');
      }
      item.quantity = quantity;
    }

    cart.updatedAt = new Date();
    return cart;
  }

  removeFromCart(sessionId: string, itemId: string): Cart {
    const cart = this.getCart(sessionId);
    if (!cart) {
      throw new Error('Cart not found');
    }

    cart.items = cart.items.filter(item => item.id !== itemId);
    cart.updatedAt = new Date();
    return cart;
  }

  clearCart(sessionId: string): void {
    this.carts.delete(sessionId);
  }

  // ============================================================================
  // Orders
  // ============================================================================

  getOrders(sessionId?: string): Order[] {
    const orders = Array.from(this.orders.values());
    if (sessionId) {
      return orders.filter(o => o.sessionId === sessionId);
    }
    return orders;
  }

  getOrder(id: string): Order | undefined {
    return this.orders.get(id);
  }

  createOrder(
    sessionId: string,
    shippingAddress: Address,
    billingAddress: Address,
    customerEmail: string
  ): Order {
    const cart = this.getCart(sessionId);
    if (!cart || cart.items.length === 0) {
      throw new Error('Cart is empty');
    }

    // Calculate totals using Decimal for precision
    let subtotal = new Decimal(0);
    const orderItems: OrderItem[] = [];

    for (const item of cart.items) {
      const product = this.products.get(item.productId);
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }

      // Check stock availability
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }

      const itemSubtotal = new Decimal(item.price).times(item.quantity);
      subtotal = subtotal.plus(itemSubtotal);

      orderItems.push({
        productId: item.productId,
        productName: product.name,
        quantity: item.quantity,
        price: item.price,
        subtotal: itemSubtotal.toNumber(),
      });

      // Reduce stock
      product.stock -= item.quantity;
      product.updatedAt = new Date();

      // Update inventory
      const inventory = this.inventory.get(item.productId);
      if (inventory) {
        inventory.stock -= item.quantity;
        inventory.available = inventory.stock - inventory.reserved;
      }
    }

    // Calculate tax and shipping
    const tax = subtotal.times(0.085); // 8.5% tax
    const shipping = subtotal.greaterThanOrEqualTo(50) ? new Decimal(0) : new Decimal(5.99);
    const total = subtotal.plus(tax).plus(shipping);

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const order: Order = {
      id: uuidv4(),
      orderNumber,
      sessionId,
      items: orderItems,
      subtotal: subtotal.toNumber(),
      tax: tax.toNumber(),
      shipping: shipping.toNumber(),
      total: total.toNumber(),
      status: OrderStatus.PENDING,
      shippingAddress,
      billingAddress,
      customerEmail,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.orders.set(order.id, order);

    // Clear the cart
    this.clearCart(sessionId);

    return order;
  }

  updateOrderStatus(orderId: string, status: OrderStatus): Order | undefined {
    const order = this.orders.get(orderId);
    if (!order) return undefined;

    order.status = status;
    order.updatedAt = new Date();

    return order;
  }

  // ============================================================================
  // Inventory
  // ============================================================================

  getInventory(): InventoryRecord[] {
    return Array.from(this.inventory.values());
  }

  getInventoryForProduct(productId: string): InventoryRecord | undefined {
    return this.inventory.get(productId);
  }

  updateStock(productId: string, stock: number): InventoryRecord | undefined {
    const product = this.products.get(productId);
    const inventory = this.inventory.get(productId);

    if (!product || !inventory) return undefined;

    product.stock = stock;
    product.updatedAt = new Date();

    inventory.stock = stock;
    inventory.available = stock - inventory.reserved;
    inventory.lastRestocked = new Date();

    return inventory;
  }

  reserveStock(productId: string, quantity: number): boolean {
    const inventory = this.inventory.get(productId);
    if (!inventory) return false;

    if (inventory.available < quantity) return false;

    inventory.reserved += quantity;
    inventory.available -= quantity;

    return true;
  }

  releaseStock(productId: string, quantity: number): boolean {
    const inventory = this.inventory.get(productId);
    if (!inventory) return false;

    inventory.reserved -= quantity;
    inventory.available += quantity;

    return true;
  }

  getLowStockProducts(): Product[] {
    return this.getProducts().filter(product => {
      const inventory = this.inventory.get(product.id);
      return inventory && inventory.available <= inventory.reorderLevel;
    });
  }
}
