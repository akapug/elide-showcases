/**
 * Middleware Module for API Gateway
 *
 * Provides logging, CORS, rate limiting, and request validation middleware.
 * Demonstrates polyglot shared utilities for consistent behavior across services.
 */

import { generateRequestId, generateTransactionId } from '../shared/uuid.ts';
import { formatDuration, RATE_LIMITS } from '../shared/ms.ts';
import { formatBytes, SIZE_LIMITS } from '../shared/bytes.ts';
import { isIP } from '../shared/validator.ts';
import { authenticate, type User } from './auth.ts';

/**
 * Request context interface
 */
export interface RequestContext {
  requestId: string;
  transactionId: string;
  startTime: number;
  method: string;
  path: string;
  ip: string;
  user?: User;
  headers: Record<string, string>;
  query: Record<string, any>;
  body?: any;
}

/**
 * Response interface
 */
export interface Response {
  status: number;
  headers: Record<string, string>;
  body: any;
}

/**
 * Middleware function type
 */
export type Middleware = (ctx: RequestContext, next: () => Promise<Response>) => Promise<Response>;

/**
 * Logging middleware
 */
export function loggingMiddleware(): Middleware {
  return async (ctx: RequestContext, next: () => Promise<Response>): Promise<Response> => {
    const startTime = Date.now();

    console.log(`→ ${ctx.method} ${ctx.path} [${ctx.requestId}]`);
    console.log(`  IP: ${ctx.ip}`);
    console.log(`  User-Agent: ${ctx.headers['user-agent'] || 'unknown'}`);
    if (ctx.user) {
      console.log(`  User: ${ctx.user.email} (${ctx.user.role})`);
    }

    try {
      const response = await next();
      const duration = Date.now() - startTime;

      console.log(`← ${response.status} ${ctx.method} ${ctx.path} [${ctx.requestId}]`);
      console.log(`  Duration: ${formatDuration(duration)}`);

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`✗ ${ctx.method} ${ctx.path} [${ctx.requestId}]`);
      console.error(`  Duration: ${formatDuration(duration)}`);
      console.error(`  Error: ${error}`);
      throw error;
    }
  };
}

/**
 * CORS middleware
 */
export function corsMiddleware(options: {
  origin?: string | string[];
  methods?: string[];
  allowedHeaders?: string[];
  credentials?: boolean;
} = {}): Middleware {
  const {
    origin = '*',
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders = ['Content-Type', 'Authorization', 'X-API-Key'],
    credentials = true,
  } = options;

  return async (ctx: RequestContext, next: () => Promise<Response>): Promise<Response> => {
    const requestOrigin = ctx.headers.origin || ctx.headers.Origin;

    // Handle preflight requests
    if (ctx.method === 'OPTIONS') {
      return {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': Array.isArray(origin) ? (origin.includes(requestOrigin) ? requestOrigin : origin[0]) : origin,
          'Access-Control-Allow-Methods': methods.join(', '),
          'Access-Control-Allow-Headers': allowedHeaders.join(', '),
          'Access-Control-Allow-Credentials': credentials ? 'true' : 'false',
          'Access-Control-Max-Age': '86400',
        },
        body: null,
      };
    }

    const response = await next();

    // Add CORS headers to response
    response.headers['Access-Control-Allow-Origin'] = Array.isArray(origin) ? (origin.includes(requestOrigin) ? requestOrigin : origin[0]) : origin;
    response.headers['Access-Control-Allow-Credentials'] = credentials ? 'true' : 'false';
    response.headers['Access-Control-Expose-Headers'] = 'X-Request-ID, X-Transaction-ID';

    return response;
  };
}

/**
 * Rate limiting middleware
 */
export function rateLimitMiddleware(options: {
  windowMs?: number;
  maxRequests?: number;
  keyGenerator?: (ctx: RequestContext) => string;
} = {}): Middleware {
  const {
    windowMs = RATE_LIMITS.PER_MINUTE,
    maxRequests = 100,
    keyGenerator = (ctx) => ctx.ip,
  } = options;

  // Simple in-memory rate limit store
  const store = new Map<string, { count: number; resetTime: number }>();

  return async (ctx: RequestContext, next: () => Promise<Response>): Promise<Response> => {
    const key = keyGenerator(ctx);
    const now = Date.now();

    let entry = store.get(key);

    // Reset if window expired
    if (!entry || entry.resetTime < now) {
      entry = { count: 0, resetTime: now + windowMs };
      store.set(key, entry);
    }

    // Increment counter
    entry.count++;

    // Check limit
    if (entry.count > maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      return {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': entry.resetTime.toString(),
        },
        body: {
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
          retryAfter,
        },
      };
    }

    const response = await next();

    // Add rate limit headers
    response.headers['X-RateLimit-Limit'] = maxRequests.toString();
    response.headers['X-RateLimit-Remaining'] = (maxRequests - entry.count).toString();
    response.headers['X-RateLimit-Reset'] = entry.resetTime.toString();

    return response;
  };
}

/**
 * Authentication middleware
 */
export function authMiddleware(options: {
  required?: boolean;
  roles?: Array<'admin' | 'user' | 'guest'>;
} = {}): Middleware {
  const { required = true, roles = [] } = options;

  return async (ctx: RequestContext, next: () => Promise<Response>): Promise<Response> => {
    const authHeader = ctx.headers.authorization || ctx.headers.Authorization;
    const apiKey = ctx.headers['x-api-key'] || ctx.headers['X-API-Key'];

    const user = authenticate(authHeader, apiKey);

    if (!user && required) {
      return {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
        body: {
          error: 'Unauthorized',
          message: 'Authentication required',
        },
      };
    }

    if (user) {
      ctx.user = user;

      // Check role authorization
      if (roles.length > 0 && !roles.includes(user.role)) {
        return {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
          body: {
            error: 'Forbidden',
            message: 'Insufficient permissions',
          },
        };
      }
    }

    return next();
  };
}

/**
 * Body size validation middleware
 */
export function bodySizeMiddleware(maxSize: number = SIZE_LIMITS.JSON_BODY): Middleware {
  return async (ctx: RequestContext, next: () => Promise<Response>): Promise<Response> => {
    const contentLength = parseInt(ctx.headers['content-length'] || '0', 10);

    if (contentLength > maxSize) {
      return {
        status: 413,
        headers: { 'Content-Type': 'application/json' },
        body: {
          error: 'Payload Too Large',
          message: `Request body size ${formatBytes(contentLength)} exceeds limit of ${formatBytes(maxSize)}`,
        },
      };
    }

    return next();
  };
}

/**
 * Request ID middleware
 */
export function requestIdMiddleware(): Middleware {
  return async (ctx: RequestContext, next: () => Promise<Response>): Promise<Response> => {
    // Add request ID and transaction ID to context
    ctx.requestId = ctx.requestId || generateRequestId();
    ctx.transactionId = ctx.transactionId || generateTransactionId();

    const response = await next();

    // Add IDs to response headers
    response.headers['X-Request-ID'] = ctx.requestId;
    response.headers['X-Transaction-ID'] = ctx.transactionId;

    return response;
  };
}

/**
 * Error handling middleware
 */
export function errorHandlerMiddleware(): Middleware {
  return async (ctx: RequestContext, next: () => Promise<Response>): Promise<Response> => {
    try {
      return await next();
    } catch (error: any) {
      console.error(`Error handling ${ctx.method} ${ctx.path}:`, error);

      return {
        status: error.status || 500,
        headers: { 'Content-Type': 'application/json' },
        body: {
          error: error.name || 'Internal Server Error',
          message: error.message || 'An unexpected error occurred',
          requestId: ctx.requestId,
        },
      };
    }
  };
}

/**
 * IP validation middleware
 */
export function ipWhitelistMiddleware(allowedIps: string[]): Middleware {
  return async (ctx: RequestContext, next: () => Promise<Response>): Promise<Response> => {
    if (!isIP(ctx.ip)) {
      return {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: {
          error: 'Bad Request',
          message: 'Invalid IP address',
        },
      };
    }

    if (allowedIps.length > 0 && !allowedIps.includes(ctx.ip)) {
      return {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
        body: {
          error: 'Forbidden',
          message: 'IP address not whitelisted',
        },
      };
    }

    return next();
  };
}

/**
 * Compose multiple middleware functions
 */
export function compose(...middlewares: Middleware[]): Middleware {
  return async (ctx: RequestContext, next: () => Promise<Response>): Promise<Response> => {
    let index = -1;

    async function dispatch(i: number): Promise<Response> {
      if (i <= index) {
        throw new Error('next() called multiple times');
      }
      index = i;

      const middleware = middlewares[i];
      if (!middleware) {
        return next();
      }

      return middleware(ctx, () => dispatch(i + 1));
    }

    return dispatch(0);
  };
}
