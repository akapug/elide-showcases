/**
 * Cache System - In-Memory LRU Cache with TTL
 *
 * High-performance caching for ML inference results:
 * - LRU eviction policy
 * - Time-to-live (TTL) support
 * - Memory limits
 * - Cache statistics
 * - Automatic cleanup
 *
 * @module api/cache
 */

/**
 * Cache entry
 */
interface CacheEntry<T> {
  key: string;
  value: T;
  expiresAt: number;
  createdAt: number;
  accessCount: number;
  lastAccessedAt: number;
  size: number; // Approximate size in bytes
}

/**
 * Cache statistics
 */
interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  size: number;
  memory: number;
  hitRate: number;
  avgAccessCount: number;
}

/**
 * Cache configuration
 */
interface CacheConfig {
  maxSize: number; // Maximum number of entries
  maxMemory: number; // Maximum memory in bytes
  defaultTTL: number; // Default TTL in seconds
  cleanupInterval: number; // Cleanup interval in milliseconds
}

/**
 * LRU Cache with TTL
 */
class Cache {
  private store: Map<string, CacheEntry<any>>;
  private config: CacheConfig;
  private stats: CacheStats;
  private cleanupTimer: NodeJS.Timeout | null;
  private accessOrder: string[]; // For LRU tracking

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      maxSize: config?.maxSize || 1000,
      maxMemory: config?.maxMemory || 100 * 1024 * 1024, // 100MB
      defaultTTL: config?.defaultTTL || 3600, // 1 hour
      cleanupInterval: config?.cleanupInterval || 60000, // 1 minute
    };

    this.store = new Map();
    this.accessOrder = [];
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      size: 0,
      memory: 0,
      hitRate: 0,
      avgAccessCount: 0,
    };

    this.cleanupTimer = null;
    this.startCleanup();
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key);

    // Cache miss
    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Cache hit
    this.stats.hits++;
    entry.accessCount++;
    entry.lastAccessedAt = Date.now();
    this.updateAccessOrder(key);
    this.updateHitRate();

    return entry.value as T;
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, value: T, ttl?: number): void {
    this.stats.sets++;

    // Calculate entry size (approximate)
    const size = this.estimateSize(value);

    // Check if we need to evict entries
    this.ensureCapacity(size);

    // Create cache entry
    const now = Date.now();
    const entry: CacheEntry<T> = {
      key,
      value,
      expiresAt: now + (ttl || this.config.defaultTTL) * 1000,
      createdAt: now,
      accessCount: 0,
      lastAccessedAt: now,
      size,
    };

    // Delete old entry if exists
    if (this.store.has(key)) {
      this.delete(key);
    }

    // Add new entry
    this.store.set(key, entry);
    this.accessOrder.push(key);
    this.stats.size++;
    this.stats.memory += size;
  }

  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) {
      return false;
    }

    this.store.delete(key);
    this.removeFromAccessOrder(key);
    this.stats.deletes++;
    this.stats.size--;
    this.stats.memory -= entry.size;

    return true;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) {
      return false;
    }

    if (this.isExpired(entry)) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.store.clear();
    this.accessOrder = [];
    this.stats.size = 0;
    this.stats.memory = 0;
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.store.size;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    // Calculate average access count
    let totalAccessCount = 0;
    for (const entry of this.store.values()) {
      totalAccessCount += entry.accessCount;
    }
    this.stats.avgAccessCount = this.store.size > 0
      ? totalAccessCount / this.store.size
      : 0;

    return { ...this.stats };
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    return Array.from(this.store.keys());
  }

  /**
   * Get all entries
   */
  entries(): Array<[string, any]> {
    const entries: Array<[string, any]> = [];
    for (const [key, entry] of this.store.entries()) {
      if (!this.isExpired(entry)) {
        entries.push([key, entry.value]);
      }
    }
    return entries;
  }

  /**
   * Get cache info for debugging
   */
  getInfo(): any {
    const entries = Array.from(this.store.values()).map(entry => ({
      key: entry.key,
      size: entry.size,
      expiresIn: Math.max(0, entry.expiresAt - Date.now()),
      accessCount: entry.accessCount,
      age: Date.now() - entry.createdAt,
    }));

    return {
      config: this.config,
      stats: this.getStats(),
      entries: entries.slice(0, 10), // Show first 10 entries
      oldestEntry: entries.reduce((oldest, entry) =>
        entry.age > oldest.age ? entry : oldest,
        entries[0]
      ),
      mostAccessed: entries.reduce((most, entry) =>
        entry.accessCount > most.accessCount ? entry : most,
        entries[0]
      ),
    };
  }

  /**
   * Check if entry is expired
   */
  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() > entry.expiresAt;
  }

  /**
   * Estimate size of value in bytes
   */
  private estimateSize(value: any): number {
    const json = JSON.stringify(value);
    return json.length * 2; // 2 bytes per character (UTF-16)
  }

  /**
   * Ensure cache has capacity for new entry
   */
  private ensureCapacity(requiredSize: number): void {
    // Check memory limit
    while (this.stats.memory + requiredSize > this.config.maxMemory && this.store.size > 0) {
      this.evictLRU();
    }

    // Check size limit
    while (this.store.size >= this.config.maxSize && this.store.size > 0) {
      this.evictLRU();
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    if (this.accessOrder.length === 0) {
      return;
    }

    // Get least recently used key
    const key = this.accessOrder[0];
    this.delete(key);
    this.stats.evictions++;
  }

  /**
   * Update access order for LRU
   */
  private updateAccessOrder(key: string): void {
    // Remove key from current position
    this.removeFromAccessOrder(key);

    // Add key to end (most recently used)
    this.accessOrder.push(key);
  }

  /**
   * Remove key from access order
   */
  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * Start automatic cleanup
   */
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Stop automatic cleanup
   */
  private stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt < now) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.delete(key);
    }

    if (keysToDelete.length > 0) {
      console.log(`[Cache] Cleaned up ${keysToDelete.length} expired entries`);
    }
  }

  /**
   * Destroy cache
   */
  destroy(): void {
    this.stopCleanup();
    this.clear();
  }
}

/**
 * Multi-level cache with local and distributed tiers
 */
class MultiLevelCache {
  private l1Cache: Cache; // Fast in-memory cache
  private l2Cache: Cache; // Larger secondary cache

  constructor() {
    // L1: Small, fast cache
    this.l1Cache = new Cache({
      maxSize: 100,
      maxMemory: 10 * 1024 * 1024, // 10MB
      defaultTTL: 300, // 5 minutes
    });

    // L2: Larger, longer-lived cache
    this.l2Cache = new Cache({
      maxSize: 1000,
      maxMemory: 100 * 1024 * 1024, // 100MB
      defaultTTL: 3600, // 1 hour
    });
  }

  /**
   * Get value from cache (tries L1, then L2)
   */
  get<T>(key: string): T | null {
    // Try L1 first
    let value = this.l1Cache.get<T>(key);
    if (value !== null) {
      return value;
    }

    // Try L2
    value = this.l2Cache.get<T>(key);
    if (value !== null) {
      // Promote to L1
      this.l1Cache.set(key, value);
      return value;
    }

    return null;
  }

  /**
   * Set value in cache (sets in both L1 and L2)
   */
  set<T>(key: string, value: T, ttl?: number): void {
    this.l1Cache.set(key, value, ttl);
    this.l2Cache.set(key, value, ttl);
  }

  /**
   * Delete from both caches
   */
  delete(key: string): void {
    this.l1Cache.delete(key);
    this.l2Cache.delete(key);
  }

  /**
   * Clear both caches
   */
  clear(): void {
    this.l1Cache.clear();
    this.l2Cache.clear();
  }

  /**
   * Get combined statistics
   */
  getStats(): { l1: CacheStats; l2: CacheStats } {
    return {
      l1: this.l1Cache.getStats(),
      l2: this.l2Cache.getStats(),
    };
  }

  /**
   * Destroy both caches
   */
  destroy(): void {
    this.l1Cache.destroy();
    this.l2Cache.destroy();
  }
}

// Export singleton cache instance
export const cache = new Cache({
  maxSize: 1000,
  maxMemory: 100 * 1024 * 1024, // 100MB
  defaultTTL: 3600, // 1 hour
  cleanupInterval: 60000, // 1 minute
});

// Export cache classes
export { Cache, MultiLevelCache };
export type { CacheEntry, CacheStats, CacheConfig };
