/**
 * Express Brute Force Protection for Elide
 *
 * Core brute force protection features:
 * - Request rate limiting per identifier
 * - Exponential backoff
 * - Failed attempt tracking
 * - Configurable retry delays
 * - Memory and persistent storage
 * - Custom failure callbacks
 *
 * Pure TypeScript, zero dependencies, polyglot-ready
 * NPM: 500K+ downloads/week
 */

export interface BruteOptions {
  freeRetries?: number;
  minWait?: number;
  maxWait?: number;
  lifetime?: number;
  failCallback?: (req: any, res: any, next: any, nextValidRequestDate: Date) => void;
  handleStoreError?: (error: Error) => void;
  attachResetToRequest?: boolean;
  refreshTimeoutOnRequest?: boolean;
  proxyDepth?: number;
}

export interface BruteStore {
  get(key: string): Promise<any>;
  set(key: string, value: any, lifetime: number): Promise<void>;
  reset(key: string): Promise<void>;
  increment(key: string, lifetime: number): Promise<any>;
}

export interface BruteData {
  count: number;
  firstRequest: number;
  lastRequest: number;
  nextValidRequestDate?: number;
}

export class MemoryStore implements BruteStore {
  private store: Map<string, BruteData>;

  constructor() {
    this.store = new Map();
  }

  async get(key: string): Promise<BruteData | null> {
    const data = this.store.get(key);
    if (!data) return null;

    // Check if expired
    if (data.nextValidRequestDate && data.nextValidRequestDate < Date.now()) {
      this.store.delete(key);
      return null;
    }

    return data;
  }

  async set(key: string, value: BruteData, lifetime: number): Promise<void> {
    this.store.set(key, value);

    // Auto-cleanup after lifetime
    if (lifetime > 0) {
      setTimeout(() => {
        this.store.delete(key);
      }, lifetime);
    }
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }

  async increment(key: string, lifetime: number): Promise<BruteData> {
    const existing = await this.get(key);
    const now = Date.now();

    if (existing) {
      existing.count++;
      existing.lastRequest = now;
      await this.set(key, existing, lifetime);
      return existing;
    } else {
      const data: BruteData = {
        count: 1,
        firstRequest: now,
        lastRequest: now
      };
      await this.set(key, data, lifetime);
      return data;
    }
  }
}

export class ExpressBrute {
  private freeRetries: number;
  private minWait: number;
  private maxWait: number;
  private lifetime: number;
  private failCallback?: (req: any, res: any, next: any, nextValidRequestDate: Date) => void;
  private handleStoreError?: (error: Error) => void;
  private attachResetToRequest: boolean;
  private refreshTimeoutOnRequest: boolean;
  private proxyDepth: number;
  private store: BruteStore;

  constructor(store?: BruteStore, options: BruteOptions = {}) {
    this.store = store || new MemoryStore();
    this.freeRetries = options.freeRetries ?? 2;
    this.minWait = options.minWait ?? 500; // 500ms
    this.maxWait = options.maxWait ?? 1000 * 60 * 15; // 15 minutes
    this.lifetime = options.lifetime ?? 1000 * 60 * 60 * 24; // 24 hours
    this.failCallback = options.failCallback;
    this.handleStoreError = options.handleStoreError;
    this.attachResetToRequest = options.attachResetToRequest ?? true;
    this.refreshTimeoutOnRequest = options.refreshTimeoutOnRequest ?? true;
    this.proxyDepth = options.proxyDepth ?? 0;
  }

  /**
   * Get middleware to protect routes
   */
  prevent(options?: {
    key?: (req: any, res: any, next: any) => string;
    failCallback?: (req: any, res: any, next: any, nextValidRequestDate: Date) => void;
  }) {
    return async (req: any, res: any, next: any) => {
      try {
        const key = options?.key ? options.key(req, res, next) : this.getKey(req);
        const data = await this.store.get(key);

        // Attach reset function to request
        if (this.attachResetToRequest) {
          req.brute = {
            reset: async () => {
              await this.store.reset(key);
            }
          };
        }

        // Check if request should be blocked
        if (data) {
          const curWait = this.calculateWait(data.count);
          const nextValidRequestDate = new Date(data.lastRequest + curWait);

          if (nextValidRequestDate > new Date()) {
            // Request is blocked
            const retryAfter = Math.ceil((nextValidRequestDate.getTime() - Date.now()) / 1000);
            res.setHeader('Retry-After', retryAfter.toString());

            const failCallback = options?.failCallback || this.failCallback || this.defaultFailCallback;
            return failCallback(req, res, next, nextValidRequestDate);
          }
        }

        // Increment counter
        try {
          await this.store.increment(key, this.lifetime);
        } catch (error) {
          if (this.handleStoreError) {
            this.handleStoreError(error as Error);
          } else {
            console.error('Brute force store error:', error);
          }
        }

        next();
      } catch (error) {
        if (this.handleStoreError) {
          this.handleStoreError(error as Error);
        }
        // On error, fail open (allow request)
        next();
      }
    };
  }

  /**
   * Calculate wait time based on attempt count
   */
  private calculateWait(attemptNumber: number): number {
    if (attemptNumber <= this.freeRetries) {
      return 0;
    }

    const attemptsOverFree = attemptNumber - this.freeRetries;
    // Exponential backoff: minWait * 2^(attempts - 1)
    const wait = this.minWait * Math.pow(2, attemptsOverFree - 1);

    return Math.min(wait, this.maxWait);
  }

  /**
   * Get key from request (default: IP address)
   */
  private getKey(req: any): string {
    let ip = this.getIP(req);
    return `brute:${ip}`;
  }

  /**
   * Get IP address from request
   */
  private getIP(req: any): string {
    let ip = req.ip || req.connection?.remoteAddress || '0.0.0.0';

    // Handle proxy depth
    if (this.proxyDepth > 0 && req.headers?.['x-forwarded-for']) {
      const forwardedIps = req.headers['x-forwarded-for'].split(',').map((s: string) => s.trim());
      const index = Math.max(0, forwardedIps.length - this.proxyDepth);
      ip = forwardedIps[index] || ip;
    }

    return ip;
  }

  /**
   * Default fail callback
   */
  private defaultFailCallback(req: any, res: any, next: any, nextValidRequestDate: Date): void {
    const retryAfter = Math.ceil((nextValidRequestDate.getTime() - Date.now()) / 1000);
    res.status(429).json({
      error: 'Too many requests',
      message: `Too many failed attempts. Please try again later.`,
      nextValidRequestDate: nextValidRequestDate.toISOString(),
      retryAfter: retryAfter
    });
  }

  /**
   * Reset attempts for a specific key
   */
  async reset(key: string): Promise<void> {
    await this.store.reset(key);
  }
}

/**
 * Factory function
 */
export function expressBrute(store?: BruteStore, options: BruteOptions = {}) {
  return new ExpressBrute(store, options);
}

// CLI Demo
if (import.meta.url.includes("express-brute")) {
  console.log("🔐 Express Brute for Elide - Brute Force Protection\n");

  console.log("=== Basic Setup ===");
  const bruteforce = new ExpressBrute(new MemoryStore(), {
    freeRetries: 2,
    minWait: 1000, // 1 second
    maxWait: 60000, // 1 minute
    lifetime: 3600000 // 1 hour
  });

  console.log("✓ Brute force protection initialized");
  console.log("  Free retries: 2");
  console.log("  Min wait: 1000ms");
  console.log("  Max wait: 60000ms");
  console.log("  Lifetime: 1 hour\n");

  console.log("=== Simulating Login Attempts ===");

  const mockReq = {
    ip: '192.168.1.100',
    connection: { remoteAddress: '192.168.1.100' },
    headers: {},
    body: { username: 'test', password: 'wrong' }
  };

  const mockRes = {
    status: (code: number) => ({
      json: (data: any) => {
        console.log(`  Response ${code}:`, JSON.stringify(data, null, 2).substring(0, 100));
      },
      send: (message: string) => {
        console.log(`  Response ${code}: ${message}`);
      }
    }),
    setHeader: (name: string, value: string) => {
      console.log(`  Header: ${name}=${value}`);
    }
  };

  const mockNext = () => {
    console.log("  ✓ Request allowed");
  };

  const middleware = bruteforce.prevent();

  // Simulate multiple failed attempts
  (async () => {
    console.log("Attempt 1 (should succeed):");
    await middleware(mockReq, mockRes, mockNext);
    console.log();

    console.log("Attempt 2 (should succeed):");
    await middleware(mockReq, mockRes, mockNext);
    console.log();

    console.log("Attempt 3 (should succeed):");
    await middleware(mockReq, mockRes, mockNext);
    console.log();

    console.log("Attempt 4 (should be rate limited):");
    await middleware(mockReq, mockRes, mockNext);
    console.log();

    console.log("Attempt 5 (should be rate limited):");
    await middleware(mockReq, mockRes, mockNext);
    console.log();

    console.log("=== Custom Key Example ===");
    const usernameMiddleware = bruteforce.prevent({
      key: (req) => `brute:login:${req.body.username}`
    });

    console.log("Rate limiting by username instead of IP:");
    const userReq = {
      ...mockReq,
      body: { username: 'admin', password: 'wrong' }
    };

    await usernameMiddleware(userReq, mockRes, mockNext);
    console.log();

    console.log("=== Reset Example ===");
    console.log("Resetting attempts for IP 192.168.1.100...");
    await bruteforce.reset('brute:192.168.1.100');
    console.log("✓ Attempts reset\n");

    console.log("✅ Use Cases:");
    console.log("- Login endpoint protection");
    console.log("- Password reset protection");
    console.log("- API authentication protection");
    console.log("- Registration form protection");
    console.log("- Prevent credential stuffing");
    console.log();

    console.log("🚀 Polyglot Benefits:");
    console.log("- 500K+ npm downloads/week");
    console.log("- Zero dependencies");
    console.log("- Works in TypeScript, Python, Ruby, Java");
    console.log("- Instant startup on Elide");
    console.log();

    console.log("🔒 Protection Features:");
    console.log("- Exponential backoff");
    console.log("- Per-IP rate limiting");
    console.log("- Per-user rate limiting");
    console.log("- Configurable thresholds");
    console.log("- Memory or persistent storage");
  })();
}

export default ExpressBrute;
