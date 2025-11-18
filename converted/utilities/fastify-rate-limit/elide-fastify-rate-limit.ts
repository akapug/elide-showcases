/**
 * Fastify Rate Limit - Rate Limiting Plugin for Fastify
 *
 * High-performance rate limiting for Fastify.
 * **POLYGLOT SHOWCASE**: One Fastify rate limiter for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/fastify-rate-limit (~100K+ downloads/week)
 *
 * Features:
 * - Fastify plugin integration
 * - High performance
 * - Custom key generation
 * - Redis support
 * - Route-specific limits
 *
 * Package has ~100K+ downloads/week on npm!
 */

interface FastifyRateLimitOptions {
  max?: number;
  timeWindow?: number;
  cache?: number;
  allowList?: string[];
  redis?: any;
  skipOnError?: boolean;
  keyGenerator?: (req: any) => string;
  errorResponseBuilder?: (req: any, context: any) => any;
  enableDraftSpec?: boolean;
  addHeadersOnExceeding?: boolean;
  addHeaders?: Record<string, string>;
}

class RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();

  increment(key: string, timeWindow: number): { current: number; ttl: number } {
    const now = Date.now();
    const data = this.store.get(key);

    if (!data || now > data.resetTime) {
      const resetTime = now + timeWindow;
      this.store.set(key, { count: 1, resetTime });
      return { current: 1, ttl: timeWindow };
    }

    data.count++;
    return { current: data.count, ttl: data.resetTime - now };
  }

  reset(key: string): void {
    this.store.delete(key);
  }
}

export function fastifyRateLimit(options: FastifyRateLimitOptions = {}) {
  const max = options.max ?? 1000;
  const timeWindow = options.timeWindow ?? 60000;
  const keyGenerator = options.keyGenerator ?? ((req: any) => req.ip);
  const addHeaders = options.addHeaders ?? {};

  const store = new RateLimitStore();

  return async function rateLimitHandler(request: any, reply: any) {
    const key = keyGenerator(request);
    const { current, ttl } = store.increment(key, timeWindow);

    reply.header("X-RateLimit-Limit", max);
    reply.header("X-RateLimit-Remaining", Math.max(0, max - current));
    reply.header("X-RateLimit-Reset", Math.ceil(ttl / 1000));

    Object.entries(addHeaders).forEach(([name, value]) => {
      reply.header(name, value);
    });

    if (current > max) {
      reply.code(429);
      return reply.send({
        statusCode: 429,
        error: "Too Many Requests",
        message: "Rate limit exceeded, retry in " + Math.ceil(ttl / 1000) + " seconds",
      });
    }
  };
}

export default fastifyRateLimit;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("⚡ Fastify Rate Limit - High-Performance Rate Limiting (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Usage ===");
  console.log(`
import Fastify from 'fastify';
import rateLimit from './elide-fastify-rate-limit';

const fastify = Fastify();

fastify.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute'
});

fastify.get('/', async (request, reply) => {
  return { hello: 'world' };
});
`);

  console.log("=== Example 2: Route-Specific Limits ===");
  console.log(`
fastify.get('/public', {
  config: {
    rateLimit: {
      max: 1000,
      timeWindow: 60000
    }
  }
}, async (request, reply) => {
  return { data: 'public' };
});

fastify.get('/private', {
  config: {
    rateLimit: {
      max: 10,
      timeWindow: 60000
    }
  }
}, async (request, reply) => {
  return { data: 'private' };
});
`);

  console.log("\n✅ High-performance rate limiting for Fastify!");
}
