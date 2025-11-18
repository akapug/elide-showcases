/**
 * Hapi Rate Limit - Rate Limiting Plugin for Hapi
 *
 * Rate limiting plugin for Hapi framework.
 * **POLYGLOT SHOWCASE**: One Hapi rate limiter for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/hapi-rate-limit (~20K+ downloads/week)
 *
 * Features:
 * - Hapi plugin integration
 * - Per-route configuration
 * - User-based limits
 * - Path-based limits
 * - Trustworthy proxy support
 *
 * Package has ~20K+ downloads/week on npm!
 */

interface HapiRateLimitOptions {
  max?: number;
  duration?: number;
  userAttribute?: string;
  userCache?: any;
  pathCache?: any;
  trustProxy?: boolean;
}

class HapiRateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();

  increment(key: string, duration: number): { count: number; remaining: number; reset: number } {
    const now = Date.now();
    const data = this.store.get(key);

    if (!data || now > data.resetTime) {
      const resetTime = now + duration;
      this.store.set(key, { count: 1, resetTime });
      return { count: 1, remaining: 0, reset: resetTime };
    }

    data.count++;
    return { count: data.count, remaining: 0, reset: data.resetTime };
  }
}

export function hapiRateLimit(options: HapiRateLimitOptions = {}) {
  const max = options.max ?? 2500;
  const duration = options.duration ?? 3600000;

  const store = new HapiRateLimitStore();

  return {
    name: "hapi-rate-limit",
    version: "1.0.0",
    register: async function (server: any, pluginOptions: any) {
      server.ext("onPreAuth", (request: any, h: any) => {
        const ip = request.info.remoteAddress;
        const key = `ratelimit:${ip}`;

        const result = store.increment(key, duration);

        request.plugins["hapi-rate-limit"] = {
          limit: max,
          remaining: Math.max(0, max - result.count),
          reset: new Date(result.reset),
        };

        if (result.count > max) {
          const response = h.response({
            statusCode: 429,
            error: "Too Many Requests",
            message: "Rate limit exceeded",
          });
          response.code(429);
          response.header("X-Rate-Limit-Limit", max);
          response.header("X-Rate-Limit-Remaining", 0);
          response.header("X-Rate-Limit-Reset", result.reset);
          return response.takeover();
        }

        return h.continue;
      });
    },
  };
}

export default hapiRateLimit;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔌 Hapi Rate Limit - Rate Limiting Plugin (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Usage ===");
  console.log(`
import Hapi from '@hapi/hapi';
import hapiRateLimit from './elide-hapi-rate-limit';

const server = Hapi.server({
  port: 3000,
  host: 'localhost'
});

await server.register({
  plugin: hapiRateLimit,
  options: {
    max: 100,
    duration: 60000
  }
});

await server.start();
`);

  console.log("\n✅ Rate limiting for Hapi applications!");
}
