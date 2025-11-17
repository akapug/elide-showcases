/**
 * Database Integration Example for Koa Clone
 */

import Koa from '../src/koa.ts';

const app = new Koa();

// In-memory database simulation
class Database {
  private tables: Map<string, any[]> = new Map();
  private nextIds: Map<string, number> = new Map();

  async query(table: string, conditions?: any): Promise<any[]> {
    const records = this.tables.get(table) || [];

    if (!conditions) return [...records];

    return records.filter(record => {
      return Object.entries(conditions).every(([key, value]) => record[key] === value);
    });
  }

  async insert(table: string, data: any): Promise<any> {
    if (!this.tables.has(table)) {
      this.tables.set(table, []);
      this.nextIds.set(table, 1);
    }

    const id = this.nextIds.get(table)!;
    const record = { id, ...data, createdAt: new Date().toISOString() };

    this.tables.get(table)!.push(record);
    this.nextIds.set(table, id + 1);

    return record;
  }

  async update(table: string, id: number, data: any): Promise<any | null> {
    const records = this.tables.get(table);
    if (!records) return null;

    const record = records.find(r => r.id === id);
    if (!record) return null;

    Object.assign(record, data, { updatedAt: new Date().toISOString() });
    return record;
  }

  async delete(table: string, id: number): Promise<boolean> {
    const records = this.tables.get(table);
    if (!records) return false;

    const index = records.findIndex(r => r.id === id);
    if (index === -1) return false;

    records.splice(index, 1);
    return true;
  }
}

const db = new Database();

// Add db to context
app.use(async (ctx, next) => {
  ctx.state.db = db;
  await next();
});

// Logger
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  console.log(`${ctx.method} ${ctx.path} - ${duration}ms`);
});

// Error handler
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err: any) {
    ctx.status = err.status || 500;
    ctx.body = {
      error: err.message,
      status: ctx.status
    };
  }
});

// Routes
app.use(async (ctx, next) => {
  const { db } = ctx.state;
  const path = ctx.path;
  const method = ctx.method;

  // GET /users
  if (method === 'GET' && path === '/users') {
    const { name, email } = ctx.query;
    const conditions: any = {};

    if (name) conditions.name = name;
    if (email) conditions.email = email;

    const users = await db.query('users', Object.keys(conditions).length > 0 ? conditions : undefined);
    ctx.body = { users, count: users.length };
    return;
  }

  // GET /users/:id
  if (method === 'GET' && path.startsWith('/users/')) {
    const id = parseInt(path.split('/')[2]);
    const users = await db.query('users', { id });

    if (users.length === 0) {
      ctx.status = 404;
      ctx.body = { error: 'User not found' };
      return;
    }

    ctx.body = { user: users[0] };
    return;
  }

  // POST /users
  if (method === 'POST' && path === '/users') {
    const { name, email, age } = ctx.request.body || {};

    if (!name || !email) {
      ctx.status = 400;
      ctx.body = { error: 'Name and email are required' };
      return;
    }

    const user = await db.insert('users', { name, email, age });
    ctx.status = 201;
    ctx.body = { user };
    return;
  }

  // PUT /users/:id
  if (method === 'PUT' && path.startsWith('/users/')) {
    const id = parseInt(path.split('/')[2]);
    const data = ctx.request.body || {};

    const user = await db.update('users', id, data);

    if (!user) {
      ctx.status = 404;
      ctx.body = { error: 'User not found' };
      return;
    }

    ctx.body = { user };
    return;
  }

  // DELETE /users/:id
  if (method === 'DELETE' && path.startsWith('/users/')) {
    const id = parseInt(path.split('/')[2]);
    const deleted = await db.delete('users', id);

    if (!deleted) {
      ctx.status = 404;
      ctx.body = { error: 'User not found' };
      return;
    }

    ctx.body = { success: true, id };
    return;
  }

  // GET /stats
  if (method === 'GET' && path === '/stats') {
    const users = await db.query('users');
    const posts = await db.query('posts');

    ctx.body = {
      users: users.length,
      posts: posts.length,
      timestamp: new Date().toISOString()
    };
    return;
  }

  await next();
});

// 404 handler
app.use(async ctx => {
  ctx.status = 404;
  ctx.body = { error: 'Not Found' };
});

// Seed some data
(async () => {
  await db.insert('users', { name: 'Alice', email: 'alice@example.com', age: 30 });
  await db.insert('users', { name: 'Bob', email: 'bob@example.com', age: 25 });
  await db.insert('users', { name: 'Charlie', email: 'charlie@example.com', age: 35 });

  app.listen(3011, () => {
    console.log('Database example on http://localhost:3011');
    console.log('\nEndpoints:');
    console.log('  GET    /users - List all users');
    console.log('  GET    /users/:id - Get user by ID');
    console.log('  POST   /users - Create user');
    console.log('  PUT    /users/:id - Update user');
    console.log('  DELETE /users/:id - Delete user');
    console.log('  GET    /stats - Get statistics\n');
  });
})();
