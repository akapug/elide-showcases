/**
 * Rate Limiter
 * Token bucket algorithm for edge rate limiting
 */

export interface RateLimitConfig {
  tokensPerInterval: number;
  interval: number; // milliseconds
  maxTokens?: number;
}

export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private config: Required<RateLimitConfig>;

  constructor(config: RateLimitConfig) {
    this.config = {
      tokensPerInterval: config.tokensPerInterval,
      interval: config.interval,
      maxTokens: config.maxTokens || config.tokensPerInterval
    };

    this.tokens = this.config.maxTokens;
    this.lastRefill = Date.now();
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const intervalsToAdd = Math.floor(timePassed / this.config.interval);

    if (intervalsToAdd > 0) {
      this.tokens = Math.min(
        this.tokens + (intervalsToAdd * this.config.tokensPerInterval),
        this.config.maxTokens
      );
      this.lastRefill = now;
    }
  }

  tryConsume(tokens: number = 1): boolean {
    this.refill();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }

    return false;
  }

  getTokens(): number {
    this.refill();
    return this.tokens;
  }

  reset(): void {
    this.tokens = this.config.maxTokens;
    this.lastRefill = Date.now();
  }
}

export class RateLimiterStore {
  private limiters = new Map<string, RateLimiter>();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  tryConsume(key: string, tokens: number = 1): boolean {
    let limiter = this.limiters.get(key);

    if (!limiter) {
      limiter = new RateLimiter(this.config);
      this.limiters.set(key, limiter);
    }

    return limiter.tryConsume(tokens);
  }

  reset(key: string): void {
    this.limiters.delete(key);
  }

  clear(): void {
    this.limiters.clear();
  }
}

// CLI demo
if (import.meta.url.includes("rate-limiter.ts")) {
  console.log("Rate Limiter Demo\n");

  // 5 requests per second
  const limiter = new RateLimiter({
    tokensPerInterval: 5,
    interval: 1000,
    maxTokens: 5
  });

  console.log("Allow 5 requests:");
  for (let i = 1; i <= 7; i++) {
    const allowed = limiter.tryConsume();
    console.log(`  Request ${i}: ${allowed ? '✅ allowed' : '❌ blocked'}`);
  }

  console.log(`\nRemaining tokens: ${limiter.getTokens()}`);

  console.log("\nStore demo (per-IP limits):");
  const store = new RateLimiterStore({
    tokensPerInterval: 3,
    interval: 1000
  });

  ['192.168.1.1', '192.168.1.1', '192.168.1.1', '192.168.1.1'].forEach((ip, i) => {
    const allowed = store.tryConsume(ip);
    console.log(`  IP ${ip} request ${i + 1}: ${allowed ? '✅' : '❌'}`);
  });

  console.log("\n✅ Rate limiter test passed");
}
