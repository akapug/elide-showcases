/**
 * Intelligent Caching Plugin for API Gateway
 * Provides advanced caching strategies:
 * - In-memory caching with LRU eviction
 * - Distributed caching with Redis
 * - HTTP caching with ETags and Last-Modified
 * - Cache warming and prefetching
 * - Cache invalidation patterns
 * - Tiered caching (L1/L2)
 * - Conditional requests
 */

import { createHash } from "crypto";

interface CacheEntry<T> {
  key: string;
  value: T;
  expiresAt: number;
  createdAt: number;
  accessCount: number;
  lastAccessed: number;
  tags?: string[];
  etag?: string;
  metadata?: Record<string, any>;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  tags?: string[];
  staleWhileRevalidate?: number;
  staleIfError?: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  size: number;
  hitRate: number;
}

/**
 * LRU Cache Implementation
 */
export class LRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;
  private defaultTTL: number;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    size: 0,
    hitRate: 0,
  };

  constructor(config: { maxSize: number; defaultTTL?: number }) {
    this.maxSize = config.maxSize;
    this.defaultTTL = config.defaultTTL || 3600000; // 1 hour default

    // Periodic cleanup
    setInterval(() => this.cleanup(), 60000);
  }

  async get(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    const now = Date.now();

    if (now > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Update access metadata
    entry.accessCount++;
    entry.lastAccessed = now;

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    this.stats.hits++;
    this.updateHitRate();

    return entry.value;
  }

  async set(key: string, value: T, options?: CacheOptions): Promise<void> {
    const now = Date.now();
    const ttl = options?.ttl || this.defaultTTL;

    // Check if we need to evict
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      key,
      value,
      expiresAt: now + ttl,
      createdAt: now,
      accessCount: 0,
      lastAccessed: now,
      tags: options?.tags,
      etag: this.generateETag(value),
    };

    this.cache.set(key, entry);
    this.stats.sets++;
    this.stats.size = this.cache.size;
  }

  async delete(key: string): Promise<boolean> {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
      this.stats.size = this.cache.size;
    }
    return deleted;
  }

  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.stats.size = 0;
  }

  async getByTag(tag: string): Promise<T[]> {
    const results: T[] = [];

    for (const entry of this.cache.values()) {
      if (entry.tags?.includes(tag) && Date.now() <= entry.expiresAt) {
        results.push(entry.value);
      }
    }

    return results;
  }

  async invalidateByTag(tag: string): Promise<number> {
    let count = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags?.includes(tag)) {
        this.cache.delete(key);
        count++;
      }
    }

    this.stats.deletes += count;
    this.stats.size = this.cache.size;

    return count;
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  private evictLRU(): void {
    // Find the least recently used entry
    let lruKey: string | null = null;
    let lruTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        toDelete.push(key);
      }
    }

    toDelete.forEach((key) => this.cache.delete(key));
    this.stats.size = this.cache.size;
  }

  private generateETag(value: any): string {
    const hash = createHash("md5");
    hash.update(JSON.stringify(value));
    return hash.digest("hex");
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }
}

/**
 * Distributed Cache with Redis
 */
export class DistributedCache<T> {
  private redis: any;
  private prefix: string;
  private defaultTTL: number;
  private localCache?: LRUCache<T>;

  constructor(config: {
    redis: any;
    prefix?: string;
    defaultTTL?: number;
    localCache?: LRUCache<T>;
  }) {
    this.redis = config.redis;
    this.prefix = config.prefix || "cache";
    this.defaultTTL = config.defaultTTL || 3600;
    this.localCache = config.localCache;
  }

  async get(key: string): Promise<T | null> {
    const fullKey = `${this.prefix}:${key}`;

    // Try local cache first (L1)
    if (this.localCache) {
      const localValue = await this.localCache.get(key);
      if (localValue !== null) {
        return localValue;
      }
    }

    try {
      const value = await this.redis.get(fullKey);
      if (!value) return null;

      const parsed = JSON.parse(value) as T;

      // Populate local cache
      if (this.localCache) {
        await this.localCache.set(key, parsed);
      }

      return parsed;
    } catch (error) {
      console.error("Redis get error:", error);
      return null;
    }
  }

  async set(key: string, value: T, options?: CacheOptions): Promise<void> {
    const fullKey = `${this.prefix}:${key}`;
    const ttl = options?.ttl ? Math.floor(options.ttl / 1000) : this.defaultTTL;

    try {
      const serialized = JSON.stringify(value);
      await this.redis.setex(fullKey, ttl, serialized);

      // Update local cache
      if (this.localCache) {
        await this.localCache.set(key, value, options);
      }
    } catch (error) {
      console.error("Redis set error:", error);
    }
  }

  async delete(key: string): Promise<boolean> {
    const fullKey = `${this.prefix}:${key}`;

    try {
      const result = await this.redis.del(fullKey);

      // Delete from local cache
      if (this.localCache) {
        await this.localCache.delete(key);
      }

      return result > 0;
    } catch (error) {
      console.error("Redis delete error:", error);
      return false;
    }
  }

  async has(key: string): Promise<boolean> {
    const fullKey = `${this.prefix}:${key}`;

    try {
      const exists = await this.redis.exists(fullKey);
      return exists === 1;
    } catch (error) {
      console.error("Redis exists error:", error);
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      const pattern = `${this.prefix}:*`;
      const keys = await this.redis.keys(pattern);

      if (keys.length > 0) {
        await this.redis.del(...keys);
      }

      if (this.localCache) {
        await this.localCache.clear();
      }
    } catch (error) {
      console.error("Redis clear error:", error);
    }
  }

  async invalidateByPattern(pattern: string): Promise<number> {
    try {
      const fullPattern = `${this.prefix}:${pattern}`;
      const keys = await this.redis.keys(fullPattern);

      if (keys.length > 0) {
        await this.redis.del(...keys);
      }

      return keys.length;
    } catch (error) {
      console.error("Redis invalidate error:", error);
      return 0;
    }
  }
}

/**
 * HTTP Cache Handler
 * Implements HTTP caching semantics
 */
export class HTTPCacheHandler {
  private cache: LRUCache<any> | DistributedCache<any>;

  constructor(cache: LRUCache<any> | DistributedCache<any>) {
    this.cache = cache;
  }

  /**
   * Generate cache key from request
   */
  generateCacheKey(request: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    query?: Record<string, any>;
  }): string {
    const parts = [
      request.method,
      request.url,
      request.query ? JSON.stringify(request.query) : "",
    ];

    // Include vary headers
    const varyHeaders = ["accept", "accept-encoding", "accept-language"];
    if (request.headers) {
      for (const header of varyHeaders) {
        if (request.headers[header]) {
          parts.push(`${header}:${request.headers[header]}`);
        }
      }
    }

    const hash = createHash("sha256");
    hash.update(parts.join("|"));
    return hash.digest("hex");
  }

  /**
   * Check if request can be cached
   */
  isCacheable(request: {
    method: string;
    headers?: Record<string, string>;
  }): boolean {
    // Only cache GET and HEAD requests
    if (!["GET", "HEAD"].includes(request.method)) {
      return false;
    }

    // Check Cache-Control header
    const cacheControl = request.headers?.["cache-control"];
    if (cacheControl) {
      if (
        cacheControl.includes("no-cache") ||
        cacheControl.includes("no-store")
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Parse Cache-Control header
   */
  parseCacheControl(header: string): Record<string, string | boolean> {
    const directives: Record<string, string | boolean> = {};

    header.split(",").forEach((directive) => {
      const [key, value] = directive.trim().split("=");
      directives[key] = value || true;
    });

    return directives;
  }

  /**
   * Calculate TTL from response headers
   */
  calculateTTL(headers: Record<string, string>): number {
    const cacheControl = headers["cache-control"];

    if (cacheControl) {
      const directives = this.parseCacheControl(cacheControl);

      if (directives["max-age"]) {
        return parseInt(directives["max-age"] as string, 10) * 1000;
      }

      if (directives["s-maxage"]) {
        return parseInt(directives["s-maxage"] as string, 10) * 1000;
      }
    }

    // Check Expires header
    const expires = headers["expires"];
    if (expires) {
      const expiresDate = new Date(expires);
      return Math.max(0, expiresDate.getTime() - Date.now());
    }

    // Default TTL
    return 300000; // 5 minutes
  }

  /**
   * Generate ETag
   */
  generateETag(body: any): string {
    const hash = createHash("md5");
    hash.update(JSON.stringify(body));
    return `"${hash.digest("hex")}"`;
  }

  /**
   * Check if ETag matches
   */
  checkETag(etag: string, ifNoneMatch?: string): boolean {
    if (!ifNoneMatch) return false;

    const tags = ifNoneMatch.split(",").map((t) => t.trim());
    return tags.includes(etag) || tags.includes("*");
  }

  /**
   * Check if modified since
   */
  checkModifiedSince(
    lastModified: number,
    ifModifiedSince?: string,
  ): boolean {
    if (!ifModifiedSince) return false;

    const modifiedSinceDate = new Date(ifModifiedSince);
    return lastModified <= modifiedSinceDate.getTime();
  }

  /**
   * Handle conditional request
   */
  async handleConditionalRequest(
    request: {
      headers?: Record<string, string>;
    },
    cacheKey: string,
  ): Promise<{
    status: number;
    headers: Record<string, string>;
    body?: any;
  } | null> {
    const cached = await this.cache.get(cacheKey);
    if (!cached) return null;

    const ifNoneMatch = request.headers?.["if-none-match"];
    const ifModifiedSince = request.headers?.["if-modified-since"];

    // Check ETag
    if (ifNoneMatch && cached.etag) {
      if (this.checkETag(cached.etag, ifNoneMatch)) {
        return {
          status: 304,
          headers: {
            etag: cached.etag,
            "cache-control": "max-age=300",
          },
        };
      }
    }

    // Check Last-Modified
    if (ifModifiedSince && cached.lastModified) {
      if (this.checkModifiedSince(cached.lastModified, ifModifiedSince)) {
        return {
          status: 304,
          headers: {
            "last-modified": new Date(cached.lastModified).toUTCString(),
            "cache-control": "max-age=300",
          },
        };
      }
    }

    return null;
  }
}

/**
 * Cache Warming Strategy
 */
export class CacheWarmer {
  private cache: LRUCache<any> | DistributedCache<any>;
  private warmingQueue: Array<{
    key: string;
    fetcher: () => Promise<any>;
    priority: number;
  }> = [];
  private isWarming = false;

  constructor(cache: LRUCache<any> | DistributedCache<any>) {
    this.cache = cache;
  }

  /**
   * Add item to warming queue
   */
  addToQueue(
    key: string,
    fetcher: () => Promise<any>,
    priority: number = 0,
  ): void {
    this.warmingQueue.push({ key, fetcher, priority });
    this.warmingQueue.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Start cache warming
   */
  async warm(concurrency: number = 5): Promise<void> {
    if (this.isWarming) return;

    this.isWarming = true;

    while (this.warmingQueue.length > 0) {
      const batch = this.warmingQueue.splice(0, concurrency);

      await Promise.all(
        batch.map(async (item) => {
          try {
            const value = await item.fetcher();
            await this.cache.set(item.key, value);
          } catch (error) {
            console.error(`Cache warming failed for key ${item.key}:`, error);
          }
        }),
      );
    }

    this.isWarming = false;
  }

  /**
   * Prefetch related items
   */
  async prefetch(
    keys: string[],
    fetcher: (key: string) => Promise<any>,
  ): Promise<void> {
    await Promise.all(
      keys.map(async (key) => {
        const exists = await this.cache.has(key);
        if (!exists) {
          try {
            const value = await fetcher(key);
            await this.cache.set(key, value);
          } catch (error) {
            console.error(`Prefetch failed for key ${key}:`, error);
          }
        }
      }),
    );
  }
}

/**
 * Cache Invalidation Strategies
 */
export class CacheInvalidator {
  private cache: LRUCache<any> | DistributedCache<any>;
  private patterns = new Map<string, RegExp[]>();

  constructor(cache: LRUCache<any> | DistributedCache<any>) {
    this.cache = cache;
  }

  /**
   * Register invalidation pattern
   */
  registerPattern(event: string, patterns: RegExp[]): void {
    this.patterns.set(event, patterns);
  }

  /**
   * Invalidate by event
   */
  async invalidate(event: string, data?: any): Promise<number> {
    const patterns = this.patterns.get(event);
    if (!patterns) return 0;

    let count = 0;

    for (const pattern of patterns) {
      if (this.cache instanceof DistributedCache) {
        count += await this.cache.invalidateByPattern(pattern.source);
      }
    }

    return count;
  }

  /**
   * Time-based invalidation
   */
  scheduleInvalidation(key: string, delay: number): void {
    setTimeout(async () => {
      await this.cache.delete(key);
    }, delay);
  }
}

/**
 * Main Cache Plugin
 */
export class CachePlugin {
  private l1Cache: LRUCache<any>;
  private l2Cache?: DistributedCache<any>;
  private httpCache: HTTPCacheHandler;
  private warmer: CacheWarmer;
  private invalidator: CacheInvalidator;

  constructor(config: {
    l1MaxSize?: number;
    l1TTL?: number;
    redis?: any;
    redisPrefix?: string;
  }) {
    // L1 cache (in-memory)
    this.l1Cache = new LRUCache({
      maxSize: config.l1MaxSize || 1000,
      defaultTTL: config.l1TTL || 300000,
    });

    // L2 cache (distributed)
    if (config.redis) {
      this.l2Cache = new DistributedCache({
        redis: config.redis,
        prefix: config.redisPrefix || "cache",
        localCache: this.l1Cache,
      });
    }

    this.httpCache = new HTTPCacheHandler(this.l2Cache || this.l1Cache);
    this.warmer = new CacheWarmer(this.l2Cache || this.l1Cache);
    this.invalidator = new CacheInvalidator(this.l2Cache || this.l1Cache);
  }

  getL1Cache(): LRUCache<any> {
    return this.l1Cache;
  }

  getL2Cache(): DistributedCache<any> | undefined {
    return this.l2Cache;
  }

  getHTTPCache(): HTTPCacheHandler {
    return this.httpCache;
  }

  getWarmer(): CacheWarmer {
    return this.warmer;
  }

  getInvalidator(): CacheInvalidator {
    return this.invalidator;
  }

  /**
   * Cache middleware
   */
  middleware() {
    return async (req: any, res: any, next: any) => {
      // Check if request is cacheable
      if (!this.httpCache.isCacheable(req)) {
        return next();
      }

      const cacheKey = this.httpCache.generateCacheKey(req);

      // Check for conditional request
      const conditional = await this.httpCache.handleConditionalRequest(
        req,
        cacheKey,
      );

      if (conditional) {
        res.status(conditional.status);
        Object.entries(conditional.headers).forEach(([key, value]) => {
          res.setHeader(key, value);
        });
        return res.end();
      }

      // Try to serve from cache
      const cache = this.l2Cache || this.l1Cache;
      const cached = await cache.get(cacheKey);

      if (cached) {
        res.setHeader("X-Cache", "HIT");
        if (cached.etag) {
          res.setHeader("ETag", cached.etag);
        }
        return res.json(cached.body);
      }

      // Store original send
      const originalJson = res.json.bind(res);

      res.json = (body: any) => {
        // Cache the response
        const ttl = this.httpCache.calculateTTL(res.getHeaders());
        const etag = this.httpCache.generateETag(body);

        cache.set(cacheKey, {
          body,
          etag,
          lastModified: Date.now(),
        }, { ttl });

        res.setHeader("X-Cache", "MISS");
        res.setHeader("ETag", etag);

        return originalJson(body);
      };

      next();
    };
  }
}

export default CachePlugin;
