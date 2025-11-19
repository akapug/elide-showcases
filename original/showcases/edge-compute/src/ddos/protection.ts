/**
 * DDoS Protection System
 *
 * Comprehensive DDoS protection for edge computing:
 * - Rate limiting (per IP, per path, global)
 * - Connection limiting
 * - Request validation
 * - Challenge-response (proof-of-work)
 * - Anomaly detection
 * - Auto-mitigation
 */

interface Request {
  ip: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  timestamp: number;
  connectionId?: string;
}

interface RateLimitConfig {
  requestsPerSecond: number;
  burstSize: number;
  blockDuration: number;
}

interface ConnectionLimit {
  maxConnections: number;
  maxConnectionsPerIP: number;
}

interface DDoSMetrics {
  totalRequests: number;
  blockedRequests: number;
  activeConnections: number;
  uniqueIPs: number;
  requestsPerSecond: number;
  topAttackers: Array<{ ip: string; count: number }>;
}

interface Challenge {
  id: string;
  difficulty: number;
  expires: number;
}

/**
 * Token Bucket for rate limiting
 */
class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private capacity: number,
    private refillRate: number
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  /**
   * Try to consume tokens
   */
  consume(tokens: number = 1): boolean {
    this.refill();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }

    return false;
  }

  /**
   * Refill tokens based on time elapsed
   */
  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    const tokensToAdd = elapsed * this.refillRate;

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  /**
   * Get current token count
   */
  getTokens(): number {
    this.refill();
    return this.tokens;
  }
}

/**
 * Connection tracker
 */
class ConnectionTracker {
  private connections: Map<string, Set<string>>; // IP -> connection IDs
  private connectionTimestamps: Map<string, number>;

  constructor(private maxAge: number = 60000) {
    this.connections = new Map();
    this.connectionTimestamps = new Map();
  }

  /**
   * Add connection
   */
  addConnection(ip: string, connectionId: string): void {
    if (!this.connections.has(ip)) {
      this.connections.set(ip, new Set());
    }

    this.connections.get(ip)!.add(connectionId);
    this.connectionTimestamps.set(connectionId, Date.now());
  }

  /**
   * Remove connection
   */
  removeConnection(ip: string, connectionId: string): void {
    const ipConnections = this.connections.get(ip);
    if (ipConnections) {
      ipConnections.delete(connectionId);
      if (ipConnections.size === 0) {
        this.connections.delete(ip);
      }
    }
    this.connectionTimestamps.delete(connectionId);
  }

  /**
   * Get connection count for IP
   */
  getConnectionCount(ip: string): number {
    return this.connections.get(ip)?.size || 0;
  }

  /**
   * Get total connection count
   */
  getTotalConnections(): number {
    let total = 0;
    for (const connections of this.connections.values()) {
      total += connections.size;
    }
    return total;
  }

  /**
   * Clean up old connections
   */
  cleanup(): void {
    const now = Date.now();
    const staleConnections: Array<[string, string]> = [];

    for (const [connectionId, timestamp] of this.connectionTimestamps.entries()) {
      if (now - timestamp > this.maxAge) {
        staleConnections.push(['', connectionId]);
      }
    }

    for (const [ip, connections] of this.connections.entries()) {
      for (const connectionId of connections) {
        const timestamp = this.connectionTimestamps.get(connectionId);
        if (timestamp && now - timestamp > this.maxAge) {
          this.removeConnection(ip, connectionId);
        }
      }
    }
  }
}

/**
 * Request pattern analyzer
 */
class PatternAnalyzer {
  private requestHistory: Map<string, number[]>;
  private pathCounts: Map<string, number>;

  constructor(private windowSize: number = 60000) {
    this.requestHistory = new Map();
    this.pathCounts = new Map();
  }

  /**
   * Record request
   */
  recordRequest(ip: string, path: string, timestamp: number): void {
    // Record IP history
    if (!this.requestHistory.has(ip)) {
      this.requestHistory.set(ip, []);
    }

    const history = this.requestHistory.get(ip)!;
    history.push(timestamp);

    // Clean old entries
    const cutoff = timestamp - this.windowSize;
    const filtered = history.filter((t) => t > cutoff);
    this.requestHistory.set(ip, filtered);

    // Record path
    const count = this.pathCounts.get(path) || 0;
    this.pathCounts.set(path, count + 1);
  }

  /**
   * Detect if IP shows attack pattern
   */
  isAttackPattern(ip: string): boolean {
    const history = this.requestHistory.get(ip) || [];

    if (history.length < 10) {
      return false;
    }

    // Check for very rapid requests
    const recentRequests = history.slice(-10);
    const timeSpan = recentRequests[recentRequests.length - 1] - recentRequests[0];

    // More than 10 requests in 1 second
    if (timeSpan < 1000) {
      return true;
    }

    // Check for constant timing (bot pattern)
    const intervals: number[] = [];
    for (let i = 1; i < recentRequests.length; i++) {
      intervals.push(recentRequests[i] - recentRequests[i - 1]);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce(
      (sum, interval) => sum + Math.pow(interval - avgInterval, 2),
      0
    ) / intervals.length;

    // Very low variance suggests automated requests
    if (variance < 10) {
      return true;
    }

    return false;
  }

  /**
   * Get request rate for IP
   */
  getRequestRate(ip: string): number {
    const history = this.requestHistory.get(ip) || [];
    if (history.length < 2) {
      return 0;
    }

    const timeSpan = (Date.now() - history[0]) / 1000;
    return history.length / timeSpan;
  }

  /**
   * Get top attacked paths
   */
  getTopPaths(limit: number = 10): Array<{ path: string; count: number }> {
    const sorted = Array.from(this.pathCounts.entries())
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count);

    return sorted.slice(0, limit);
  }
}

/**
 * Proof-of-Work Challenge
 */
class ProofOfWorkChallenge {
  private challenges: Map<string, Challenge>;

  constructor() {
    this.challenges = new Map();
  }

  /**
   * Generate challenge for IP
   */
  generateChallenge(ip: string, difficulty: number = 4): Challenge {
    const challenge: Challenge = {
      id: this.generateRandomString(32),
      difficulty,
      expires: Date.now() + 60000, // 1 minute
    };

    this.challenges.set(ip, challenge);
    return challenge;
  }

  /**
   * Verify challenge solution
   */
  verifyChallenge(ip: string, solution: string): boolean {
    const challenge = this.challenges.get(ip);

    if (!challenge) {
      return false;
    }

    if (Date.now() > challenge.expires) {
      this.challenges.delete(ip);
      return false;
    }

    // Verify proof of work (simplified)
    const hash = this.simpleHash(challenge.id + solution);
    const valid = this.hasLeadingZeros(hash, challenge.difficulty);

    if (valid) {
      this.challenges.delete(ip);
    }

    return valid;
  }

  /**
   * Simple hash function (in production, use crypto.createHash)
   */
  private simpleHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  /**
   * Check if hash has leading zeros
   */
  private hasLeadingZeros(hash: string, count: number): boolean {
    for (let i = 0; i < count; i++) {
      if (hash[i] !== '0') {
        return false;
      }
    }
    return true;
  }

  /**
   * Generate random string
   */
  private generateRandomString(length: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

/**
 * DDoS Protection System
 */
export class DDoSProtection {
  private globalRateLimiter: TokenBucket;
  private ipRateLimiters: Map<string, TokenBucket>;
  private pathRateLimiters: Map<string, TokenBucket>;
  private connectionTracker: ConnectionTracker;
  private patternAnalyzer: PatternAnalyzer;
  private powChallenge: ProofOfWorkChallenge;
  private blockedIPs: Map<string, number>; // IP -> unblock timestamp
  private metrics: {
    totalRequests: number;
    blockedRequests: number;
    challengedRequests: number;
  };

  constructor(
    private config: {
      globalLimit: RateLimitConfig;
      ipLimit: RateLimitConfig;
      pathLimit: RateLimitConfig;
      connectionLimit: ConnectionLimit;
    }
  ) {
    this.globalRateLimiter = new TokenBucket(
      config.globalLimit.burstSize,
      config.globalLimit.requestsPerSecond
    );
    this.ipRateLimiters = new Map();
    this.pathRateLimiters = new Map();
    this.connectionTracker = new ConnectionTracker();
    this.patternAnalyzer = new PatternAnalyzer();
    this.powChallenge = new ProofOfWorkChallenge();
    this.blockedIPs = new Map();
    this.metrics = {
      totalRequests: 0,
      blockedRequests: 0,
      challengedRequests: 0,
    };

    // Periodic cleanup
    setInterval(() => {
      this.connectionTracker.cleanup();
      this.cleanupBlockedIPs();
    }, 60000);
  }

  /**
   * Check if request should be allowed
   */
  checkRequest(req: Request): {
    allowed: boolean;
    reason?: string;
    challenge?: Challenge;
  } {
    this.metrics.totalRequests++;

    // Check if IP is blocked
    const blockExpiry = this.blockedIPs.get(req.ip);
    if (blockExpiry && Date.now() < blockExpiry) {
      this.metrics.blockedRequests++;
      return { allowed: false, reason: 'IP blocked due to abuse' };
    }

    // Check global rate limit
    if (!this.globalRateLimiter.consume()) {
      this.metrics.blockedRequests++;
      return { allowed: false, reason: 'Global rate limit exceeded' };
    }

    // Check IP rate limit
    const ipLimiter = this.getIPRateLimiter(req.ip);
    if (!ipLimiter.consume()) {
      this.blockIP(req.ip);
      this.metrics.blockedRequests++;
      return { allowed: false, reason: 'IP rate limit exceeded' };
    }

    // Check path rate limit
    const path = new URL(req.url).pathname;
    const pathLimiter = this.getPathRateLimiter(path);
    if (!pathLimiter.consume()) {
      this.metrics.blockedRequests++;
      return { allowed: false, reason: 'Path rate limit exceeded' };
    }

    // Check connection limit
    if (req.connectionId) {
      this.connectionTracker.addConnection(req.ip, req.connectionId);

      const ipConnections = this.connectionTracker.getConnectionCount(req.ip);
      if (ipConnections > this.config.connectionLimit.maxConnectionsPerIP) {
        this.blockIP(req.ip);
        this.metrics.blockedRequests++;
        return { allowed: false, reason: 'Too many connections from IP' };
      }

      const totalConnections = this.connectionTracker.getTotalConnections();
      if (totalConnections > this.config.connectionLimit.maxConnections) {
        this.metrics.blockedRequests++;
        return { allowed: false, reason: 'Server connection limit reached' };
      }
    }

    // Record for pattern analysis
    this.patternAnalyzer.recordRequest(req.ip, path, req.timestamp);

    // Check for attack patterns
    if (this.patternAnalyzer.isAttackPattern(req.ip)) {
      const challenge = this.powChallenge.generateChallenge(req.ip);
      this.metrics.challengedRequests++;
      return {
        allowed: false,
        reason: 'Suspicious pattern detected',
        challenge,
      };
    }

    return { allowed: true };
  }

  /**
   * Verify challenge solution
   */
  verifyChallenge(ip: string, solution: string): boolean {
    return this.powChallenge.verifyChallenge(ip, solution);
  }

  /**
   * Get IP rate limiter
   */
  private getIPRateLimiter(ip: string): TokenBucket {
    if (!this.ipRateLimiters.has(ip)) {
      this.ipRateLimiters.set(
        ip,
        new TokenBucket(
          this.config.ipLimit.burstSize,
          this.config.ipLimit.requestsPerSecond
        )
      );
    }
    return this.ipRateLimiters.get(ip)!;
  }

  /**
   * Get path rate limiter
   */
  private getPathRateLimiter(path: string): TokenBucket {
    if (!this.pathRateLimiters.has(path)) {
      this.pathRateLimiters.set(
        path,
        new TokenBucket(
          this.config.pathLimit.burstSize,
          this.config.pathLimit.requestsPerSecond
        )
      );
    }
    return this.pathRateLimiters.get(path)!;
  }

  /**
   * Block IP temporarily
   */
  private blockIP(ip: string): void {
    const blockUntil = Date.now() + this.config.ipLimit.blockDuration;
    this.blockedIPs.set(ip, blockUntil);
  }

  /**
   * Clean up expired IP blocks
   */
  private cleanupBlockedIPs(): void {
    const now = Date.now();
    for (const [ip, expiry] of this.blockedIPs.entries()) {
      if (now >= expiry) {
        this.blockedIPs.delete(ip);
      }
    }
  }

  /**
   * Get metrics
   */
  getMetrics(): DDoSMetrics {
    const ipRequestRates = new Map<string, number>();

    for (const [ip] of this.ipRateLimiters.entries()) {
      const rate = this.patternAnalyzer.getRequestRate(ip);
      ipRequestRates.set(ip, rate);
    }

    const topAttackers = Array.from(ipRequestRates.entries())
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const totalRPS = Array.from(ipRequestRates.values()).reduce((a, b) => a + b, 0);

    return {
      totalRequests: this.metrics.totalRequests,
      blockedRequests: this.metrics.blockedRequests,
      activeConnections: this.connectionTracker.getTotalConnections(),
      uniqueIPs: this.ipRateLimiters.size,
      requestsPerSecond: totalRPS,
      topAttackers,
    };
  }
}

/**
 * Example usage
 */
async function demonstrateDDoSProtection() {
  console.log('=== DDoS Protection Demo ===\n');

  const protection = new DDoSProtection({
    globalLimit: {
      requestsPerSecond: 1000,
      burstSize: 2000,
      blockDuration: 60000,
    },
    ipLimit: {
      requestsPerSecond: 10,
      burstSize: 20,
      blockDuration: 300000,
    },
    pathLimit: {
      requestsPerSecond: 100,
      burstSize: 200,
      blockDuration: 60000,
    },
    connectionLimit: {
      maxConnections: 10000,
      maxConnectionsPerIP: 100,
    },
  });

  // Simulate normal traffic
  console.log('1. Normal traffic:');
  for (let i = 0; i < 5; i++) {
    const req: Request = {
      ip: '192.0.2.1',
      url: 'https://example.com/api/data',
      method: 'GET',
      headers: {},
      timestamp: Date.now(),
    };

    const result = protection.checkRequest(req);
    console.log(`  Request ${i + 1}: ${result.allowed ? 'ALLOWED' : 'BLOCKED'}`);

    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  console.log();

  // Simulate attack
  console.log('2. Simulated attack (rapid requests):');
  for (let i = 0; i < 25; i++) {
    const req: Request = {
      ip: '198.51.100.1',
      url: 'https://example.com/api/data',
      method: 'GET',
      headers: {},
      timestamp: Date.now(),
    };

    const result = protection.checkRequest(req);
    if (!result.allowed) {
      console.log(`  Request ${i + 1}: BLOCKED - ${result.reason}`);
      if (result.challenge) {
        console.log(`  Challenge issued (difficulty: ${result.challenge.difficulty})`);
      }
      break;
    }
  }

  console.log();

  // Metrics
  console.log('3. Protection Metrics:');
  const metrics = protection.getMetrics();
  console.log(`  Total requests: ${metrics.totalRequests}`);
  console.log(`  Blocked requests: ${metrics.blockedRequests}`);
  console.log(`  Block rate: ${((metrics.blockedRequests / metrics.totalRequests) * 100).toFixed(1)}%`);
  console.log(`  Unique IPs: ${metrics.uniqueIPs}`);
  console.log(`  Active connections: ${metrics.activeConnections}`);
}

if (require.main === module) {
  demonstrateDDoSProtection().catch(console.error);
}

export { Request, RateLimitConfig, ConnectionLimit, DDoSMetrics, Challenge };
