/**
 * Conf - Simple Config Storage
 * Pure TypeScript, zero dependencies, polyglot-ready
 * NPM: 15M+ downloads/week
 */

interface ConfOptions<T> {
  defaults?: T;
  projectName?: string;
}

export class Conf<T extends Record<string, any> = Record<string, any>> {
  private store = new Map<string, any>();

  constructor(options: ConfOptions<T> = {}) {
    if (options.defaults) {
      Object.entries(options.defaults).forEach(([key, value]) => {
        this.store.set(key, value);
      });
    }
  }

  get<K extends keyof T>(key: K): T[K];
  get<K extends keyof T>(key: K, defaultValue: T[K]): T[K];
  get<K extends keyof T>(key: K, defaultValue?: T[K]): T[K] | undefined {
    return this.store.has(key as string) ? this.store.get(key as string) : defaultValue;
  }

  set<K extends keyof T>(key: K, value: T[K]): void;
  set(object: Partial<T>): void;
  set<K extends keyof T>(keyOrObject: K | Partial<T>, value?: T[K]): void {
    if (typeof keyOrObject === 'object') {
      Object.entries(keyOrObject).forEach(([k, v]) => this.store.set(k, v));
    } else {
      this.store.set(keyOrObject as string, value);
    }
  }

  has(key: keyof T): boolean {
    return this.store.has(key as string);
  }

  delete(key: keyof T): void {
    this.store.delete(key as string);
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }

  get store(): Record<string, any> {
    return Object.fromEntries(this.store);
  }
}

if (import.meta.url.includes("elide-conf")) {
  console.log("🎯 Conf for Elide - Simple Config Storage\n");

  const config = new Conf<{ theme: string; lang: string }>({
    defaults: { theme: 'light', lang: 'en' },
  });

  console.log("Theme:", config.get('theme'));
  config.set('theme', 'dark');
  console.log("Updated theme:", config.get('theme'));
  console.log("All:", config.store);

  console.log("\n✅ Simple config management");
  console.log("🚀 15M+ npm downloads/week - Polyglot-ready");
}

export default Conf;
