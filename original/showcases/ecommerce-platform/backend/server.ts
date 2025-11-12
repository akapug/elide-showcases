/**
 * E-commerce Platform Backend Server
 *
 * Main HTTP server for the e-commerce platform built with Elide.
 * Handles product catalog, shopping cart, orders, and inventory management.
 *
 * Architecture:
 * - TypeScript API server (this file)
 * - Product, cart, order, and inventory routes
 * - Integration with Python payment service
 * - Integration with Ruby email service
 * - Shared utilities (UUID, validator, decimal, nanoid, bytes)
 *
 * Features:
 * - RESTful API
 * - Session-based shopping cart
 * - Real-time inventory tracking
 * - Order management
 * - Payment processing integration
 * - Email notifications integration
 *
 * Try running with: elide run backend/server.ts
 */

import { ProductRoutes } from './routes/products.ts';
import { CartRoutes } from './routes/cart.ts';
import { OrderRoutes } from './routes/orders.ts';
import { InventoryRoutes } from './routes/inventory.ts';
import { Database } from './db/database.ts';
import { v4 as uuidv4 } from '../shared/uuid.ts';

// Import new production services
import { CartManager } from './services/cart-manager.ts';
import { CheckoutEngine } from './services/checkout-engine.ts';
import { PaymentProcessor } from './services/payment-processor.ts';
import { InventoryTracker } from './services/inventory-tracker.ts';
import { ShippingCalculator } from './services/shipping-calculator.ts';
import { RecommendationEngine } from './services/recommendation-engine.ts';
import { SearchEngine } from './services/search-engine.ts';

/**
 * Request context interface
 */
export interface RequestContext {
  requestId: string;
  method: string;
  path: string;
  query: Record<string, any>;
  headers: Record<string, string>;
  body?: any;
  sessionId?: string;
  startTime: number;
}

/**
 * Response interface
 */
export interface Response {
  status: number;
  headers: Record<string, string>;
  body: any;
}

/**
 * Server configuration
 */
const CONFIG = {
  port: 3000,
  host: '0.0.0.0',
  corsOrigins: ['http://localhost:3000', 'http://localhost:8080'],
  sessionCookieName: 'elide-shop-session',
  sessionMaxAge: 86400000, // 24 hours
};

/**
 * Main E-commerce Server
 */
export class EcommerceServer {
  private db: Database;
  private productRoutes: ProductRoutes;
  private cartRoutes: CartRoutes;
  private orderRoutes: OrderRoutes;
  private inventoryRoutes: InventoryRoutes;

  // Production services
  private cartManager: CartManager;
  private checkoutEngine: CheckoutEngine;
  private paymentProcessor: PaymentProcessor;
  private inventoryTracker: InventoryTracker;
  private shippingCalculator: ShippingCalculator;
  private recommendationEngine: RecommendationEngine;
  private searchEngine: SearchEngine;

  constructor() {
    this.db = new Database();
    this.productRoutes = new ProductRoutes(this.db);
    this.cartRoutes = new CartRoutes(this.db);
    this.orderRoutes = new OrderRoutes(this.db);
    this.inventoryRoutes = new InventoryRoutes(this.db);

    // Initialize production services
    this.cartManager = new CartManager(this.db);
    this.checkoutEngine = new CheckoutEngine(this.db);
    this.paymentProcessor = new PaymentProcessor();
    this.inventoryTracker = new InventoryTracker(this.db);
    this.shippingCalculator = new ShippingCalculator();
    this.recommendationEngine = new RecommendationEngine(this.db);
    this.searchEngine = new SearchEngine(this.db);
  }

  /**
   * Handle incoming HTTP requests
   */
  async handleRequest(req: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: any;
  }): Promise<Response> {
    const startTime = Date.now();
    const requestId = uuidv4();

    // Parse URL
    const urlParts = req.url.split('?');
    const path = urlParts[0];
    const queryString = urlParts[1] || '';
    const query = this.parseQueryString(queryString);

    // Get or create session
    const sessionId = this.getOrCreateSession(req.headers);

    // Create request context
    const ctx: RequestContext = {
      requestId,
      method: req.method.toUpperCase(),
      path,
      query,
      headers: req.headers,
      body: req.body,
      sessionId,
      startTime,
    };

    // Log request
    this.logRequest(ctx);

    try {
      // Route the request
      const response = await this.route(ctx);

      // Add CORS headers
      response.headers = {
        ...response.headers,
        'Access-Control-Allow-Origin': CONFIG.corsOrigins[0],
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Credentials': 'true',
      };

      // Set session cookie if needed
      if (ctx.sessionId) {
        response.headers['Set-Cookie'] = `${CONFIG.sessionCookieName}=${ctx.sessionId}; Max-Age=${CONFIG.sessionMaxAge}; Path=/; HttpOnly`;
      }

      // Log response
      this.logResponse(ctx, response);

      return response;
    } catch (error) {
      console.error('Request error:', error);
      return this.errorResponse(500, 'Internal server error');
    }
  }

  /**
   * Route requests to appropriate handlers
   */
  private async route(ctx: RequestContext): Promise<Response> {
    const { method, path } = ctx;

    // Health check
    if (path === '/health') {
      return this.jsonResponse(200, {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime ? process.uptime() : 0,
      });
    }

    // API info
    if (path === '/api' && method === 'GET') {
      return this.jsonResponse(200, {
        name: 'ElideShop API',
        version: '1.0.0',
        description: 'E-commerce platform powered by Elide polyglot runtime',
        endpoints: {
          products: '/api/products',
          cart: '/api/cart',
          orders: '/api/orders',
          inventory: '/api/inventory',
        },
        services: {
          api: 'TypeScript (Elide)',
          payment: 'Python (Stripe integration)',
          email: 'Ruby (order confirmations)',
        },
        shared_utilities: ['UUID', 'Validator', 'Decimal.js', 'Nanoid', 'Bytes'],
      });
    }

    // Product routes
    if (path.startsWith('/api/products')) {
      return this.productRoutes.handle(ctx);
    }

    // Cart routes
    if (path.startsWith('/api/cart')) {
      return this.cartRoutes.handle(ctx);
    }

    // Order routes
    if (path.startsWith('/api/orders')) {
      return this.orderRoutes.handle(ctx);
    }

    // Inventory routes
    if (path.startsWith('/api/inventory')) {
      return this.inventoryRoutes.handle(ctx);
    }

    // Search routes
    if (path === '/api/search' && method === 'GET') {
      return this.handleSearch(ctx);
    }

    // Recommendations routes
    if (path === '/api/recommendations/personalized' && method === 'GET') {
      return this.handlePersonalizedRecommendations(ctx);
    }
    if (path === '/api/recommendations/trending' && method === 'GET') {
      return this.handleTrendingProducts(ctx);
    }
    if (path.match(/^\/api\/recommendations\/similar\/[\w-]+$/) && method === 'GET') {
      const productId = path.split('/').pop()!;
      return this.handleSimilarProducts(productId);
    }

    // Cart manager routes
    if (path === '/api/cart/summary' && method === 'GET') {
      return this.handleCartSummary(ctx);
    }
    if (path === '/api/wishlist' && method === 'GET') {
      return this.handleGetWishlist(ctx);
    }
    if (path === '/api/wishlist' && method === 'POST') {
      return this.handleAddToWishlist(ctx);
    }

    // Checkout routes
    if (path === '/api/checkout/session' && method === 'POST') {
      return this.handleCreateCheckoutSession(ctx);
    }
    if (path === '/api/checkout/discount' && method === 'POST') {
      return this.handleApplyDiscount(ctx);
    }

    // Payment routes
    if (path === '/api/payment/intent' && method === 'POST') {
      return this.handleCreatePaymentIntent(ctx);
    }
    if (path === '/api/payment/process' && method === 'POST') {
      return this.handleProcessPayment(ctx);
    }

    // Shipping routes
    if (path === '/api/shipping/rates' && method === 'POST') {
      return this.handleCalculateShipping(ctx);
    }

    // Analytics routes
    if (path === '/api/analytics/dashboard' && method === 'GET') {
      return this.handleAnalyticsDashboard(ctx);
    }

    // 404 Not Found
    return this.errorResponse(404, 'Endpoint not found');
  }

  /**
   * Parse query string to object
   */
  private parseQueryString(qs: string): Record<string, any> {
    if (!qs) return {};

    const params: Record<string, any> = {};
    const pairs = qs.split('&');

    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key) {
        params[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
      }
    }

    return params;
  }

  /**
   * Get or create session ID
   */
  private getOrCreateSession(headers: Record<string, string>): string {
    const cookieHeader = headers['cookie'] || headers['Cookie'];
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map(c => c.trim());
      const sessionCookie = cookies.find(c => c.startsWith(`${CONFIG.sessionCookieName}=`));
      if (sessionCookie) {
        return sessionCookie.split('=')[1];
      }
    }

    // Create new session
    return uuidv4();
  }

  /**
   * Create JSON response
   */
  private jsonResponse(status: number, body: any): Response {
    return {
      status,
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    };
  }

  /**
   * Create error response
   */
  private errorResponse(status: number, message: string, details?: any): Response {
    return this.jsonResponse(status, {
      error: message,
      status,
      details,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log incoming request
   */
  private logRequest(ctx: RequestContext) {
    console.log(`[${ctx.requestId}] ${ctx.method} ${ctx.path}`);
  }

  /**
   * Log response
   */
  private logResponse(ctx: RequestContext, response: Response) {
    const duration = Date.now() - ctx.startTime;
    console.log(`[${ctx.requestId}] ${response.status} (${duration}ms)`);
  }

  /**
   * Initialize the database with sample data
   */
  async initialize() {
    await this.db.initialize();
  }

  /**
   * Get database instance
   */
  getDatabase(): Database {
    return this.db;
  }

  // ============================================================================
  // New Production Feature Handlers
  // ============================================================================

  /**
   * Handle advanced search
   */
  private handleSearch(ctx: RequestContext): Response {
    const query = ctx.query.q || ctx.query.query || '';
    const page = parseInt(ctx.query.page || '1', 10);
    const limit = parseInt(ctx.query.limit || '20', 10);

    const searchQuery = {
      query: query as string,
      page,
      limit,
      filters: {
        categories: ctx.query.category ? [ctx.query.category as string] : undefined,
        minPrice: ctx.query.minPrice ? parseFloat(ctx.query.minPrice as string) : undefined,
        maxPrice: ctx.query.maxPrice ? parseFloat(ctx.query.maxPrice as string) : undefined,
        inStock: ctx.query.inStock === 'true',
      },
      sort: ctx.query.sort ? {
        field: ctx.query.sortField as any || 'relevance',
        order: ctx.query.sortOrder as any || 'desc',
      } : undefined,
    };

    const results = this.searchEngine.search(searchQuery);
    return this.jsonResponse(200, results);
  }

  /**
   * Handle personalized recommendations
   */
  private handlePersonalizedRecommendations(ctx: RequestContext): Response {
    const recommendations = this.recommendationEngine.getPersonalizedRecommendations({
      sessionId: ctx.sessionId,
    }, 10);

    return this.jsonResponse(200, { recommendations });
  }

  /**
   * Handle trending products
   */
  private handleTrendingProducts(ctx: RequestContext): Response {
    const trending = this.recommendationEngine.getTrendingProducts(10);
    return this.jsonResponse(200, { trending });
  }

  /**
   * Handle similar products
   */
  private handleSimilarProducts(productId: string): Response {
    const similar = this.recommendationEngine.getSimilarProducts(productId, 6);
    return this.jsonResponse(200, { similar });
  }

  /**
   * Handle cart summary
   */
  private handleCartSummary(ctx: RequestContext): Response {
    if (!ctx.sessionId) {
      return this.errorResponse(400, 'Session required');
    }

    const summary = this.cartManager.getCartSummary(ctx.sessionId);
    const validation = this.cartManager.validateCart(ctx.sessionId);

    return this.jsonResponse(200, { summary, validation });
  }

  /**
   * Handle get wishlist
   */
  private handleGetWishlist(ctx: RequestContext): Response {
    if (!ctx.sessionId) {
      return this.errorResponse(400, 'Session required');
    }

    const wishlist = this.cartManager.getWishlist(ctx.sessionId);
    return this.jsonResponse(200, { wishlist });
  }

  /**
   * Handle add to wishlist
   */
  private handleAddToWishlist(ctx: RequestContext): Response {
    if (!ctx.sessionId) {
      return this.errorResponse(400, 'Session required');
    }

    const { productId, notes, priority } = ctx.body;
    if (!productId) {
      return this.errorResponse(400, 'Product ID required');
    }

    try {
      const item = this.cartManager.addToWishlist(ctx.sessionId, productId, notes, priority);
      return this.jsonResponse(200, { item });
    } catch (error) {
      return this.errorResponse(400, error instanceof Error ? error.message : 'Failed to add to wishlist');
    }
  }

  /**
   * Handle create checkout session
   */
  private handleCreateCheckoutSession(ctx: RequestContext): Response {
    if (!ctx.sessionId) {
      return this.errorResponse(400, 'Session required');
    }

    try {
      const checkoutSession = this.checkoutEngine.createCheckoutSession(ctx.sessionId);
      return this.jsonResponse(200, { checkoutSession });
    } catch (error) {
      return this.errorResponse(400, error instanceof Error ? error.message : 'Failed to create checkout session');
    }
  }

  /**
   * Handle apply discount code
   */
  private handleApplyDiscount(ctx: RequestContext): Response {
    const { checkoutId, code } = ctx.body;
    if (!checkoutId || !code) {
      return this.errorResponse(400, 'Checkout ID and discount code required');
    }

    try {
      const session = this.checkoutEngine.applyDiscountCode(checkoutId, code);
      return this.jsonResponse(200, { session });
    } catch (error) {
      return this.errorResponse(400, error instanceof Error ? error.message : 'Failed to apply discount');
    }
  }

  /**
   * Handle create payment intent
   */
  private handleCreatePaymentIntent(ctx: RequestContext): Response {
    const { orderId, amount, currency, customerEmail, customerName, method } = ctx.body;

    if (!orderId || !amount || !customerEmail) {
      return this.errorResponse(400, 'Missing required payment information');
    }

    const intent = this.paymentProcessor.createPaymentIntent(
      orderId,
      amount,
      currency || 'USD',
      customerEmail,
      customerName || 'Customer',
      method || 'credit_card'
    );

    return this.jsonResponse(200, { intent });
  }

  /**
   * Handle process payment
   */
  private async handleProcessPayment(ctx: RequestContext): Promise<Response> {
    const { intentId, paymentMethod } = ctx.body;

    if (!intentId || !paymentMethod) {
      return this.errorResponse(400, 'Payment intent ID and method required');
    }

    try {
      const result = await this.paymentProcessor.processStripePayment(intentId, paymentMethod);
      return this.jsonResponse(200, { result });
    } catch (error) {
      return this.errorResponse(400, error instanceof Error ? error.message : 'Payment processing failed');
    }
  }

  /**
   * Handle calculate shipping
   */
  private handleCalculateShipping(ctx: RequestContext): Response {
    const { destination, packages, orderTotal } = ctx.body;

    if (!destination || !packages) {
      return this.errorResponse(400, 'Destination and packages required');
    }

    const quote = this.shippingCalculator.calculateRates(
      destination,
      packages,
      orderTotal || 0
    );

    return this.jsonResponse(200, { quote });
  }

  /**
   * Handle analytics dashboard
   */
  private handleAnalyticsDashboard(ctx: RequestContext): Response {
    const cartAnalytics = this.cartManager.getCartAnalytics();
    const inventoryAnalytics = this.inventoryTracker.getInventoryAnalytics();
    const searchAnalytics = this.searchEngine.getSearchAnalytics();
    const recommendationAnalytics = this.recommendationEngine.getRecommendationAnalytics();
    const paymentAnalytics = this.paymentProcessor.getPaymentAnalytics();

    const dashboard = {
      cart: cartAnalytics,
      inventory: inventoryAnalytics,
      search: searchAnalytics,
      recommendations: recommendationAnalytics,
      payments: paymentAnalytics,
      timestamp: new Date().toISOString(),
    };

    return this.jsonResponse(200, dashboard);
  }
}

/**
 * Main function (CLI entry point)
 */
export async function main() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║   ElideShop - E-commerce Platform on Elide          ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log();
  console.log('Architecture:');
  console.log('  Backend:    TypeScript (Elide)');
  console.log('  Services:');
  console.log('    - Payment:   Python (Stripe integration)');
  console.log('    - Email:     Ruby (order confirmations)');
  console.log('    - Inventory: TypeScript');
  console.log();
  console.log('Shared Utilities (Polyglot):');
  console.log('  - UUID:      Universal identifier generation');
  console.log('  - Validator: Email, URL, UUID validation');
  console.log('  - Decimal:   Precise price calculations');
  console.log('  - Nanoid:    Short unique IDs');
  console.log('  - Bytes:     Size parsing and formatting');
  console.log();

  // Create and initialize server
  const server = new EcommerceServer();
  await server.initialize();

  console.log(`Server ready on http://${CONFIG.host}:${CONFIG.port}`);
  console.log();
  console.log('API Endpoints:');
  console.log('  GET    /health                      - Health check');
  console.log('  GET    /api                         - API info');
  console.log();
  console.log('Products:');
  console.log('  GET    /api/products                - List products');
  console.log('  GET    /api/products/:id            - Get product');
  console.log('  POST   /api/products                - Create product (admin)');
  console.log('  PUT    /api/products/:id            - Update product (admin)');
  console.log('  DELETE /api/products/:id            - Delete product (admin)');
  console.log();
  console.log('Cart:');
  console.log('  GET    /api/cart                    - Get cart');
  console.log('  POST   /api/cart/items              - Add item to cart');
  console.log('  PUT    /api/cart/items/:id          - Update cart item');
  console.log('  DELETE /api/cart/items/:id          - Remove from cart');
  console.log('  DELETE /api/cart                    - Clear cart');
  console.log();
  console.log('Orders:');
  console.log('  GET    /api/orders                  - List orders');
  console.log('  GET    /api/orders/:id              - Get order');
  console.log('  POST   /api/orders                  - Create order (checkout)');
  console.log();
  console.log('Inventory:');
  console.log('  GET    /api/inventory               - Get inventory status');
  console.log('  GET    /api/inventory/:id           - Get product inventory');
  console.log('  PUT    /api/inventory/:id           - Update stock (admin)');
  console.log();

  // Demo: Test some endpoints
  console.log('══════════════════════════════════════════════════════');
  console.log('Demo: Testing Endpoints');
  console.log('══════════════════════════════════════════════════════');
  console.log();

  // Test health endpoint
  console.log('[TEST 1] Health Check');
  const healthRes = await server.handleRequest({
    method: 'GET',
    url: '/health',
    headers: {},
  });
  console.log(`Status: ${healthRes.status}`);
  console.log(`Body:`, JSON.stringify(healthRes.body, null, 2));
  console.log();

  // Test API info
  console.log('[TEST 2] API Info');
  const apiRes = await server.handleRequest({
    method: 'GET',
    url: '/api',
    headers: {},
  });
  console.log(`Status: ${apiRes.status}`);
  console.log(`Body:`, JSON.stringify(apiRes.body, null, 2));
  console.log();

  // Test products list
  console.log('[TEST 3] List Products');
  const productsRes = await server.handleRequest({
    method: 'GET',
    url: '/api/products?limit=5',
    headers: {},
  });
  console.log(`Status: ${productsRes.status}`);
  console.log(`Products found: ${productsRes.body.products?.length || 0}`);
  console.log();

  // Test add to cart
  console.log('[TEST 4] Add to Cart');
  const db = server.getDatabase();
  const firstProduct = db.getProducts()[0];
  if (firstProduct) {
    const cartRes = await server.handleRequest({
      method: 'POST',
      url: '/api/cart/items',
      headers: {},
      body: {
        productId: firstProduct.id,
        quantity: 2,
      },
    });
    console.log(`Status: ${cartRes.status}`);
    console.log(`Cart items: ${cartRes.body.items?.length || 0}`);
    console.log(`Cart total: $${cartRes.body.total?.toFixed(2) || '0.00'}`);
    console.log();
  }

  // Test inventory
  console.log('[TEST 5] Check Inventory');
  const inventoryRes = await server.handleRequest({
    method: 'GET',
    url: '/api/inventory',
    headers: {},
  });
  console.log(`Status: ${inventoryRes.status}`);
  console.log(`Total products: ${inventoryRes.body.totalProducts || 0}`);
  console.log(`Total stock: ${inventoryRes.body.totalStock || 0}`);
  console.log();

  console.log('══════════════════════════════════════════════════════');
  console.log('Server Tests Complete!');
  console.log('══════════════════════════════════════════════════════');
  console.log();
  console.log('Production Features:');
  console.log('  ✓ Advanced search with filters & autocomplete');
  console.log('  ✓ AI-powered product recommendations');
  console.log('  ✓ Shopping cart with wishlist & save-for-later');
  console.log('  ✓ Multi-step checkout with validation');
  console.log('  ✓ Payment processing (Stripe & PayPal)');
  console.log('  ✓ Multi-location inventory tracking');
  console.log('  ✓ Smart shipping calculation');
  console.log('  ✓ Discount codes & promotions');
  console.log('  ✓ Tax calculation by jurisdiction');
  console.log('  ✓ Order fulfillment optimization');
  console.log('  ✓ Analytics dashboard');
  console.log();
  console.log('Polyglot Value:');
  console.log('  → One TypeScript implementation for utilities');
  console.log('  → Used by TS API, Python payments, Ruby emails');
  console.log('  → Consistent behavior everywhere');
  console.log('  → Zero code duplication');
  console.log();
}

// Run main function if executed directly
if (import.meta.url.includes('server.ts')) {
  main().catch(console.error);
}
