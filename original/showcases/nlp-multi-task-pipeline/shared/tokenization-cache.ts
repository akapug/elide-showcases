/**
 * Tokenization Cache
 *
 * LRU cache for storing tokenized text to avoid redundant tokenization
 * across multiple NLP tasks.
 */
export class TokenizationCache {
  private cache: Map<string, CacheEntry>;
  private maxSize: number;
  private ttl: number;

  constructor(maxSize: number = 1000, ttl: number = 300000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl; // Time-to-live in milliseconds
  }

  /**
   * Get cached tokenization result
   */
  get(key: string): any | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (LRU)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  /**
   * Set tokenization result in cache
   */
  set(key: string, value: any): void {
    // Remove oldest entry if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // Would need to track hits/misses
    };
  }

  /**
   * Remove expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

interface CacheEntry {
  value: any;
  timestamp: number;
}

interface CacheStats {
  size: number;
  maxSize: number;
  hitRate: number;
}
