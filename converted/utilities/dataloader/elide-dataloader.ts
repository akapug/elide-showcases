/**
 * DataLoader - Batch Loading and Caching
 *
 * A generic utility for batching and caching.
 * **POLYGLOT SHOWCASE**: One data loader for ALL languages on Elide!
 *
 * Features:
 * - Batch loading
 * - Request caching
 * - Automatic batching
 * - Deduplication
 * - Error handling
 * - TypeScript support
 *
 * Package has ~15M downloads/week on npm!
 */

export type BatchLoadFn<K, V> = (keys: readonly K[]) => Promise<ArrayLike<V | Error>>;

export interface DataLoaderOptions<K, V> {
  batch?: boolean;
  cache?: boolean;
  cacheKeyFn?: (key: K) => any;
  cacheMap?: Map<K, Promise<V>>;
}

export class DataLoader<K, V> {
  private batchLoadFn: BatchLoadFn<K, V>;
  private options: DataLoaderOptions<K, V>;
  private cache: Map<any, Promise<V>>;
  private queue: Array<{ key: K; resolve: (value: V) => void; reject: (error: Error) => void }> = [];
  private batchScheduled = false;

  constructor(batchLoadFn: BatchLoadFn<K, V>, options: DataLoaderOptions<K, V> = {}) {
    this.batchLoadFn = batchLoadFn;
    this.options = { batch: true, cache: true, ...options };
    this.cache = options.cacheMap || new Map();
  }

  async load(key: K): Promise<V> {
    if (this.options.cache) {
      const cacheKey = this.options.cacheKeyFn ? this.options.cacheKeyFn(key) : key;
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;
    }

    const promise = new Promise<V>((resolve, reject) => {
      this.queue.push({ key, resolve, reject });

      if (!this.batchScheduled) {
        this.batchScheduled = true;
        Promise.resolve().then(() => this.dispatchBatch());
      }
    });

    if (this.options.cache) {
      const cacheKey = this.options.cacheKeyFn ? this.options.cacheKeyFn(key) : key;
      this.cache.set(cacheKey, promise);
    }

    return promise;
  }

  async loadMany(keys: readonly K[]): Promise<Array<V | Error>> {
    return Promise.all(keys.map((key) => this.load(key).catch((err) => err)));
  }

  clear(key: K): this {
    const cacheKey = this.options.cacheKeyFn ? this.options.cacheKeyFn(key) : key;
    this.cache.delete(cacheKey);
    return this;
  }

  clearAll(): this {
    this.cache.clear();
    return this;
  }

  private async dispatchBatch(): Promise<void> {
    this.batchScheduled = false;
    const queue = this.queue;
    this.queue = [];

    const keys = queue.map((item) => item.key);
    const values = await this.batchLoadFn(keys);

    queue.forEach((item, index) => {
      const value = values[index];
      if (value instanceof Error) {
        item.reject(value);
      } else {
        item.resolve(value as V);
      }
    });
  }
}

if (import.meta.url.includes("elide-dataloader.ts")) {
  console.log("📦 DataLoader - Batch Loading and Caching (POLYGLOT!)\n");
  console.log("=== Example ===");
  console.log("const userLoader = new DataLoader(async (ids) => {");
  console.log("  return await fetchUsersByIds(ids);");
  console.log("});");
  console.log();
  console.log("const user = await userLoader.load(1);");
  console.log("const users = await userLoader.loadMany([1, 2, 3]);");
  console.log();
  console.log("🚀 ~15M downloads/week on npm");
}
