/**
 * API Middleware - Rate Limiting, Auth, CORS, Logging
 *
 * Comprehensive middleware stack for API security and monitoring:
 * - Rate limiting with sliding window
 * - API key authentication
 * - CORS handling
 * - Request logging
 * - Request validation
 * - Error handling
 *
 * @module api/middleware
 */

import { RequestContext } from './server';
import { createHash } from 'crypto';

// Rate limit configuration
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (ctx: RequestContext) => string;
}

// Rate limit result
interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
}

// Auth result
interface AuthResult {
  authenticated: boolean;
  user?: {
    id: string;
    apiKey: string;
    tier: 'free' | 'pro' | 'enterprise';
    rateLimit?: RateLimitConfig;
  };
  message?: string;
}

// Rate limit store
class RateLimitStore {
  private store: Map<string, { count: number; resetAt: number }>;
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.store = new Map();

    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  /**
   * Check rate limit
   */
  check(key: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now();
    const entry = this.store.get(key);

    // Create new entry if doesn't exist or expired
    if (!entry || entry.resetAt < now) {
      const resetAt = now + config.windowMs;
      this.store.set(key, { count: 1, resetAt });

      return {
        allowed: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - 1,
        resetAt: new Date(resetAt),
      };
    }

    // Check if limit exceeded
    if (entry.count >= config.maxRequests) {
      return {
        allowed: false,
        limit: config.maxRequests,
        remaining: 0,
        resetAt: new Date(entry.resetAt),
      };
    }

    // Increment count
    entry.count++;

    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - entry.count,
      resetAt: new Date(entry.resetAt),
    };
  }

  /**
   * Reset rate limit for key
   */
  reset(key: string): void {
    this.store.delete(key);
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetAt < now) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Get store size
   */
  size(): number {
    return this.store.size;
  }

  /**
   * Destroy store
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// Global rate limit store
const rateLimitStore = new RateLimitStore();

// API keys database (in production, use proper database)
const apiKeys = new Map<string, AuthResult['user']>([
  ['demo_free_key_123', {
    id: 'user_free_1',
    apiKey: 'demo_free_key_123',
    tier: 'free',
    rateLimit: {
      windowMs: 60000, // 1 minute
      maxRequests: 10,
    },
  }],
  ['demo_pro_key_456', {
    id: 'user_pro_1',
    apiKey: 'demo_pro_key_456',
    tier: 'pro',
    rateLimit: {
      windowMs: 60000, // 1 minute
      maxRequests: 100,
    },
  }],
  ['demo_enterprise_key_789', {
    id: 'user_enterprise_1',
    apiKey: 'demo_enterprise_key_789',
    tier: 'enterprise',
    rateLimit: {
      windowMs: 60000, // 1 minute
      maxRequests: 1000,
    },
  }],
]);

/**
 * Rate limiting middleware
 */
export async function rateLimitMiddleware(ctx: RequestContext): Promise<RateLimitResult> {
  // Skip rate limiting for health and metrics endpoints
  if (ctx.path === '/health' || ctx.path === '/metrics') {
    return {
      allowed: true,
      limit: Infinity,
      remaining: Infinity,
      resetAt: new Date(Date.now() + 3600000),
    };
  }

  // Get rate limit config based on user tier
  let config: RateLimitConfig;

  if (ctx.user?.rateLimit) {
    config = ctx.user.rateLimit;
  } else {
    // Default rate limit for unauthenticated requests
    config = {
      windowMs: 60000, // 1 minute
      maxRequests: 5,
    };
  }

  // Generate rate limit key
  const key = generateRateLimitKey(ctx);

  // Check rate limit
  const result = rateLimitStore.check(key, config);

  // Set rate limit headers
  ctx.res.setHeader('X-RateLimit-Limit', result.limit.toString());
  ctx.res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
  ctx.res.setHeader('X-RateLimit-Reset', result.resetAt.toISOString());

  return result;
}

/**
 * Generate rate limit key
 */
function generateRateLimitKey(ctx: RequestContext): string {
  if (ctx.user) {
    return `user:${ctx.user.id}`;
  }

  // Use IP address for unauthenticated requests
  const ip = getClientIp(ctx);
  return `ip:${ip}`;
}

/**
 * Get client IP address
 */
function getClientIp(ctx: RequestContext): string {
  // Check X-Forwarded-For header
  const forwarded = ctx.headers['x-forwarded-for'];
  if (forwarded) {
    if (Array.isArray(forwarded)) {
      return forwarded[0].split(',')[0].trim();
    }
    return forwarded.split(',')[0].trim();
  }

  // Check X-Real-IP header
  const realIp = ctx.headers['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  // Use socket address
  return ctx.req.socket.remoteAddress || 'unknown';
}

/**
 * Authentication middleware
 */
export async function authMiddleware(ctx: RequestContext): Promise<AuthResult> {
  // Skip auth for public endpoints
  const publicPaths = ['/', '/health', '/metrics', '/api/v1/models'];
  if (publicPaths.includes(ctx.path)) {
    return { authenticated: true };
  }

  // Get API key from header or query
  let apiKey: string | undefined;

  // Check Authorization header
  const authHeader = ctx.headers['authorization'];
  if (authHeader) {
    if (Array.isArray(authHeader)) {
      apiKey = authHeader[0];
    } else {
      apiKey = authHeader;
    }

    // Remove "Bearer " prefix if present
    if (apiKey.startsWith('Bearer ')) {
      apiKey = apiKey.substring(7);
    }
  }

  // Check X-API-Key header
  if (!apiKey) {
    const apiKeyHeader = ctx.headers['x-api-key'];
    if (apiKeyHeader) {
      apiKey = Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader;
    }
  }

  // Check query parameter
  if (!apiKey && ctx.query.apiKey) {
    apiKey = ctx.query.apiKey as string;
  }

  // Validate API key
  if (!apiKey) {
    return {
      authenticated: false,
      message: 'API key is required. Provide it via Authorization header, X-API-Key header, or apiKey query parameter.',
    };
  }

  // Lookup user by API key
  const user = apiKeys.get(apiKey);
  if (!user) {
    return {
      authenticated: false,
      message: 'Invalid API key.',
    };
  }

  return {
    authenticated: true,
    user,
  };
}

/**
 * CORS middleware
 */
export function corsMiddleware(ctx: RequestContext): void {
  // Get origin
  const origin = ctx.headers['origin'];
  const allowedOrigin = origin || '*';

  // Set CORS headers
  ctx.res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  ctx.res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  ctx.res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
  ctx.res.setHeader('Access-Control-Allow-Credentials', 'true');
  ctx.res.setHeader('Access-Control-Max-Age', '86400');

  // Expose custom headers
  ctx.res.setHeader('Access-Control-Expose-Headers', 'X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-Request-ID');
}

/**
 * Logging middleware
 */
export function loggingMiddleware(ctx: RequestContext): void {
  const ip = getClientIp(ctx);
  const userAgent = ctx.headers['user-agent'] || 'unknown';
  const referer = ctx.headers['referer'] || '-';

  // Set request ID header
  ctx.res.setHeader('X-Request-ID', ctx.requestId);

  // Log request
  console.log(
    `[${new Date().toISOString()}] ` +
    `${ctx.method} ${ctx.path} ` +
    `${ip} ` +
    `"${userAgent}" ` +
    `referer="${referer}" ` +
    `requestId=${ctx.requestId}`
  );

  // Log when response finishes
  ctx.res.on('finish', () => {
    const duration = Date.now() - ctx.startTime;
    console.log(
      `[${new Date().toISOString()}] ` +
      `${ctx.method} ${ctx.path} ` +
      `${ctx.res.statusCode} ` +
      `${duration}ms ` +
      `requestId=${ctx.requestId}`
    );
  });
}

/**
 * Request validation middleware
 */
export interface ValidationRule {
  field: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'email' | 'url';
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: any[];
  custom?: (value: any) => boolean | string;
}

export interface ValidationResult {
  valid: boolean;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export function validateRequest(data: any, rules: ValidationRule[]): ValidationResult {
  const errors: Array<{ field: string; message: string }> = [];

  for (const rule of rules) {
    const value = data?.[rule.field];

    // Check required
    if (rule.required && (value === undefined || value === null)) {
      errors.push({
        field: rule.field,
        message: `Field '${rule.field}' is required`,
      });
      continue;
    }

    // Skip validation if not required and value is undefined
    if (!rule.required && (value === undefined || value === null)) {
      continue;
    }

    // Type validation
    switch (rule.type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push({
            field: rule.field,
            message: `Field '${rule.field}' must be a string`,
          });
          continue;
        }
        if (rule.min !== undefined && value.length < rule.min) {
          errors.push({
            field: rule.field,
            message: `Field '${rule.field}' must be at least ${rule.min} characters`,
          });
        }
        if (rule.max !== undefined && value.length > rule.max) {
          errors.push({
            field: rule.field,
            message: `Field '${rule.field}' must be at most ${rule.max} characters`,
          });
        }
        if (rule.pattern && !rule.pattern.test(value)) {
          errors.push({
            field: rule.field,
            message: `Field '${rule.field}' does not match required pattern`,
          });
        }
        break;

      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          errors.push({
            field: rule.field,
            message: `Field '${rule.field}' must be a number`,
          });
          continue;
        }
        if (rule.min !== undefined && value < rule.min) {
          errors.push({
            field: rule.field,
            message: `Field '${rule.field}' must be at least ${rule.min}`,
          });
        }
        if (rule.max !== undefined && value > rule.max) {
          errors.push({
            field: rule.field,
            message: `Field '${rule.field}' must be at most ${rule.max}`,
          });
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push({
            field: rule.field,
            message: `Field '${rule.field}' must be a boolean`,
          });
        }
        break;

      case 'array':
        if (!Array.isArray(value)) {
          errors.push({
            field: rule.field,
            message: `Field '${rule.field}' must be an array`,
          });
          continue;
        }
        if (rule.min !== undefined && value.length < rule.min) {
          errors.push({
            field: rule.field,
            message: `Field '${rule.field}' must have at least ${rule.min} items`,
          });
        }
        if (rule.max !== undefined && value.length > rule.max) {
          errors.push({
            field: rule.field,
            message: `Field '${rule.field}' must have at most ${rule.max} items`,
          });
        }
        break;

      case 'object':
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          errors.push({
            field: rule.field,
            message: `Field '${rule.field}' must be an object`,
          });
        }
        break;

      case 'email':
        if (typeof value !== 'string') {
          errors.push({
            field: rule.field,
            message: `Field '${rule.field}' must be a string`,
          });
        } else {
          // Simple email validation
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            errors.push({
              field: rule.field,
              message: `Field '${rule.field}' must be a valid email address`,
            });
          }
        }
        break;

      case 'url':
        if (typeof value !== 'string') {
          errors.push({
            field: rule.field,
            message: `Field '${rule.field}' must be a string`,
          });
        } else {
          try {
            new URL(value);
          } catch {
            errors.push({
              field: rule.field,
              message: `Field '${rule.field}' must be a valid URL`,
            });
          }
        }
        break;
    }

    // Enum validation
    if (rule.enum && !rule.enum.includes(value)) {
      errors.push({
        field: rule.field,
        message: `Field '${rule.field}' must be one of: ${rule.enum.join(', ')}`,
      });
    }

    // Custom validation
    if (rule.custom) {
      const result = rule.custom(value);
      if (result !== true) {
        errors.push({
          field: rule.field,
          message: typeof result === 'string' ? result : `Field '${rule.field}' is invalid`,
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Security headers middleware
 */
export function securityHeadersMiddleware(ctx: RequestContext): void {
  ctx.res.setHeader('X-Content-Type-Options', 'nosniff');
  ctx.res.setHeader('X-Frame-Options', 'DENY');
  ctx.res.setHeader('X-XSS-Protection', '1; mode=block');
  ctx.res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  ctx.res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
}

/**
 * Compression middleware (simple implementation)
 */
export function compressionMiddleware(ctx: RequestContext): boolean {
  const acceptEncoding = ctx.headers['accept-encoding'];
  if (!acceptEncoding) {
    return false;
  }

  const encodings = Array.isArray(acceptEncoding)
    ? acceptEncoding.join(',')
    : acceptEncoding;

  // Check if client accepts gzip
  if (encodings.includes('gzip')) {
    ctx.res.setHeader('Content-Encoding', 'gzip');
    return true;
  }

  return false;
}

// Export rate limit store for testing
export { rateLimitStore, apiKeys };
