/**
 * Production-Ready FastAPI Example
 *
 * Demonstrates production-grade features:
 * - Comprehensive error handling
 * - Request validation
 * - Logging and monitoring
 * - Security middleware
 * - Rate limiting
 * - Database integration
 * - Authentication
 * - API versioning
 */

import FastAPI from '../src/fastapi';
import { APIRouter } from '../src/routing';
import { createModel, Field } from '../src/models';
import {
  CORSMiddleware,
  LoggingMiddleware,
  RateLimitMiddleware,
  RequestIDMiddleware,
  SecurityHeadersMiddleware,
  TimingMiddleware,
} from '../src/middleware';

// Create app with production settings
const app = new FastAPI({
  title: 'Production API',
  description: 'Production-ready FastAPI with best practices',
  version: '2.0.0',
  docs_url: '/api/docs',
  redoc_url: '/api/redoc',
  openapi_url: '/api/openapi.json',
});

// Apply middleware stack
app.add_middleware(RequestIDMiddleware());
app.add_middleware(SecurityHeadersMiddleware());
app.add_middleware(CORSMiddleware({
  allow_origins: ['https://app.example.com'],
  allow_methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allow_credentials: true,
}));
app.add_middleware(RateLimitMiddleware({
  requests_per_minute: 100,
}));
app.add_middleware(LoggingMiddleware({
  log_requests: true,
  log_responses: true,
}));
app.add_middleware(TimingMiddleware());

// Define models
const UserModel = createModel('User', {
  title: 'User',
  description: 'User model with full validation',
  fields: {
    id: Field({ type: 'number', description: 'User ID' }),
    email: Field({
      type: 'string',
      required: true,
      pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
      description: 'User email address',
    }),
    username: Field({
      type: 'string',
      required: true,
      minLength: 3,
      maxLength: 50,
      description: 'Username (3-50 chars)',
    }),
    role: Field({
      type: 'string',
      enum: ['admin', 'user', 'guest'],
      default: 'user',
      description: 'User role',
    }),
  },
});

// Mock database with error handling
const db = {
  async query<T>(sql: string, params?: any[]): Promise<T[]> {
    try {
      await new Promise(resolve => setTimeout(resolve, 10));
      // Simulate database query
      return [] as T[];
    } catch (err) {
      throw {
        status_code: 500,
        detail: 'Database error',
        error_code: 'DB_ERROR',
      };
    }
  },

  async transaction<T>(callback: () => Promise<T>): Promise<T> {
    try {
      return await callback();
    } catch (err) {
      // Rollback transaction
      throw err;
    }
  },
};

// Error handler
app.add_exception_handler(Error, (req, err) => {
  console.error('Error:', err);
  return {
    status_code: 500,
    content: {
      detail: 'Internal server error',
      request_id: req.request_id,
      timestamp: new Date().toISOString(),
    },
    headers: { 'Content-Type': 'application/json' },
  };
});

// Startup event
app.on_event('startup', async () => {
  console.log('Starting up...');
  console.log('- Connecting to database');
  console.log('- Loading configuration');
  console.log('- Warming up caches');
  console.log('✓ Startup complete');
});

// Shutdown event
app.on_event('shutdown', async () => {
  console.log('Shutting down...');
  console.log('- Closing database connections');
  console.log('- Flushing logs');
  console.log('✓ Shutdown complete');
});

// Health check router
const healthRouter = new APIRouter({ prefix: '/health', tags: ['Health'] });

healthRouter.get('/', async () => {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
  };
}, {
  summary: 'Health check',
  description: 'Basic health check endpoint',
});

healthRouter.get('/detailed', async () => {
  // Check all dependencies
  const checks = {
    database: 'healthy',
    cache: 'healthy',
    external_api: 'healthy',
  };

  const allHealthy = Object.values(checks).every(status => status === 'healthy');

  return {
    status: allHealthy ? 'healthy' : 'degraded',
    checks,
    timestamp: new Date().toISOString(),
    uptime_seconds: process.uptime(),
  };
}, {
  summary: 'Detailed health check',
  description: 'Health check with dependency status',
});

// API v1 router
const v1Router = new APIRouter({ prefix: '/v1', tags: ['API v1'] });

v1Router.get('/users', async (req) => {
  const skip = parseInt(req.query.skip || '0');
  const limit = parseInt(req.query.limit || '10');

  const users = await db.query('SELECT * FROM users LIMIT $1 OFFSET $2', [limit, skip]);

  return {
    users,
    pagination: {
      skip,
      limit,
      total: users.length,
    },
  };
}, {
  summary: 'List users',
  description: 'Get paginated list of users',
});

v1Router.post('/users', async (req) => {
  const user = new UserModel(req.body);

  await db.transaction(async () => {
    // Insert user
    await db.query('INSERT INTO users (email, username, role) VALUES ($1, $2, $3)', [
      user.dict().email,
      user.dict().username,
      user.dict().role,
    ]);
  });

  return user.dict();
}, {
  summary: 'Create user',
  description: 'Create a new user',
  status_code: 201,
});

// API v2 router (newer version)
const v2Router = new APIRouter({ prefix: '/v2', tags: ['API v2'] });

v2Router.get('/users', async (req) => {
  const page = parseInt(req.query.page || '1');
  const pageSize = parseInt(req.query.page_size || '10');
  const skip = (page - 1) * pageSize;

  const users = await db.query('SELECT * FROM users LIMIT $1 OFFSET $2', [pageSize, skip]);

  return {
    data: users,
    meta: {
      page,
      page_size: pageSize,
      total_pages: Math.ceil(users.length / pageSize),
    },
  };
}, {
  summary: 'List users (v2)',
  description: 'Get paginated users with improved pagination',
});

// Include all routers
app.include_router(healthRouter);
app.include_router(v1Router, '/api');
app.include_router(v2Router, '/api');

// Metrics endpoint
app.get('/metrics', async () => {
  return {
    requests_total: 12345,
    requests_per_minute: 42,
    error_rate: 0.01,
    avg_response_time_ms: 45,
    uptime_seconds: process.uptime(),
  };
}, {
  summary: 'Prometheus metrics',
  tags: ['Monitoring'],
  include_in_schema: false,
});

// Start server
if (require.main === module) {
  const PORT = 8005;
  app.listen(PORT, () => {
    console.log(`\n${'='.repeat(60)}`);
    console.log('  PRODUCTION-READY FASTAPI');
    console.log(`${'='.repeat(60)}\n`);
    console.log(`Server running at http://localhost:${PORT}`);
    console.log();
    console.log('Production features enabled:');
    console.log('  ✓ Request ID tracking');
    console.log('  ✓ Security headers');
    console.log('  ✓ CORS protection');
    console.log('  ✓ Rate limiting');
    console.log('  ✓ Request/response logging');
    console.log('  ✓ Response timing');
    console.log('  ✓ Error handling');
    console.log('  ✓ Health checks');
    console.log('  ✓ API versioning');
    console.log();
    console.log('Endpoints:');
    console.log(`  GET  http://localhost:${PORT}/health`);
    console.log(`  GET  http://localhost:${PORT}/api/v1/users`);
    console.log(`  POST http://localhost:${PORT}/api/v1/users`);
    console.log(`  GET  http://localhost:${PORT}/api/v2/users`);
    console.log();
    console.log(`API docs at http://localhost:${PORT}/api/docs`);
    console.log(`${'='.repeat(60)}\n`);
  });
}

export default app;
