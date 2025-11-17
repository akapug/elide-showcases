/**
 * Middleware Composition Example
 *
 * Demonstrates:
 * - Multiple middleware functions
 * - Middleware execution order
 * - Using ctx.state to pass data
 * - Error handling middleware
 * - Timing middleware
 */

import { Koa } from '../server';

const app = new Koa();

// 1. Error handling middleware (first in chain)
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err: any) {
    ctx.status = err.statusCode || err.status || 500;
    ctx.body = {
      error: err.message,
      status: ctx.status
    };

    // Emit error for logging
    ctx.app.emit('error', err, ctx);
  }
});

// 2. Request timing middleware
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;

  ctx.set('X-Response-Time', `${ms}ms`);
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
});

// 3. Request logging middleware
app.use(async (ctx, next) => {
  console.log(`→ ${ctx.method} ${ctx.url}`);
  console.log(`  Headers:`, ctx.headers);
  await next();
  console.log(`← ${ctx.status} ${ctx.message}`);
});

// 4. Authentication middleware (example)
app.use(async (ctx, next) => {
  const token = ctx.get('Authorization');

  if (!token && ctx.path.startsWith('/api/protected')) {
    ctx.throw(401, 'Authentication required');
  }

  // Simulate user lookup
  if (token) {
    ctx.state.user = {
      id: 1,
      name: 'John Doe',
      token: token
    };
  }

  await next();
});

// 5. CORS middleware
app.use(async (ctx, next) => {
  ctx.set('Access-Control-Allow-Origin', '*');
  ctx.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  ctx.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (ctx.method === 'OPTIONS') {
    ctx.status = 204;
    return;
  }

  await next();
});

// 6. Route handlers
app.use(async (ctx) => {
  const path = ctx.path;

  if (path === '/') {
    ctx.body = {
      message: 'Middleware composition example',
      endpoints: [
        '/',
        '/api/public',
        '/api/protected (requires Authorization header)',
        '/api/user',
        '/error'
      ]
    };
  }
  else if (path === '/api/public') {
    ctx.body = {
      message: 'This is a public endpoint',
      timestamp: new Date().toISOString()
    };
  }
  else if (path === '/api/protected') {
    ctx.body = {
      message: 'This is a protected endpoint',
      user: ctx.state.user
    };
  }
  else if (path === '/api/user') {
    ctx.body = {
      user: ctx.state.user || null,
      authenticated: !!ctx.state.user
    };
  }
  else if (path === '/error') {
    // Trigger error to test error handling
    ctx.throw(500, 'Intentional error for testing');
  }
  else {
    ctx.throw(404, 'Not Found');
  }
});

// Error event handler
app.on('error', (err, ctx) => {
  console.error('Application error:', err.message);
});

// Start server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✓ Middleware example server running on http://localhost:${PORT}`);
  console.log('\n  Try these commands:');
  console.log('  curl http://localhost:3001/');
  console.log('  curl http://localhost:3001/api/public');
  console.log('  curl http://localhost:3001/api/user');
  console.log('  curl -H "Authorization: Bearer token123" http://localhost:3001/api/protected');
  console.log('  curl http://localhost:3001/error');
});
