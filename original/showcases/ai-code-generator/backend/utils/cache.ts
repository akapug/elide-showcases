/**
 * Cache Utility
 *
 * LRU (Least Recently Used) cache with TTL (Time To Live) support
 * Used for caching AI responses, transpilation results, and more
 */

interface CacheEntry<T> {
  value: T;
  expires: number;
  size: number;
}

interface CacheOptions {
  maxSize: number;      // Maximum number of entries
  maxMemory: number;    // Maximum memory in bytes
  ttl: number;          // Default TTL in milliseconds
}

interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
  memory: string;
}

export class Cache<T = any> {
  private cache: Map<string, CacheEntry<T>>;
  private options: CacheOptions;
  private hits: number;
  private misses: number;
  private currentMemory: number;

  constructor(options: CacheOptions) {
    this.cache = new Map();
    this.options = options;
    this.hits = 0;
    this.misses = 0;
    this.currentMemory = 0;
  }

  /**
   * Get value from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expires) {
      this.delete(key);
      this.misses++;
      return null;
    }

    // Update access time (move to end for LRU)
    this.cache.delete(key);
    this.cache.set(key, entry);

    this.hits++;
    return entry.value;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T, ttl?: number): void {
    const size = this.estimateSize(value);
    const expires = Date.now() + (ttl || this.options.ttl);

    // Remove old entry if exists
    if (this.cache.has(key)) {
      const oldEntry = this.cache.get(key)!;
      this.currentMemory -= oldEntry.size;
      this.cache.delete(key);
    }

    // Evict entries if necessary
    while (
      (this.cache.size >= this.options.maxSize ||
        this.currentMemory + size > this.options.maxMemory) &&
      this.cache.size > 0
    ) {
      this.evictLRU();
    }

    // Add new entry
    this.cache.set(key, { value, expires, size });
    this.currentMemory += size;
  }

  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      this.currentMemory -= entry.size;
      return this.cache.delete(key);
    }
    return false;
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    // Check if expired
    if (Date.now() > entry.expires) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.currentMemory = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? this.hits / total : 0;

    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: parseFloat(hitRate.toFixed(2)),
      memory: this.formatMemory(this.currentMemory),
    };
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    const firstKey = this.cache.keys().next().value;
    if (firstKey) {
      this.delete(firstKey);
    }
  }

  /**
   * Estimate size of value in bytes
   */
  private estimateSize(value: T): number {
    const str = JSON.stringify(value);
    return new Blob([str]).size;
  }

  /**
   * Format memory size
   */
  private formatMemory(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes}B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)}KB`;
    } else {
      return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        toDelete.push(key);
      }
    }

    for (const key of toDelete) {
      this.delete(key);
    }
  }
}
