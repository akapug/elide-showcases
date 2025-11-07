/**
 * Cache Layer - High-performance caching for edge functions
 *
 * Provides response caching with cache control and invalidation.
 */

import { EventEmitter } from 'events';

export interface CacheEntry {
  key: string;
  value: any;
  headers?: Record<string, string>;
  statusCode?: number;
  createdAt: Date;
  expiresAt?: Date;
  hits: number;
  lastAccessedAt: Date;
  tags?: string[];
}

export interface CacheConfig {
  maxSize: number;
  maxMemory: number;
  defaultTTL: number; // seconds
  enableCompression: boolean;
}

export interface CacheOptions {
  ttl?: number;
  tags?: string[];
  vary?: string[]; // Vary by headers
}

export class Cache extends EventEmitter {
  private config: CacheConfig;
  private store: Map<string, CacheEntry>;
  private memoryUsage: number;
  private stats: {
    hits: number;
    misses: number;
    sets: number;
    evictions: number;
  };

  constructor(config: Partial<CacheConfig> = {}) {
    super();

    this.config = {
      maxSize: config.maxSize || 1000,
      maxMemory: config.maxMemory || 50 * 1024 * 1024, // 50MB
      defaultTTL: config.defaultTTL || 300, // 5 minutes
      enableCompression: config.enableCompression !== false,
    };

    this.store = new Map();
    this.memoryUsage = 0;
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0,
    };

    this.startCleanup();
  }

  /**
   * Get cached value
   */
  get(key: string, varyBy?: Record<string, string>): any | null {
    const cacheKey = this.buildCacheKey(key, varyBy);
    const entry = this.store.get(cacheKey);

    if (!entry) {
      this.stats.misses++;
      this.emit('miss', { key: cacheKey });
      return null;
    }

    // Check expiration
    if (entry.expiresAt && entry.expiresAt < new Date()) {
      this.delete(cacheKey);
      this.stats.misses++;
      this.emit('expired', { key: cacheKey });
      return null;
    }

    // Update access stats
    entry.hits++;
    entry.lastAccessedAt = new Date();

    this.stats.hits++;
    this.emit('hit', { key: cacheKey });

    return entry.value;
  }

  /**
   * Set cached value
   */
  set(key: string, value: any, options?: CacheOptions): void {
    const cacheKey = this.buildCacheKey(key, options?.vary ? this.extractVaryHeaders(options.vary) : undefined);

    // Check size limits
    if (this.store.size >= this.config.maxSize && !this.store.has(cacheKey)) {
      this.evict();
    }

    const now = new Date();
    const ttl = options?.ttl || this.config.defaultTTL;

    const entry: CacheEntry = {
      key: cacheKey,
      value,
      createdAt: now,
      expiresAt: new Date(now.getTime() + ttl * 1000),
      hits: 0,
      lastAccessedAt: now,
      tags: options?.tags,
    };

    // Calculate size
    const entrySize = this.calculateSize(entry);

    // Check memory limits
    if (this.memoryUsage + entrySize > this.config.maxMemory && !this.store.has(cacheKey)) {
      this.evict();
    }

    // Remove old entry
    if (this.store.has(cacheKey)) {
      const oldEntry = this.store.get(cacheKey)!;
      this.memoryUsage -= this.calculateSize(oldEntry);
    }

    // Add new entry
    this.store.set(cacheKey, entry);
    this.memoryUsage += entrySize;

    this.stats.sets++;
    this.emit('set', { key: cacheKey, size: entrySize });
  }

  /**
   * Delete cached value
   */
  delete(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;

    this.memoryUsage -= this.calculateSize(entry);
    this.store.delete(key);

    this.emit('delete', { key });
    return true;
  }

  /**
   * Invalidate cache by tags
   */
  invalidateByTags(tags: string[]): number {
    let invalidated = 0;

    for (const [key, entry] of this.store.entries()) {
      if (entry.tags?.some((tag) => tags.includes(tag))) {
        this.delete(key);
        invalidated++;
      }
    }

    this.emit('invalidate', { tags, count: invalidated });
    return invalidated;
  }

  /**
   * Invalidate cache by prefix
   */
  invalidateByPrefix(prefix: string): number {
    let invalidated = 0;

    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.delete(key);
        invalidated++;
      }
    }

    this.emit('invalidate', { prefix, count: invalidated });
    return invalidated;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.store.clear();
    this.memoryUsage = 0;
    this.emit('clear');
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    memoryUsage: number;
    memoryUsageFormatted: string;
    hits: number;
    misses: number;
    hitRate: number;
    sets: number;
    evictions: number;
  } {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? this.stats.hits / total : 0;

    return {
      size: this.store.size,
      memoryUsage: this.memoryUsage,
      memoryUsageFormatted: this.formatBytes(this.memoryUsage),
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate,
      sets: this.stats.sets,
      evictions: this.stats.evictions,
    };
  }

  /**
   * Get top cached items by hits
   */
  getTopItems(limit: number = 10): Array<{ key: string; hits: number; size: number }> {
    const items = Array.from(this.store.values())
      .map((entry) => ({
        key: entry.key,
        hits: entry.hits,
        size: this.calculateSize(entry),
      }))
      .sort((a, b) => b.hits - a.hits)
      .slice(0, limit);

    return items;
  }

  /**
   * Parse Cache-Control header
   */
  static parseCacheControl(header: string): {
    maxAge?: number;
    sMaxAge?: number;
    noCache?: boolean;
    noStore?: boolean;
    public?: boolean;
    private?: boolean;
  } {
    const directives = header.split(',').map((d) => d.trim());
    const result: any = {};

    for (const directive of directives) {
      const [key, value] = directive.split('=').map((s) => s.trim());

      switch (key.toLowerCase()) {
        case 'max-age':
          result.maxAge = parseInt(value);
          break;
        case 's-maxage':
          result.sMaxAge = parseInt(value);
          break;
        case 'no-cache':
          result.noCache = true;
          break;
        case 'no-store':
          result.noStore = true;
          break;
        case 'public':
          result.public = true;
          break;
        case 'private':
          result.private = true;
          break;
      }
    }

    return result;
  }

  // Private methods

  private buildCacheKey(key: string, varyBy?: Record<string, string>): string {
    if (!varyBy || Object.keys(varyBy).length === 0) {
      return key;
    }

    const varyString = Object.entries(varyBy)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join('|');

    return `${key}:${varyString}`;
  }

  private extractVaryHeaders(varyHeaders: string[]): Record<string, string> {
    // In a real implementation, this would extract headers from the request
    // For now, return empty object
    return {};
  }

  private calculateSize(entry: CacheEntry): number {
    const valueSize = JSON.stringify(entry.value).length;
    const keySize = entry.key.length;
    return keySize + valueSize + 200; // Add overhead
  }

  private formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  private evict(): void {
    if (this.store.size === 0) return;

    // Simple LRU eviction
    let oldestKey: string | undefined;
    let oldestTime = Date.now();

    for (const [key, entry] of this.store.entries()) {
      if (entry.lastAccessedAt.getTime() < oldestTime) {
        oldestTime = entry.lastAccessedAt.getTime();
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
      this.stats.evictions++;
      this.emit('evict', { key: oldestKey });
    }
  }

  private startCleanup(): void {
    // Clean up expired entries every minute
    setInterval(() => {
      let cleaned = 0;

      for (const [key, entry] of this.store.entries()) {
        if (entry.expiresAt && entry.expiresAt < new Date()) {
          this.delete(key);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        this.emit('cleanup', { count: cleaned });
      }
    }, 60000);
  }
}

export default Cache;
