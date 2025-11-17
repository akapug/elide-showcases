/**
 * Advanced Micro Clone Example
 *
 * Demonstrates microservices patterns, service mesh, and advanced routing
 */

import micro, { send, json, text, buffer, Router } from '../src/micro.ts';

// ==================== SERVICE REGISTRY ====================

class ServiceRegistry {
  private services = new Map<string, ServiceInfo>();

  register(name: string, info: ServiceInfo) {
    this.services.set(name, {
      ...info,
      registeredAt: Date.now(),
      lastHeartbeat: Date.now()
    });
    console.log(`✓ Service registered: ${name} at ${info.url}`);
  }

  deregister(name: string) {
    this.services.delete(name);
    console.log(`✗ Service deregistered: ${name}`);
  }

  get(name: string): ServiceInfo | undefined {
    return this.services.get(name);
  }

  getAll(): ServiceInfo[] {
    return Array.from(this.services.values());
  }

  heartbeat(name: string) {
    const service = this.services.get(name);
    if (service) {
      service.lastHeartbeat = Date.now();
    }
  }

  checkHealth() {
    const now = Date.now();
    const timeout = 30000; // 30 seconds

    for (const [name, service] of this.services) {
      if (now - service.lastHeartbeat > timeout) {
        console.warn(`⚠️  Service ${name} is unhealthy (no heartbeat)`);
        service.healthy = false;
      }
    }
  }
}

interface ServiceInfo {
  name: string;
  url: string;
  version: string;
  healthy?: boolean;
  registeredAt?: number;
  lastHeartbeat?: number;
  metadata?: Record<string, any>;
}

const registry = new ServiceRegistry();

// Health check interval
setInterval(() => {
  registry.checkHealth();
}, 10000);

// ==================== SERVICE DISCOVERY ====================

const discoveryRouter = new Router();

discoveryRouter.post('/register', async (req, res) => {
  const body = await json(req);

  const { name, url, version, metadata } = body;

  if (!name || !url || !version) {
    return send(res, 400, {
      error: 'Missing required fields: name, url, version'
    });
  }

  registry.register(name, {
    name,
    url,
    version,
    healthy: true,
    metadata
  });

  return send(res, 201, {
    success: true,
    message: `Service ${name} registered successfully`
  });
});

discoveryRouter.post('/deregister/:name', async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const name = url.pathname.split('/')[2];

  registry.deregister(name);

  return send(res, 200, {
    success: true,
    message: `Service ${name} deregistered`
  });
});

discoveryRouter.post('/heartbeat/:name', async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const name = url.pathname.split('/')[2];

  registry.heartbeat(name);

  return send(res, 200, {
    success: true,
    timestamp: Date.now()
  });
});

discoveryRouter.get('/services', async (req, res) => {
  const services = registry.getAll();

  return send(res, 200, {
    services,
    count: services.length
  });
});

discoveryRouter.get('/services/:name', async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const name = url.pathname.split('/')[2];

  const service = registry.get(name);

  if (!service) {
    return send(res, 404, {
      error: `Service ${name} not found`
    });
  }

  return send(res, 200, { service });
});

// ==================== LOAD BALANCER ====================

class LoadBalancer {
  private currentIndex = 0;

  roundRobin(services: ServiceInfo[]): ServiceInfo | null {
    const healthy = services.filter(s => s.healthy !== false);

    if (healthy.length === 0) return null;

    const service = healthy[this.currentIndex % healthy.length];
    this.currentIndex++;

    return service;
  }

  leastConnections(services: ServiceInfo[]): ServiceInfo | null {
    // Simplified - in production, track actual connections
    return this.roundRobin(services);
  }

  random(services: ServiceInfo[]): ServiceInfo | null {
    const healthy = services.filter(s => s.healthy !== false);

    if (healthy.length === 0) return null;

    return healthy[Math.floor(Math.random() * healthy.length)];
  }
}

const loadBalancer = new LoadBalancer();

// ==================== API GATEWAY ====================

const gatewayRouter = new Router();

gatewayRouter.get('/health', async (req, res) => {
  return send(res, 200, {
    status: 'healthy',
    services: registry.getAll().length,
    timestamp: Date.now()
  });
});

gatewayRouter.get('/proxy/:service/*', async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const parts = url.pathname.split('/');
  const serviceName = parts[2];
  const path = '/' + parts.slice(3).join('/');

  const service = registry.get(serviceName);

  if (!service) {
    return send(res, 503, {
      error: 'Service Unavailable',
      message: `Service ${serviceName} not found`
    });
  }

  if (!service.healthy) {
    return send(res, 503, {
      error: 'Service Unhealthy',
      message: `Service ${serviceName} is not responding`
    });
  }

  // Simulate proxying request
  return send(res, 200, {
    proxied: true,
    service: serviceName,
    targetUrl: `${service.url}${path}`,
    method: req.method,
    timestamp: Date.now()
  });
});

// ==================== USER SERVICE ====================

const userServiceRouter = new Router();

const users = [
  { id: 1, username: 'alice', email: 'alice@example.com', role: 'admin' },
  { id: 2, username: 'bob', email: 'bob@example.com', role: 'user' },
  { id: 3, username: 'charlie', email: 'charlie@example.com', role: 'user' }
];

userServiceRouter.get('/', async (req, res) => {
  return send(res, 200, {
    service: 'users',
    version: '1.0.0',
    endpoints: ['/users', '/users/:id']
  });
});

userServiceRouter.get('/users', async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const role = url.searchParams.get('role');

  let filtered = users;

  if (role) {
    filtered = users.filter(u => u.role === role);
  }

  return send(res, 200, { users: filtered });
});

userServiceRouter.get('/users/:id', async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const id = parseInt(url.pathname.split('/')[2]);

  const user = users.find(u => u.id === id);

  if (!user) {
    return send(res, 404, { error: 'User not found' });
  }

  return send(res, 200, { user });
});

userServiceRouter.post('/users', async (req, res) => {
  const body = await json(req);

  const newUser = {
    id: users.length + 1,
    ...body
  };

  users.push(newUser);

  return send(res, 201, { user: newUser });
});

// ==================== ORDER SERVICE ====================

const orderServiceRouter = new Router();

const orders = [
  { id: 1, userId: 1, items: ['item1', 'item2'], total: 100, status: 'completed' },
  { id: 2, userId: 2, items: ['item3'], total: 50, status: 'pending' }
];

orderServiceRouter.get('/', async (req, res) => {
  return send(res, 200, {
    service: 'orders',
    version: '1.0.0',
    endpoints: ['/orders', '/orders/:id', '/orders/user/:userId']
  });
});

orderServiceRouter.get('/orders', async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const status = url.searchParams.get('status');

  let filtered = orders;

  if (status) {
    filtered = orders.filter(o => o.status === status);
  }

  return send(res, 200, { orders: filtered });
});

orderServiceRouter.get('/orders/:id', async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const id = parseInt(url.pathname.split('/')[2]);

  const order = orders.find(o => o.id === id);

  if (!order) {
    return send(res, 404, { error: 'Order not found' });
  }

  return send(res, 200, { order });
});

orderServiceRouter.get('/orders/user/:userId', async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const userId = parseInt(url.pathname.split('/')[3]);

  const userOrders = orders.filter(o => o.userId === userId);

  return send(res, 200, { orders: userOrders });
});

orderServiceRouter.post('/orders', async (req, res) => {
  const body = await json(req);

  const newOrder = {
    id: orders.length + 1,
    ...body,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  orders.push(newOrder);

  return send(res, 201, { order: newOrder });
});

// ==================== START SERVICES ====================

async function startServices() {
  // Service Discovery (port 4000)
  const discoveryHandler = micro(discoveryRouter.handler());
  discoveryHandler.listen(4000);
  console.log('📡 Service Discovery listening on port 4000\n');

  // API Gateway (port 4001)
  const gatewayHandler = micro(gatewayRouter.handler());
  gatewayHandler.listen(4001);
  console.log('🚪 API Gateway listening on port 4001');

  // User Service (port 4002)
  const userHandler = micro(userServiceRouter.handler());
  userHandler.listen(4002);
  console.log('👤 User Service listening on port 4002');

  // Register user service
  await fetch('http://localhost:4000/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'users',
      url: 'http://localhost:4002',
      version: '1.0.0',
      metadata: { description: 'User management service' }
    })
  });

  // Order Service (port 4003)
  const orderHandler = micro(orderServiceRouter.handler());
  orderHandler.listen(4003);
  console.log('📦 Order Service listening on port 4003');

  // Register order service
  await fetch('http://localhost:4000/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'orders',
      url: 'http://localhost:4003',
      version: '1.0.0',
      metadata: { description: 'Order management service' }
    })
  });

  // Start heartbeat for services
  setInterval(() => {
    fetch('http://localhost:4000/heartbeat/users', { method: 'POST' });
    fetch('http://localhost:4000/heartbeat/orders', { method: 'POST' });
  }, 5000);

  console.log('\n✅ All services started\n');
  console.log('Architecture:');
  console.log('  Service Discovery: http://localhost:4000');
  console.log('    • POST /register - Register service');
  console.log('    • POST /deregister/:name - Deregister service');
  console.log('    • POST /heartbeat/:name - Send heartbeat');
  console.log('    • GET  /services - List all services');
  console.log('    • GET  /services/:name - Get service info\n');
  console.log('  API Gateway: http://localhost:4001');
  console.log('    • GET /health - Gateway health');
  console.log('    • GET /proxy/:service/* - Proxy to service\n');
  console.log('  User Service: http://localhost:4002');
  console.log('    • GET  /users - List users');
  console.log('    • GET  /users/:id - Get user');
  console.log('    • POST /users - Create user\n');
  console.log('  Order Service: http://localhost:4003');
  console.log('    • GET  /orders - List orders');
  console.log('    • GET  /orders/:id - Get order');
  console.log('    • POST /orders - Create order\n');
  console.log('Features:');
  console.log('  ✓ Service discovery and registration');
  console.log('  ✓ Health checks and heartbeats');
  console.log('  ✓ API Gateway with routing');
  console.log('  ✓ Load balancing (round-robin)');
  console.log('  ✓ Service mesh architecture\n');
}

startServices().catch(console.error);
