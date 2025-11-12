/**
 * Cache Manager Module
 *
 * Provides advanced caching with Redis simulation:
 * - Multi-tier caching (L1: memory, L2: Redis-like)
 * - Cache invalidation strategies
 * - Cache warming
 * - Cache tags and groups
 * - TTL and eviction policies
 * - Cache statistics
 */

// ==================== Types & Interfaces ====================

export interface CacheEntry<T = any> {
  key: string;
  value: T;
  ttl: number;
  createdAt: number;
  expiresAt: number;
  hits: number;
  size: number;
  tags: Set<string>;
  etag?: string;
  metadata?: Record<string, any>;
}

export interface CacheConfig {
  maxSize?: number;
  defaultTTL?: number;
  evictionPolicy?: 'lru' | 'lfu' | 'fifo' | 'ttl';
  enableL2?: boolean;
  l2TTLMultiplier?: number;
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hits: number;
  misses: number;
  hitRate: number;
  evictions: number;
  l1Entries: number;
  l2Entries: number;
}

export interface InvalidationPattern {
  type: 'key' | 'prefix' | 'tag' | 'regex';
  value: string;
}

// ==================== LRU Cache (L1) ====================

class LRUCache<T = any> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private accessOrder: string[] = [];
  private maxSize: number;
  private totalSize: number = 0;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  set(entry: CacheEntry<T>): void {
    // Remove existing entry if present
    if (this.cache.has(entry.key)) {
      const existing = this.cache.get(entry.key)!;
      this.totalSize -= existing.size;
      this.removeFromAccessOrder(entry.key);
    }

    // Evict if necessary
    while (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(entry.key, entry);
    this.accessOrder.push(entry.key);
    this.totalSize += entry.size;
  }

  get(key: string): CacheEntry<T> | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return null;
    }

    // Update access order
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);
    entry.hits++;

    return entry;
  }

  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    this.cache.delete(key);
    this.removeFromAccessOrder(key);
    this.totalSize -= entry.size;
    return true;
  }

  has(key: string): boolean {
    return this.cache.has(key) && Date.now() <= this.cache.get(key)!.expiresAt;
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    this.totalSize = 0;
  }

  size(): number {
    return this.cache.size;
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  entries(): CacheEntry<T>[] {
    return Array.from(this.cache.values());
  }

  private evictLRU(): void {
    if (this.accessOrder.length === 0) return;

    const key = this.accessOrder.shift()!;
    const entry = this.cache.get(key);

    if (entry) {
      this.totalSize -= entry.size;
    }

    this.cache.delete(key);
  }

  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }
}

// ==================== Redis Simulator (L2) ====================

class RedisSimulator<T = any> {
  private store: Map<string, CacheEntry<T>> = new Map();
  private keyExpiry: Map<string, number> = new Map();
  private pubsubChannels: Map<string, Set<(message: any) => void>> = new Map();

  /**
   * Set a value with optional TTL
   */
  async set(key: string, entry: CacheEntry<T>): Promise<void> {
    this.store.set(key, entry);

    if (entry.ttl > 0) {
      this.keyExpiry.set(key, entry.expiresAt);
    }
  }

  /**
   * Get a value
   */
  async get(key: string): Promise<CacheEntry<T> | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    // Check expiration
    const expiry = this.keyExpiry.get(key);
    if (expiry && Date.now() > expiry) {
      await this.del(key);
      return null;
    }

    entry.hits++;
    return entry;
  }

  /**
   * Delete a key
   */
  async del(key: string): Promise<boolean> {
    this.keyExpiry.delete(key);
    return this.store.delete(key);
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.store.has(key)) return false;

    const expiry = this.keyExpiry.get(key);
    if (expiry && Date.now() > expiry) {
      await this.del(key);
      return false;
    }

    return true;
  }

  /**
   * Get keys matching pattern
   */
  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return Array.from(this.store.keys()).filter(key => regex.test(key));
  }

  /**
   * Get multiple values
   */
  async mget(keys: string[]): Promise<Array<CacheEntry<T> | null>> {
    return Promise.all(keys.map(key => this.get(key)));
  }

  /**
   * Set multiple values
   */
  async mset(entries: Array<{ key: string; entry: CacheEntry<T> }>): Promise<void> {
    await Promise.all(entries.map(({ key, entry }) => this.set(key, entry)));
  }

  /**
   * Increment a value
   */
  async incr(key: string): Promise<number> {
    const entry = await this.get(key);
    const value = entry ? (Number(entry.value) || 0) + 1 : 1;

    await this.set(key, {
      key,
      value: value as any,
      ttl: entry?.ttl || 0,
      createdAt: Date.now(),
      expiresAt: entry?.expiresAt || Date.now() + 3600000,
      hits: 0,
      size: 8,
      tags: new Set()
    });

    return value;
  }

  /**
   * Set expiration time
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    const entry = this.store.get(key);
    if (!entry) return false;

    const expiresAt = Date.now() + seconds * 1000;
    entry.expiresAt = expiresAt;
    this.keyExpiry.set(key, expiresAt);

    return true;
  }

  /**
   * Get time to live
   */
  async ttl(key: string): Promise<number> {
    const expiry = this.keyExpiry.get(key);
    if (!expiry) return -1;

    const remaining = expiry - Date.now();
    return remaining > 0 ? Math.ceil(remaining / 1000) : -2;
  }

  /**
   * Publish message to channel
   */
  async publish(channel: string, message: any): Promise<number> {
    const subscribers = this.pubsubChannels.get(channel);
    if (!subscribers) return 0;

    subscribers.forEach(callback => callback(message));
    return subscribers.size;
  }

  /**
   * Subscribe to channel
   */
  subscribe(channel: string, callback: (message: any) => void): void {
    if (!this.pubsubChannels.has(channel)) {
      this.pubsubChannels.set(channel, new Set());
    }

    this.pubsubChannels.get(channel)!.add(callback);
  }

  /**
   * Unsubscribe from channel
   */
  unsubscribe(channel: string, callback: (message: any) => void): void {
    const subscribers = this.pubsubChannels.get(channel);
    if (subscribers) {
      subscribers.delete(callback);

      if (subscribers.size === 0) {
        this.pubsubChannels.delete(channel);
      }
    }
  }

  /**
   * Get all keys
   */
  getAllKeys(): string[] {
    return Array.from(this.store.keys());
  }

  /**
   * Get database size
   */
  dbsize(): number {
    return this.store.size;
  }

  /**
   * Flush all data
   */
  flushall(): void {
    this.store.clear();
    this.keyExpiry.clear();
  }

  /**
   * Clean up expired keys
   */
  cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [key, expiry] of this.keyExpiry.entries()) {
      if (now > expiry) {
        toDelete.push(key);
      }
    }

    for (const key of toDelete) {
      this.del(key);
    }
  }
}

// ==================== Multi-Tier Cache Manager ====================

export class CacheManager {
  private l1Cache: LRUCache;
  private l2Cache: RedisSimulator;
  private config: CacheConfig;
  private stats: {
    hits: number;
    misses: number;
    evictions: number;
  };
  private tags: Map<string, Set<string>> = new Map();
  private cleanupInterval: any;

  constructor(config?: CacheConfig) {
    this.config = {
      maxSize: 1000,
      defaultTTL: 3600000, // 1 hour
      evictionPolicy: 'lru',
      enableL2: true,
      l2TTLMultiplier: 2,
      ...config
    };

    this.l1Cache = new LRUCache(this.config.maxSize);
    this.l2Cache = new RedisSimulator();

    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0
    };

    this.startCleanup();
  }

  /**
   * Set a value in cache
   */
  async set<T = any>(
    key: string,
    value: T,
    options?: {
      ttl?: number;
      tags?: string[];
      metadata?: Record<string, any>;
    }
  ): Promise<void> {
    const ttl = options?.ttl || this.config.defaultTTL!;
    const now = Date.now();

    const entry: CacheEntry<T> = {
      key,
      value,
      ttl,
      createdAt: now,
      expiresAt: now + ttl,
      hits: 0,
      size: this.estimateSize(value),
      tags: new Set(options?.tags || []),
      etag: this.generateETag(value),
      metadata: options?.metadata
    };

    // Set in L1 cache
    this.l1Cache.set(entry);

    // Set in L2 cache with extended TTL
    if (this.config.enableL2) {
      const l2Entry = { ...entry, ttl: ttl * (this.config.l2TTLMultiplier || 2) };
      await this.l2Cache.set(key, l2Entry);
    }

    // Update tag index
    if (options?.tags) {
      for (const tag of options.tags) {
        if (!this.tags.has(tag)) {
          this.tags.set(tag, new Set());
        }
        this.tags.get(tag)!.add(key);
      }
    }
  }

  /**
   * Get a value from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    // Try L1 cache first
    let entry = this.l1Cache.get(key);

    if (entry) {
      this.stats.hits++;
      return entry.value as T;
    }

    // Try L2 cache
    if (this.config.enableL2) {
      const l2Entry = await this.l2Cache.get(key);

      if (l2Entry) {
        // Promote to L1
        this.l1Cache.set(l2Entry);
        this.stats.hits++;
        return l2Entry.value as T;
      }
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Check if key exists
   */
  async has(key: string): Promise<boolean> {
    if (this.l1Cache.has(key)) {
      return true;
    }

    if (this.config.enableL2) {
      return await this.l2Cache.exists(key);
    }

    return false;
  }

  /**
   * Delete a key
   */
  async delete(key: string): Promise<boolean> {
    const l1Deleted = this.l1Cache.delete(key);
    const l2Deleted = this.config.enableL2 ? await this.l2Cache.del(key) : false;

    // Remove from tag index
    for (const keys of this.tags.values()) {
      keys.delete(key);
    }

    return l1Deleted || l2Deleted;
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidate(pattern: InvalidationPattern): Promise<number> {
    let count = 0;
    const keysToDelete: string[] = [];

    switch (pattern.type) {
      case 'key':
        if (await this.delete(pattern.value)) {
          count++;
        }
        break;

      case 'prefix':
        keysToDelete.push(...this.l1Cache.keys().filter(k => k.startsWith(pattern.value)));

        if (this.config.enableL2) {
          const l2Keys = await this.l2Cache.keys(`${pattern.value}*`);
          keysToDelete.push(...l2Keys);
        }
        break;

      case 'tag':
        const taggedKeys = this.tags.get(pattern.value);
        if (taggedKeys) {
          keysToDelete.push(...Array.from(taggedKeys));
        }
        break;

      case 'regex':
        const regex = new RegExp(pattern.value);
        keysToDelete.push(...this.l1Cache.keys().filter(k => regex.test(k)));

        if (this.config.enableL2) {
          const allL2Keys = this.l2Cache.getAllKeys();
          keysToDelete.push(...allL2Keys.filter(k => regex.test(k)));
        }
        break;
    }

    // Delete all matched keys
    for (const key of new Set(keysToDelete)) {
      if (await this.delete(key)) {
        count++;
      }
    }

    // Publish invalidation event
    if (this.config.enableL2 && count > 0) {
      await this.l2Cache.publish('cache:invalidate', { pattern, count });
    }

    return count;
  }

  /**
   * Warm cache with data
   */
  async warm<T = any>(entries: Array<{ key: string; value: T; ttl?: number; tags?: string[] }>): Promise<void> {
    await Promise.all(
      entries.map(entry =>
        this.set(entry.key, entry.value, { ttl: entry.ttl, tags: entry.tags })
      )
    );
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? this.stats.hits / (this.stats.hits + this.stats.misses)
      : 0;

    return {
      totalEntries: this.l1Cache.size() + (this.config.enableL2 ? this.l2Cache.dbsize() : 0),
      totalSize: this.l1Cache.entries().reduce((sum, e) => sum + e.size, 0),
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate,
      evictions: this.stats.evictions,
      l1Entries: this.l1Cache.size(),
      l2Entries: this.config.enableL2 ? this.l2Cache.dbsize() : 0
    };
  }

  /**
   * Get entry info
   */
  async getEntryInfo(key: string): Promise<{
    exists: boolean;
    ttl?: number;
    hits?: number;
    size?: number;
    tags?: string[];
    etag?: string;
    tier?: 'l1' | 'l2' | 'none';
  }> {
    const l1Entry = this.l1Cache.get(key);

    if (l1Entry) {
      return {
        exists: true,
        ttl: Math.ceil((l1Entry.expiresAt - Date.now()) / 1000),
        hits: l1Entry.hits,
        size: l1Entry.size,
        tags: Array.from(l1Entry.tags),
        etag: l1Entry.etag,
        tier: 'l1'
      };
    }

    if (this.config.enableL2) {
      const l2Entry = await this.l2Cache.get(key);

      if (l2Entry) {
        return {
          exists: true,
          ttl: await this.l2Cache.ttl(key),
          hits: l2Entry.hits,
          size: l2Entry.size,
          tags: Array.from(l2Entry.tags),
          etag: l2Entry.etag,
          tier: 'l2'
        };
      }
    }

    return { exists: false, tier: 'none' };
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.l1Cache.clear();

    if (this.config.enableL2) {
      this.l2Cache.flushall();
    }

    this.tags.clear();
    this.stats = { hits: 0, misses: 0, evictions: 0 };
  }

  private estimateSize(value: any): number {
    const str = JSON.stringify(value);
    return str.length * 2; // UTF-16 encoding
  }

  private generateETag(value: any): string {
    const str = JSON.stringify(value);
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }

    return `"${Math.abs(hash).toString(36)}"`;
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      if (this.config.enableL2) {
        this.l2Cache.cleanup();
      }
    }, 60000); // Every minute
  }

  /**
   * Shutdown cache manager
   */
  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  /**
   * Get L2 cache (for advanced operations)
   */
  getL2Cache(): RedisSimulator {
    return this.l2Cache;
  }
}
