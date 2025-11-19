/**
 * Advanced Rate Limiting Plugin for API Gateway
 * Implements multiple rate limiting algorithms:
 * - Token Bucket
 * - Leaky Bucket
 * - Fixed Window
 * - Sliding Window Log
 * - Sliding Window Counter
 * - Distributed rate limiting with Redis
 */

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: any) => string;
  skipFailedRequests?: boolean;
  skipSuccessfulRequests?: boolean;
  handler?: (req: any, res: any) => void;
}

interface RateLimitInfo {
  limit: number;
  current: number;
  remaining: number;
  resetTime: number;
}

interface BucketState {
  tokens: number;
  lastRefill: number;
}

/**
 * Token Bucket Rate Limiter
 * Allows bursts of traffic up to bucket capacity
 */
export class TokenBucketRateLimiter {
  private buckets: Map<string, BucketState> = new Map();
  private capacity: number;
  private refillRate: number; // tokens per second
  private refillInterval: number;

  constructor(config: {
    capacity: number;
    refillRate: number;
    refillInterval?: number;
  }) {
    this.capacity = config.capacity;
    this.refillRate = config.refillRate;
    this.refillInterval = config.refillInterval || 1000;

    // Start refill timer
    setInterval(() => this.refillBuckets(), this.refillInterval);
  }

  private refillBuckets(): void {
    const now = Date.now();
    for (const [key, bucket] of this.buckets.entries()) {
      const timePassed = now - bucket.lastRefill;
      const tokensToAdd = (timePassed / 1000) * this.refillRate;
      bucket.tokens = Math.min(this.capacity, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;
    }
  }

  async consume(key: string, tokens: number = 1): Promise<RateLimitInfo> {
    if (!this.buckets.has(key)) {
      this.buckets.set(key, {
        tokens: this.capacity,
        lastRefill: Date.now(),
      });
    }

    const bucket = this.buckets.get(key)!;

    // Refill tokens based on time passed
    const now = Date.now();
    const timePassed = now - bucket.lastRefill;
    const tokensToAdd = (timePassed / 1000) * this.refillRate;
    bucket.tokens = Math.min(this.capacity, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;

    const allowed = bucket.tokens >= tokens;

    if (allowed) {
      bucket.tokens -= tokens;
    }

    const resetTime = bucket.tokens < this.capacity
      ? now + ((this.capacity - bucket.tokens) / this.refillRate) * 1000
      : now;

    return {
      limit: this.capacity,
      current: Math.floor(this.capacity - bucket.tokens),
      remaining: Math.floor(bucket.tokens),
      resetTime,
    };
  }

  reset(key: string): void {
    this.buckets.delete(key);
  }

  cleanup(olderThanMs: number = 3600000): void {
    const now = Date.now();
    for (const [key, bucket] of this.buckets.entries()) {
      if (now - bucket.lastRefill > olderThanMs) {
        this.buckets.delete(key);
      }
    }
  }
}

/**
 * Leaky Bucket Rate Limiter
 * Smooths out bursts by processing requests at a fixed rate
 */
export class LeakyBucketRateLimiter {
  private buckets: Map<
    string,
    {
      queue: Array<{ timestamp: number; resolve: () => void }>;
      lastLeak: number;
    }
  > = new Map();
  private capacity: number;
  private leakRate: number; // requests per second

  constructor(config: { capacity: number; leakRate: number }) {
    this.capacity = config.capacity;
    this.leakRate = config.leakRate;

    // Start leak timer
    setInterval(() => this.leak(), 100);
  }

  private leak(): void {
    const now = Date.now();
    for (const [key, bucket] of this.buckets.entries()) {
      const timePassed = now - bucket.lastLeak;
      const requestsToLeak = Math.floor((timePassed / 1000) * this.leakRate);

      if (requestsToLeak > 0 && bucket.queue.length > 0) {
        const toProcess = Math.min(requestsToLeak, bucket.queue.length);
        for (let i = 0; i < toProcess; i++) {
          const item = bucket.queue.shift();
          if (item) {
            item.resolve();
          }
        }
        bucket.lastLeak = now;
      }

      // Cleanup empty buckets
      if (bucket.queue.length === 0 && now - bucket.lastLeak > 60000) {
        this.buckets.delete(key);
      }
    }
  }

  async consume(key: string): Promise<RateLimitInfo> {
    if (!this.buckets.has(key)) {
      this.buckets.set(key, {
        queue: [],
        lastLeak: Date.now(),
      });
    }

    const bucket = this.buckets.get(key)!;

    if (bucket.queue.length >= this.capacity) {
      // Bucket is full
      return {
        limit: this.capacity,
        current: bucket.queue.length,
        remaining: 0,
        resetTime: Date.now() + (bucket.queue.length / this.leakRate) * 1000,
      };
    }

    // Add to queue
    await new Promise<void>((resolve) => {
      bucket.queue.push({
        timestamp: Date.now(),
        resolve,
      });
    });

    return {
      limit: this.capacity,
      current: bucket.queue.length,
      remaining: this.capacity - bucket.queue.length,
      resetTime: Date.now() + (bucket.queue.length / this.leakRate) * 1000,
    };
  }
}

/**
 * Fixed Window Rate Limiter
 * Simple time-based windows
 */
export class FixedWindowRateLimiter {
  private windows: Map<string, { count: number; resetTime: number }> = new Map();
  private windowMs: number;
  private maxRequests: number;

  constructor(config: { windowMs: number; maxRequests: number }) {
    this.windowMs = config.windowMs;
    this.maxRequests = config.maxRequests;

    // Cleanup old windows
    setInterval(() => this.cleanup(), this.windowMs);
  }

  async consume(key: string): Promise<RateLimitInfo> {
    const now = Date.now();
    const windowKey = `${key}:${Math.floor(now / this.windowMs)}`;

    if (!this.windows.has(windowKey)) {
      this.windows.set(windowKey, {
        count: 0,
        resetTime: Math.ceil(now / this.windowMs) * this.windowMs,
      });
    }

    const window = this.windows.get(windowKey)!;

    if (now >= window.resetTime) {
      // Window expired, create new window
      window.count = 0;
      window.resetTime = Math.ceil(now / this.windowMs) * this.windowMs;
    }

    window.count++;

    return {
      limit: this.maxRequests,
      current: window.count,
      remaining: Math.max(0, this.maxRequests - window.count),
      resetTime: window.resetTime,
    };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, window] of this.windows.entries()) {
      if (now >= window.resetTime + this.windowMs) {
        this.windows.delete(key);
      }
    }
  }
}

/**
 * Sliding Window Log Rate Limiter
 * Maintains a log of request timestamps
 */
export class SlidingWindowLogRateLimiter {
  private logs: Map<string, number[]> = new Map();
  private windowMs: number;
  private maxRequests: number;

  constructor(config: { windowMs: number; maxRequests: number }) {
    this.windowMs = config.windowMs;
    this.maxRequests = config.maxRequests;

    // Periodic cleanup
    setInterval(() => this.cleanup(), this.windowMs);
  }

  async consume(key: string): Promise<RateLimitInfo> {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    if (!this.logs.has(key)) {
      this.logs.set(key, []);
    }

    const log = this.logs.get(key)!;

    // Remove old entries
    while (log.length > 0 && log[0] <= windowStart) {
      log.shift();
    }

    // Add current request
    log.push(now);

    const oldestTimestamp = log.length > 0 ? log[0] : now;
    const resetTime = oldestTimestamp + this.windowMs;

    return {
      limit: this.maxRequests,
      current: log.length,
      remaining: Math.max(0, this.maxRequests - log.length),
      resetTime,
    };
  }

  private cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    for (const [key, log] of this.logs.entries()) {
      // Remove old entries
      while (log.length > 0 && log[0] <= windowStart) {
        log.shift();
      }

      // Remove empty logs
      if (log.length === 0) {
        this.logs.delete(key);
      }
    }
  }
}

/**
 * Sliding Window Counter Rate Limiter
 * Hybrid approach using counters for efficiency
 */
export class SlidingWindowCounterRateLimiter {
  private windows: Map<
    string,
    { current: { count: number; start: number }; previous: { count: number; start: number } }
  > = new Map();
  private windowMs: number;
  private maxRequests: number;

  constructor(config: { windowMs: number; maxRequests: number }) {
    this.windowMs = config.windowMs;
    this.maxRequests = config.maxRequests;
  }

  async consume(key: string): Promise<RateLimitInfo> {
    const now = Date.now();
    const currentWindowStart = Math.floor(now / this.windowMs) * this.windowMs;
    const previousWindowStart = currentWindowStart - this.windowMs;

    if (!this.windows.has(key)) {
      this.windows.set(key, {
        current: { count: 0, start: currentWindowStart },
        previous: { count: 0, start: previousWindowStart },
      });
    }

    const windows = this.windows.get(key)!;

    // Shift windows if needed
    if (currentWindowStart > windows.current.start) {
      windows.previous = windows.current;
      windows.current = { count: 0, start: currentWindowStart };
    }

    // Calculate weighted count
    const percentageOfCurrentWindow = (now - currentWindowStart) / this.windowMs;
    const weightedCount =
      windows.previous.count * (1 - percentageOfCurrentWindow) +
      windows.current.count;

    windows.current.count++;

    return {
      limit: this.maxRequests,
      current: Math.ceil(weightedCount),
      remaining: Math.max(0, Math.floor(this.maxRequests - weightedCount)),
      resetTime: currentWindowStart + this.windowMs,
    };
  }
}

/**
 * Distributed Rate Limiter using Redis
 * For multi-instance deployments
 */
export class DistributedRateLimiter {
  private redis: any; // Redis client
  private prefix: string;
  private windowMs: number;
  private maxRequests: number;

  constructor(config: {
    redis: any;
    prefix?: string;
    windowMs: number;
    maxRequests: number;
  }) {
    this.redis = config.redis;
    this.prefix = config.prefix || "ratelimit";
    this.windowMs = config.windowMs;
    this.maxRequests = config.maxRequests;
  }

  async consume(key: string): Promise<RateLimitInfo> {
    const now = Date.now();
    const windowKey = `${this.prefix}:${key}:${Math.floor(now / this.windowMs)}`;

    try {
      // Atomic increment with expiry
      const multi = this.redis.multi();
      multi.incr(windowKey);
      multi.pexpire(windowKey, this.windowMs * 2);
      const results = await multi.exec();

      const count = results[0][1] as number;
      const resetTime = Math.ceil(now / this.windowMs) * this.windowMs;

      return {
        limit: this.maxRequests,
        current: count,
        remaining: Math.max(0, this.maxRequests - count),
        resetTime,
      };
    } catch (error) {
      console.error("Redis rate limit error:", error);
      // Fallback to allow request on error
      return {
        limit: this.maxRequests,
        current: 0,
        remaining: this.maxRequests,
        resetTime: now + this.windowMs,
      };
    }
  }

  async reset(key: string): Promise<void> {
    const pattern = `${this.prefix}:${key}:*`;
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}

/**
 * Rate Limit Plugin with multiple strategies
 */
export class RateLimitPlugin {
  private limiters: Map<string, any> = new Map();
  private defaultLimiter?: string;
  private keyGenerator: (req: any) => string;

  constructor(config?: {
    keyGenerator?: (req: any) => string;
  }) {
    this.keyGenerator = config?.keyGenerator || this.defaultKeyGenerator;
  }

  private defaultKeyGenerator(req: any): string {
    return req.ip || req.headers["x-forwarded-for"] || "unknown";
  }

  registerLimiter(name: string, limiter: any): void {
    this.limiters.set(name, limiter);
    if (!this.defaultLimiter) {
      this.defaultLimiter = name;
    }
  }

  setDefaultLimiter(name: string): void {
    if (!this.limiters.has(name)) {
      throw new Error(`Limiter '${name}' not registered`);
    }
    this.defaultLimiter = name;
  }

  async checkLimit(
    request: any,
    limiterName?: string,
  ): Promise<{
    allowed: boolean;
    info: RateLimitInfo;
  }> {
    const limiter = limiterName
      ? this.limiters.get(limiterName)
      : this.limiters.get(this.defaultLimiter || "");

    if (!limiter) {
      throw new Error("No rate limiter configured");
    }

    const key = this.keyGenerator(request);
    const info = await limiter.consume(key);

    return {
      allowed: info.remaining >= 0 && info.current <= info.limit,
      info,
    };
  }

  middleware(limiterName?: string) {
    return async (req: any, res: any, next: any) => {
      try {
        const result = await this.checkLimit(req, limiterName);

        // Set rate limit headers
        res.setHeader("X-RateLimit-Limit", result.info.limit.toString());
        res.setHeader("X-RateLimit-Remaining", result.info.remaining.toString());
        res.setHeader("X-RateLimit-Reset", result.info.resetTime.toString());

        if (!result.allowed) {
          res.status(429).json({
            error: "Too Many Requests",
            retryAfter: Math.ceil((result.info.resetTime - Date.now()) / 1000),
          });
          return;
        }

        next();
      } catch (error) {
        console.error("Rate limit error:", error);
        // Allow request on error to prevent blocking legitimate traffic
        next();
      }
    };
  }
}

/**
 * Advanced Rate Limiting Strategies
 */
export class AdvancedRateLimitStrategies {
  /**
   * Adaptive Rate Limiting
   * Adjusts limits based on system load
   */
  static createAdaptiveLimiter(config: {
    baseLimit: number;
    windowMs: number;
    loadThresholds: { cpu: number; memory: number };
  }): TokenBucketRateLimiter {
    const getCurrentLoad = () => {
      // In a real implementation, this would check actual system metrics
      return { cpu: 0.5, memory: 0.6 };
    };

    const calculateCapacity = () => {
      const load = getCurrentLoad();
      const cpuFactor = Math.max(0.1, 1 - load.cpu);
      const memoryFactor = Math.max(0.1, 1 - load.memory);
      return Math.floor(config.baseLimit * Math.min(cpuFactor, memoryFactor));
    };

    return new TokenBucketRateLimiter({
      capacity: calculateCapacity(),
      refillRate: config.baseLimit / (config.windowMs / 1000),
    });
  }

  /**
   * Tiered Rate Limiting
   * Different limits for different user tiers
   */
  static createTieredLimiter(tiers: Record<string, { limit: number; windowMs: number }>) {
    const limiters = new Map<string, FixedWindowRateLimiter>();

    for (const [tier, config] of Object.entries(tiers)) {
      limiters.set(
        tier,
        new FixedWindowRateLimiter({
          windowMs: config.windowMs,
          maxRequests: config.limit,
        }),
      );
    }

    return {
      async consume(tier: string, key: string): Promise<RateLimitInfo> {
        const limiter = limiters.get(tier) || limiters.get("free");
        if (!limiter) {
          throw new Error("No limiter for tier");
        }
        return await limiter.consume(key);
      },
    };
  }

  /**
   * Geographic Rate Limiting
   * Different limits based on geographic region
   */
  static createGeoLimiter(config: {
    regions: Record<string, { limit: number; windowMs: number }>;
    default: { limit: number; windowMs: number };
  }) {
    const limiters = new Map<string, SlidingWindowCounterRateLimiter>();

    for (const [region, regionConfig] of Object.entries(config.regions)) {
      limiters.set(
        region,
        new SlidingWindowCounterRateLimiter({
          windowMs: regionConfig.windowMs,
          maxRequests: regionConfig.limit,
        }),
      );
    }

    // Default limiter
    limiters.set(
      "default",
      new SlidingWindowCounterRateLimiter({
        windowMs: config.default.windowMs,
        maxRequests: config.default.limit,
      }),
    );

    return {
      async consume(region: string, key: string): Promise<RateLimitInfo> {
        const limiter = limiters.get(region) || limiters.get("default");
        if (!limiter) {
          throw new Error("No limiter configured");
        }
        return await limiter.consume(key);
      },
    };
  }
}

export default RateLimitPlugin;
