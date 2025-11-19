/**
 * Cache-Aside Polyglot Pattern
 *
 * Demonstrates cache-aside caching pattern with different cache implementations:
 * - TypeScript: Cache coordinator
 * - Go: High-performance in-memory cache
 * - Redis (simulated): Distributed cache
 * - Python: ML-based cache warming
 */

// Cache interface
interface Cache {
  get(key: string): Promise<any | null>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
}

// In-Memory Cache (Go-style)
class InMemoryCache implements Cache {
  private store: Map<string, { value: any; expiresAt: number }> = new Map();
  private hits = 0;
  private misses = 0;

  async get(key: string): Promise<any | null> {
    const entry = this.store.get(key);

    if (!entry) {
      this.misses++;
      console.log(`  [Go Cache] MISS: ${key}`);
      return null;
    }

    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      this.misses++;
      console.log(`  [Go Cache] EXPIRED: ${key}`);
      return null;
    }

    this.hits++;
    console.log(`  [Go Cache] HIT: ${key}`);
    return entry.value;
  }

  async set(key: string, value: any, ttl: number = 300000): Promise<void> {
    const expiresAt = Date.now() + ttl;
    this.store.set(key, { value, expiresAt });
    console.log(`  [Go Cache] SET: ${key} (TTL: ${ttl}ms)`);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
    console.log(`  [Go Cache] DELETE: ${key}`);
  }

  async has(key: string): Promise<boolean> {
    const entry = this.store.get(key);
    return !!entry && entry.expiresAt >= Date.now();
  }

  getStats(): { hits: number; misses: number; hitRate: number } {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? (this.hits / total) * 100 : 0,
    };
  }

  clear(): void {
    this.store.clear();
    console.log(`  [Go Cache] CLEAR: All entries removed`);
  }
}

// Distributed Cache (Redis-style simulation)
class DistributedCache implements Cache {
  private store: Map<string, { value: any; expiresAt: number }> = new Map();

  async get(key: string): Promise<any | null> {
    const entry = this.store.get(key);

    if (!entry || entry.expiresAt < Date.now()) {
      console.log(`  [Redis] MISS: ${key}`);
      return null;
    }

    console.log(`  [Redis] HIT: ${key}`);
    return entry.value;
  }

  async set(key: string, value: any, ttl: number = 300000): Promise<void> {
    const expiresAt = Date.now() + ttl;
    this.store.set(key, { value, expiresAt });
    console.log(`  [Redis] SET: ${key} (TTL: ${ttl}ms)`);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
    console.log(`  [Redis] DELETE: ${key}`);
  }

  async has(key: string): Promise<boolean> {
    const entry = this.store.get(key);
    return !!entry && entry.expiresAt >= Date.now();
  }
}

// Cache Warmer (Python-style ML-based)
class CacheWarmer {
  private cache: Cache;
  private dataSource: DataSource;

  constructor(cache: Cache, dataSource: DataSource) {
    this.cache = cache;
    this.dataSource = dataSource;
  }

  async warmPopularItems(): Promise<void> {
    console.log(`  [Python CacheWarmer] Warming cache with popular items`);

    // Simulate ML prediction of popular items
    const popularIds = ['user-1', 'product-1', 'product-2'];

    for (const id of popularIds) {
      const data = await this.dataSource.fetch(id);
      await this.cache.set(id, data, 600000); // 10 minutes
      console.log(`    → Warmed: ${id}`);
    }
  }

  async predictAndWarm(userId: string): Promise<void> {
    console.log(`  [Python CacheWarmer] ML prediction for user: ${userId}`);

    // Simulate ML-based prediction
    const predictedItems = ['product-3', 'product-4'];

    for (const id of predictedItems) {
      const data = await this.dataSource.fetch(id);
      await this.cache.set(id, data);
      console.log(`    → Predicted and warmed: ${id}`);
    }
  }
}

// Data Source (Database simulation)
class DataSource {
  private queryCount = 0;

  async fetch(id: string): Promise<any> {
    this.queryCount++;
    console.log(`    [Database] Query #${this.queryCount}: Fetching ${id}`);

    // Simulate database latency
    await new Promise(resolve => setTimeout(resolve, 100));

    // Simulate data
    if (id.startsWith('user-')) {
      return { id, type: 'user', name: `User ${id}`, email: `${id}@example.com` };
    } else if (id.startsWith('product-')) {
      return { id, type: 'product', name: `Product ${id}`, price: 99.99 };
    }

    return { id, type: 'unknown' };
  }

  getQueryCount(): number {
    return this.queryCount;
  }

  resetQueryCount(): void {
    this.queryCount = 0;
  }
}

// Cache-Aside Service (TypeScript)
class CacheAsideService {
  private cache: Cache;
  private dataSource: DataSource;

  constructor(cache: Cache, dataSource: DataSource) {
    this.cache = cache;
    this.dataSource = dataSource;
  }

  async get(id: string): Promise<any> {
    console.log(`[CacheAside] Getting: ${id}`);

    // Try cache first
    let data = await this.cache.get(id);

    if (data) {
      console.log(`  ✓ Returned from cache`);
      return data;
    }

    // Cache miss - fetch from source
    console.log(`  → Cache miss, fetching from source`);
    data = await this.dataSource.fetch(id);

    // Store in cache
    await this.cache.set(id, data);

    return data;
  }

  async update(id: string, updates: any): Promise<any> {
    console.log(`[CacheAside] Updating: ${id}`);

    // Fetch current data
    const current = await this.dataSource.fetch(id);
    const updated = { ...current, ...updates };

    // Invalidate cache
    await this.cache.delete(id);
    console.log(`  → Cache invalidated`);

    // In production, update database here

    return updated;
  }

  async delete(id: string): Promise<void> {
    console.log(`[CacheAside] Deleting: ${id}`);

    // Invalidate cache
    await this.cache.delete(id);

    // In production, delete from database here
  }
}

export async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║     Cache-Aside Polyglot - Elide Showcase              ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log();
  console.log('Cache-Aside Components:');
  console.log('  • Cache Service:   TypeScript');
  console.log('  • In-Memory Cache: Go (High performance)');
  console.log('  • Distributed Cache: Redis');
  console.log('  • Cache Warmer:    Python (ML-based)');
  console.log();
  console.log('Pattern:');
  console.log('  1. Check cache');
  console.log('  2. On miss: fetch from source');
  console.log('  3. Store in cache');
  console.log('  4. Return data');
  console.log();

  const dataSource = new DataSource();
  const cache = new InMemoryCache();
  const service = new CacheAsideService(cache, dataSource);
  const warmer = new CacheWarmer(cache, dataSource);

  console.log('════════════════════════════════════════════════════════════');
  console.log('Demo: Cache-Aside Pattern');
  console.log('════════════════════════════════════════════════════════════');
  console.log();

  // Test 1: First access (cache miss)
  console.log('[Test 1] First access - Cache Miss\n');
  await service.get('user-1');
  console.log();

  // Test 2: Second access (cache hit)
  console.log('[Test 2] Second access - Cache Hit\n');
  await service.get('user-1');
  console.log();

  // Test 3: Update (invalidates cache)
  console.log('[Test 3] Update - Invalidate Cache\n');
  await service.update('user-1', { name: 'Updated User' });
  console.log();

  // Test 4: Access after update (cache miss again)
  console.log('[Test 4] Access after update - Cache Miss\n');
  await service.get('user-1');
  console.log();

  // Test 5: Multiple items
  console.log('[Test 5] Multiple Items\n');
  await service.get('product-1');
  await service.get('product-2');
  await service.get('product-1'); // Hit
  console.log();

  // Test 6: Cache warming
  console.log('[Test 6] Cache Warming (Python ML)\n');
  cache.clear();
  dataSource.resetQueryCount();
  await warmer.warmPopularItems();
  console.log();

  // Test 7: Access warmed items (all hits)
  console.log('[Test 7] Access Warmed Items - All Hits\n');
  await service.get('user-1'); // Hit
  await service.get('product-1'); // Hit
  await service.get('product-2'); // Hit
  console.log();

  // Test 8: Predictive warming
  console.log('[Test 8] Predictive Cache Warming\n');
  await warmer.predictAndWarm('user-2');
  console.log();

  // Stats
  console.log('════════════════════════════════════════════════════════════');
  console.log('Cache Statistics');
  console.log('════════════════════════════════════════════════════════════');
  const stats = cache.getStats();
  console.log(`Cache Hits: ${stats.hits}`);
  console.log(`Cache Misses: ${stats.misses}`);
  console.log(`Hit Rate: ${stats.hitRate.toFixed(1)}%`);
  console.log(`Database Queries: ${dataSource.getQueryCount()}`);
  console.log();

  console.log('Key Benefits Demonstrated:');
  console.log('  ✓ Reduced database load');
  console.log('  ✓ Faster response times');
  console.log('  ✓ ML-based cache warming');
  console.log('  ✓ Cache invalidation on updates');
  console.log('  ✓ High-performance Go cache');
  console.log();
}

if (import.meta.url.includes('server.ts')) {
  main().catch(console.error);
}
