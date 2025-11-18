/**
 * Cache-Base - Base Cache Implementation
 * Based on https://www.npmjs.com/package/cache-base (~100K+ downloads/week)
 * Features: Simple cache with get/set/has/del
 */

export class CacheBase {
  private cache: Map<string, any> = new Map();

  get(key: string): any {
    return this.cache.get(key);
  }

  set(key: string, value: any): this {
    this.cache.set(key, value);
    return this;
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  del(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

export default CacheBase;

if (import.meta.url.includes("elide-cache-base.ts")) {
  console.log("🗄️ Cache-Base (~100K+/week)\n");
  
  const cache = new CacheBase();
  cache.set('key1', 'value1');
  console.log("get('key1'):", cache.get('key1'));
  console.log("has('key1'):", cache.has('key1'));
  cache.del('key1');
  console.log("has('key1') after del:", cache.has('key1'));
}
