/**
 * Middleware Example for Oak Clone
 *
 * Demonstrates middleware composition, error handling, logging, and CORS
 */

import { Application, Router, Context } from '../src/oak.ts';

const app = new Application();
const router = new Router();

// ==================== MIDDLEWARE ====================

// Logger middleware
app.use(async (ctx, next) => {
  const start = Date.now();
  const method = ctx.request.method;
  const url = ctx.request.url.pathname;

  console.log(`→ ${method} ${url}`);

  await next();

  const duration = Date.now() - start;
  const status = ctx.response.status || 200;

  console.log(`← ${method} ${url} - ${status} (${duration}ms)`);
});

// Error handler middleware
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    const error = err as Error;

    console.error('Error caught:', error);

    ctx.response.status = (error as any).status || 500;
    ctx.response.body = {
      error: true,
      message: error.message,
      status: ctx.response.status,
      timestamp: new Date().toISOString()
    };
  }
});

// CORS middleware
app.use(async (ctx, next) => {
  ctx.response.headers.set('Access-Control-Allow-Origin', '*');
  ctx.response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  ctx.response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (ctx.request.method === 'OPTIONS') {
    ctx.response.status = 204;
    return;
  }

  await next();
});

// Request ID middleware
app.use(async (ctx, next) => {
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  ctx.state.requestId = requestId;
  ctx.response.headers.set('X-Request-ID', requestId);

  await next();
});

// Response time middleware
app.use(async (ctx, next) => {
  const start = process.hrtime.bigint();

  await next();

  const end = process.hrtime.bigint();
  const duration = Number(end - start) / 1000000; // Convert to milliseconds

  ctx.response.headers.set('X-Response-Time', `${duration.toFixed(2)}ms`);
});

// Security headers middleware
app.use(async (ctx, next) => {
  ctx.response.headers.set('X-Content-Type-Options', 'nosniff');
  ctx.response.headers.set('X-Frame-Options', 'DENY');
  ctx.response.headers.set('X-XSS-Protection', '1; mode=block');
  ctx.response.headers.set('Strict-Transport-Security', 'max-age=31536000');

  await next();
});

// Rate limiting middleware
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function rateLimit(options: { max: number; windowMs: number }) {
  return async (ctx: Context, next: () => Promise<void>) => {
    const ip = ctx.request.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();

    let record = rateLimitStore.get(ip);

    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + options.windowMs };
      rateLimitStore.set(ip, record);
    }

    record.count++;

    ctx.response.headers.set('X-RateLimit-Limit', options.max.toString());
    ctx.response.headers.set('X-RateLimit-Remaining', Math.max(0, options.max - record.count).toString());
    ctx.response.headers.set('X-RateLimit-Reset', record.resetTime.toString());

    if (record.count > options.max) {
      ctx.response.status = 429;
      ctx.response.body = {
        error: 'Too Many Requests',
        message: 'Rate limit exceeded',
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      };
      return;
    }

    await next();
  };
}

// Authentication middleware
function authenticate() {
  return async (ctx: Context, next: () => Promise<void>) => {
    const authHeader = ctx.request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      ctx.response.status = 401;
      ctx.response.body = {
        error: 'Unauthorized',
        message: 'Authentication token required'
      };
      return;
    }

    const token = authHeader.substring(7);

    // Simple token validation
    if (token !== 'valid-token') {
      ctx.response.status = 401;
      ctx.response.body = {
        error: 'Unauthorized',
        message: 'Invalid token'
      };
      return;
    }

    // Attach user to state
    ctx.state.user = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com'
    };

    await next();
  };
}

// Caching middleware
const cacheStore = new Map<string, { data: any; expires: number }>();

function cache(options: { maxAge: number }) {
  return async (ctx: Context, next: () => Promise<void>) => {
    // Only cache GET requests
    if (ctx.request.method !== 'GET') {
      await next();
      return;
    }

    const cacheKey = ctx.request.url.pathname + ctx.request.url.search;
    const cached = cacheStore.get(cacheKey);

    if (cached && Date.now() < cached.expires) {
      ctx.response.headers.set('X-Cache', 'HIT');
      ctx.response.body = cached.data;
      return;
    }

    await next();

    // Cache the response
    if (ctx.response.body) {
      cacheStore.set(cacheKey, {
        data: ctx.response.body,
        expires: Date.now() + (options.maxAge * 1000)
      });

      ctx.response.headers.set('X-Cache', 'MISS');
      ctx.response.headers.set('Cache-Control', `public, max-age=${options.maxAge}`);
    }
  };
}

// ==================== ROUTES ====================

router.get('/', (ctx) => {
  ctx.response.body = {
    message: 'Oak Middleware Demo',
    requestId: ctx.state.requestId,
    endpoints: [
      'GET /',
      'GET /public',
      'GET /protected (requires auth)',
      'GET /cached (5 min cache)',
      'GET /rate-limited (10 req/min)',
      'GET /error (test error handling)',
      'GET /user (shows user from auth)'
    ]
  };
});

router.get('/public', (ctx) => {
  ctx.response.body = {
    message: 'This is a public endpoint',
    timestamp: new Date().toISOString()
  };
});

router.get('/protected', authenticate(), (ctx) => {
  ctx.response.body = {
    message: 'This is a protected endpoint',
    user: ctx.state.user,
    timestamp: new Date().toISOString()
  };
});

router.get('/cached', cache({ maxAge: 300 }), (ctx) => {
  ctx.response.body = {
    message: 'This response is cached for 5 minutes',
    timestamp: new Date().toISOString(),
    random: Math.random()
  };
});

router.get('/rate-limited', rateLimit({ max: 10, windowMs: 60000 }), (ctx) => {
  ctx.response.body = {
    message: 'This endpoint is rate limited to 10 requests per minute',
    timestamp: new Date().toISOString()
  };
});

router.get('/error', (ctx) => {
  throw new Error('This is a test error');
});

router.get('/user', authenticate(), (ctx) => {
  ctx.response.body = {
    user: ctx.state.user
  };
});

router.post('/data', authenticate(), async (ctx) => {
  const body = await ctx.request.body();

  ctx.response.body = {
    message: 'Data received',
    data: body.value,
    user: ctx.state.user,
    timestamp: new Date().toISOString()
  };
});

// Apply routes
app.use(router.routes());
app.use(router.allowedMethods());

// ==================== START SERVER ====================

await app.listen({ port: 3800 });

console.log('\n🌳 Oak Middleware Demo listening on port 3800\n');
console.log('Middleware Stack:');
console.log('  1. Logger - Logs all requests');
console.log('  2. Error Handler - Catches and formats errors');
console.log('  3. CORS - Handles cross-origin requests');
console.log('  4. Request ID - Adds unique ID to each request');
console.log('  5. Response Time - Tracks response duration');
console.log('  6. Security Headers - Sets security headers\n');
console.log('Route-Specific Middleware:');
console.log('  • authenticate() - Requires Bearer token');
console.log('  • cache() - Caches GET responses');
console.log('  • rateLimit() - Limits request rate\n');
console.log('Endpoints:');
console.log('  GET  / - API info');
console.log('  GET  /public - Public endpoint');
console.log('  GET  /protected - Requires authentication');
console.log('  GET  /cached - Cached for 5 minutes');
console.log('  GET  /rate-limited - 10 requests/minute limit');
console.log('  GET  /error - Test error handling');
console.log('  GET  /user - Get authenticated user');
console.log('  POST /data - Post data (requires auth)\n');
console.log('Usage:');
console.log('  curl http://localhost:3800/public');
console.log('  curl -H "Authorization: Bearer valid-token" http://localhost:3800/protected');
console.log('  curl http://localhost:3800/cached  # Check X-Cache header\n');
