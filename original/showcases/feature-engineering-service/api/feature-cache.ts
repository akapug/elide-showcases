/**
 * Feature Cache - High-performance LRU cache for features
 *
 * Provides <1ms feature retrieval with TTL-based expiration
 */

import { LRUCache } from 'lru-cache';
import { Features } from './feature-store';

export interface CacheOptions {
  maxSize: number;
  ttl: number; // milliseconds
}

export class FeatureCache {
  private cache: LRUCache<string, Features>;
  private maxSize: number;
  private ttl: number;
  private hits = 0;
  private misses = 0;
  private evictions = 0;

  constructor(options: CacheOptions) {
    this.maxSize = options.maxSize;
    this.ttl = options.ttl;

    this.cache = new LRUCache<string, Features>({
      max: options.maxSize,
      ttl: options.ttl,
      updateAgeOnGet: true,
      updateAgeOnHas: true,
      dispose: () => {
        this.evictions++;
      },
    });
  }

  /**
   * Get features from cache
   */
  get(key: string): Features | undefined {
    const value = this.cache.get(key);
    if (value) {
      this.hits++;
      return value;
    }
    this.misses++;
    return undefined;
  }

  /**
   * Set features in cache
   */
  set(key: string, value: Features): void {
    this.cache.set(key, value);
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Delete a key from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      max_size: this.maxSize,
      ttl_ms: this.ttl,
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      hit_rate: total > 0 ? this.hits / total : 0,
      utilization: this.cache.size / this.maxSize,
    };
  }

  /**
   * Get all cache keys (for debugging)
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache size
   */
  get size(): number {
    return this.cache.size;
  }
}
