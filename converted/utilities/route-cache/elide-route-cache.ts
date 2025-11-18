/**
 * Route-Cache - Express Route Caching Middleware
 * Based on https://www.npmjs.com/package/route-cache (~50K+ downloads/week)
 * Features: HTTP response caching for Express
 */

export class RouteCache {
  private cache: Map<string, { body: any; headers: any; status: number; timestamp: number }> = new Map();

  constructor(private ttl: number = 60000) {}

  middleware() {
    return (req: any, res: any, next: any) => {
      const key = req.originalUrl || req.url;
      const cached = this.cache.get(key);

      if (cached && Date.now() - cached.timestamp < this.ttl) {
        res.status(cached.status);
        Object.entries(cached.headers).forEach(([k, v]) => res.setHeader(k, v as string));
        return res.send(cached.body);
      }

      const originalSend = res.send;
      res.send = (body: any) => {
        this.cache.set(key, {
          body,
          headers: res.getHeaders(),
          status: res.statusCode,
          timestamp: Date.now()
        });
        return originalSend.call(res, body);
      };

      next();
    };
  }

  clear(): void {
    this.cache.clear();
  }
}

export default RouteCache;

if (import.meta.url.includes("elide-route-cache.ts")) {
  console.log("🛣️ Route-Cache - Express Caching (~50K+/week)\n");
  
  const cache = new RouteCache(5000);
  console.log("Created route cache with 5s TTL");
  console.log("Use: app.use(cache.middleware())");
}
