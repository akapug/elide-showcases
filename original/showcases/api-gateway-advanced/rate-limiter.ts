/**
 * Advanced Rate Limiting Module
 *
 * Provides sophisticated rate limiting strategies:
 * - Per user rate limiting
 * - Per IP rate limiting
 * - Per endpoint rate limiting
 * - Token bucket algorithm
 * - Leaky bucket algorithm
 * - Fixed window counter
 * - Sliding window log
 * - Sliding window counter
 * - Distributed rate limiting simulation
 */

// ==================== Types & Interfaces ====================

export interface RateLimitConfig {
  algorithm: 'token-bucket' | 'leaky-bucket' | 'fixed-window' | 'sliding-window' | 'sliding-log';
  maxRequests: number;
  windowMs: number;
  identifier: 'user' | 'ip' | 'apikey' | 'custom';
  burstSize?: number;
  blockDurationMs?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
  limit: number;
}

export interface RateLimitStats {
  identifier: string;
  requestCount: number;
  remaining: number;
  resetAt: number;
  blocked: boolean;
  blockExpiresAt?: number;
}

export interface EndpointLimit {
  endpoint: string;
  method: string;
  limit: RateLimitConfig;
}

// ==================== Token Bucket Algorithm ====================

class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private readonly capacity: number;
  private readonly refillRate: number;

  constructor(capacity: number, refillRate: number) {
    this.capacity = capacity;
    this.refillRate = refillRate;
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  tryConsume(tokensNeeded: number = 1): boolean {
    this.refill();

    if (this.tokens >= tokensNeeded) {
      this.tokens -= tokensNeeded;
      return true;
    }

    return false;
  }

  getRemaining(): number {
    this.refill();
    return Math.floor(this.tokens);
  }

  getResetTime(): number {
    if (this.tokens >= this.capacity) {
      return Date.now();
    }
    const tokensNeeded = this.capacity - this.tokens;
    const timeNeeded = (tokensNeeded / this.refillRate) * 1000;
    return Date.now() + timeNeeded;
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = (timePassed / 1000) * this.refillRate;

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
}

// ==================== Leaky Bucket Algorithm ====================

class LeakyBucket {
  private queue: number[] = [];
  private lastLeak: number;
  private readonly capacity: number;
  private readonly leakRate: number;

  constructor(capacity: number, leakRatePerSecond: number) {
    this.capacity = capacity;
    this.leakRate = leakRatePerSecond;
    this.lastLeak = Date.now();
  }

  tryAdd(): boolean {
    this.leak();

    if (this.queue.length < this.capacity) {
      this.queue.push(Date.now());
      return true;
    }

    return false;
  }

  getRemaining(): number {
    this.leak();
    return Math.max(0, this.capacity - this.queue.length);
  }

  getResetTime(): number {
    if (this.queue.length === 0) {
      return Date.now();
    }
    const timeToEmpty = (this.queue.length / this.leakRate) * 1000;
    return Date.now() + timeToEmpty;
  }

  private leak(): void {
    const now = Date.now();
    const timePassed = now - this.lastLeak;
    const itemsToLeak = Math.floor((timePassed / 1000) * this.leakRate);

    if (itemsToLeak > 0) {
      this.queue.splice(0, Math.min(itemsToLeak, this.queue.length));
      this.lastLeak = now;
    }
  }
}

// ==================== Fixed Window Counter ====================

class FixedWindow {
  private count: number = 0;
  private windowStart: number;
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.windowStart = Date.now();
  }

  tryIncrement(): boolean {
    this.resetIfNeeded();

    if (this.count < this.maxRequests) {
      this.count++;
      return true;
    }

    return false;
  }

  getRemaining(): number {
    this.resetIfNeeded();
    return Math.max(0, this.maxRequests - this.count);
  }

  getResetTime(): number {
    return this.windowStart + this.windowMs;
  }

  private resetIfNeeded(): void {
    const now = Date.now();
    if (now - this.windowStart >= this.windowMs) {
      this.count = 0;
      this.windowStart = now;
    }
  }
}

// ==================== Sliding Window Log ====================

class SlidingWindowLog {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  tryAdd(): boolean {
    this.removeExpired();

    if (this.requests.length < this.maxRequests) {
      this.requests.push(Date.now());
      return true;
    }

    return false;
  }

  getRemaining(): number {
    this.removeExpired();
    return Math.max(0, this.maxRequests - this.requests.length);
  }

  getResetTime(): number {
    if (this.requests.length === 0) {
      return Date.now();
    }
    return this.requests[0] + this.windowMs;
  }

  private removeExpired(): void {
    const now = Date.now();
    this.requests = this.requests.filter(timestamp => now - timestamp < this.windowMs);
  }
}

// ==================== Sliding Window Counter ====================

class SlidingWindowCounter {
  private currentWindow: { start: number; count: number };
  private previousWindow: { start: number; count: number };
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    const now = Date.now();
    this.currentWindow = { start: now, count: 0 };
    this.previousWindow = { start: now - windowMs, count: 0 };
  }

  tryIncrement(): boolean {
    this.updateWindows();

    const estimatedCount = this.getEstimatedCount();

    if (estimatedCount < this.maxRequests) {
      this.currentWindow.count++;
      return true;
    }

    return false;
  }

  getRemaining(): number {
    this.updateWindows();
    const estimatedCount = this.getEstimatedCount();
    return Math.max(0, Math.floor(this.maxRequests - estimatedCount));
  }

  getResetTime(): number {
    return this.currentWindow.start + this.windowMs;
  }

  private updateWindows(): void {
    const now = Date.now();
    const currentWindowAge = now - this.currentWindow.start;

    if (currentWindowAge >= this.windowMs) {
      this.previousWindow = this.currentWindow;
      this.currentWindow = { start: now, count: 0 };
    }
  }

  private getEstimatedCount(): number {
    const now = Date.now();
    const currentWindowAge = now - this.currentWindow.start;
    const previousWindowWeight = Math.max(0, 1 - currentWindowAge / this.windowMs);

    return this.currentWindow.count + this.previousWindow.count * previousWindowWeight;
  }
}

// ==================== Advanced Rate Limiter ====================

export class AdvancedRateLimiter {
  private limiters: Map<string, any> = new Map();
  private blocklist: Map<string, number> = new Map();
  private endpointLimits: Map<string, RateLimitConfig> = new Map();
  private globalConfig: RateLimitConfig;

  constructor(globalConfig?: RateLimitConfig) {
    this.globalConfig = globalConfig || {
      algorithm: 'sliding-window',
      maxRequests: 1000,
      windowMs: 60000,
      identifier: 'ip'
    };
  }

  /**
   * Check if request is allowed
   */
  async checkLimit(
    identifier: string,
    config?: RateLimitConfig
  ): Promise<RateLimitResult> {
    const limitConfig = config || this.globalConfig;

    // Check if blocked
    const blockExpiry = this.blocklist.get(identifier);
    if (blockExpiry && Date.now() < blockExpiry) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: blockExpiry,
        retryAfter: Math.ceil((blockExpiry - Date.now()) / 1000),
        limit: limitConfig.maxRequests
      };
    }

    // Get or create limiter
    const limiterKey = `${identifier}:${limitConfig.algorithm}`;
    let limiter = this.limiters.get(limiterKey);

    if (!limiter) {
      limiter = this.createLimiter(limitConfig);
      this.limiters.set(limiterKey, limiter);
    }

    // Try to consume
    const allowed = this.tryConsume(limiter, limitConfig.algorithm);
    const remaining = this.getRemaining(limiter, limitConfig.algorithm);
    const resetAt = this.getResetTime(limiter, limitConfig.algorithm);

    // Block if limit exceeded and block duration is set
    if (!allowed && limitConfig.blockDurationMs) {
      const blockUntil = Date.now() + limitConfig.blockDurationMs;
      this.blocklist.set(identifier, blockUntil);
    }

    return {
      allowed,
      remaining,
      resetAt,
      retryAfter: allowed ? undefined : Math.ceil((resetAt - Date.now()) / 1000),
      limit: limitConfig.maxRequests
    };
  }

  /**
   * Set endpoint-specific rate limit
   */
  setEndpointLimit(endpoint: string, method: string, config: RateLimitConfig): void {
    const key = `${method}:${endpoint}`;
    this.endpointLimits.set(key, config);
  }

  /**
   * Get endpoint-specific rate limit
   */
  getEndpointLimit(endpoint: string, method: string): RateLimitConfig | undefined {
    const key = `${method}:${endpoint}`;
    return this.endpointLimits.get(key);
  }

  /**
   * Block an identifier temporarily
   */
  blockIdentifier(identifier: string, durationMs: number): void {
    this.blocklist.set(identifier, Date.now() + durationMs);
  }

  /**
   * Unblock an identifier
   */
  unblockIdentifier(identifier: string): void {
    this.blocklist.delete(identifier);
  }

  /**
   * Check if identifier is blocked
   */
  isBlocked(identifier: string): boolean {
    const blockExpiry = this.blocklist.get(identifier);
    if (!blockExpiry) return false;

    if (Date.now() >= blockExpiry) {
      this.blocklist.delete(identifier);
      return false;
    }

    return true;
  }

  /**
   * Get rate limit stats for identifier
   */
  getStats(identifier: string, config?: RateLimitConfig): RateLimitStats {
    const limitConfig = config || this.globalConfig;
    const limiterKey = `${identifier}:${limitConfig.algorithm}`;
    const limiter = this.limiters.get(limiterKey);

    const blockExpiry = this.blocklist.get(identifier);

    if (!limiter) {
      return {
        identifier,
        requestCount: 0,
        remaining: limitConfig.maxRequests,
        resetAt: Date.now() + limitConfig.windowMs,
        blocked: !!blockExpiry && Date.now() < blockExpiry,
        blockExpiresAt: blockExpiry
      };
    }

    const remaining = this.getRemaining(limiter, limitConfig.algorithm);

    return {
      identifier,
      requestCount: limitConfig.maxRequests - remaining,
      remaining,
      resetAt: this.getResetTime(limiter, limitConfig.algorithm),
      blocked: !!blockExpiry && Date.now() < blockExpiry,
      blockExpiresAt: blockExpiry
    };
  }

  /**
   * Reset rate limit for identifier
   */
  reset(identifier: string): void {
    for (const [key] of this.limiters) {
      if (key.startsWith(`${identifier}:`)) {
        this.limiters.delete(key);
      }
    }
    this.blocklist.delete(identifier);
  }

  /**
   * Clean up expired limiters
   */
  cleanup(): void {
    const now = Date.now();

    // Clean up expired blocks
    for (const [identifier, expiry] of this.blocklist.entries()) {
      if (now >= expiry) {
        this.blocklist.delete(identifier);
      }
    }

    // Clean up old limiters (keep only active ones)
    if (this.limiters.size > 10000) {
      const toDelete: string[] = [];
      let count = 0;

      for (const key of this.limiters.keys()) {
        if (count++ > 5000) {
          toDelete.push(key);
        }
      }

      toDelete.forEach(key => this.limiters.delete(key));
    }
  }

  private createLimiter(config: RateLimitConfig): any {
    switch (config.algorithm) {
      case 'token-bucket':
        const refillRate = config.maxRequests / (config.windowMs / 1000);
        return new TokenBucket(config.burstSize || config.maxRequests, refillRate);

      case 'leaky-bucket':
        const leakRate = config.maxRequests / (config.windowMs / 1000);
        return new LeakyBucket(config.burstSize || config.maxRequests, leakRate);

      case 'fixed-window':
        return new FixedWindow(config.maxRequests, config.windowMs);

      case 'sliding-log':
        return new SlidingWindowLog(config.maxRequests, config.windowMs);

      case 'sliding-window':
      default:
        return new SlidingWindowCounter(config.maxRequests, config.windowMs);
    }
  }

  private tryConsume(limiter: any, algorithm: string): boolean {
    switch (algorithm) {
      case 'token-bucket':
        return (limiter as TokenBucket).tryConsume();

      case 'leaky-bucket':
        return (limiter as LeakyBucket).tryAdd();

      case 'fixed-window':
        return (limiter as FixedWindow).tryIncrement();

      case 'sliding-log':
        return (limiter as SlidingWindowLog).tryAdd();

      case 'sliding-window':
      default:
        return (limiter as SlidingWindowCounter).tryIncrement();
    }
  }

  private getRemaining(limiter: any, algorithm: string): number {
    return limiter.getRemaining();
  }

  private getResetTime(limiter: any, algorithm: string): number {
    return limiter.getResetTime();
  }
}

// ==================== Multi-Tier Rate Limiter ====================

export class MultiTierRateLimiter {
  private userLimiter: AdvancedRateLimiter;
  private ipLimiter: AdvancedRateLimiter;
  private endpointLimiter: AdvancedRateLimiter;

  constructor() {
    // User-based limiting (authenticated users)
    this.userLimiter = new AdvancedRateLimiter({
      algorithm: 'sliding-window',
      maxRequests: 1000,
      windowMs: 60000,
      identifier: 'user'
    });

    // IP-based limiting (unauthenticated or additional layer)
    this.ipLimiter = new AdvancedRateLimiter({
      algorithm: 'token-bucket',
      maxRequests: 500,
      windowMs: 60000,
      identifier: 'ip',
      burstSize: 100
    });

    // Endpoint-based limiting
    this.endpointLimiter = new AdvancedRateLimiter({
      algorithm: 'leaky-bucket',
      maxRequests: 100,
      windowMs: 60000,
      identifier: 'custom'
    });
  }

  /**
   * Check all applicable rate limits
   */
  async checkAll(
    userId: string | null,
    ipAddress: string,
    endpoint: string,
    method: string
  ): Promise<{
    allowed: boolean;
    results: {
      user?: RateLimitResult;
      ip: RateLimitResult;
      endpoint?: RateLimitResult;
    };
    limitedBy?: 'user' | 'ip' | 'endpoint';
  }> {
    const results: any = {};

    // Check IP limit (always)
    results.ip = await this.ipLimiter.checkLimit(ipAddress);
    if (!results.ip.allowed) {
      return { allowed: false, results, limitedBy: 'ip' };
    }

    // Check user limit (if authenticated)
    if (userId) {
      results.user = await this.userLimiter.checkLimit(userId);
      if (!results.user.allowed) {
        return { allowed: false, results, limitedBy: 'user' };
      }
    }

    // Check endpoint-specific limit
    const endpointKey = `${method}:${endpoint}`;
    const endpointConfig = this.endpointLimiter.getEndpointLimit(endpoint, method);
    if (endpointConfig) {
      results.endpoint = await this.endpointLimiter.checkLimit(endpointKey, endpointConfig);
      if (!results.endpoint.allowed) {
        return { allowed: false, results, limitedBy: 'endpoint' };
      }
    }

    return { allowed: true, results };
  }

  /**
   * Set custom endpoint limit
   */
  setEndpointLimit(endpoint: string, method: string, config: RateLimitConfig): void {
    this.endpointLimiter.setEndpointLimit(endpoint, method, config);
  }

  getUserLimiter(): AdvancedRateLimiter {
    return this.userLimiter;
  }

  getIPLimiter(): AdvancedRateLimiter {
    return this.ipLimiter;
  }

  getEndpointLimiter(): AdvancedRateLimiter {
    return this.endpointLimiter;
  }

  /**
   * Periodic cleanup
   */
  startCleanup(): void {
    setInterval(() => {
      this.userLimiter.cleanup();
      this.ipLimiter.cleanup();
      this.endpointLimiter.cleanup();
    }, 300000); // Every 5 minutes
  }
}
