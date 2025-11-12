/**
 * Rate Limiting Polyglot Pattern
 *
 * Demonstrates rate limiting across multiple languages:
 * - TypeScript: Rate limiter coordinator
 * - Go: High-performance token bucket
 * - Python: ML-based adaptive limits
 * - Redis: Distributed rate limiting (simulated)
 */

// Token Bucket (Go-style)
class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private name: string,
    private capacity: number,
    private refillRate: number, // tokens per second
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  async consume(tokensNeeded: number = 1): Promise<boolean> {
    this.refill();

    if (this.tokens >= tokensNeeded) {
      this.tokens -= tokensNeeded;
      console.log(`  [Go TokenBucket ${this.name}] Allowed (${this.tokens}/${this.capacity} remaining)`);
      return true;
    }

    console.log(`  [Go TokenBucket ${this.name}] Rate limited (${this.tokens}/${this.capacity} tokens)`);
    return false;
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000; // seconds
    const newTokens = elapsed * this.refillRate;

    this.tokens = Math.min(this.capacity, this.tokens + newTokens);
    this.lastRefill = now;
  }

  getStatus(): any {
    this.refill();
    return {
      name: this.name,
      tokens: Math.floor(this.tokens),
      capacity: this.capacity,
      refillRate: this.refillRate,
    };
  }

  reset(): void {
    this.tokens = this.capacity;
    this.lastRefill = Date.now();
  }
}

// Sliding Window (Redis-style)
class SlidingWindowRateLimiter {
  private requests: Map<string, number[]> = new Map();

  constructor(
    private name: string,
    private maxRequests: number,
    private windowMs: number
  ) {}

  async isAllowed(clientId: string): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get existing requests for this client
    let timestamps = this.requests.get(clientId) || [];

    // Remove old requests outside the window
    timestamps = timestamps.filter(ts => ts > windowStart);

    if (timestamps.length < this.maxRequests) {
      timestamps.push(now);
      this.requests.set(clientId, timestamps);
      console.log(`  [Redis SlidingWindow ${this.name}] Allowed for ${clientId} (${timestamps.length}/${this.maxRequests})`);
      return true;
    }

    console.log(`  [Redis SlidingWindow ${this.name}] Rate limited ${clientId} (${timestamps.length}/${this.maxRequests})`);
    return false;
  }

  getStatus(clientId: string): any {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const timestamps = (this.requests.get(clientId) || []).filter(ts => ts > windowStart);

    return {
      name: this.name,
      clientId,
      requests: timestamps.length,
      maxRequests: this.maxRequests,
      windowMs: this.windowMs,
      resetsIn: timestamps.length > 0
        ? Math.max(0, timestamps[0] + this.windowMs - now)
        : 0,
    };
  }
}

// Adaptive Rate Limiter (Python-style ML-based)
class AdaptiveRateLimiter {
  private baseLimits: Map<string, number> = new Map();
  private requestHistory: Map<string, Array<{ timestamp: number; success: boolean }>> = new Map();

  constructor(
    private name: string,
    private defaultLimit: number = 100
  ) {}

  async isAllowed(clientId: string, cost: number = 1): Promise<boolean> {
    const limit = this.calculateAdaptiveLimit(clientId);
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window

    // Get recent requests
    let history = this.requestHistory.get(clientId) || [];
    history = history.filter(h => h.timestamp > windowStart);

    const currentRequests = history.filter(h => h.success).length;

    if (currentRequests + cost <= limit) {
      history.push({ timestamp: now, success: true });
      this.requestHistory.set(clientId, history);
      console.log(`  [Python AdaptiveRL ${this.name}] Allowed for ${clientId} (${currentRequests + cost}/${limit}, adaptive)`);
      return true;
    }

    history.push({ timestamp: now, success: false });
    this.requestHistory.set(clientId, history);
    console.log(`  [Python AdaptiveRL ${this.name}] Rate limited ${clientId} (${currentRequests}/${limit})`);
    return false;
  }

  private calculateAdaptiveLimit(clientId: string): number {
    const history = this.requestHistory.get(clientId) || [];
    if (history.length < 10) {
      return this.defaultLimit;
    }

    // ML-based adaptive calculation
    const recentWindow = history.slice(-50);
    const successRate = recentWindow.filter(h => h.success).length / recentWindow.length;

    // Increase limit for well-behaved clients
    if (successRate > 0.95) {
      console.log(`    [Python ML] Increasing limit for ${clientId} (high success rate)`);
      return Math.floor(this.defaultLimit * 1.5);
    }

    // Decrease limit for clients hitting limits frequently
    if (successRate < 0.7) {
      console.log(`    [Python ML] Decreasing limit for ${clientId} (frequent limiting)`);
      return Math.floor(this.defaultLimit * 0.7);
    }

    return this.defaultLimit;
  }

  getStats(clientId: string): any {
    const history = this.requestHistory.get(clientId) || [];
    const recentWindow = history.slice(-50);
    const successRate = recentWindow.length > 0
      ? recentWindow.filter(h => h.success).length / recentWindow.length
      : 1;

    return {
      name: this.name,
      clientId,
      currentLimit: this.calculateAdaptiveLimit(clientId),
      defaultLimit: this.defaultLimit,
      successRate: (successRate * 100).toFixed(1) + '%',
      totalRequests: history.length,
    };
  }
}

// Rate Limiter Facade (TypeScript)
class RateLimiterService {
  private limiters: Map<string, any> = new Map();

  registerLimiter(name: string, limiter: any): void {
    this.limiters.set(name, limiter);
  }

  async checkLimit(limiterName: string, identifier: string, cost: number = 1): Promise<boolean> {
    const limiter = this.limiters.get(limiterName);
    if (!limiter) {
      throw new Error(`Limiter not found: ${limiterName}`);
    }

    if ('consume' in limiter) {
      return limiter.consume(cost);
    } else if ('isAllowed' in limiter) {
      return limiter.isAllowed(identifier, cost);
    }

    throw new Error(`Unsupported limiter type`);
  }

  getStatus(limiterName: string, identifier?: string): any {
    const limiter = this.limiters.get(limiterName);
    if (!limiter) {
      return { error: 'Limiter not found' };
    }

    if ('getStatus' in limiter) {
      return limiter.getStatus(identifier);
    } else if ('getStats' in limiter) {
      return limiter.getStats(identifier);
    }

    return { name: limiterName };
  }
}

export async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║    Rate Limiting Polyglot - Elide Showcase             ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log();
  console.log('Rate Limiting Algorithms:');
  console.log('  • Token Bucket:     Go (High performance)');
  console.log('  • Sliding Window:   Redis (Distributed)');
  console.log('  • Adaptive Limits:  Python (ML-based)');
  console.log('  • Coordinator:      TypeScript');
  console.log();

  const service = new RateLimiterService();

  // Setup rate limiters
  const apiTokenBucket = new TokenBucket('API', 10, 2); // 10 capacity, 2 tokens/sec
  const userSlidingWindow = new SlidingWindowRateLimiter('User', 5, 10000); // 5 req per 10 sec
  const adaptiveLimiter = new AdaptiveRateLimiter('Adaptive', 10);

  service.registerLimiter('api-token', apiTokenBucket);
  service.registerLimiter('user-sliding', userSlidingWindow);
  service.registerLimiter('adaptive', adaptiveLimiter);

  console.log('════════════════════════════════════════════════════════════');
  console.log('Demo: Rate Limiting Patterns');
  console.log('════════════════════════════════════════════════════════════');
  console.log();

  // Test 1: Token Bucket
  console.log('[Test 1] Token Bucket Rate Limiter\n');
  for (let i = 0; i < 12; i++) {
    const allowed = await apiTokenBucket.consume();
    console.log(`Request ${i + 1}: ${allowed ? '✓ Allowed' : '✗ Rate limited'}`);
  }
  console.log('\nToken bucket status:', apiTokenBucket.getStatus());
  console.log();

  // Test 2: Sliding Window
  console.log('[Test 2] Sliding Window Rate Limiter\n');
  const clientId = 'user-123';
  for (let i = 0; i < 7; i++) {
    const allowed = await userSlidingWindow.isAllowed(clientId);
    console.log(`Request ${i + 1}: ${allowed ? '✓ Allowed' : '✗ Rate limited'}`);
  }
  console.log('\nSliding window status:', userSlidingWindow.getStatus(clientId));
  console.log();

  // Test 3: Adaptive Rate Limiter
  console.log('[Test 3] Adaptive Rate Limiter (ML-based)\n');
  const adaptiveClient = 'user-456';

  console.log('Phase 1: Normal usage (builds history)\n');
  for (let i = 0; i < 15; i++) {
    await adaptiveLimiter.isAllowed(adaptiveClient);
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  console.log('\nAdaptive limiter stats:', adaptiveLimiter.getStats(adaptiveClient));
  console.log();

  console.log('Phase 2: Burst traffic\n');
  for (let i = 0; i < 8; i++) {
    const allowed = await adaptiveLimiter.isAllowed(adaptiveClient);
    console.log(`Burst request ${i + 1}: ${allowed ? '✓ Allowed' : '✗ Rate limited'}`);
  }

  console.log('\nUpdated stats:', adaptiveLimiter.getStats(adaptiveClient));
  console.log();

  // Test 4: Different costs
  console.log('[Test 4] Variable Cost Requests\n');
  apiTokenBucket.reset();

  const costs = [1, 2, 3, 5];
  for (const cost of costs) {
    const allowed = await apiTokenBucket.consume(cost);
    console.log(`Request (cost ${cost}): ${allowed ? '✓ Allowed' : '✗ Rate limited'}`);
  }
  console.log();

  // Test 5: Multiple clients
  console.log('[Test 5] Multiple Clients (Isolation)\n');
  const clients = ['user-A', 'user-B', 'user-C'];

  for (const client of clients) {
    console.log(`\n${client}:`);
    for (let i = 0; i < 6; i++) {
      const allowed = await userSlidingWindow.isAllowed(client);
      if (!allowed) {
        console.log(`  Request ${i + 1}: ✗ Rate limited`);
        break;
      }
      console.log(`  Request ${i + 1}: ✓ Allowed`);
    }
  }
  console.log();

  console.log('════════════════════════════════════════════════════════════');
  console.log('Rate Limiting Demo Complete!');
  console.log('════════════════════════════════════════════════════════════');
  console.log('Key Benefits Demonstrated:');
  console.log('  ✓ Token bucket for smooth rate limiting');
  console.log('  ✓ Sliding window for precise limits');
  console.log('  ✓ Adaptive limits based on behavior');
  console.log('  ✓ Per-client isolation');
  console.log('  ✓ Variable cost requests');
  console.log();
}

if (import.meta.url.includes('server.ts')) {
  main().catch(console.error);
}
