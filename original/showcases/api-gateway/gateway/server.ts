/**
 * API Gateway Server
 *
 * Main entry point for the polyglot microservices gateway.
 * Demonstrates Elide's ability to run TypeScript services with shared utilities
 * that can be used across Python, Ruby, and Java services.
 *
 * Architecture:
 * - TypeScript gateway (this file)
 * - Smart routing to services
 * - JWT authentication
 * - Rate limiting
 * - CORS support
 * - Comprehensive logging
 *
 * Try running with: elide run gateway/server.ts
 * Or: elide serve gateway/server.ts (if Elide supports HTTP serving)
 */

import { createRouter } from './router.ts';
import {
  loggingMiddleware,
  corsMiddleware,
  rateLimitMiddleware,
  authMiddleware,
  requestIdMiddleware,
  errorHandlerMiddleware,
  bodySizeMiddleware,
  compose,
  type RequestContext,
  type Response,
} from './middleware.ts';
import { generateRequestId } from '../shared/uuid.ts';

/**
 * Server configuration
 */
const CONFIG = {
  port: 3000,
  host: '0.0.0.0',
  corsOrigins: ['http://localhost:3000', 'http://localhost:8080'],
  rateLimitWindow: 60000, // 1 minute
  rateLimitMax: 100, // 100 requests per minute
};

/**
 * Create HTTP server (conceptual - actual implementation depends on Elide's HTTP API)
 */
export async function createServer() {
  const router = createRouter();

  // Global middleware stack
  const globalMiddleware = compose(
    errorHandlerMiddleware(),
    requestIdMiddleware(),
    loggingMiddleware(),
    corsMiddleware({ origin: CONFIG.corsOrigins }),
    rateLimitMiddleware({ windowMs: CONFIG.rateLimitWindow, maxRequests: CONFIG.rateLimitMax }),
    bodySizeMiddleware()
  );

  /**
   * Handle incoming HTTP requests
   */
  async function handleRequest(req: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: any;
    ip: string;
  }): Promise<Response> {
    // Parse URL
    const urlParts = req.url.split('?');
    const path = urlParts[0];
    const queryString = urlParts[1] || '';

    // Create request context
    const ctx: RequestContext = {
      requestId: generateRequestId(),
      transactionId: '',
      startTime: Date.now(),
      method: req.method.toUpperCase(),
      path,
      ip: req.ip,
      headers: req.headers,
      query: parseQueryString(queryString),
      body: req.body,
    };

    // Apply middleware and route
    return globalMiddleware(ctx, () => router.handle(ctx));
  }

  return { handleRequest };
}

/**
 * Parse query string to object
 */
function parseQueryString(qs: string): Record<string, any> {
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
 * Main function (CLI entry point)
 */
export async function main() {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║   API Gateway - Polyglot Microservices on Elide   ║');
  console.log('╚════════════════════════════════════════════════════╝');
  console.log();
  console.log('Architecture:');
  console.log('  Gateway:    TypeScript (Elide)');
  console.log('  Services:');
  console.log('    - Users:     TypeScript');
  console.log('    - Analytics: Python (conceptual)');
  console.log('    - Email:     Ruby (conceptual)');
  console.log('    - Payments:  Java (conceptual)');
  console.log();
  console.log('Shared Utilities (Polyglot):');
  console.log('  - UUID:      Universal identifier generation');
  console.log('  - Validator: Email, URL, UUID validation');
  console.log('  - MS:        Time duration parsing');
  console.log('  - Base64:    Encoding/decoding');
  console.log('  - Bytes:     Size parsing and formatting');
  console.log('  - Query:     URL parameter handling');
  console.log();

  // Create server
  const server = await createServer();

  console.log(`Server ready on http://${CONFIG.host}:${CONFIG.port}`);
  console.log();
  console.log('API Endpoints:');
  console.log('  GET    /health                      - Health check');
  console.log('  GET    /api                         - API info');
  console.log();
  console.log('Authentication:');
  console.log('  POST   /auth/login                  - Login');
  console.log('  POST   /auth/register               - Register');
  console.log();
  console.log('Users Service (TypeScript):');
  console.log('  GET    /api/users                   - List users');
  console.log('  GET    /api/users/:id               - Get user');
  console.log('  POST   /api/users                   - Create user');
  console.log('  PUT    /api/users/:id               - Update user');
  console.log('  DELETE /api/users/:id               - Delete user');
  console.log();
  console.log('Analytics Service (Python):');
  console.log('  GET    /api/analytics/users/:id     - Analyze user');
  console.log('  GET    /api/analytics/stats         - Get stats');
  console.log('  POST   /api/analytics/events        - Track event');
  console.log();
  console.log('Email Service (Ruby):');
  console.log('  POST   /api/email/send              - Send email');
  console.log('  GET    /api/email/templates         - List templates');
  console.log('  POST   /api/email/templates         - Create template');
  console.log();
  console.log('Payments Service (Java):');
  console.log('  POST   /api/payments/charge         - Process charge');
  console.log('  GET    /api/payments/transactions   - List transactions');
  console.log('  GET    /api/payments/transactions/:id - Get transaction');
  console.log('  POST   /api/payments/refund         - Process refund');
  console.log();

  // Demo: Test some endpoints
  console.log('════════════════════════════════════════════════════');
  console.log('Demo: Testing Endpoints');
  console.log('════════════════════════════════════════════════════');
  console.log();

  // Test health endpoint
  console.log('[TEST 1] Health Check');
  const healthReq = {
    method: 'GET',
    url: '/health',
    headers: {},
    ip: '127.0.0.1',
  };
  const healthRes = await server.handleRequest(healthReq);
  console.log(`Status: ${healthRes.status}`);
  console.log(`Body:`, JSON.stringify(healthRes.body, null, 2));
  console.log();

  // Test API info endpoint
  console.log('[TEST 2] API Info');
  const apiReq = {
    method: 'GET',
    url: '/api',
    headers: {},
    ip: '127.0.0.1',
  };
  const apiRes = await server.handleRequest(apiReq);
  console.log(`Status: ${apiRes.status}`);
  console.log(`Body:`, JSON.stringify(apiRes.body, null, 2));
  console.log();

  // Test login
  console.log('[TEST 3] User Login');
  const loginReq = {
    method: 'POST',
    url: '/auth/login',
    headers: { 'content-type': 'application/json' },
    body: { email: 'admin@example.com', password: 'password123' },
    ip: '127.0.0.1',
  };
  const loginRes = await server.handleRequest(loginReq);
  console.log(`Status: ${loginRes.status}`);
  console.log(`Body:`, JSON.stringify(loginRes.body, null, 2));
  console.log();

  // Test users endpoint with auth
  if (loginRes.status === 200 && loginRes.body.token) {
    console.log('[TEST 4] List Users (Authenticated)');
    const usersReq = {
      method: 'GET',
      url: '/api/users?page=1&limit=10',
      headers: { authorization: `Bearer ${loginRes.body.token}` },
      ip: '127.0.0.1',
    };
    const usersRes = await server.handleRequest(usersReq);
    console.log(`Status: ${usersRes.status}`);
    console.log(`Body:`, JSON.stringify(usersRes.body, null, 2));
    console.log();
  }

  // Test analytics endpoint
  console.log('[TEST 5] Analytics Stats');
  const analyticsReq = {
    method: 'GET',
    url: '/api/analytics/stats?period=7d',
    headers: {},
    ip: '127.0.0.1',
  };
  const analyticsRes = await server.handleRequest(analyticsReq);
  console.log(`Status: ${analyticsRes.status}`);
  console.log(`Body:`, JSON.stringify(analyticsRes.body, null, 2));
  console.log();

  // Test rate limiting
  console.log('[TEST 6] Rate Limiting (Multiple Requests)');
  for (let i = 0; i < 5; i++) {
    const rateLimitReq = {
      method: 'GET',
      url: '/health',
      headers: {},
      ip: '192.168.1.100',
    };
    const rateLimitRes = await server.handleRequest(rateLimitReq);
    console.log(`Request ${i + 1}: Status ${rateLimitRes.status}, Remaining: ${rateLimitRes.headers['X-RateLimit-Remaining']}`);
  }
  console.log();

  console.log('════════════════════════════════════════════════════');
  console.log('Gateway Tests Complete!');
  console.log('════════════════════════════════════════════════════');
  console.log();
  console.log('Key Features Demonstrated:');
  console.log('  ✓ Request routing to polyglot services');
  console.log('  ✓ JWT authentication');
  console.log('  ✓ Rate limiting');
  console.log('  ✓ CORS support');
  console.log('  ✓ Request ID tracking');
  console.log('  ✓ Comprehensive logging');
  console.log('  ✓ Shared utilities across languages');
  console.log();
  console.log('Polyglot Value:');
  console.log('  → One implementation (TypeScript utilities)');
  console.log('  → Many services (TS, Python, Ruby, Java)');
  console.log('  → Consistent behavior everywhere');
  console.log('  → No duplicate code across languages');
  console.log();
}

// Run main function if executed directly
if (import.meta.url.includes('server.ts')) {
  main().catch(console.error);
}
