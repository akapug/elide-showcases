/**
 * Order Routes
 *
 * Handles order management:
 * - Create order (checkout)
 * - Get order by ID
 * - List orders
 * - Update order status
 * - Integration with payment service (Python)
 * - Integration with email service (Ruby)
 */

import { RequestContext, Response } from '../server.ts';
import { Database, Address, OrderStatus } from '../db/database.ts';
import { isEmail } from '../../shared/validator.ts';
import { processPayment } from '../services/payment-service.ts';
import { sendOrderConfirmation } from '../services/email-service.ts';

export class OrderRoutes {
  constructor(private db: Database) {}

  /**
   * Handle order routes
   */
  async handle(ctx: RequestContext): Promise<Response> {
    const { method, path } = ctx;

    // GET /api/orders - List orders
    if (path === '/api/orders' && method === 'GET') {
      return this.listOrders(ctx);
    }

    // GET /api/orders/:id - Get single order
    if (path.match(/^\/api\/orders\/[^/]+$/) && method === 'GET') {
      const id = path.split('/')[3];
      return this.getOrder(id);
    }

    // POST /api/orders - Create order (checkout)
    if (path === '/api/orders' && method === 'POST') {
      return this.createOrder(ctx);
    }

    // PUT /api/orders/:id/status - Update order status
    if (path.match(/^\/api\/orders\/[^/]+\/status$/) && method === 'PUT') {
      const id = path.split('/')[3];
      return this.updateOrderStatus(id, ctx);
    }

    return this.errorResponse(404, 'Order endpoint not found');
  }

  /**
   * List orders (optionally filtered by session)
   */
  private listOrders(ctx: RequestContext): Response {
    try {
      // For demo purposes, list all orders
      // In production, this would be filtered by authenticated user
      const orders = this.db.getOrders(ctx.sessionId);

      return this.jsonResponse(200, {
        orders,
        count: orders.length,
      });
    } catch (error) {
      return this.errorResponse(500, 'Failed to list orders', error);
    }
  }

  /**
   * Get single order by ID
   */
  private getOrder(id: string): Response {
    const order = this.db.getOrder(id);

    if (!order) {
      return this.errorResponse(404, 'Order not found');
    }

    return this.jsonResponse(200, {
      order,
    });
  }

  /**
   * Create order (checkout flow)
   */
  private async createOrder(ctx: RequestContext): Response {
    const {
      shippingAddress,
      billingAddress,
      customerEmail,
      paymentMethod,
      sameAsBilling = true,
    } = ctx.body || {};

    // Validation
    const errors = this.validateCheckout({
      shippingAddress,
      billingAddress: sameAsBilling ? shippingAddress : billingAddress,
      customerEmail,
      paymentMethod,
    });

    if (errors.length > 0) {
      return this.errorResponse(400, 'Validation failed', errors);
    }

    // Validate email
    if (!isEmail(customerEmail)) {
      return this.errorResponse(400, 'Invalid email address');
    }

    try {
      // Create order in database
      const order = this.db.createOrder(
        ctx.sessionId!,
        shippingAddress,
        sameAsBilling ? shippingAddress : billingAddress,
        customerEmail
      );

      // Process payment using Python service
      try {
        const paymentResult = await processPayment({
          orderId: order.id,
          amount: order.total,
          currency: 'USD',
          customerEmail: order.customerEmail,
          paymentMethod: paymentMethod || {
            cardNumber: '4242424242424242',
            expiry: '12/25',
            cvv: '123',
          },
        });

        // Update order with payment ID
        order.paymentId = paymentResult.transactionId;
        this.db.updateOrderStatus(order.id, OrderStatus.PROCESSING);

        console.log(`✓ Payment processed: ${paymentResult.transactionId}`);
      } catch (paymentError) {
        console.error('Payment processing failed:', paymentError);
        return this.errorResponse(402, 'Payment processing failed', paymentError);
      }

      // Send order confirmation email using Ruby service
      try {
        await sendOrderConfirmation({
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerEmail: order.customerEmail,
          customerName: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
          items: order.items,
          total: order.total,
          shippingAddress: order.shippingAddress,
        });

        console.log(`✓ Order confirmation email sent to ${order.customerEmail}`);
      } catch (emailError) {
        // Don't fail the order if email fails, just log it
        console.error('Failed to send order confirmation email:', emailError);
      }

      return this.jsonResponse(201, {
        message: 'Order created successfully',
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          total: order.total,
          items: order.items,
          customerEmail: order.customerEmail,
          shippingAddress: order.shippingAddress,
          createdAt: order.createdAt,
        },
      });
    } catch (error) {
      return this.errorResponse(500, 'Failed to create order', error);
    }
  }

  /**
   * Update order status
   */
  private updateOrderStatus(id: string, ctx: RequestContext): Response {
    const { status } = ctx.body || {};

    // Validate status
    if (!status || !Object.values(OrderStatus).includes(status)) {
      return this.errorResponse(400, 'Invalid order status', {
        validStatuses: Object.values(OrderStatus),
      });
    }

    try {
      const order = this.db.updateOrderStatus(id, status);

      if (!order) {
        return this.errorResponse(404, 'Order not found');
      }

      return this.jsonResponse(200, {
        message: 'Order status updated',
        order,
      });
    } catch (error) {
      return this.errorResponse(500, 'Failed to update order status', error);
    }
  }

  /**
   * Validate checkout data
   */
  private validateCheckout(data: {
    shippingAddress: any;
    billingAddress: any;
    customerEmail: any;
    paymentMethod: any;
  }): string[] {
    const errors: string[] = [];

    // Validate shipping address
    if (!this.validateAddress(data.shippingAddress)) {
      errors.push('Invalid shipping address');
    }

    // Validate billing address
    if (!this.validateAddress(data.billingAddress)) {
      errors.push('Invalid billing address');
    }

    // Validate customer email
    if (!data.customerEmail || typeof data.customerEmail !== 'string') {
      errors.push('Customer email is required');
    }

    // Validate payment method
    if (!this.validatePaymentMethod(data.paymentMethod)) {
      errors.push('Invalid payment method');
    }

    return errors;
  }

  /**
   * Validate address
   */
  private validateAddress(address: any): boolean {
    if (!address || typeof address !== 'object') return false;

    const required = ['firstName', 'lastName', 'address', 'city', 'state', 'zipCode', 'phone'];

    for (const field of required) {
      if (!address[field] || typeof address[field] !== 'string' || address[field].trim() === '') {
        return false;
      }
    }

    // Validate ZIP code format
    if (!/^\d{5}$/.test(address.zipCode)) {
      return false;
    }

    return true;
  }

  /**
   * Validate payment method
   */
  private validatePaymentMethod(payment: any): boolean {
    if (!payment || typeof payment !== 'object') return false;

    // Basic validation - in production, this would use Stripe's validation
    if (!payment.cardNumber || typeof payment.cardNumber !== 'string') return false;
    if (!payment.expiry || typeof payment.expiry !== 'string') return false;
    if (!payment.cvv || typeof payment.cvv !== 'string') return false;

    return true;
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
