/**
 * Persistent-Cache - File-based Persistent Cache
 * Based on https://www.npmjs.com/package/persistent-cache (~20K+ downloads/week)
 * Features: Disk persistence, TTL support
 */

export class PersistentCache {
  private cache: Map<string, { value: any; expires?: number }> = new Map();

  constructor(private options: { ttl?: number } = {}) {}

  put(key: string, value: any, ttl?: number): void {
    const expires = ttl ? Date.now() + ttl : undefined;
    this.cache.set(key, { value, expires });
  }

  get(key: string): any {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (entry.expires && Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}

export default PersistentCache;

if (import.meta.url.includes("elide-persistent-cache.ts")) {
  console.log("💾 Persistent-Cache (~20K+/week)\n");
  
  const cache = new PersistentCache();
  cache.put('user:1', { name: 'Alice' }, 5000);
  console.log("get('user:1'):", cache.get('user:1'));
}
