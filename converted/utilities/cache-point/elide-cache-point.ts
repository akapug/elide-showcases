/**
 * Cache-Point - Flexible Caching Library
 * Pure TypeScript, zero dependencies, polyglot-ready
 * NPM: 100K+ downloads/week
 */

export class CachePoint {
  private cache = new Map<string, { value: any; expires?: number }>();

  set(key: string, value: any, ttl?: number): void {
    const expires = ttl ? Date.now() + ttl * 1000 : undefined;
    this.cache.set(key, { value, expires });
  }

  get(key: string): any {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (entry.expires && entry.expires < Date.now()) {
      this.cache.delete(key);
      return undefined;
    }
    return entry.value;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }
}

if (import.meta.url.includes("cache-point")) {
  console.log("🎯 Cache-Point for Elide\n");
  const cache = new CachePoint();
  cache.set('test', 'value', 60);
  console.log("Get:", cache.get('test'));
  console.log("\n✅ Flexible caching");
  console.log("🚀 100K+ npm downloads/week - Polyglot-ready");
}

export default CachePoint;
