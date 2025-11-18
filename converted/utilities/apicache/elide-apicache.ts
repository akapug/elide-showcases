/**
 * Apicache - API Response Caching
 * Pure TypeScript, zero dependencies, polyglot-ready
 * NPM: 2M+ downloads/week
 */

export class ApiCache {
  private cache = new Map<string, { data: any; expires: number }>();

  middleware(duration: string | number = '1 hour') {
    return (req: any, res: any, next: () => void) => {
      const key = req.url || req.path;
      const cached = this.cache.get(key);

      if (cached && cached.expires > Date.now()) {
        return res.send(cached.data);
      }

      const originalSend = res.send;
      res.send = (data: any) => {
        const ttl = typeof duration === 'number' ? duration : 3600000;
        this.cache.set(key, { data, expires: Date.now() + ttl });
        return originalSend.call(res, data);
      };

      next();
    };
  }

  clear(target?: string): void {
    if (target) {
      this.cache.delete(target);
    } else {
      this.cache.clear();
    }
  }
}

const instance = new ApiCache();

export function middleware(duration?: string | number) {
  return instance.middleware(duration);
}

export function clear(target?: string): void {
  instance.clear(target);
}

if (import.meta.url.includes("apicache")) {
  console.log("🎯 Apicache for Elide\n");
  console.log("API response caching middleware");
  console.log("\n✅ HTTP response caching");
  console.log("🚀 2M+ npm downloads/week - Polyglot-ready");
}

export default { middleware, clear };
