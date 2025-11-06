/**
 * Example: REST API Server
 * Demonstrates routing, middleware, validation, and CRUD operations
 */

import { createApp } from '../../core/app';
import { logger } from '../../middleware/logger';
import { cors } from '../../middleware/cors';
import { rateLimit } from '../../middleware/rate-limit';
import { validateBody } from '../../helpers/validator';

// In-memory database
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

const users = new Map<string, User>();

// Seed data
users.set('1', {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  createdAt: new Date().toISOString(),
});

users.set('2', {
  id: '2',
  name: 'Jane Smith',
  email: 'jane@example.com',
  createdAt: new Date().toISOString(),
});

// Create app
const app = createApp();

// Global middleware
app.use(logger({ format: 'detailed', colorize: true }));
app.use(cors());
app.use(rateLimit({ max: 1000, window: 60 }));

// Routes
app.get('/', (ctx) => {
  return ctx.jsonResponse({
    message: 'Velocity REST API Example',
    version: '1.0.0',
    endpoints: {
      users: '/api/users',
      health: '/health',
    },
  });
});

// Health check
app.get('/health', (ctx) => {
  return ctx.jsonResponse({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Get all users
app.get('/api/users', (ctx) => {
  const limit = parseInt(ctx.queryParam('limit') || '10');
  const offset = parseInt(ctx.queryParam('offset') || '0');

  const allUsers = Array.from(users.values());
  const paginatedUsers = allUsers.slice(offset, offset + limit);

  return ctx.jsonResponse({
    data: paginatedUsers,
    total: allUsers.length,
    limit,
    offset,
  });
});

// Get user by ID
app.get('/api/users/:id', (ctx) => {
  const id = ctx.param('id');
  const user = users.get(id!);

  if (!user) {
    return ctx.status(404).jsonResponse({
      error: 'User not found',
      id,
    });
  }

  return ctx.jsonResponse({ data: user });
});

// Create user
app.post(
  '/api/users',
  validateBody({
    name: {
      required: true,
      type: 'string',
      minLength: 2,
      maxLength: 50,
    },
    email: {
      required: true,
      type: 'string',
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
  }),
  async (ctx: any) => {
    const body = ctx.validatedBody;

    // Check if email already exists
    for (const user of users.values()) {
      if (user.email === body.email) {
        return ctx.status(409).jsonResponse({
          error: 'Email already exists',
        });
      }
    }

    const id = (users.size + 1).toString();
    const user: User = {
      id,
      name: body.name,
      email: body.email,
      createdAt: new Date().toISOString(),
    };

    users.set(id, user);

    return ctx.status(201).jsonResponse({
      data: user,
      message: 'User created successfully',
    });
  }
);

// Update user
app.put('/api/users/:id', async (ctx) => {
  const id = ctx.param('id');
  const user = users.get(id!);

  if (!user) {
    return ctx.status(404).jsonResponse({
      error: 'User not found',
      id,
    });
  }

  const body = await ctx.json();

  if (body.name) user.name = body.name;
  if (body.email) user.email = body.email;

  users.set(id!, user);

  return ctx.jsonResponse({
    data: user,
    message: 'User updated successfully',
  });
});

// Delete user
app.delete('/api/users/:id', (ctx) => {
  const id = ctx.param('id');

  if (!users.has(id!)) {
    return ctx.status(404).jsonResponse({
      error: 'User not found',
      id,
    });
  }

  users.delete(id!);

  return ctx.status(204).textResponse('');
});

// Search users
app.get('/api/users/search', (ctx) => {
  const query = ctx.queryParam('q')?.toLowerCase() || '';

  const results = Array.from(users.values()).filter(
    (user) =>
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
  );

  return ctx.jsonResponse({
    data: results,
    count: results.length,
    query,
  });
});

// 404 handler
app.onNotFound((ctx) => {
  return ctx.status(404).jsonResponse({
    error: 'Route not found',
    path: ctx.path,
  });
});

// Error handler
app.onError((error, ctx) => {
  console.error('Error:', error);

  return ctx.status(500).jsonResponse({
    error: 'Internal server error',
    message: error.message,
  });
});

// Start server
const PORT = parseInt(process.env.PORT || '3000');
app.listen({ port: PORT });

console.log(`\n✨ REST API Example running at http://localhost:${PORT}`);
console.log('\nAvailable endpoints:');
console.log('  GET    /api/users           - List all users');
console.log('  GET    /api/users/:id       - Get user by ID');
console.log('  POST   /api/users           - Create user');
console.log('  PUT    /api/users/:id       - Update user');
console.log('  DELETE /api/users/:id       - Delete user');
console.log('  GET    /api/users/search?q= - Search users');
console.log('  GET    /health              - Health check\n');
