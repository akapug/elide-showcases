/**
 * Cache
 *
 * Simple in-memory cache with TTL support
 */

export interface CacheOptions {
  /**
   * Maximum number of items
   */
  maxSize?: number;

  /**
   * Default time-to-live in milliseconds
   */
  ttl?: number;

  /**
   * Cleanup interval in milliseconds
   */
  cleanupInterval?: number;
}

interface CacheEntry<T> {
  value: T;
  expires?: number;
}

export class Cache<T = any> {
  private store: Map<string, CacheEntry<T>> = new Map();
  private options: Required<CacheOptions>;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(options: CacheOptions = {}) {
    this.options = {
      maxSize: options.maxSize || 1000,
      ttl: options.ttl || 60000, // 1 minute default
      cleanupInterval: options.cleanupInterval || 30000, // 30 seconds
    };

    // Start cleanup timer
    this.startCleanup();
  }

  /**
   * Set cache value
   */
  set(key: string, value: T, ttl?: number): void {
    // Check size limit
    if (this.store.size >= this.options.maxSize && !this.store.has(key)) {
      // Remove oldest entry
      const firstKey = this.store.keys().next().value;
      this.store.delete(firstKey);
    }

    const expires = ttl !== undefined || this.options.ttl > 0
      ? Date.now() + (ttl || this.options.ttl)
      : undefined;

    this.store.set(key, { value, expires });
  }

  /**
   * Get cache value
   */
  get(key: string): T | undefined {
    const entry = this.store.get(key);

    if (!entry) {
      return undefined;
    }

    // Check expiration
    if (entry.expires && Date.now() > entry.expires) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value;
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    const entry = this.store.get(key);

    if (!entry) {
      return false;
    }

    // Check expiration
    if (entry.expires && Date.now() > entry.expires) {
      this.store.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete cache entry
   */
  delete(key: string): boolean {
    return this.store.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Get cache size
   */
  get size(): number {
    return this.store.size;
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    return Array.from(this.store.keys());
  }

  /**
   * Get or set value
   */
  async getOrSet(key: string, factory: () => T | Promise<T>, ttl?: number): Promise<T> {
    const cached = this.get(key);

    if (cached !== undefined) {
      return cached;
    }

    const value = await factory();
    this.set(key, value, ttl);
    return value;
  }

  /**
   * Start cleanup timer
   */
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.options.cleanupInterval);
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();

    for (const [key, entry] of this.store.entries()) {
      if (entry.expires && now > entry.expires) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Stop cleanup and clear cache
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.clear();
  }
}
