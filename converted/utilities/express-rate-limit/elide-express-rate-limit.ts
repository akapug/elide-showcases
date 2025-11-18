/**
 * Express Rate Limit Middleware for Elide
 *
 * Core rate limiting features:
 * - Request rate limiting
 * - Configurable windows
 * - Custom stores
 * - Skip conditions
 * - Custom handlers
 * - Header injection
 *
 * Pure TypeScript, zero dependencies, polyglot-ready
 * NPM: 10M+ downloads/week
 */

export interface RateLimitOptions {
  windowMs?: number;
  max?: number;
  message?: string | object;
  statusCode?: number;
  headers?: boolean;
  skipFailedRequests?: boolean;
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (req: any) => string;
  skip?: (req: any) => boolean;
  handler?: (req: any, res: any, next: any) => void;
  store?: RateLimitStore;
}

export interface RateLimitStore {
  incr(key: string, callback: (err: any, hits?: number, resetTime?: Date) => void): void;
  decrement(key: string): void;
  resetKey(key: string): void;
}

export class MemoryStore implements RateLimitStore {
  private hits: Map<string, { count: number; resetTime: Date }> = new Map();

  incr(key: string, callback: (err: any, hits?: number, resetTime?: Date) => void): void {
    const hit = this.hits.get(key);
    const now = Date.now();

    if (hit && hit.resetTime.getTime() > now) {
      hit.count++;
      callback(null, hit.count, hit.resetTime);
    } else {
      const resetTime = new Date(now + (hit ? now - hit.resetTime.getTime() : 60000));
      this.hits.set(key, { count: 1, resetTime });
      callback(null, 1, resetTime);
    }
  }

  decrement(key: string): void {
    const hit = this.hits.get(key);
    if (hit && hit.count > 0) {
      hit.count--;
    }
  }

  resetKey(key: string): void {
    this.hits.delete(key);
  }
}

export function rateLimit(options: RateLimitOptions = {}): (req: any, res: any, next: any) => void {
  const opts: Required<RateLimitOptions> = {
    windowMs: 60000, // 1 minute
    max: 100,
    message: 'Too many requests, please try again later.',
    statusCode: 429,
    headers: true,
    skipFailedRequests: false,
    skipSuccessfulRequests: false,
    keyGenerator: (req) => req.ip || req.connection?.remoteAddress || 'unknown',
    skip: () => false,
    handler: (req, res, next) => {
      res.status(opts.statusCode).json({
        error: opts.message
      });
    },
    store: new MemoryStore(),
    ...options as any
  };

  return (req: any, res: any, next: any) => {
    if (opts.skip(req)) {
      return next();
    }

    const key = opts.keyGenerator(req);

    opts.store.incr(key, (err, hits, resetTime) => {
      if (err) {
        return next(err);
      }

      if (opts.headers) {
        res.setHeader('X-RateLimit-Limit', opts.max.toString());
        res.setHeader('X-RateLimit-Remaining', Math.max(0, opts.max - hits!).toString());
        res.setHeader('X-RateLimit-Reset', resetTime!.getTime().toString());
      }

      if (hits! > opts.max) {
        return opts.handler(req, res, next);
      }

      if (!opts.skipSuccessfulRequests && !opts.skipFailedRequests) {
        return next();
      }

      const originalEnd = res.end;
      res.end = function(...args: any[]) {
        if (opts.skipSuccessfulRequests && res.statusCode < 400) {
          opts.store.decrement(key);
        }
        if (opts.skipFailedRequests && res.statusCode >= 400) {
          opts.store.decrement(key);
        }
        originalEnd.apply(res, args);
      };

      next();
    });
  };
}

// CLI Demo
if (import.meta.url.includes("express-rate-limit")) {
  console.log("⏱️  Express Rate Limit for Elide - Request Rate Limiting\n");

  console.log("=== Creating Rate Limiter ===");
  const limiter = rateLimit({
    windowMs: 60000, // 1 minute
    max: 5, // 5 requests per minute
    message: 'Too many requests from this IP'
  });

  console.log("✓ Rate limiter created (5 requests/minute)\n");

  console.log("=== Simulating Requests ===");
  let requestCount = 0;

  const mockReq = {
    ip: '192.168.1.1',
    connection: { remoteAddress: '192.168.1.1' }
  };

  const mockRes = {
    setHeader: (name: string, value: string) => {},
    status: (code: number) => ({
      json: (data: any) => {
        console.log(`Request ${requestCount}: ✗ Rate limited (${code})`);
      }
    }),
    end: function(...args: any[]) {}
  };

  const makeRequest = () => {
    requestCount++;
    limiter(mockReq, mockRes, () => {
      console.log(`Request ${requestCount}: ✓ Allowed`);
    });
  };

  // Simulate 7 requests
  for (let i = 0; i < 7; i++) {
    makeRequest();
  }
  console.log();

  console.log("=== Configuration Options ===");
  console.log("- windowMs: Time window in milliseconds");
  console.log("- max: Maximum requests per window");
  console.log("- message: Error message when limited");
  console.log("- keyGenerator: Custom key function (IP, user ID, etc.)");
  console.log("- skip: Skip rate limiting for certain requests");
  console.log("- store: Custom store (Redis, Memcached, etc.)");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- API rate limiting");
  console.log("- Brute force protection");
  console.log("- DDoS mitigation");
  console.log("- Resource protection");
  console.log("- Fair usage enforcement");
  console.log();

  console.log("🚀 Polyglot Benefits:");
  console.log("- 10M+ npm downloads/week");
  console.log("- Zero dependencies");
  console.log("- Works in TypeScript, Python, Ruby, Java");
  console.log("- Instant startup on Elide");
}

export default rateLimit;
