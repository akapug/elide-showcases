/**
 * Shopping Cart Routes
 *
 * Handles session-based shopping cart operations:
 * - Get cart
 * - Add item to cart
 * - Update cart item quantity
 * - Remove item from cart
 * - Clear cart
 * - Calculate cart totals
 */

import { RequestContext, Response } from '../server.ts';
import { Database } from '../db/database.ts';
import { Decimal } from '../../shared/decimal.ts';

export class CartRoutes {
  constructor(private db: Database) {}

  /**
   * Handle cart routes
   */
  async handle(ctx: RequestContext): Promise<Response> {
    const { method, path } = ctx;

    if (!ctx.sessionId) {
      return this.errorResponse(400, 'Session required');
    }

    // GET /api/cart - Get cart
    if (path === '/api/cart' && method === 'GET') {
      return this.getCart(ctx.sessionId);
    }

    // POST /api/cart/items - Add item to cart
    if (path === '/api/cart/items' && method === 'POST') {
      return this.addToCart(ctx);
    }

    // PUT /api/cart/items/:id - Update cart item
    if (path.match(/^\/api\/cart\/items\/[^/]+$/) && method === 'PUT') {
      const itemId = path.split('/')[4];
      return this.updateCartItem(ctx, itemId);
    }

    // DELETE /api/cart/items/:id - Remove from cart
    if (path.match(/^\/api\/cart\/items\/[^/]+$/) && method === 'DELETE') {
      const itemId = path.split('/')[4];
      return this.removeFromCart(ctx.sessionId, itemId);
    }

    // DELETE /api/cart - Clear cart
    if (path === '/api/cart' && method === 'DELETE') {
      return this.clearCart(ctx.sessionId);
    }

    return this.errorResponse(404, 'Cart endpoint not found');
  }

  /**
   * Get cart with calculated totals
   */
  private getCart(sessionId: string): Response {
    try {
      const cart = this.db.getOrCreateCart(sessionId);

      // Enrich cart items with product details
      const enrichedItems = cart.items.map(item => {
        const product = this.db.getProduct(item.productId);
        return {
          ...item,
          product: product ? {
            id: product.id,
            name: product.name,
            price: product.price,
            stock: product.stock,
            category: product.category,
            imageUrl: product.imageUrl,
          } : null,
          subtotal: new Decimal(item.price).times(item.quantity).toNumber(),
        };
      });

      // Calculate totals
      const totals = this.calculateTotals(cart.items);

      return this.jsonResponse(200, {
        cart: {
          sessionId: cart.sessionId,
          items: enrichedItems,
          itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
          createdAt: cart.createdAt,
          updatedAt: cart.updatedAt,
        },
        totals,
      });
    } catch (error) {
      return this.errorResponse(500, 'Failed to get cart', error);
    }
  }

  /**
   * Add item to cart
   */
  private addToCart(ctx: RequestContext): Response {
    const { productId, quantity = 1 } = ctx.body || {};

    // Validation
    if (!productId || typeof productId !== 'string') {
      return this.errorResponse(400, 'Product ID is required');
    }

    if (typeof quantity !== 'number' || quantity < 1) {
      return this.errorResponse(400, 'Quantity must be a positive number');
    }

    // Check if product exists
    const product = this.db.getProduct(productId);
    if (!product) {
      return this.errorResponse(404, 'Product not found');
    }

    // Check stock availability
    if (product.stock < quantity) {
      return this.errorResponse(400, 'Insufficient stock', {
        requested: quantity,
        available: product.stock,
      });
    }

    try {
      const cart = this.db.addToCart(ctx.sessionId!, productId, quantity);

      // Calculate totals
      const totals = this.calculateTotals(cart.items);

      return this.jsonResponse(200, {
        message: 'Item added to cart',
        cart: {
          sessionId: cart.sessionId,
          items: cart.items,
          itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
        },
        totals,
      });
    } catch (error) {
      return this.errorResponse(500, 'Failed to add item to cart', error);
    }
  }

  /**
   * Update cart item quantity
   */
  private updateCartItem(ctx: RequestContext, itemId: string): Response {
    const { quantity } = ctx.body || {};

    if (typeof quantity !== 'number' || quantity < 0) {
      return this.errorResponse(400, 'Quantity must be a non-negative number');
    }

    try {
      const cart = this.db.updateCartItem(ctx.sessionId!, itemId, quantity);

      // Calculate totals
      const totals = this.calculateTotals(cart.items);

      return this.jsonResponse(200, {
        message: quantity === 0 ? 'Item removed from cart' : 'Cart updated',
        cart: {
          sessionId: cart.sessionId,
          items: cart.items,
          itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
        },
        totals,
      });
    } catch (error) {
      return this.errorResponse(500, 'Failed to update cart', error);
    }
  }

  /**
   * Remove item from cart
   */
  private removeFromCart(sessionId: string, itemId: string): Response {
    try {
      const cart = this.db.removeFromCart(sessionId, itemId);

      // Calculate totals
      const totals = this.calculateTotals(cart.items);

      return this.jsonResponse(200, {
        message: 'Item removed from cart',
        cart: {
          sessionId: cart.sessionId,
          items: cart.items,
          itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
        },
        totals,
      });
    } catch (error) {
      return this.errorResponse(500, 'Failed to remove item from cart', error);
    }
  }

  /**
   * Clear entire cart
   */
  private clearCart(sessionId: string): Response {
    try {
      this.db.clearCart(sessionId);

      return this.jsonResponse(200, {
        message: 'Cart cleared successfully',
        cart: {
          sessionId,
          items: [],
          itemCount: 0,
        },
        totals: {
          subtotal: 0,
          tax: 0,
          shipping: 0,
          total: 0,
        },
      });
    } catch (error) {
      return this.errorResponse(500, 'Failed to clear cart', error);
    }
  }

  /**
   * Calculate cart totals with decimal precision
   */
  private calculateTotals(items: any[]): {
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
    taxRate: number;
    freeShippingThreshold: number;
  } {
    // Calculate subtotal using Decimal for precision
    let subtotal = new Decimal(0);

    for (const item of items) {
      const itemTotal = new Decimal(item.price).times(item.quantity);
      subtotal = subtotal.plus(itemTotal);
    }

    // Tax: 8.5%
    const taxRate = 0.085;
    const tax = subtotal.times(taxRate);

    // Shipping: Free over $50, otherwise $5.99
    const freeShippingThreshold = 50;
    const shipping = subtotal.greaterThanOrEqualTo(freeShippingThreshold)
      ? new Decimal(0)
      : new Decimal(5.99);

    // Total
    const total = subtotal.plus(tax).plus(shipping);

    return {
      subtotal: subtotal.toNumber(),
      tax: tax.toNumber(),
      shipping: shipping.toNumber(),
      total: total.toNumber(),
      taxRate,
      freeShippingThreshold,
    };
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
