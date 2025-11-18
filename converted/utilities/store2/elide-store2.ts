/**
 * Store2 - Better localStorage
 * Pure TypeScript, zero dependencies, polyglot-ready
 * NPM: 500K+ downloads/week
 */

export class Store2 {
  private storage = new Map<string, any>();
  private namespace: string;

  constructor(namespace: string = '') {
    this.namespace = namespace;
  }

  set(key: string, value: any, overwrite: boolean = true): any {
    const fullKey = this.namespace ? `${this.namespace}.${key}` : key;
    if (!overwrite && this.storage.has(fullKey)) {
      return this.storage.get(fullKey);
    }
    this.storage.set(fullKey, value);
    return value;
  }

  get(key: string, defaultValue?: any): any {
    const fullKey = this.namespace ? `${this.namespace}.${key}` : key;
    return this.storage.has(fullKey) ? this.storage.get(fullKey) : defaultValue;
  }

  remove(key: string): void {
    const fullKey = this.namespace ? `${this.namespace}.${key}` : key;
    this.storage.delete(fullKey);
  }

  clear(): void {
    if (this.namespace) {
      const prefix = `${this.namespace}.`;
      for (const key of this.storage.keys()) {
        if (key.startsWith(prefix)) this.storage.delete(key);
      }
    } else {
      this.storage.clear();
    }
  }

  has(key: string): boolean {
    const fullKey = this.namespace ? `${this.namespace}.${key}` : key;
    return this.storage.has(fullKey);
  }
}

const defaultStore = new Store2();

export function namespace(ns: string): Store2 {
  return new Store2(ns);
}

export default defaultStore;

if (import.meta.url.includes("store2")) {
  console.log("🎯 Store2 for Elide\n");
  defaultStore.set('key', 'value');
  console.log("Get:", defaultStore.get('key'));
  const ns = namespace('app');
  ns.set('config', { theme: 'dark' });
  console.log("Namespaced:", ns.get('config'));
  console.log("\n✅ Better localStorage with namespaces");
  console.log("🚀 500K+ npm downloads/week - Polyglot-ready");
}
