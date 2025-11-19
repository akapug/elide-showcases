/**
 * Cache Manager
 *
 * Simple in-memory cache with TTL support.
 * For production, consider Redis or similar.
 */

export class CacheManager {
  constructor(config) {
    this.config = config;
    this.cache = new Map();
    this.enabled = config.enabled;

    // Start cleanup interval
    if (this.enabled) {
      setInterval(() => this.cleanup(), 60000); // Every minute
    }
  }

  async get(key) {
    if (!this.enabled) {
      return null;
    }

    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  async set(key, value, ttl = this.config.ttl) {
    if (!this.enabled) {
      return;
    }

    const expiresAt = ttl ? Date.now() + (ttl * 1000) : null;

    this.cache.set(key, {
      value,
      expiresAt,
      size: this.estimateSize(value),
    });

    // Check total size
    this.enforceLimit();
  }

  async delete(key) {
    this.cache.delete(key);
  }

  async clear() {
    this.cache.clear();
  }

  async invalidatePattern(pattern) {
    const regex = new RegExp(pattern);

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🗑️  Cache cleanup: removed ${cleaned} expired entries`);
    }
  }

  enforceLimit() {
    const maxSize = this.config.maxSize * 1024 * 1024; // Convert MB to bytes
    let totalSize = 0;

    for (const entry of this.cache.values()) {
      totalSize += entry.size;
    }

    if (totalSize > maxSize) {
      // Remove oldest entries
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => (a[1].expiresAt || 0) - (b[1].expiresAt || 0));

      while (totalSize > maxSize && entries.length > 0) {
        const [key, entry] = entries.shift();
        this.cache.delete(key);
        totalSize -= entry.size;
      }

      console.log(`🗑️  Cache limit enforced: removed entries to stay under ${this.config.maxSize}MB`);
    }
  }

  estimateSize(value) {
    if (typeof value === 'string') {
      return value.length * 2; // UTF-16
    }

    if (typeof value === 'object') {
      return JSON.stringify(value).length * 2;
    }

    return 100; // Default estimate
  }

  getStats() {
    let totalSize = 0;
    let expired = 0;
    const now = Date.now();

    for (const entry of this.cache.values()) {
      totalSize += entry.size;

      if (entry.expiresAt && entry.expiresAt < now) {
        expired++;
      }
    }

    return {
      entries: this.cache.size,
      expired,
      totalSize,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
      enabled: this.enabled,
    };
  }
}
