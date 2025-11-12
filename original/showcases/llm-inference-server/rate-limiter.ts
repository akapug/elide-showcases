/**
 * Rate Limiter - API Rate Limiting and Throttling
 *
 * Implements token bucket and sliding window rate limiting algorithms,
 * per-API-key limits, tiered rate limits, and DDoS protection.
 */

export interface RateLimitConfig {
  apiKey: string;
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  tokensPerMinute?: number;
  burstAllowance?: number; // Allow bursts up to this many requests
  tier: "free" | "basic" | "pro" | "enterprise";
}

export interface RateLimitStatus {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number; // seconds
  tier: string;
}

export interface RateLimitTier {
  name: string;
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  tokensPerMinute: number;
  burstAllowance: number;
  concurrentRequests: number;
}

/**
 * Token Bucket implementation for rate limiting
 */
class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private capacity: number,
    private refillRate: number, // tokens per second
    private burstAllowance: number = capacity
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
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

  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000; // seconds
    const tokensToAdd = elapsed * this.refillRate;

    this.tokens = Math.min(
      this.capacity + this.burstAllowance,
      this.tokens + tokensToAdd
    );
    this.lastRefill = now;
  }

  reset(): void {
    this.tokens = this.capacity;
    this.lastRefill = Date.now();
  }
}

/**
 * Sliding Window implementation
 */
class SlidingWindow {
  private requests: number[] = [];

  constructor(private windowMs: number, private maxRequests: number) {}

  tryAdd(): boolean {
    const now = Date.now();
    this.cleanup(now);

    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return true;
    }

    return false;
  }

  getCount(): number {
    this.cleanup(Date.now());
    return this.requests.length;
  }

  getRemaining(): number {
    return Math.max(0, this.maxRequests - this.getCount());
  }

  getResetTime(): number {
    if (this.requests.length === 0) return 0;
    return this.requests[0] + this.windowMs;
  }

  private cleanup(now: number): void {
    const cutoff = now - this.windowMs;
    this.requests = this.requests.filter((time) => time > cutoff);
  }

  reset(): void {
    this.requests = [];
  }
}

/**
 * Main Rate Limiter
 */
export class RateLimiter {
  private configs: Map<string, RateLimitConfig> = new Map();
  private minuteBuckets: Map<string, TokenBucket> = new Map();
  private hourWindows: Map<string, SlidingWindow> = new Map();
  private dayWindows: Map<string, SlidingWindow> = new Map();
  private tokenBuckets: Map<string, TokenBucket> = new Map();
  private concurrentRequests: Map<string, number> = new Map();
  private tiers: Map<string, RateLimitTier> = new Map();

  constructor() {
    this.initializeTiers();
    this.startCleanupInterval();
  }

  /**
   * Initialize rate limit tiers
   */
  private initializeTiers(): void {
    this.tiers.set("free", {
      name: "Free",
      requestsPerMinute: 10,
      requestsPerHour: 100,
      requestsPerDay: 1000,
      tokensPerMinute: 10000,
      burstAllowance: 20,
      concurrentRequests: 2,
    });

    this.tiers.set("basic", {
      name: "Basic",
      requestsPerMinute: 60,
      requestsPerHour: 1000,
      requestsPerDay: 10000,
      tokensPerMinute: 100000,
      burstAllowance: 100,
      concurrentRequests: 5,
    });

    this.tiers.set("pro", {
      name: "Pro",
      requestsPerMinute: 300,
      requestsPerHour: 10000,
      requestsPerDay: 100000,
      tokensPerMinute: 500000,
      burstAllowance: 500,
      concurrentRequests: 20,
    });

    this.tiers.set("enterprise", {
      name: "Enterprise",
      requestsPerMinute: 1000,
      requestsPerHour: 50000,
      requestsPerDay: 500000,
      tokensPerMinute: 2000000,
      burstAllowance: 2000,
      concurrentRequests: 100,
    });
  }

  /**
   * Set rate limit configuration for an API key
   */
  setRateLimit(config: RateLimitConfig): void {
    this.configs.set(config.apiKey, config);

    // Initialize buckets/windows
    const tier = this.tiers.get(config.tier) || this.tiers.get("free")!;

    this.minuteBuckets.set(
      config.apiKey,
      new TokenBucket(
        config.requestsPerMinute,
        config.requestsPerMinute / 60,
        config.burstAllowance || tier.burstAllowance
      )
    );

    this.hourWindows.set(
      config.apiKey,
      new SlidingWindow(60 * 60 * 1000, config.requestsPerHour)
    );

    this.dayWindows.set(
      config.apiKey,
      new SlidingWindow(24 * 60 * 60 * 1000, config.requestsPerDay)
    );

    if (config.tokensPerMinute) {
      this.tokenBuckets.set(
        config.apiKey,
        new TokenBucket(config.tokensPerMinute, config.tokensPerMinute / 60)
      );
    }
  }

  /**
   * Check if a request is allowed
   */
  checkLimit(apiKey: string, tokenCount: number = 0): RateLimitStatus {
    // Get or create config
    let config = this.configs.get(apiKey);
    if (!config) {
      // Default to free tier
      const tier = this.tiers.get("free")!;
      config = {
        apiKey,
        requestsPerMinute: tier.requestsPerMinute,
        requestsPerHour: tier.requestsPerHour,
        requestsPerDay: tier.requestsPerDay,
        tokensPerMinute: tier.tokensPerMinute,
        burstAllowance: tier.burstAllowance,
        tier: "free",
      };
      this.setRateLimit(config);
    }

    // Check concurrent requests
    const concurrent = this.concurrentRequests.get(apiKey) || 0;
    const tier = this.tiers.get(config.tier)!;
    if (concurrent >= tier.concurrentRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(Date.now() + 1000),
        retryAfter: 1,
        tier: config.tier,
      };
    }

    // Check minute bucket (token bucket)
    const minuteBucket = this.minuteBuckets.get(apiKey)!;
    if (!minuteBucket.tryConsume(1)) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(Date.now() + 60000),
        retryAfter: 60,
        tier: config.tier,
      };
    }

    // Check hour window
    const hourWindow = this.hourWindows.get(apiKey)!;
    if (!hourWindow.tryAdd()) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(hourWindow.getResetTime()),
        retryAfter: Math.ceil((hourWindow.getResetTime() - Date.now()) / 1000),
        tier: config.tier,
      };
    }

    // Check day window
    const dayWindow = this.dayWindows.get(apiKey)!;
    if (!dayWindow.tryAdd()) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(dayWindow.getResetTime()),
        retryAfter: Math.ceil((dayWindow.getResetTime() - Date.now()) / 1000),
        tier: config.tier,
      };
    }

    // Check token bucket if tokens are specified
    if (tokenCount > 0 && config.tokensPerMinute) {
      const tokenBucket = this.tokenBuckets.get(apiKey);
      if (tokenBucket && !tokenBucket.tryConsume(tokenCount)) {
        return {
          allowed: false,
          remaining: 0,
          resetAt: new Date(Date.now() + 60000),
          retryAfter: 60,
          tier: config.tier,
        };
      }
    }

    // All checks passed
    return {
      allowed: true,
      remaining: Math.min(
        minuteBucket.getTokens(),
        hourWindow.getRemaining(),
        dayWindow.getRemaining()
      ),
      resetAt: new Date(Date.now() + 60000),
      tier: config.tier,
    };
  }

  /**
   * Mark request as started (for concurrent tracking)
   */
  startRequest(apiKey: string): void {
    const current = this.concurrentRequests.get(apiKey) || 0;
    this.concurrentRequests.set(apiKey, current + 1);
  }

  /**
   * Mark request as finished (for concurrent tracking)
   */
  endRequest(apiKey: string): void {
    const current = this.concurrentRequests.get(apiKey) || 0;
    this.concurrentRequests.set(apiKey, Math.max(0, current - 1));
  }

  /**
   * Get current status without consuming tokens
   */
  getStatus(apiKey: string): {
    minuteRemaining: number;
    hourRemaining: number;
    dayRemaining: number;
    concurrentRequests: number;
    tier: string;
  } {
    const config = this.configs.get(apiKey);
    const tier = config?.tier || "free";

    return {
      minuteRemaining: this.minuteBuckets.get(apiKey)?.getTokens() || 0,
      hourRemaining: this.hourWindows.get(apiKey)?.getRemaining() || 0,
      dayRemaining: this.dayWindows.get(apiKey)?.getRemaining() || 0,
      concurrentRequests: this.concurrentRequests.get(apiKey) || 0,
      tier,
    };
  }

  /**
   * Reset limits for an API key
   */
  resetLimits(apiKey: string): void {
    this.minuteBuckets.get(apiKey)?.reset();
    this.hourWindows.get(apiKey)?.reset();
    this.dayWindows.get(apiKey)?.reset();
    this.tokenBuckets.get(apiKey)?.reset();
    this.concurrentRequests.set(apiKey, 0);
  }

  /**
   * Get tier information
   */
  getTier(tierName: string): RateLimitTier | undefined {
    return this.tiers.get(tierName);
  }

  /**
   * Get all tiers
   */
  getAllTiers(): RateLimitTier[] {
    return Array.from(this.tiers.values());
  }

  /**
   * Update API key tier
   */
  updateTier(apiKey: string, newTier: "free" | "basic" | "pro" | "enterprise"): boolean {
    const config = this.configs.get(apiKey);
    if (!config) return false;

    const tier = this.tiers.get(newTier);
    if (!tier) return false;

    config.tier = newTier;
    config.requestsPerMinute = tier.requestsPerMinute;
    config.requestsPerHour = tier.requestsPerHour;
    config.requestsPerDay = tier.requestsPerDay;
    config.tokensPerMinute = tier.tokensPerMinute;
    config.burstAllowance = tier.burstAllowance;

    this.setRateLimit(config);
    return true;
  }

  /**
   * Check if IP is being rate limited (DDoS protection)
   */
  private ipRequestCounts: Map<string, { count: number; firstSeen: number }> =
    new Map();

  checkIP(ip: string, maxRequestsPerMinute: number = 100): boolean {
    const now = Date.now();
    const record = this.ipRequestCounts.get(ip);

    if (!record) {
      this.ipRequestCounts.set(ip, { count: 1, firstSeen: now });
      return true;
    }

    // Reset if window expired
    if (now - record.firstSeen > 60000) {
      this.ipRequestCounts.set(ip, { count: 1, firstSeen: now });
      return true;
    }

    // Check limit
    if (record.count >= maxRequestsPerMinute) {
      return false;
    }

    record.count++;
    return true;
  }

  /**
   * Cleanup old data periodically
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanup();
    }, 60000); // Every minute
  }

  private cleanup(): void {
    // Clean up IP tracking
    const now = Date.now();
    for (const [ip, record] of this.ipRequestCounts.entries()) {
      if (now - record.firstSeen > 60000) {
        this.ipRequestCounts.delete(ip);
      }
    }
  }

  /**
   * Get rate limit statistics
   */
  getStatistics(): {
    totalApiKeys: number;
    tierDistribution: Record<string, number>;
    avgConcurrentRequests: number;
  } {
    const tierDist: Record<string, number> = {};
    let totalConcurrent = 0;

    for (const config of this.configs.values()) {
      tierDist[config.tier] = (tierDist[config.tier] || 0) + 1;
      totalConcurrent += this.concurrentRequests.get(config.apiKey) || 0;
    }

    return {
      totalApiKeys: this.configs.size,
      tierDistribution: tierDist,
      avgConcurrentRequests:
        this.configs.size > 0 ? totalConcurrent / this.configs.size : 0,
    };
  }
}
