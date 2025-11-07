/**
 * Router Module for API Gateway
 *
 * Smart routing to microservices with path matching, query parsing, and service discovery.
 * Routes requests to TypeScript, Python, Ruby, and Java services (polyglot architecture).
 */

import { parseQuery, extractPagination, extractSorting } from '../shared/query-string.ts';
import { isEmail, isUUID, isInt } from '../shared/validator.ts';
import type { RequestContext, Response } from './middleware.ts';

/**
 * Route handler function type
 */
export type RouteHandler = (ctx: RequestContext) => Promise<Response>;

/**
 * Route definition
 */
export interface Route {
  method: string;
  path: string | RegExp;
  handler: RouteHandler;
  middleware?: Array<(ctx: RequestContext, next: () => Promise<Response>) => Promise<Response>>;
}

/**
 * Router class
 */
export class Router {
  private routes: Route[] = [];

  /**
   * Add a route
   */
  add(method: string, path: string | RegExp, handler: RouteHandler): void {
    this.routes.push({ method, path, handler });
  }

  /**
   * GET route
   */
  get(path: string | RegExp, handler: RouteHandler): void {
    this.add('GET', path, handler);
  }

  /**
   * POST route
   */
  post(path: string | RegExp, handler: RouteHandler): void {
    this.add('POST', path, handler);
  }

  /**
   * PUT route
   */
  put(path: string | RegExp, handler: RouteHandler): void {
    this.add('PUT', path, handler);
  }

  /**
   * DELETE route
   */
  delete(path: string | RegExp, handler: RouteHandler): void {
    this.add('DELETE', path, handler);
  }

  /**
   * PATCH route
   */
  patch(path: string | RegExp, handler: RouteHandler): void {
    this.add('PATCH', path, handler);
  }

  /**
   * Match a route
   */
  match(method: string, path: string): { route: Route; params: Record<string, string> } | null {
    for (const route of this.routes) {
      if (route.method !== method && route.method !== '*') continue;

      if (typeof route.path === 'string') {
        const { match, params } = matchPath(route.path, path);
        if (match) {
          return { route, params };
        }
      } else {
        const match = route.path.test(path);
        if (match) {
          return { route, params: {} };
        }
      }
    }

    return null;
  }

  /**
   * Handle a request
   */
  async handle(ctx: RequestContext): Promise<Response> {
    const matched = this.match(ctx.method, ctx.path);

    if (!matched) {
      return {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
        body: {
          error: 'Not Found',
          message: `Route ${ctx.method} ${ctx.path} not found`,
        },
      };
    }

    // Add params to context
    (ctx as any).params = matched.params;

    // Execute handler
    return matched.route.handler(ctx);
  }
}

/**
 * Match path with parameters
 */
function matchPath(pattern: string, path: string): { match: boolean; params: Record<string, string> } {
  const params: Record<string, string> = {};

  // Convert pattern to regex
  const paramNames: string[] = [];
  const regexPattern = pattern.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, name) => {
    paramNames.push(name);
    return '([^/]+)';
  });

  const regex = new RegExp(`^${regexPattern}$`);
  const match = regex.exec(path);

  if (!match) {
    return { match: false, params };
  }

  // Extract params
  paramNames.forEach((name, index) => {
    params[name] = match[index + 1];
  });

  return { match: true, params };
}

/**
 * Create main application router
 */
export function createRouter(): Router {
  const router = new Router();

  // Health check endpoint
  router.get('/health', async (ctx) => {
    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime?.() || 0,
      },
    };
  });

  // API info endpoint
  router.get('/api', async (ctx) => {
    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        name: 'Polyglot API Gateway',
        version: '1.0.0',
        description: 'Multi-language microservices powered by Elide',
        services: [
          { name: 'users', language: 'TypeScript', path: '/api/users' },
          { name: 'analytics', language: 'Python', path: '/api/analytics' },
          { name: 'email', language: 'Ruby', path: '/api/email' },
          { name: 'payments', language: 'Java', path: '/api/payments' },
        ],
      },
    };
  });

  // User service routes (TypeScript service)
  router.get('/api/users', async (ctx) => {
    // Import user service
    const userService = await import('../services/user-service.ts');
    const query = parseQuery(ctx.path);
    const pagination = extractPagination(query);
    return userService.listUsers(ctx, pagination);
  });

  router.get('/api/users/:id', async (ctx) => {
    const userService = await import('../services/user-service.ts');
    const userId = (ctx as any).params.id;

    // Validate UUID
    if (!isUUID(userId)) {
      return {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: { error: 'Bad Request', message: 'Invalid user ID format' },
      };
    }

    return userService.getUser(ctx, userId);
  });

  router.post('/api/users', async (ctx) => {
    const userService = await import('../services/user-service.ts');
    return userService.createUser(ctx, ctx.body);
  });

  router.put('/api/users/:id', async (ctx) => {
    const userService = await import('../services/user-service.ts');
    const userId = (ctx as any).params.id;

    if (!isUUID(userId)) {
      return {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: { error: 'Bad Request', message: 'Invalid user ID format' },
      };
    }

    return userService.updateUser(ctx, userId, ctx.body);
  });

  router.delete('/api/users/:id', async (ctx) => {
    const userService = await import('../services/user-service.ts');
    const userId = (ctx as any).params.id;

    if (!isUUID(userId)) {
      return {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: { error: 'Bad Request', message: 'Invalid user ID format' },
      };
    }

    return userService.deleteUser(ctx, userId);
  });

  // Analytics service routes (Python service - conceptual)
  router.get('/api/analytics/users/:id', async (ctx) => {
    const analyticsService = await import('../services/analytics-service.ts');
    const userId = (ctx as any).params.id;
    return analyticsService.analyzeUser(ctx, userId);
  });

  router.get('/api/analytics/stats', async (ctx) => {
    const analyticsService = await import('../services/analytics-service.ts');
    const query = parseQuery(ctx.path);
    return analyticsService.getStats(ctx, query);
  });

  router.post('/api/analytics/events', async (ctx) => {
    const analyticsService = await import('../services/analytics-service.ts');
    return analyticsService.trackEvent(ctx, ctx.body);
  });

  // Email service routes (Ruby service - conceptual)
  router.post('/api/email/send', async (ctx) => {
    const emailService = await import('../services/email-worker.ts');
    return emailService.sendEmail(ctx, ctx.body);
  });

  router.get('/api/email/templates', async (ctx) => {
    const emailService = await import('../services/email-worker.ts');
    return emailService.listTemplates(ctx);
  });

  router.post('/api/email/templates', async (ctx) => {
    const emailService = await import('../services/email-worker.ts');
    return emailService.createTemplate(ctx, ctx.body);
  });

  // Payment service routes (Java service - conceptual)
  router.post('/api/payments/charge', async (ctx) => {
    const paymentService = await import('../services/payment-service.ts');
    return paymentService.processCharge(ctx, ctx.body);
  });

  router.get('/api/payments/transactions', async (ctx) => {
    const paymentService = await import('../services/payment-service.ts');
    const query = parseQuery(ctx.path);
    const pagination = extractPagination(query);
    return paymentService.listTransactions(ctx, pagination);
  });

  router.get('/api/payments/transactions/:id', async (ctx) => {
    const paymentService = await import('../services/payment-service.ts');
    const transactionId = (ctx as any).params.id;
    return paymentService.getTransaction(ctx, transactionId);
  });

  router.post('/api/payments/refund', async (ctx) => {
    const paymentService = await import('../services/payment-service.ts');
    return paymentService.processRefund(ctx, ctx.body);
  });

  // Authentication routes
  router.post('/auth/login', async (ctx) => {
    const { login } = await import('./auth.ts');
    const { email, password } = ctx.body || {};

    if (!email || !password) {
      return {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: { error: 'Bad Request', message: 'Email and password required' },
      };
    }

    const result = login(email, password);
    if (!result) {
      return {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
        body: { error: 'Unauthorized', message: 'Invalid credentials' },
      };
    }

    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        token: result.token,
        user: {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role,
        },
      },
    };
  });

  router.post('/auth/register', async (ctx) => {
    const { register } = await import('./auth.ts');
    const { email, password } = ctx.body || {};

    if (!email || !password) {
      return {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: { error: 'Bad Request', message: 'Email and password required' },
      };
    }

    try {
      const result = register(email, password);
      if (!result) {
        return {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
          body: { error: 'Bad Request', message: 'Registration failed' },
        };
      }

      return {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
        body: {
          token: result.token,
          user: {
            id: result.user.id,
            email: result.user.email,
            role: result.user.role,
          },
        },
      };
    } catch (error: any) {
      return {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: { error: 'Bad Request', message: error.message },
      };
    }
  });

  return router;
}
