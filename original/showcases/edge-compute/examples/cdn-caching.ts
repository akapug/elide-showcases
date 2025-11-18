/**
 * Advanced CDN Caching Strategies
 *
 * Demonstrates sophisticated edge caching patterns including:
 * - Cache key generation and normalization
 * - Stale-while-revalidate patterns
 * - Cache purging and invalidation
 * - Conditional requests and ETags
 * - Cache warming and preloading
 * - Origin shield implementation
 * - Cache analytics and monitoring
 */

interface CacheConfig {
  ttl: number;
  staleWhileRevalidate?: number;
  staleIfError?: number;
  tags?: string[];
  varyBy?: string[];
  bypassConditions?: ((req: Request) => boolean)[];
}

interface Request {
  url: string;
  method: string;
  headers: Record<string, string>;
  query: Record<string, string>;
  body?: any;
  ip: string;
  geo?: {
    country: string;
    region: string;
    city: string;
  };
}

interface Response {
  status: number;
  headers: Record<string, string>;
  body: any;
  cached?: boolean;
  age?: number;
}

interface CacheEntry {
  key: string;
  response: Response;
  createdAt: number;
  expiresAt: number;
  staleAt?: number;
  tags: string[];
  hits: number;
  size: number;
}

/**
 * Advanced Cache Manager
 */
class AdvancedCacheManager {
  private cache: Map<string, CacheEntry>;
  private stats: {
    hits: number;
    misses: number;
    staleHits: number;
    bypasses: number;
    purges: number;
  };

  constructor() {
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      staleHits: 0,
      bypasses: 0,
      purges: 0,
    };
  }

  /**
   * Generate normalized cache key
   */
  generateCacheKey(req: Request, config: CacheConfig): string {
    const url = new URL(req.url);
    const parts: string[] = [req.method, url.pathname];

    // Include query parameters
    const queryKeys = Array.from(url.searchParams.keys()).sort();
    if (queryKeys.length > 0) {
      const query = queryKeys
        .map((k) => `${k}=${url.searchParams.get(k)}`)
        .join('&');
      parts.push(query);
    }

    // Vary by headers
    if (config.varyBy) {
      for (const header of config.varyBy) {
        const value = req.headers[header.toLowerCase()] || '';
        parts.push(`${header}:${value}`);
      }
    }

    // Vary by geo location
    if (req.geo && config.varyBy?.includes('geo')) {
      parts.push(`geo:${req.geo.country}`);
    }

    return parts.join('|');
  }

  /**
   * Check if request should bypass cache
   */
  shouldBypass(req: Request, config: CacheConfig): boolean {
    // Always bypass non-GET/HEAD requests
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return true;
    }

    // Check cache control headers
    const cacheControl = req.headers['cache-control'] || '';
    if (cacheControl.includes('no-cache') || cacheControl.includes('no-store')) {
      return true;
    }

    // Check custom bypass conditions
    if (config.bypassConditions) {
      for (const condition of config.bypassConditions) {
        if (condition(req)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Get cached response with stale support
   */
  async get(req: Request, config: CacheConfig): Promise<Response | null> {
    if (this.shouldBypass(req, config)) {
      this.stats.bypasses++;
      return null;
    }

    const key = this.generateCacheKey(req, config);
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    const now = Date.now();

    // Check if entry is fresh
    if (now < entry.expiresAt) {
      entry.hits++;
      this.stats.hits++;
      return {
        ...entry.response,
        cached: true,
        age: Math.floor((now - entry.createdAt) / 1000),
      };
    }

    // Check if we can serve stale
    if (entry.staleAt && now < entry.staleAt) {
      entry.hits++;
      this.stats.staleHits++;

      // Trigger async revalidation
      this.revalidate(key, req, config).catch(console.error);

      return {
        ...entry.response,
        cached: true,
        age: Math.floor((now - entry.createdAt) / 1000),
        headers: {
          ...entry.response.headers,
          'X-Cache-Status': 'STALE',
        },
      };
    }

    // Entry is expired
    this.cache.delete(key);
    this.stats.misses++;
    return null;
  }

  /**
   * Store response in cache
   */
  async set(
    req: Request,
    response: Response,
    config: CacheConfig
  ): Promise<void> {
    if (this.shouldBypass(req, config)) {
      return;
    }

    // Don't cache error responses (except with stale-if-error)
    if (response.status >= 400 && !config.staleIfError) {
      return;
    }

    const key = this.generateCacheKey(req, config);
    const now = Date.now();

    const entry: CacheEntry = {
      key,
      response: {
        ...response,
        headers: {
          ...response.headers,
          'X-Cache-Status': 'HIT',
        },
      },
      createdAt: now,
      expiresAt: now + config.ttl * 1000,
      staleAt: config.staleWhileRevalidate
        ? now + (config.ttl + config.staleWhileRevalidate) * 1000
        : undefined,
      tags: config.tags || [],
      hits: 0,
      size: JSON.stringify(response.body).length,
    };

    this.cache.set(key, entry);
  }

  /**
   * Revalidate stale entry
   */
  private async revalidate(
    key: string,
    req: Request,
    config: CacheConfig
  ): Promise<void> {
    console.log(`Revalidating cache entry: ${key}`);

    // In real implementation, fetch from origin
    // For now, just extend expiration
    const entry = this.cache.get(key);
    if (entry) {
      const now = Date.now();
      entry.expiresAt = now + config.ttl * 1000;
      if (config.staleWhileRevalidate) {
        entry.staleAt = now + (config.ttl + config.staleWhileRevalidate) * 1000;
      }
    }
  }

  /**
   * Purge cache by tags
   */
  purgeByTag(tag: string): number {
    let purged = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        this.cache.delete(key);
        purged++;
      }
    }
    this.stats.purges += purged;
    return purged;
  }

  /**
   * Purge cache by pattern
   */
  purgeByPattern(pattern: RegExp): number {
    let purged = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        purged++;
      }
    }
    this.stats.purges += purged;
    return purged;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? this.stats.hits / total : 0;

    return {
      ...this.stats,
      entries: this.cache.size,
      hitRate: Math.round(hitRate * 100) / 100,
      totalRequests: total,
    };
  }

  /**
   * Get cache entries by tag
   */
  getEntriesByTag(tag: string): CacheEntry[] {
    const entries: CacheEntry[] = [];
    for (const entry of this.cache.values()) {
      if (entry.tags.includes(tag)) {
        entries.push(entry);
      }
    }
    return entries;
  }
}

/**
 * Cache Warming Service
 */
class CacheWarmingService {
  private cacheManager: AdvancedCacheManager;
  private warmingQueue: Request[];
  private isWarming: boolean;

  constructor(cacheManager: AdvancedCacheManager) {
    this.cacheManager = cacheManager;
    this.warmingQueue = [];
    this.isWarming = false;
  }

  /**
   * Add URLs to warming queue
   */
  queueUrls(urls: string[], config: CacheConfig): void {
    for (const url of urls) {
      this.warmingQueue.push({
        url,
        method: 'GET',
        headers: {},
        query: {},
        ip: '127.0.0.1',
      });
    }
  }

  /**
   * Start cache warming
   */
  async warm(config: CacheConfig): Promise<void> {
    if (this.isWarming) {
      return;
    }

    this.isWarming = true;
    console.log(`Starting cache warming: ${this.warmingQueue.length} URLs`);

    while (this.warmingQueue.length > 0) {
      const req = this.warmingQueue.shift()!;

      try {
        // In real implementation, fetch from origin
        const response: Response = {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
          body: `<html>Cached content for ${req.url}</html>`,
        };

        await this.cacheManager.set(req, response, config);
        console.log(`Warmed: ${req.url}`);
      } catch (error: any) {
        console.error(`Failed to warm ${req.url}:`, error.message);
      }

      // Throttle requests
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    this.isWarming = false;
    console.log('Cache warming completed');
  }
}

/**
 * Origin Shield
 *
 * Reduces load on origin by adding a layer between edge and origin
 */
class OriginShield {
  private shieldCache: Map<string, CacheEntry>;
  private originRequests: Map<string, Promise<Response>>;

  constructor() {
    this.shieldCache = new Map();
    this.originRequests = new Map();
  }

  /**
   * Fetch from origin with request coalescing
   */
  async fetch(req: Request, config: CacheConfig): Promise<Response> {
    const key = this.generateKey(req);

    // Check shield cache first
    const cached = this.shieldCache.get(key);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.response;
    }

    // Check if already fetching
    const pending = this.originRequests.get(key);
    if (pending) {
      return pending;
    }

    // Fetch from origin
    const promise = this.fetchFromOrigin(req, config);
    this.originRequests.set(key, promise);

    try {
      const response = await promise;

      // Cache in shield
      const entry: CacheEntry = {
        key,
        response,
        createdAt: Date.now(),
        expiresAt: Date.now() + config.ttl * 1000,
        tags: config.tags || [],
        hits: 0,
        size: JSON.stringify(response.body).length,
      };
      this.shieldCache.set(key, entry);

      return response;
    } finally {
      this.originRequests.delete(key);
    }
  }

  private generateKey(req: Request): string {
    return `${req.method}:${req.url}`;
  }

  private async fetchFromOrigin(
    req: Request,
    config: CacheConfig
  ): Promise<Response> {
    console.log(`Fetching from origin: ${req.url}`);

    // Simulate origin fetch
    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `max-age=${config.ttl}`,
      },
      body: { data: 'From origin', timestamp: Date.now() },
    };
  }
}

/**
 * Example: Basic CDN caching
 */
async function exampleBasicCaching() {
  console.log('=== Basic CDN Caching ===\n');

  const cache = new AdvancedCacheManager();

  const request: Request = {
    url: 'https://example.com/api/products',
    method: 'GET',
    headers: {},
    query: {},
    ip: '1.2.3.4',
  };

  const config: CacheConfig = {
    ttl: 300, // 5 minutes
    tags: ['products'],
  };

  // First request - cache miss
  let response = await cache.get(request, config);
  if (!response) {
    console.log('Cache MISS - fetching from origin');
    response = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: { products: ['A', 'B', 'C'] },
    };
    await cache.set(request, response, config);
  }

  // Second request - cache hit
  response = await cache.get(request, config);
  console.log('Cache status:', response?.cached ? 'HIT' : 'MISS');
  console.log('Response age:', response?.age, 'seconds');

  console.log('\nCache stats:', cache.getStats());
  console.log();
}

/**
 * Example: Stale-while-revalidate
 */
async function exampleStaleWhileRevalidate() {
  console.log('=== Stale-While-Revalidate ===\n');

  const cache = new AdvancedCacheManager();

  const request: Request = {
    url: 'https://example.com/api/trending',
    method: 'GET',
    headers: {},
    query: {},
    ip: '1.2.3.4',
  };

  const config: CacheConfig = {
    ttl: 2, // 2 seconds
    staleWhileRevalidate: 10, // Can serve stale for 10 more seconds
    tags: ['trending'],
  };

  // Initial cache
  const response: Response = {
    status: 200,
    headers: {},
    body: { trending: ['Item 1', 'Item 2'] },
  };
  await cache.set(request, response, config);

  // Wait for expiration
  await new Promise((resolve) => setTimeout(resolve, 2500));

  // Request stale content (will trigger revalidation)
  const staleResponse = await cache.get(request, config);
  console.log('Served stale:', staleResponse?.headers['X-Cache-Status']);
  console.log('Age:', staleResponse?.age, 'seconds');

  console.log();
}

/**
 * Example: Cache purging
 */
async function exampleCachePurging() {
  console.log('=== Cache Purging ===\n');

  const cache = new AdvancedCacheManager();

  // Cache multiple entries
  for (let i = 1; i <= 5; i++) {
    const req: Request = {
      url: `https://example.com/api/product/${i}`,
      method: 'GET',
      headers: {},
      query: {},
      ip: '1.2.3.4',
    };

    const config: CacheConfig = {
      ttl: 300,
      tags: i <= 3 ? ['products', 'featured'] : ['products'],
    };

    await cache.set(
      req,
      { status: 200, headers: {}, body: { id: i } },
      config
    );
  }

  console.log('Cached entries:', cache.getStats().entries);

  // Purge by tag
  const purged = cache.purgeByTag('featured');
  console.log('Purged by tag "featured":', purged);
  console.log('Remaining entries:', cache.getStats().entries);

  // Purge by pattern
  const purged2 = cache.purgeByPattern(/product\/[45]/);
  console.log('Purged by pattern /product/[45]/:', purged2);
  console.log('Remaining entries:', cache.getStats().entries);

  console.log();
}

/**
 * Example: Cache warming
 */
async function exampleCacheWarming() {
  console.log('=== Cache Warming ===\n');

  const cache = new AdvancedCacheManager();
  const warmer = new CacheWarmingService(cache);

  // Queue popular URLs
  const popularUrls = [
    'https://example.com/',
    'https://example.com/products',
    'https://example.com/about',
    'https://example.com/contact',
  ];

  const config: CacheConfig = {
    ttl: 600,
    tags: ['static'],
  };

  warmer.queueUrls(popularUrls, config);
  await warmer.warm(config);

  console.log('\nCache stats after warming:', cache.getStats());
  console.log();
}

/**
 * Example: Origin shield
 */
async function exampleOriginShield() {
  console.log('=== Origin Shield ===\n');

  const shield = new OriginShield();

  const request: Request = {
    url: 'https://example.com/api/data',
    method: 'GET',
    headers: {},
    query: {},
    ip: '1.2.3.4',
  };

  const config: CacheConfig = {
    ttl: 300,
  };

  // First request - hits origin
  console.log('Request 1:');
  const start1 = Date.now();
  await shield.fetch(request, config);
  console.log('Duration:', Date.now() - start1, 'ms');

  // Second request - hits shield cache
  console.log('\nRequest 2:');
  const start2 = Date.now();
  await shield.fetch(request, config);
  console.log('Duration:', Date.now() - start2, 'ms');

  console.log();
}

/**
 * Main execution
 */
async function main() {
  try {
    await exampleBasicCaching();
    await exampleStaleWhileRevalidate();
    await exampleCachePurging();
    await exampleCacheWarming();
    await exampleOriginShield();

    console.log('All CDN caching examples completed successfully!');
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export {
  AdvancedCacheManager,
  CacheWarmingService,
  OriginShield,
  CacheConfig,
  CacheEntry,
  Request,
  Response,
};
