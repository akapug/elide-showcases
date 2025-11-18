/**
 * File-Cache - Simple File-based Cache
 * Based on https://www.npmjs.com/package/file-cache (~50K+ downloads/week)
 * Features: File system caching
 */

export class FileCache {
  private cache: Map<string, any> = new Map();

  set(key: string, value: any, ttl?: number): void {
    this.cache.set(key, { value, timestamp: Date.now(), ttl });
  }

  get(key: string): any {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value;
  }

  remove(key: string): void {
    this.cache.delete(key);
  }
}

export default FileCache;

if (import.meta.url.includes("elide-file-cache.ts")) {
  console.log("📁 File-Cache (~50K+/week)\n");
  
  const cache = new FileCache();
  cache.set('data', { foo: 'bar' }, 10000);
  console.log("get('data'):", cache.get('data'));
}
