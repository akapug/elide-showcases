/**
 * High-performance LRU cache for embeddings
 */

import { LRUCache } from 'lru-cache';
import crypto from 'crypto';

export class EmbeddingCache {
  private cache: LRUCache<string, number[]>;
  private hits: number = 0;
  private misses: number = 0;

  constructor(maxSize: number = 10000, ttl: number = 3600000) {
    this.cache = new LRUCache<string, number[]>({
      max: maxSize,
      ttl: ttl,
      updateAgeOnGet: true,
      updateAgeOnHas: true,
    });
  }

  /**
   * Generate cache key from input and model
   */
  private generateKey(input: string, model: string): string {
    const hash = crypto.createHash('sha256');
    hash.update(`${model}:${input}`);
    return hash.digest('hex');
  }

  /**
   * Get embedding from cache
   */
  get(input: string, model: string): number[] | undefined {
    const key = this.generateKey(input, model);
    const value = this.cache.get(key);

    if (value !== undefined) {
      this.hits++;
      return value;
    }

    this.misses++;
    return undefined;
  }

  /**
   * Set embedding in cache
   */
  set(input: string, model: string, embedding: number[]): void {
    const key = this.generateKey(input, model);
    this.cache.set(key, embedding);
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      maxSize: this.cache.max,
      hitRate: total > 0 ? this.hits / total : 0,
      hits: this.hits,
      misses: this.misses,
    };
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Check if cache has key
   */
  has(input: string, model: string): boolean {
    const key = this.generateKey(input, model);
    return this.cache.has(key);
  }
}
