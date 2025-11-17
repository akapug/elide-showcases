/**
 * Microservices Example for Fastify Clone
 *
 * Demonstrates service-to-service communication, service discovery
 */

import fastify from '../src/fastify.ts';

// Service Registry
const serviceRegistry = new Map();

function registerService(name: string, host: string, port: number) {
  serviceRegistry.set(name, { host, port, url: `http://${host}:${port}`, healthy: true });
}

function getService(name: string) {
  return serviceRegistry.get(name);
}

// ==================== API GATEWAY ====================

const gateway = fastify({ logger: true });

gateway.get('/services', async (request, reply) => {
  const services = Array.from(serviceRegistry.entries()).map(([name, info]) => ({
    name,
    ...info
  }));

  return { services, count: services.length };
});

gateway.post('/services/register', async (request, reply) => {
  const { name, host, port } = request.body;

  registerService(name, host, port);

  reply.code(201);
  return {
    success: true,
    message: `Service ${name} registered`,
    service: getService(name)
  };
});

gateway.get('/health', async (request, reply) => {
  const services = Array.from(serviceRegistry.entries()).map(([name, info]) => ({
    name,
    status: info.healthy ? 'healthy' : 'unhealthy'
  }));

  return {
    gateway: 'healthy',
    services
  };
});

// Proxy requests to microservices
gateway.all('/api/:service/*', async (request, reply) => {
  const { service } = request.params;
  const path = request.url.replace(`/api/${service}`, '');

  const serviceInfo = getService(service);

  if (!serviceInfo) {
    reply.code(503);
    return {
      error: 'ServiceUnavailable',
      message: `Service ${service} not found`
    };
  }

  // Simulate proxying request
  return {
    proxied: true,
    service,
    path,
    method: request.method,
    serviceUrl: serviceInfo.url
  };
});

// ==================== USER SERVICE ====================

const userService = fastify({ logger: true });

const users = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' },
  { id: 3, name: 'Charlie', email: 'charlie@example.com' }
];

userService.get('/users', async (request, reply) => {
  return { users };
});

userService.get('/users/:id', async (request, reply) => {
  const { id } = request.params;
  const user = users.find(u => u.id === parseInt(id));

  if (!user) {
    reply.code(404);
    return { error: 'User not found' };
  }

  return { user };
});

userService.post('/users', async (request, reply) => {
  const { name, email } = request.body;

  const newUser = {
    id: users.length + 1,
    name,
    email
  };

  users.push(newUser);

  reply.code(201);
  return { user: newUser };
});

userService.get('/health', async (request, reply) => {
  return {
    service: 'users',
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  };
});

// ==================== ORDER SERVICE ====================

const orderService = fastify({ logger: true });

const orders = [
  { id: 1, userId: 1, items: ['item1', 'item2'], total: 100 },
  { id: 2, userId: 2, items: ['item3'], total: 50 }
];

orderService.get('/orders', async (request, reply) => {
  const { userId } = request.query;

  if (userId) {
    const userOrders = orders.filter(o => o.userId === parseInt(userId));
    return { orders: userOrders };
  }

  return { orders };
});

orderService.get('/orders/:id', async (request, reply) => {
  const { id } = request.params;
  const order = orders.find(o => o.id === parseInt(id));

  if (!order) {
    reply.code(404);
    return { error: 'Order not found' };
  }

  return { order };
});

orderService.post('/orders', async (request, reply) => {
  const { userId, items, total } = request.body;

  const newOrder = {
    id: orders.length + 1,
    userId,
    items,
    total,
    createdAt: new Date().toISOString()
  };

  orders.push(newOrder);

  reply.code(201);
  return { order: newOrder };
});

orderService.get('/health', async (request, reply) => {
  return {
    service: 'orders',
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  };
});

// ==================== START SERVICES ====================

async function startMicroservices() {
  // Start API Gateway
  await gateway.listen({ port: 3000 });
  console.log('🚪 API Gateway listening on port 3000');

  // Start User Service
  await userService.listen({ port: 3001 });
  console.log('👤 User Service listening on port 3001');
  registerService('users', 'localhost', 3001);

  // Start Order Service
  await orderService.listen({ port: 3002 });
  console.log('📦 Order Service listening on port 3002');
  registerService('orders', 'localhost', 3002);

  console.log('\n✅ All microservices started');
  console.log('\nAPI Gateway: http://localhost:3000');
  console.log('  GET /services - List registered services');
  console.log('  GET /health - Health check');
  console.log('  GET /api/users/users - Get all users');
  console.log('  GET /api/orders/orders - Get all orders');
  console.log('\nDirect access:');
  console.log('  User Service: http://localhost:3001');
  console.log('  Order Service: http://localhost:3002\n');
}

startMicroservices().catch(console.error);
