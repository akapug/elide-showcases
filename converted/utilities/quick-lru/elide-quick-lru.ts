/**
 * Quick-LRU - Super Fast LRU Cache
 *
 * Core features:
 * - Ultra-fast operations
 * - Simple API
 * - Iterable
 * - Max age support
 * - Size limit
 * - Optimized for speed
 *
 * Pure TypeScript, zero dependencies, polyglot-ready
 * NPM: 40M+ downloads/week
 */

interface QuickLRUOptions {
  maxSize?: number;
  maxAge?: number;
  onEviction?: (key: any, value: any) => void;
}

export class QuickLRU<K = any, V = any> implements Map<K, V> {
  private cache = new Map<K, { value: V; maxAge?: number }>();
  private oldCache = new Map<K, { value: V; maxAge?: number }>();
  private maxSize: number;
  private maxAge: number;
  private onEviction?: (key: K, value: V) => void;

  constructor(options: QuickLRUOptions = {}) {
    this.maxSize = options.maxSize || 1000;
    this.maxAge = options.maxAge || 0;
    this.onEviction = options.onEviction;
  }

  private evict() {
    if (this.onEviction) {
      for (const [key, item] of this.oldCache.entries()) {
        this.onEviction(key, item.value);
      }
    }
    this.oldCache = this.cache;
    this.cache = new Map();
  }

  private isExpired(item: { maxAge?: number }): boolean {
    if (!item.maxAge) return false;
    return Date.now() > item.maxAge;
  }

  set(key: K, value: V): this {
    const maxAge = this.maxAge > 0 ? Date.now() + this.maxAge : undefined;

    if (this.cache.has(key)) {
      this.cache.set(key, { value, maxAge });
    } else {
      this.cache.set(key, { value, maxAge });
      if (this.cache.size >= this.maxSize) {
        this.evict();
      }
    }

    return this;
  }

  get(key: K): V | undefined {
    let item = this.cache.get(key);

    if (item) {
      if (this.isExpired(item)) {
        this.cache.delete(key);
        return undefined;
      }
      return item.value;
    }

    item = this.oldCache.get(key);
    if (item) {
      if (this.isExpired(item)) {
        this.oldCache.delete(key);
        return undefined;
      }
      this.set(key, item.value);
      return item.value;
    }

    return undefined;
  }

  has(key: K): boolean {
    if (this.cache.has(key)) {
      const item = this.cache.get(key)!;
      if (this.isExpired(item)) {
        this.cache.delete(key);
        return false;
      }
      return true;
    }

    if (this.oldCache.has(key)) {
      const item = this.oldCache.get(key)!;
      if (this.isExpired(item)) {
        this.oldCache.delete(key);
        return false;
      }
      return true;
    }

    return false;
  }

  peek(key: K): V | undefined {
    const item = this.cache.get(key);
    if (item) {
      if (this.isExpired(item)) {
        return undefined;
      }
      return item.value;
    }

    const oldItem = this.oldCache.get(key);
    if (oldItem && !this.isExpired(oldItem)) {
      return oldItem.value;
    }

    return undefined;
  }

  delete(key: K): boolean {
    const deleted = this.cache.delete(key);
    return this.oldCache.delete(key) || deleted;
  }

  clear(): void {
    this.cache.clear();
    this.oldCache.clear();
  }

  resize(newSize: number): void {
    this.maxSize = newSize;
    if (this.cache.size + this.oldCache.size > newSize) {
      this.evict();
    }
  }

  *keys(): IterableIterator<K> {
    for (const [key] of this) {
      yield key;
    }
  }

  *values(): IterableIterator<V> {
    for (const [, value] of this) {
      yield value;
    }
  }

  *entries(): IterableIterator<[K, V]> {
    for (const item of this) {
      yield item;
    }
  }

  *[Symbol.iterator](): IterableIterator<[K, V]> {
    for (const [key, item] of this.cache) {
      if (!this.isExpired(item)) {
        yield [key, item.value];
      }
    }

    for (const [key, item] of this.oldCache) {
      if (!this.cache.has(key) && !this.isExpired(item)) {
        yield [key, item.value];
      }
    }
  }

  forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any): void {
    for (const [key, value] of this) {
      callbackfn.call(thisArg, value, key, this);
    }
  }

  get size(): number {
    let size = 0;
    for (const [key, item] of this.cache) {
      if (!this.isExpired(item)) size++;
    }
    for (const [key, item] of this.oldCache) {
      if (!this.cache.has(key) && !this.isExpired(item)) size++;
    }
    return size;
  }

  get [Symbol.toStringTag](): string {
    return 'QuickLRU';
  }
}

if (import.meta.url.includes("quick-lru")) {
  console.log("🎯 Quick-LRU for Elide - Super Fast LRU Cache\n");

  const lru = new QuickLRU<string, number>({ maxSize: 3 });

  console.log("=== Basic Operations ===");
  lru.set('a', 1);
  lru.set('b', 2);
  lru.set('c', 3);
  console.log("Size:", lru.size);
  console.log("Get 'a':", lru.get('a'));

  console.log("\n=== Eviction ===");
  lru.set('d', 4);
  console.log("Keys:", Array.from(lru.keys()));

  console.log();
  console.log("✅ Use Cases: High-performance caching, Request memoization");
  console.log("🚀 40M+ npm downloads/week - Zero dependencies - Polyglot-ready");
}

export default QuickLRU;
