/**
 * Rolling Rate Limiter - Sliding Window Rate Limiting
 *
 * Precise rate limiting with rolling time windows.
 * **POLYGLOT SHOWCASE**: One rolling rate limiter for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/rolling-rate-limiter (~30K+ downloads/week)
 *
 * Features:
 * - Rolling/sliding window algorithm
 * - Precise rate limiting (no bucket boundaries)
 * - Redis-compatible storage
 * - Timestamp-based tracking
 * - Memory-efficient
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need precise rate limiting
 * - ONE implementation works everywhere on Elide
 * - Consistent rolling window across services
 * - Share rate limiting logic across your stack
 *
 * Use cases:
 * - Precise API rate limiting (exact time windows)
 * - Sliding window throttling (smooth limits)
 * - Time-based quotas (rolling periods)
 * - Fair usage enforcement (accurate tracking)
 *
 * Package has ~30K+ downloads/week on npm!
 */

interface RollingRateLimiterOptions {
  interval: number;  // Time window in milliseconds
  maxInInterval: number;  // Max requests in window
}

interface RequestRecord {
  timestamp: number;
}

/**
 * Storage interface for rolling limiter
 */
interface RollingStorage {
  add(key: string, timestamp: number): Promise<void>;
  get(key: string, since: number): Promise<number[]>;
  cleanup(key: string, before: number): Promise<void>;
}

/**
 * In-memory rolling storage
 */
class MemoryRollingStorage implements RollingStorage {
  private store = new Map<string, number[]>();

  async add(key: string, timestamp: number): Promise<void> {
    const timestamps = this.store.get(key) ?? [];
    timestamps.push(timestamp);
    this.store.set(key, timestamps);
  }

  async get(key: string, since: number): Promise<number[]> {
    const timestamps = this.store.get(key) ?? [];
    return timestamps.filter(t => t >= since);
  }

  async cleanup(key: string, before: number): Promise<void> {
    const timestamps = this.store.get(key);
    if (!timestamps) return;

    const filtered = timestamps.filter(t => t >= before);
    if (filtered.length === 0) {
      this.store.delete(key);
    } else {
      this.store.set(key, filtered);
    }
  }

  clear(): void {
    this.store.clear();
  }
}

/**
 * Rolling/sliding window rate limiter
 */
export class RollingRateLimiter {
  private interval: number;
  private max: number;
  private storage: RollingStorage;

  constructor(options: RollingRateLimiterOptions, storage?: RollingStorage) {
    this.interval = options.interval;
    this.max = options.maxInInterval;
    this.storage = storage ?? new MemoryRollingStorage();
  }

  /**
   * Check if request is allowed using rolling window
   */
  async limit(identifier: string): Promise<{ allowed: boolean; current: number; remaining: number }> {
    const now = Date.now();
    const windowStart = now - this.interval;

    // Clean up old timestamps
    await this.storage.cleanup(identifier, windowStart);

    // Get timestamps in current window
    const timestamps = await this.storage.get(identifier, windowStart);
    const current = timestamps.length;

    // Check if under limit
    if (current < this.max) {
      // Add new timestamp
      await this.storage.add(identifier, now);

      return {
        allowed: true,
        current: current + 1,
        remaining: this.max - current - 1,
      };
    }

    return {
      allowed: false,
      current,
      remaining: 0,
    };
  }

  /**
   * Get current count in rolling window
   */
  async count(identifier: string): Promise<number> {
    const now = Date.now();
    const windowStart = now - this.interval;

    const timestamps = await this.storage.get(identifier, windowStart);
    return timestamps.length;
  }

  /**
   * Get oldest timestamp in window
   */
  async getOldest(identifier: string): Promise<number | null> {
    const now = Date.now();
    const windowStart = now - this.interval;

    const timestamps = await this.storage.get(identifier, windowStart);
    return timestamps.length > 0 ? timestamps[0] : null;
  }
}

/**
 * Create a rolling rate limiter
 */
export function createRollingRateLimiter(
  options: RollingRateLimiterOptions,
  storage?: RollingStorage
): RollingRateLimiter {
  return new RollingRateLimiter(options, storage);
}

export { MemoryRollingStorage, RollingStorage };
export default RollingRateLimiter;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔄 Rolling Rate Limiter - Sliding Window Rate Limiting for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Rolling Window ===");
  const limiter = new RollingRateLimiter({
    interval: 10000, // 10 second window
    maxInInterval: 5, // 5 requests per 10 seconds
  });

  async function testRollingWindow() {
    console.log("Making 7 requests...");

    for (let i = 1; i <= 7; i++) {
      const result = await limiter.limit("user:123");
      console.log(
        `Request ${i} at ${new Date().toISOString()}: ` +
        `${result.allowed ? "✅ ALLOWED" : "❌ BLOCKED"} ` +
        `(${result.current}/${limiter["max"]}, ${result.remaining} remaining)`
      );

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  await testRollingWindow();
  console.log();

  console.log("=== Example 2: Sliding Window Behavior ===");
  async function demonstrateSlidingWindow() {
    const slidingLimiter = new RollingRateLimiter({
      interval: 5000, // 5 second window
      maxInInterval: 3,
    });

    console.log("Request 1 at T+0s:");
    await slidingLimiter.limit("test:sliding");

    console.log("Request 2 at T+1s:");
    await new Promise(resolve => setTimeout(resolve, 1000));
    await slidingLimiter.limit("test:sliding");

    console.log("Request 3 at T+2s:");
    await new Promise(resolve => setTimeout(resolve, 1000));
    await slidingLimiter.limit("test:sliding");

    console.log("\nRequest 4 at T+3s (should be blocked - window hasn't cleared):");
    await new Promise(resolve => setTimeout(resolve, 1000));
    const result1 = await slidingLimiter.limit("test:sliding");
    console.log(`Result: ${result1.allowed ? "✅ ALLOWED" : "❌ BLOCKED"}`);

    console.log("\nWaiting for window to slide...");
    await new Promise(resolve => setTimeout(resolve, 2500));

    console.log("Request 5 at T+5.5s (first request now outside window):");
    const result2 = await slidingLimiter.limit("test:sliding");
    console.log(`Result: ${result2.allowed ? "✅ ALLOWED" : "❌ BLOCKED"}`);
  }

  await demonstrateSlidingWindow();
  console.log();

  console.log("=== Example 3: Precise API Rate Limiting ===");
  const apiLimiter = new RollingRateLimiter({
    interval: 60000, // 1 minute
    maxInInterval: 100,
  });

  async function handleAPIRequest(apiKey: string): Promise<{ status: number; message: string }> {
    const result = await apiLimiter.limit(`api:${apiKey}`);

    if (!result.allowed) {
      const oldest = await apiLimiter.getOldest(`api:${apiKey}`);
      const resetIn = oldest ? Math.ceil((oldest + apiLimiter["interval"] - Date.now()) / 1000) : 0;

      return {
        status: 429,
        message: `Rate limit exceeded. Resets in ${resetIn}s`,
      };
    }

    return {
      status: 200,
      message: `Success. ${result.remaining} requests remaining in current window.`,
    };
  }

  console.log("API requests:");
  for (let i = 0; i < 3; i++) {
    const response = await handleAPIRequest("key:abc");
    console.log(`Request ${i + 1}: ${response.status} - ${response.message}`);
  }
  console.log();

  console.log("=== Example 4: Burst Protection ===");
  const burstLimiter = new RollingRateLimiter({
    interval: 1000, // 1 second
    maxInInterval: 5,
  });

  async function testBurstProtection() {
    console.log("Sending 10 rapid requests...");

    const results = [];
    for (let i = 0; i < 10; i++) {
      const result = await burstLimiter.limit("burst:test");
      results.push(result);
    }

    const allowed = results.filter(r => r.allowed).length;
    const blocked = results.filter(r => !r.allowed).length;

    console.log(`Results: ${allowed} allowed, ${blocked} blocked`);
    console.log(`First 5 allowed: ${results.slice(0, 5).every(r => r.allowed) ? "✅" : "❌"}`);
    console.log(`Last 5 blocked: ${results.slice(5).every(r => !r.allowed) ? "✅" : "❌"}`);
  }

  await testBurstProtection();
  console.log();

  console.log("=== Example 5: Current Count Tracking ===");
  const countLimiter = new RollingRateLimiter({
    interval: 5000,
    maxInInterval: 10,
  });

  async function trackUsage(userId: string): Promise<void> {
    await countLimiter.limit(userId);
    const count = await countLimiter.count(userId);
    console.log(`User ${userId}: ${count} requests in current window`);
  }

  await trackUsage("user:alice");
  await trackUsage("user:alice");
  await trackUsage("user:bob");
  await trackUsage("user:alice");
  console.log();

  console.log("=== Example 6: POLYGLOT Use Case ===");
  console.log("🌐 Same rolling rate limiter works in:");
  console.log("  • JavaScript/TypeScript APIs");
  console.log("  • Python services (via Elide)");
  console.log("  • Ruby applications (via Elide)");
  console.log("  • Java backends (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ One precise rate limiting library, all languages");
  console.log("  ✓ Consistent sliding window across all services");
  console.log("  ✓ Share rolling window configs across your stack");
  console.log("  ✓ No need for language-specific rolling limiters");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Precise API rate limiting (exact time windows)");
  console.log("- Sliding window throttling (smooth limits)");
  console.log("- Time-based quotas (rolling periods)");
  console.log("- Fair usage enforcement (accurate tracking)");
  console.log("- Burst protection (prevent spikes)");
  console.log("- Gradual limit recovery (no hard resets)");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Sliding window algorithm (precise tracking)");
  console.log("- Automatic cleanup (old timestamps removed)");
  console.log("- Memory-efficient (only stores timestamps)");
  console.log("- Zero dependencies");
  console.log("- ~30K+ downloads/week on npm!");
  console.log();

  console.log("💡 Polyglot Tips:");
  console.log("- Use in Python/Ruby/Java APIs via Elide");
  console.log("- Share Redis storage for distributed rolling limits");
  console.log("- One precise rate limiting strategy for all services");
  console.log("- Perfect for polyglot microservices!");
}
