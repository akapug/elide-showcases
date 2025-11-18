/**
 * Memory-Cache - Simple Memory Cache
 * Pure TypeScript, zero dependencies, polyglot-ready
 * NPM: 3M+ downloads/week
 */

class MemoryCache {
  private cache = new Map<string, { value: any; timeout?: any }>();

  put(key: string, value: any, time?: number, timeoutCallback?: () => void): void {
    if (this.cache.has(key)) {
      clearTimeout(this.cache.get(key)!.timeout);
    }

    const timeout = time ? setTimeout(() => {
      this.del(key);
      timeoutCallback?.();
    }, time) : undefined;

    this.cache.set(key, { value, timeout });
  }

  get(key: string): any {
    const entry = this.cache.get(key);
    return entry?.value;
  }

  del(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry?.timeout) clearTimeout(entry.timeout);
    return this.cache.delete(key);
  }

  clear(): void {
    for (const [, entry] of this.cache) {
      if (entry.timeout) clearTimeout(entry.timeout);
    }
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }
}

const cache = new MemoryCache();

export function put(key: string, value: any, time?: number, timeoutCallback?: () => void): void {
  cache.put(key, value, time, timeoutCallback);
}

export function get(key: string): any {
  return cache.get(key);
}

export function del(key: string): boolean {
  return cache.del(key);
}

export function clear(): void {
  cache.clear();
}

if (import.meta.url.includes("memory-cache")) {
  console.log("🎯 Memory-Cache for Elide\n");
  put('test', 'value', 5000);
  console.log("Get:", get('test'));
  console.log("\n✅ Simple memory caching");
  console.log("🚀 3M+ npm downloads/week - Polyglot-ready");
}

export default { put, get, del, clear };
