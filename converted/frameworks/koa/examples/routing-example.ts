/**
 * Routing Example
 *
 * Demonstrates:
 * - RESTful routing patterns
 * - Route parameters
 * - Query string handling
 * - Different HTTP methods
 * - JSON request/response
 */

import { Koa } from '../server';

const app = new Koa();

// Simple in-memory data store
interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

const users: Map<number, User> = new Map([
  [1, { id: 1, name: 'Alice Smith', email: 'alice@example.com', createdAt: '2025-01-01T00:00:00Z' }],
  [2, { id: 2, name: 'Bob Jones', email: 'bob@example.com', createdAt: '2025-01-02T00:00:00Z' }],
  [3, { id: 3, name: 'Carol White', email: 'carol@example.com', createdAt: '2025-01-03T00:00:00Z' }],
]);

let nextId = 4;

// Body parser middleware (simplified)
app.use(async (ctx, next) => {
  if (ctx.method === 'POST' || ctx.method === 'PUT') {
    const chunks: Buffer[] = [];

    ctx.req.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    await new Promise<void>((resolve) => {
      ctx.req.on('end', () => {
        const body = Buffer.concat(chunks).toString();
        try {
          ctx.request.body = JSON.parse(body);
        } catch (e) {
          ctx.request.body = {};
        }
        resolve();
      });
    });
  }

  await next();
});

// Request logging
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`${ctx.method} ${ctx.url} - ${ctx.status} - ${ms}ms`);
});

// Router middleware
app.use(async (ctx) => {
  const { method, path, query } = ctx;
  const pathParts = path.split('/').filter(Boolean);

  // Home page
  if (method === 'GET' && path === '/') {
    ctx.body = {
      message: 'Koa Routing Example',
      version: '1.0.0',
      endpoints: {
        'GET /users': 'List all users',
        'GET /users?limit=N': 'List users with limit',
        'GET /users/:id': 'Get user by ID',
        'POST /users': 'Create new user',
        'PUT /users/:id': 'Update user',
        'DELETE /users/:id': 'Delete user',
        'GET /search?name=query': 'Search users by name'
      }
    };
    return;
  }

  // GET /users - List all users
  if (method === 'GET' && path === '/users') {
    const limit = query.limit ? parseInt(query.limit) : undefined;
    const userArray = Array.from(users.values());

    ctx.body = {
      total: userArray.length,
      limit: limit,
      users: limit ? userArray.slice(0, limit) : userArray
    };
    return;
  }

  // GET /users/:id - Get user by ID
  if (method === 'GET' && pathParts[0] === 'users' && pathParts.length === 2) {
    const id = parseInt(pathParts[1]);
    const user = users.get(id);

    if (!user) {
      ctx.status = 404;
      ctx.body = { error: 'User not found' };
      return;
    }

    ctx.body = { user };
    return;
  }

  // POST /users - Create new user
  if (method === 'POST' && path === '/users') {
    const { name, email } = (ctx.request as any).body || {};

    if (!name || !email) {
      ctx.status = 400;
      ctx.body = { error: 'Name and email are required' };
      return;
    }

    const newUser: User = {
      id: nextId++,
      name,
      email,
      createdAt: new Date().toISOString()
    };

    users.set(newUser.id, newUser);

    ctx.status = 201;
    ctx.body = { user: newUser };
    return;
  }

  // PUT /users/:id - Update user
  if (method === 'PUT' && pathParts[0] === 'users' && pathParts.length === 2) {
    const id = parseInt(pathParts[1]);
    const user = users.get(id);

    if (!user) {
      ctx.status = 404;
      ctx.body = { error: 'User not found' };
      return;
    }

    const { name, email } = (ctx.request as any).body || {};

    if (name) user.name = name;
    if (email) user.email = email;

    users.set(id, user);

    ctx.body = { user };
    return;
  }

  // DELETE /users/:id - Delete user
  if (method === 'DELETE' && pathParts[0] === 'users' && pathParts.length === 2) {
    const id = parseInt(pathParts[1]);

    if (!users.has(id)) {
      ctx.status = 404;
      ctx.body = { error: 'User not found' };
      return;
    }

    users.delete(id);

    ctx.status = 204;
    return;
  }

  // GET /search - Search users
  if (method === 'GET' && path.startsWith('/search')) {
    const nameQuery = (query.name || '').toLowerCase();

    const results = Array.from(users.values()).filter(user =>
      user.name.toLowerCase().includes(nameQuery)
    );

    ctx.body = {
      query: nameQuery,
      count: results.length,
      results
    };
    return;
  }

  // 404 - Not found
  ctx.status = 404;
  ctx.body = { error: 'Route not found' };
});

// Start server
const PORT = 3002;
app.listen(PORT, () => {
  console.log(`✓ Routing example server running on http://localhost:${PORT}`);
  console.log('\n  Try these commands:');
  console.log('  curl http://localhost:3002/');
  console.log('  curl http://localhost:3002/users');
  console.log('  curl http://localhost:3002/users/1');
  console.log('  curl http://localhost:3002/users?limit=2');
  console.log('  curl http://localhost:3002/search?name=alice');
  console.log('  curl -X POST http://localhost:3002/users -H "Content-Type: application/json" -d \'{"name":"Dave","email":"dave@example.com"}\'');
  console.log('  curl -X PUT http://localhost:3002/users/1 -H "Content-Type: application/json" -d \'{"name":"Alice Johnson"}\'');
  console.log('  curl -X DELETE http://localhost:3002/users/3');
});
