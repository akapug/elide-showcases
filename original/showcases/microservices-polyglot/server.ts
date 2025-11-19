/**
 * Microservices Polyglot Mesh
 *
 * Demonstrates a complete microservices architecture with services
 * implemented in different languages:
 * - TypeScript: API Gateway + User Service
 * - Python: Recommendation Engine
 * - Ruby: Notification Service
 * - Go: Payment Processing
 * - Java: Order Management
 *
 * This showcase illustrates service mesh patterns, inter-service communication,
 * and distributed system coordination across multiple languages.
 */

// Service Registry
interface ServiceEndpoint {
  name: string;
  language: string;
  url: string;
  health: string;
  version: string;
}

const serviceRegistry: ServiceEndpoint[] = [
  { name: 'user-service', language: 'typescript', url: 'http://localhost:3001', health: 'healthy', version: '1.0.0' },
  { name: 'recommendation-service', language: 'python', url: 'http://localhost:3002', health: 'healthy', version: '1.0.0' },
  { name: 'notification-service', language: 'ruby', url: 'http://localhost:3003', health: 'healthy', version: '1.0.0' },
  { name: 'payment-service', language: 'go', url: 'http://localhost:3004', health: 'healthy', version: '1.0.0' },
  { name: 'order-service', language: 'java', url: 'http://localhost:3005', health: 'healthy', version: '1.0.0' },
];

// API Gateway (TypeScript)
class APIGateway {
  private services = new Map<string, ServiceEndpoint>();

  constructor() {
    for (const service of serviceRegistry) {
      this.services.set(service.name, service);
    }
  }

  async routeRequest(serviceName: string, path: string, method: string, body?: any): Promise<any> {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service not found: ${serviceName}`);
    }

    console.log(`[API Gateway] Routing ${method} ${path} to ${service.name} (${service.language})`);

    // Simulate HTTP request to service
    // In production, use actual HTTP client
    return this.simulateServiceCall(serviceName, path, method, body);
  }

  private async simulateServiceCall(serviceName: string, path: string, method: string, body?: any): Promise<any> {
    // Simulate different service responses
    switch (serviceName) {
      case 'user-service':
        return UserService.handleRequest(path, method, body);
      case 'recommendation-service':
        return RecommendationService.handleRequest(path, method, body);
      case 'notification-service':
        return NotificationService.handleRequest(path, method, body);
      case 'payment-service':
        return PaymentService.handleRequest(path, method, body);
      case 'order-service':
        return OrderService.handleRequest(path, method, body);
      default:
        throw new Error(`Unknown service: ${serviceName}`);
    }
  }

  getServiceHealth(): Record<string, any> {
    const health: Record<string, any> = {};
    for (const [name, service] of this.services) {
      health[name] = {
        status: service.health,
        language: service.language,
        version: service.version,
        url: service.url,
      };
    }
    return health;
  }
}

// User Service (TypeScript)
class UserService {
  private static users = new Map([
    ['1', { id: '1', email: 'alice@example.com', name: 'Alice Johnson', preferences: { theme: 'dark', notifications: true } }],
    ['2', { id: '2', email: 'bob@example.com', name: 'Bob Smith', preferences: { theme: 'light', notifications: false } }],
  ]);

  static handleRequest(path: string, method: string, body?: any): any {
    console.log(`  [TypeScript User Service] ${method} ${path}`);

    if (path === '/users' && method === 'GET') {
      return { users: Array.from(this.users.values()) };
    }

    if (path.startsWith('/users/') && method === 'GET') {
      const id = path.split('/')[2];
      return this.users.get(id) || { error: 'User not found' };
    }

    if (path === '/users' && method === 'POST') {
      const id = String(this.users.size + 1);
      const user = { id, ...body };
      this.users.set(id, user);
      return user;
    }

    return { error: 'Not found' };
  }
}

// Recommendation Service (Python-style)
class RecommendationService {
  static handleRequest(path: string, method: string, body?: any): any {
    console.log(`  [Python Recommendation Service] ${method} ${path}`);

    if (path.startsWith('/recommendations/') && method === 'GET') {
      const userId = path.split('/')[2];
      // Simulate ML-based recommendations
      return {
        userId,
        recommendations: [
          { id: 'prod-1', score: 0.95, reason: 'Based on purchase history' },
          { id: 'prod-2', score: 0.87, reason: 'Similar users bought this' },
          { id: 'prod-3', score: 0.82, reason: 'Trending in your category' },
        ],
        algorithm: 'collaborative-filtering',
        modelVersion: '2.3.1',
      };
    }

    if (path === '/recommendations/retrain' && method === 'POST') {
      console.log('    → Retraining recommendation model with Python ML libraries');
      return { status: 'training', estimatedTime: '5 minutes' };
    }

    return { error: 'Not found' };
  }
}

// Notification Service (Ruby-style)
class NotificationService {
  static handleRequest(path: string, method: string, body?: any): any {
    console.log(`  [Ruby Notification Service] ${method} ${path}`);

    if (path === '/notifications/send' && method === 'POST') {
      const { userId, type, message, channels } = body;
      console.log(`    → Sending ${type} notification to user ${userId}`);
      console.log(`    → Channels: ${channels.join(', ')}`);
      console.log(`    → Message: ${message}`);

      return {
        notificationId: `notif-${Date.now()}`,
        status: 'sent',
        channels: channels.map((ch: string) => ({ channel: ch, status: 'delivered' })),
        timestamp: new Date().toISOString(),
      };
    }

    if (path === '/notifications/templates' && method === 'GET') {
      return {
        templates: [
          { id: 'welcome-email', type: 'email', language: 'en' },
          { id: 'order-confirmation', type: 'email', language: 'en' },
          { id: 'payment-alert', type: 'sms', language: 'en' },
        ],
      };
    }

    return { error: 'Not found' };
  }
}

// Payment Service (Go-style)
class PaymentService {
  static handleRequest(path: string, method: string, body?: any): any {
    console.log(`  [Go Payment Service] ${method} ${path}`);

    if (path === '/payments/charge' && method === 'POST') {
      const { userId, amount, currency, method } = body;
      console.log(`    → Processing payment: ${amount} ${currency} via ${method}`);

      // Simulate high-performance payment processing
      const transactionId = `txn-${Date.now()}`;
      return {
        transactionId,
        status: 'success',
        amount,
        currency,
        userId,
        processedAt: new Date().toISOString(),
        processingTime: '45ms', // Go's speed!
      };
    }

    if (path.startsWith('/payments/') && method === 'GET') {
      const txnId = path.split('/')[2];
      return {
        transactionId: txnId,
        status: 'completed',
        amount: 99.99,
        currency: 'USD',
        createdAt: new Date().toISOString(),
      };
    }

    return { error: 'Not found' };
  }
}

// Order Service (Java-style)
class OrderService {
  private static orders = new Map([
    ['order-1', { id: 'order-1', userId: '1', items: [{ productId: 'prod-1', quantity: 2, price: 29.99 }], status: 'completed', total: 59.98 }],
  ]);

  static handleRequest(path: string, method: string, body?: any): any {
    console.log(`  [Java Order Service] ${method} ${path}`);

    if (path === '/orders' && method === 'POST') {
      const orderId = `order-${this.orders.size + 1}`;
      const order = {
        id: orderId,
        ...body,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      this.orders.set(orderId, order);

      console.log(`    → Order created: ${orderId}`);
      console.log(`    → Items: ${body.items.length}`);
      console.log(`    → Total: ${body.total}`);

      return order;
    }

    if (path.startsWith('/orders/') && method === 'GET') {
      const orderId = path.split('/')[2];
      return this.orders.get(orderId) || { error: 'Order not found' };
    }

    if (path === '/orders' && method === 'GET') {
      return { orders: Array.from(this.orders.values()) };
    }

    return { error: 'Not found' };
  }
}

// Orchestration: Complete Order Flow
async function completeOrderFlow(gateway: APIGateway, userId: string) {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         Complete Order Flow (Polyglot Orchestration)      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Step 1: Get user info (TypeScript)
  console.log('[Step 1] Get User Info');
  const user = await gateway.routeRequest('user-service', `/users/${userId}`, 'GET');
  console.log('User:', user);
  console.log();

  // Step 2: Get recommendations (Python)
  console.log('[Step 2] Get Product Recommendations');
  const recommendations = await gateway.routeRequest('recommendation-service', `/recommendations/${userId}`, 'GET');
  console.log('Recommendations:', recommendations.recommendations.length, 'products');
  console.log();

  // Step 3: Create order (Java)
  console.log('[Step 3] Create Order');
  const order = await gateway.routeRequest('order-service', '/orders', 'POST', {
    userId,
    items: [
      { productId: recommendations.recommendations[0].id, quantity: 1, price: 49.99 },
    ],
    total: 49.99,
  });
  console.log('Order created:', order.id);
  console.log();

  // Step 4: Process payment (Go)
  console.log('[Step 4] Process Payment');
  const payment = await gateway.routeRequest('payment-service', '/payments/charge', 'POST', {
    userId,
    amount: order.total,
    currency: 'USD',
    method: 'card',
  });
  console.log('Payment processed:', payment.transactionId);
  console.log();

  // Step 5: Send notifications (Ruby)
  console.log('[Step 5] Send Order Confirmation');
  const notification = await gateway.routeRequest('notification-service', '/notifications/send', 'POST', {
    userId,
    type: 'order-confirmation',
    message: `Your order ${order.id} has been confirmed!`,
    channels: ['email', 'push'],
  });
  console.log('Notifications sent:', notification.notificationId);
  console.log();

  console.log('═══════════════════════════════════════════════════════════');
  console.log('Order Flow Complete!');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('Services used:');
  console.log('  ✓ TypeScript: User lookup');
  console.log('  ✓ Python: ML recommendations');
  console.log('  ✓ Java: Order management');
  console.log('  ✓ Go: Payment processing');
  console.log('  ✓ Ruby: Notifications');
  console.log();
}

// Main demo
export async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║     Microservices Polyglot Mesh - Elide Showcase        ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log();
  console.log('Microservices Architecture:');
  console.log('  • API Gateway:            TypeScript');
  console.log('  • User Service:           TypeScript');
  console.log('  • Recommendation Service: Python (ML/AI)');
  console.log('  • Notification Service:   Ruby (Message queues)');
  console.log('  • Payment Service:        Go (High performance)');
  console.log('  • Order Service:          Java (Enterprise systems)');
  console.log();

  const gateway = new APIGateway();

  // Check service health
  console.log('════════════════════════════════════════════════════════════');
  console.log('Service Health Check');
  console.log('════════════════════════════════════════════════════════════');
  const health = gateway.getServiceHealth();
  for (const [name, status] of Object.entries(health)) {
    console.log(`  ${name.padEnd(25)} [${status.language.padEnd(10)}] ${status.status}`);
  }
  console.log();

  // Individual service tests
  console.log('════════════════════════════════════════════════════════════');
  console.log('Individual Service Tests');
  console.log('════════════════════════════════════════════════════════════');
  console.log();

  console.log('[Test 1] User Service');
  await gateway.routeRequest('user-service', '/users/1', 'GET');
  console.log();

  console.log('[Test 2] Recommendation Service');
  await gateway.routeRequest('recommendation-service', '/recommendations/1', 'GET');
  console.log();

  console.log('[Test 3] Payment Service');
  await gateway.routeRequest('payment-service', '/payments/charge', 'POST', {
    userId: '1',
    amount: 99.99,
    currency: 'USD',
    method: 'card',
  });
  console.log();

  console.log('[Test 4] Notification Service');
  await gateway.routeRequest('notification-service', '/notifications/send', 'POST', {
    userId: '1',
    type: 'welcome',
    message: 'Welcome to our platform!',
    channels: ['email'],
  });
  console.log();

  console.log('[Test 5] Order Service');
  await gateway.routeRequest('order-service', '/orders', 'GET');
  console.log();

  // Complete order flow
  await completeOrderFlow(gateway, '2');

  console.log('Key Benefits Demonstrated:');
  console.log('  ✓ Service isolation and independence');
  console.log('  ✓ Language-specific strengths (ML, performance, etc.)');
  console.log('  ✓ Centralized API gateway');
  console.log('  ✓ Service discovery and health checks');
  console.log('  ✓ Cross-service orchestration');
  console.log('  ✓ Each team uses their preferred language');
  console.log();
}

if (import.meta.url.includes('server.ts')) {
  main().catch(console.error);
}
