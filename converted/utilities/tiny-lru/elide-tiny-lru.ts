/**
 * Tiny-LRU - Tiny & Fast LRU Cache
 *
 * Core features:
 * - Ultra-lightweight LRU cache
 * - Fast set/get operations
 * - TTL support
 * - Automatic eviction
 * - Clear/reset
 * - Size tracking
 *
 * Pure TypeScript, zero dependencies, polyglot-ready
 * NPM: 3M+ downloads/week
 */

interface TinyLRUOptions {
  max?: number;
  ttl?: number;
}

interface CacheEntry<T> {
  value: T;
  expiry?: number;
}

export class TinyLRU<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private max: number;
  private ttl: number;

  constructor(max: number = 1000, ttl: number = 0) {
    this.max = max;
    this.ttl = ttl;
  }

  set(key: string, value: T, ttl?: number): this {
    const expiry = (ttl || this.ttl) > 0 ? Date.now() + (ttl || this.ttl) : undefined;

    // Delete first to update position
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Check size and evict oldest if needed
    if (this.cache.size >= this.max) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, { value, expiry });
    return this;
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    // Check expiry
    if (entry.expiry && Date.now() > entry.expiry) {
      this.cache.delete(key);
      return undefined;
    }

    // Move to end (most recent)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    if (entry.expiry && Date.now() > entry.expiry) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  keys(): string[] {
    const now = Date.now();
    const validKeys: string[] = [];

    for (const [key, entry] of this.cache) {
      if (!entry.expiry || now <= entry.expiry) {
        validKeys.push(key);
      }
    }

    return validKeys;
  }

  get size(): number {
    const now = Date.now();
    let count = 0;

    for (const [, entry] of this.cache) {
      if (!entry.expiry || now <= entry.expiry) {
        count++;
      }
    }

    return count;
  }

  get first(): T | undefined {
    const firstEntry = this.cache.values().next().value;
    return firstEntry?.value;
  }

  get last(): T | undefined {
    const entries = Array.from(this.cache.values());
    return entries[entries.length - 1]?.value;
  }
}

if (import.meta.url.includes("tiny-lru")) {
  console.log("🎯 Tiny-LRU for Elide - Tiny & Fast LRU Cache\n");

  const cache = new TinyLRU<string>(3);

  console.log("=== Basic Operations ===");
  cache.set('a', 'Apple');
  cache.set('b', 'Banana');
  cache.set('c', 'Cherry');
  console.log("Size:", cache.size);
  console.log("Get 'a':", cache.get('a'));

  console.log("\n=== Eviction ===");
  cache.set('d', 'Date');
  console.log("Keys:", cache.keys());
  console.log("First:", cache.first);
  console.log("Last:", cache.last);

  console.log("\n=== TTL Support ===");
  const ttlCache = new TinyLRU<number>(100, 1000);
  ttlCache.set('temp', 42);
  console.log("Has 'temp':", ttlCache.has('temp'));

  console.log();
  console.log("✅ Use Cases: In-memory caching, Request memoization, Session storage");
  console.log("🚀 3M+ npm downloads/week - Zero dependencies - Polyglot-ready");
}

export default TinyLRU;
