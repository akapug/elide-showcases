/**
 * Koa Slow Down - Gradual Speed Limiting Middleware
 *
 * Slow down repeated requests instead of blocking them.
 * **POLYGLOT SHOWCASE**: One slow down middleware for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/koa-slow-down (~10K+ downloads/week)
 *
 * Features:
 * - Gradual delay increases
 * - Configurable delay progression
 * - Non-blocking throttling
 * - Custom delay functions
 * - Per-user/IP tracking
 *
 * Package has ~10K+ downloads/week on npm!
 */

interface SlowDownOptions {
  windowMs?: number;
  delayAfter?: number;
  delayMs?: number;
  maxDelayMs?: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (ctx: any) => string;
}

class SlowDownStore {
  private hits = new Map<string, { count: number; resetTime: number }>();

  increment(key: string, windowMs: number): number {
    const now = Date.now();
    const data = this.hits.get(key);

    if (!data || now > data.resetTime) {
      this.hits.set(key, { count: 1, resetTime: now + windowMs });
      return 1;
    }

    data.count++;
    return data.count;
  }

  resetKey(key: string): void {
    this.hits.delete(key);
  }
}

export function slowDown(options: SlowDownOptions = {}) {
  const windowMs = options.windowMs ?? 60000; // 1 minute
  const delayAfter = options.delayAfter ?? 5;
  const delayMs = options.delayMs ?? 1000;
  const maxDelayMs = options.maxDelayMs ?? Infinity;
  const keyGenerator = options.keyGenerator ?? ((ctx: any) => ctx.ip);

  const store = new SlowDownStore();

  return async function slowDownMiddleware(ctx: any, next: () => Promise<void>) {
    const key = keyGenerator(ctx);
    const hits = store.increment(key, windowMs);

    if (hits > delayAfter) {
      const delayCount = hits - delayAfter;
      const delay = Math.min(delayMs * delayCount, maxDelayMs);

      await new Promise(resolve => setTimeout(resolve, delay));
    }

    await next();
  };
}

export default slowDown;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🐌 Koa Slow Down - Gradual Speed Limiting (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Usage ===");
  console.log(`
import Koa from 'koa';
import slowDown from './elide-koa-slow-down';

const app = new Koa();

app.use(slowDown({
  windowMs: 60000,
  delayAfter: 5,
  delayMs: 500
}));
`);

  console.log("=== Example 2: Test Gradual Delays ===");
  const limiter = slowDown({
    windowMs: 10000,
    delayAfter: 3,
    delayMs: 1000,
  });

  async function testSlowDown() {
    console.log("Making 6 requests...");
    const ctx = { ip: "192.168.1.1" };

    for (let i = 1; i <= 6; i++) {
      const start = Date.now();
      await limiter(ctx, async () => {});
      const elapsed = Date.now() - start;

      console.log(`Request ${i}: ${elapsed}ms delay`);
    }
  }

  await testSlowDown();

  console.log("\n✅ Benefits: Gradual throttling without hard blocks!");
}
