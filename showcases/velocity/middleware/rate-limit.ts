/**
 * Rate Limit Middleware
 * Limit request rates per IP or key
 */

import type { Context } from '../core/context';

export interface RateLimitOptions {
  max?: number;
  window?: number; // in seconds
  keyGenerator?: (ctx: Context) => string;
  handler?: (ctx: Context) => Response;
  skip?: (ctx: Context) => boolean;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export function rateLimit(options: RateLimitOptions = {}) {
  const {
    max = 100,
    window = 60,
    keyGenerator = (ctx: Context) => ctx.ip || 'anonymous',
    handler = (ctx: Context) => ctx.status(429).jsonResponse({
      error: 'Too many requests',
      message: 'Rate limit exceeded',
    }),
    skip,
  } = options;

  const store = new Map<string, RateLimitEntry>();

  // Cleanup expired entries periodically
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now > entry.resetAt) {
        store.delete(key);
      }
    }
  }, window * 1000);

  return async (ctx: Context, next: () => Promise<any>) => {
    // Skip if condition met
    if (skip && skip(ctx)) {
      return await next();
    }

    const key = keyGenerator(ctx);
    const now = Date.now();
    const resetAt = now + window * 1000;

    let entry = store.get(key);

    // Create new entry if not exists or expired
    if (!entry || now > entry.resetAt) {
      entry = {
        count: 1,
        resetAt,
      };
      store.set(key, entry);
    } else {
      entry.count++;
    }

    // Set rate limit headers
    ctx.setHeader('X-RateLimit-Limit', max.toString());
    ctx.setHeader('X-RateLimit-Remaining', Math.max(0, max - entry.count).toString());
    ctx.setHeader('X-RateLimit-Reset', Math.floor(entry.resetAt / 1000).toString());

    // Check if rate limit exceeded
    if (entry.count > max) {
      ctx.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000).toString());
      return handler(ctx);
    }

    return await next();
  };
}
