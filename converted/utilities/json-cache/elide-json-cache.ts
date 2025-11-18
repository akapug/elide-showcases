/**
 * JSON-Cache - JSON-based Caching
 * Based on https://www.npmjs.com/package/json-cache (~20K+ downloads/week)
 * Features: JSON serialization, persistence
 */

export class JSONCache {
  private data: Map<string, any> = new Map();

  set(key: string, value: any): void {
    this.data.set(key, value);
  }

  get(key: string): any {
    return this.data.get(key);
  }

  has(key: string): boolean {
    return this.data.has(key);
  }

  delete(key: string): boolean {
    return this.data.delete(key);
  }

  toJSON(): string {
    return JSON.stringify(Array.from(this.data.entries()));
  }

  fromJSON(json: string): void {
    const entries = JSON.parse(json);
    this.data = new Map(entries);
  }
}

export default JSONCache;

if (import.meta.url.includes("elide-json-cache.ts")) {
  console.log("📄 JSON-Cache (~20K+/week)\n");
  
  const cache = new JSONCache();
  cache.set('key1', { data: 'value1' });
  console.log("JSON:", cache.toJSON());
  console.log("get('key1'):", cache.get('key1'));
}
