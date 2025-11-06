/**
 * ElideHTML - Fragment Caching
 *
 * High-performance caching for HTML fragments.
 * LRU cache with TTL and size limits.
 */

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum cache size in bytes
  maxEntries?: number; // Maximum number of entries
}

export interface CacheEntry {
  value: string;
  size: number;
  createdAt: number;
  expiresAt?: number;
  hits: number;
}

export interface CacheStats {
  size: number;
  entries: number;
  hits: number;
  misses: number;
  hitRate: number;
  totalSize: number;
}

/**
 * LRU Cache with TTL support
 */
export class FragmentCache {
  private cache: Map<string, CacheEntry> = new Map();
  private options: Required<CacheOptions>;
  private hits = 0;
  private misses = 0;
  private totalSize = 0;

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: options.ttl || 60000, // 1 minute default
      maxSize: options.maxSize || 10 * 1024 * 1024, // 10MB default
      maxEntries: options.maxEntries || 1000,
    };
  }

  /**
   * Get a cached fragment
   */
  get(key: string): string | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return undefined;
    }

    // Check if expired
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.delete(key);
      this.misses++;
      return undefined;
    }

    // Update LRU: move to end
    this.cache.delete(key);
    this.cache.set(key, entry);

    entry.hits++;
    this.hits++;

    return entry.value;
  }

  /**
   * Set a cached fragment
   */
  set(key: string, value: string, ttl?: number): void {
    const size = this.getSize(value);

    // Check size limits
    if (size > this.options.maxSize) {
      throw new Error(`Fragment too large: ${size} bytes > ${this.options.maxSize} bytes`);
    }

    // Evict if necessary
    this.evict(size);

    const entry: CacheEntry = {
      value,
      size,
      createdAt: Date.now(),
      expiresAt: ttl ? Date.now() + ttl : Date.now() + this.options.ttl,
      hits: 0,
    };

    // Delete old entry if exists
    if (this.cache.has(key)) {
      this.delete(key);
    }

    this.cache.set(key, entry);
    this.totalSize += size;
  }

  /**
   * Delete a cached fragment
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    this.cache.delete(key);
    this.totalSize -= entry.size;

    return true;
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Clear all cached fragments
   */
  clear(): void {
    this.cache.clear();
    this.totalSize = 0;
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      entries: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
      totalSize: this.totalSize,
    };
  }

  /**
   * Evict entries to make room for new entry
   */
  private evict(requiredSize: number): void {
    // Evict expired entries first
    this.evictExpired();

    // If still over limit, evict LRU entries
    while (
      this.cache.size >= this.options.maxEntries ||
      this.totalSize + requiredSize > this.options.maxSize
    ) {
      const firstKey = this.cache.keys().next().value;
      if (!firstKey) break;
      this.delete(firstKey);
    }
  }

  /**
   * Evict expired entries
   */
  private evictExpired(): void {
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.delete(key);
      }
    }
  }

  /**
   * Get size of string in bytes
   */
  private getSize(str: string): number {
    return new Blob([str]).size;
  }

  /**
   * Get all cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get all cache entries
   */
  entries(): Array<[string, CacheEntry]> {
    return Array.from(this.cache.entries());
  }
}

/**
 * Global fragment cache instance
 */
export const fragmentCache = new FragmentCache();

/**
 * Cache key builder
 */
export class CacheKeyBuilder {
  private parts: string[] = [];

  add(key: string, value: any): this {
    this.parts.push(`${key}:${value}`);
    return this;
  }

  params(params: Record<string, any>): this {
    for (const [key, value] of Object.entries(params)) {
      this.add(key, value);
    }
    return this;
  }

  build(): string {
    return this.parts.join('|');
  }
}

export function cacheKey(): CacheKeyBuilder {
  return new CacheKeyBuilder();
}

/**
 * Cache decorator for functions that return HTML
 */
export function cached(key: string | ((args: any[]) => string), ttl?: number) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const cacheKey = typeof key === 'function' ? key(args) : key;
      const cached = fragmentCache.get(cacheKey);

      if (cached) {
        return cached;
      }

      const result = originalMethod.apply(this, args);
      fragmentCache.set(cacheKey, result, ttl);

      return result;
    };

    return descriptor;
  };
}

/**
 * Cache tags for invalidation
 */
export class CacheTags {
  private tags: Map<string, Set<string>> = new Map();

  /**
   * Tag a cache key
   */
  tag(key: string, ...tags: string[]): void {
    for (const tag of tags) {
      if (!this.tags.has(tag)) {
        this.tags.set(tag, new Set());
      }
      this.tags.get(tag)!.add(key);
    }
  }

  /**
   * Invalidate all keys with a tag
   */
  invalidate(...tags: string[]): number {
    let count = 0;

    for (const tag of tags) {
      const keys = this.tags.get(tag);
      if (!keys) continue;

      for (const key of keys) {
        if (fragmentCache.delete(key)) {
          count++;
        }
      }

      this.tags.delete(tag);
    }

    return count;
  }

  /**
   * Get all keys for a tag
   */
  getKeys(tag: string): string[] {
    return Array.from(this.tags.get(tag) || []);
  }

  /**
   * Clear all tags
   */
  clear(): void {
    this.tags.clear();
  }
}

export const cacheTags = new CacheTags();

/**
 * Cache warming utility
 */
export class CacheWarmer {
  private tasks: Array<() => Promise<void>> = [];

  /**
   * Add a warming task
   */
  add(task: () => Promise<void>): this {
    this.tasks.push(task);
    return this;
  }

  /**
   * Warm the cache
   */
  async warm(): Promise<void> {
    await Promise.all(this.tasks.map((task) => task()));
  }

  /**
   * Clear all tasks
   */
  clear(): void {
    this.tasks = [];
  }
}

export const cacheWarmer = new CacheWarmer();
