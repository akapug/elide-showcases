/**
 * Cache Layer
 *
 * Multi-layer caching system:
 * - In-memory LRU cache
 * - TTL-based expiration
 * - Cache warming and preloading
 * - Pattern-based invalidation
 * - Cache statistics and monitoring
 * - Write-through and write-back strategies
 */

export interface CacheEntry<T = any> {
  key: string;
  value: T;
  ttl: number;
  createdAt: number;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
  tags: string[];
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  tags?: string[]; // Tags for grouped invalidation
  compress?: boolean; // Compress large values
}

export interface CacheStats {
  entries: number;
  hits: number;
  misses: number;
  hitRate: number;
  evictions: number;
  totalSize: number;
  avgAccessTime: number;
}

export class CacheLayer {
  private cache: Map<string, CacheEntry> = new Map();
  private accessOrder: string[] = []; // For LRU tracking
  private maxSize: number;
  private maxEntries: number;

  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalSize: 0,
    accessTimes: [] as number[]
  };

  constructor(maxSize = 100 * 1024 * 1024, maxEntries = 10000) {
    // 100MB default max size
    this.maxSize = maxSize;
    this.maxEntries = maxEntries;

    this.startCleanupJob();
    console.log('💾 Cache Layer initialized');
  }

  /**
   * Get value from cache
   */
  get<T = any>(key: string): T | null {
    const startTime = Date.now();
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      this.trackAccessTime(Date.now() - startTime);
      return null;
    }

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.totalSize -= entry.size;
      this.trackAccessTime(Date.now() - startTime);
      return null;
    }

    // Update access tracking
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    // Update LRU order
    this.updateAccessOrder(key);

    this.stats.hits++;
    this.trackAccessTime(Date.now() - startTime);

    return entry.value as T;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: any, ttlOrOptions?: number | CacheOptions): void {
    let ttl: number;
    let tags: string[] = [];

    if (typeof ttlOrOptions === 'number') {
      ttl = ttlOrOptions;
    } else if (ttlOrOptions) {
      ttl = ttlOrOptions.ttl || 300000; // Default 5 minutes
      tags = ttlOrOptions.tags || [];
    } else {
      ttl = 300000; // Default 5 minutes
    }

    const size = this.calculateSize(value);
    const now = Date.now();

    // Check if we need to evict entries
    this.ensureCapacity(size);

    const entry: CacheEntry = {
      key,
      value,
      ttl,
      createdAt: now,
      expiresAt: now + ttl,
      accessCount: 0,
      lastAccessed: now,
      size,
      tags
    };

    // Remove old entry if exists
    if (this.cache.has(key)) {
      const oldEntry = this.cache.get(key)!;
      this.stats.totalSize -= oldEntry.size;
    }

    this.cache.set(key, entry);
    this.stats.totalSize += size;
    this.updateAccessOrder(key);
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.totalSize -= entry.size;
      return false;
    }

    return true;
  }

  /**
   * Delete entry from cache
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    this.cache.delete(key);
    this.stats.totalSize -= entry.size;
    this.removeFromAccessOrder(key);

    return true;
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidate(pattern?: string): number {
    if (!pattern) {
      const count = this.cache.size;
      this.cache.clear();
      this.accessOrder = [];
      this.stats.totalSize = 0;
      return count;
    }

    const regex = new RegExp(pattern);
    const toDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        toDelete.push(key);
      }
    }

    for (const key of toDelete) {
      this.delete(key);
    }

    return toDelete.length;
  }

  /**
   * Invalidate by tags
   */
  invalidateByTag(tag: string): number {
    const toDelete: string[] = [];

    for (const [key, entry] of this.cache) {
      if (entry.tags.includes(tag)) {
        toDelete.push(key);
      }
    }

    for (const key of toDelete) {
      this.delete(key);
    }

    return toDelete.length;
  }

  /**
   * Get or set pattern - fetch from cache or compute and cache
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T> | T,
    options?: CacheOptions
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    this.set(key, value, options);
    return value;
  }

  /**
   * Ensure cache capacity
   */
  private ensureCapacity(newEntrySize: number): void {
    // Check entry count limit
    while (this.cache.size >= this.maxEntries) {
      this.evictLRU();
    }

    // Check size limit
    while (this.stats.totalSize + newEntrySize > this.maxSize && this.cache.size > 0) {
      this.evictLRU();
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    if (this.accessOrder.length === 0) return;

    const keyToEvict = this.accessOrder[0];
    const entry = this.cache.get(keyToEvict);

    if (entry) {
      this.stats.totalSize -= entry.size;
      this.stats.evictions++;
    }

    this.cache.delete(keyToEvict);
    this.accessOrder.shift();
  }

  /**
   * Update LRU access order
   */
  private updateAccessOrder(key: string): void {
    // Remove if exists
    this.removeFromAccessOrder(key);

    // Add to end (most recent)
    this.accessOrder.push(key);
  }

  /**
   * Remove from access order
   */
  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index !== -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  /**
   * Cache warming - preload frequently accessed data
   */
  async warm(entries: Array<{ key: string; value: any; ttl?: number }>): Promise<void> {
    for (const entry of entries) {
      this.set(entry.key, entry.value, entry.ttl);
    }
  }

  /**
   * Get multiple keys at once
   */
  mget<T = any>(keys: string[]): Map<string, T> {
    const results = new Map<string, T>();

    for (const key of keys) {
      const value = this.get<T>(key);
      if (value !== null) {
        results.set(key, value);
      }
    }

    return results;
  }

  /**
   * Set multiple keys at once
   */
  mset(entries: Array<{ key: string; value: any; ttl?: number }>): void {
    for (const entry of entries) {
      this.set(entry.key, entry.value, entry.ttl);
    }
  }

  /**
   * Delete multiple keys at once
   */
  mdel(keys: string[]): number {
    let deleted = 0;

    for (const key of keys) {
      if (this.delete(key)) {
        deleted++;
      }
    }

    return deleted;
  }

  /**
   * Get all keys matching pattern
   */
  keys(pattern?: string): string[] {
    if (!pattern) {
      return Array.from(this.cache.keys());
    }

    const regex = new RegExp(pattern);
    return Array.from(this.cache.keys()).filter(key => regex.test(key));
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? Math.round((this.stats.hits / total) * 100) : 0;

    const avgAccessTime =
      this.stats.accessTimes.length > 0
        ? this.stats.accessTimes.reduce((a, b) => a + b, 0) / this.stats.accessTimes.length
        : 0;

    return {
      entries: this.cache.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate,
      evictions: this.stats.evictions,
      totalSize: Math.round(this.stats.totalSize / 1024), // Convert to KB
      avgAccessTime: Math.round(avgAccessTime * 100) / 100
    };
  }

  /**
   * Get detailed entry info
   */
  getEntryInfo(key: string): CacheEntry | null {
    return this.cache.get(key) || null;
  }

  /**
   * Get top accessed entries
   */
  getTopEntries(limit = 10): CacheEntry[] {
    return Array.from(this.cache.values())
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, limit);
  }

  /**
   * Get entries by tag
   */
  getByTag(tag: string): CacheEntry[] {
    return Array.from(this.cache.values()).filter(entry => entry.tags.includes(tag));
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): number {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [key, entry] of this.cache) {
      if (now > entry.expiresAt) {
        toDelete.push(key);
      }
    }

    for (const key of toDelete) {
      this.delete(key);
    }

    return toDelete.length;
  }

  /**
   * Start background cleanup job
   */
  private startCleanupJob(): void {
    setInterval(() => {
      const cleaned = this.cleanup();
      if (cleaned > 0) {
        console.log(`🧹 Cache: Cleaned up ${cleaned} expired entries`);
      }
    }, 60000); // Run every minute
  }

  /**
   * Calculate approximate size of value
   */
  private calculateSize(value: any): number {
    if (value === null || value === undefined) return 0;

    if (typeof value === 'string') {
      return value.length * 2; // 2 bytes per character (UTF-16)
    }

    if (typeof value === 'number') {
      return 8; // 8 bytes for number
    }

    if (typeof value === 'boolean') {
      return 4; // 4 bytes for boolean
    }

    if (Array.isArray(value)) {
      return value.reduce((sum, item) => sum + this.calculateSize(item), 0);
    }

    if (typeof value === 'object') {
      let size = 0;
      for (const key in value) {
        size += key.length * 2; // Key size
        size += this.calculateSize(value[key]); // Value size
      }
      return size;
    }

    // Fallback for other types
    return JSON.stringify(value).length * 2;
  }

  /**
   * Track access time for performance monitoring
   */
  private trackAccessTime(ms: number): void {
    this.stats.accessTimes.push(ms);

    // Keep only last 1000 measurements
    if (this.stats.accessTimes.length > 1000) {
      this.stats.accessTimes = this.stats.accessTimes.slice(-1000);
    }
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats.hits = 0;
    this.stats.misses = 0;
    this.stats.evictions = 0;
    this.stats.accessTimes = [];
  }

  /**
   * Export cache for debugging
   */
  export(): Array<{ key: string; value: any; expiresAt: Date }> {
    return Array.from(this.cache.values()).map(entry => ({
      key: entry.key,
      value: entry.value,
      expiresAt: new Date(entry.expiresAt)
    }));
  }

  /**
   * Import cache data
   */
  import(data: Array<{ key: string; value: any; ttl?: number }>): void {
    for (const item of data) {
      this.set(item.key, item.value, item.ttl);
    }
  }

  /**
   * Get memory usage info
   */
  getMemoryInfo(): {
    used: number;
    available: number;
    utilization: number;
    maxSize: number;
    maxEntries: number;
  } {
    const utilization = Math.round((this.stats.totalSize / this.maxSize) * 100);

    return {
      used: Math.round(this.stats.totalSize / 1024 / 1024), // MB
      available: Math.round((this.maxSize - this.stats.totalSize) / 1024 / 1024), // MB
      utilization,
      maxSize: Math.round(this.maxSize / 1024 / 1024), // MB
      maxEntries: this.maxEntries
    };
  }

  /**
   * Increment numeric value (atomic operation)
   */
  increment(key: string, delta = 1): number {
    const value = this.get<number>(key);
    const newValue = (value || 0) + delta;
    this.set(key, newValue, 300000); // 5 minutes default TTL
    return newValue;
  }

  /**
   * Decrement numeric value (atomic operation)
   */
  decrement(key: string, delta = 1): number {
    return this.increment(key, -delta);
  }

  /**
   * Touch - update TTL without changing value
   */
  touch(key: string, ttl: number): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    entry.ttl = ttl;
    entry.expiresAt = Date.now() + ttl;

    return true;
  }

  /**
   * Get remaining TTL for key
   */
  ttl(key: string): number {
    const entry = this.cache.get(key);
    if (!entry) return -1;

    const remaining = entry.expiresAt - Date.now();
    return remaining > 0 ? remaining : -1;
  }
}
