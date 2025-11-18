/**
 * Workbox Strategies - Service Worker Caching Strategies
 *
 * Common caching strategies for service workers.
 * **POLYGLOT SHOWCASE**: One caching strategy library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/workbox-strategies (~500K+ downloads/week)
 *
 * Features:
 * - Cache First strategy
 * - Network First strategy
 * - Cache Only strategy
 * - Network Only strategy
 * - Stale While Revalidate strategy
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Use same caching strategies regardless of backend
 * - ONE strategy library works everywhere on Elide
 * - Consistent caching behavior across tech stacks
 * - Share caching configs across Python, Ruby, Java projects
 *
 * Use cases:
 * - Static asset caching (images, fonts)
 * - API response caching
 * - Offline-first applications
 * - Performance optimization
 *
 * Package has ~500K+ downloads/week on npm - essential caching strategies!
 */

export interface StrategyOptions {
  cacheName: string;
  plugins?: any[];
  matchOptions?: CacheQueryOptions;
}

export interface StrategyHandler {
  handle(request: Request): Promise<Response>;
}

/**
 * Cache First Strategy
 * Returns cached response if available, otherwise fetches from network
 */
export class CacheFirst implements StrategyHandler {
  constructor(private options: StrategyOptions) {}

  async handle(request: Request): Promise<Response> {
    const cache = await caches.open(this.options.cacheName);
    const cachedResponse = await cache.match(request, this.options.matchOptions);

    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  }
}

/**
 * Network First Strategy
 * Tries network first, falls back to cache if network fails
 */
export class NetworkFirst implements StrategyHandler {
  constructor(private options: StrategyOptions) {}

  async handle(request: Request): Promise<Response> {
    const cache = await caches.open(this.options.cacheName);

    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        await cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      const cachedResponse = await cache.match(request, this.options.matchOptions);
      if (cachedResponse) {
        return cachedResponse;
      }
      throw error;
    }
  }
}

/**
 * Cache Only Strategy
 * Only returns cached responses, never goes to network
 */
export class CacheOnly implements StrategyHandler {
  constructor(private options: StrategyOptions) {}

  async handle(request: Request): Promise<Response> {
    const cache = await caches.open(this.options.cacheName);
    const cachedResponse = await cache.match(request, this.options.matchOptions);

    if (!cachedResponse) {
      throw new Error('No cached response found');
    }

    return cachedResponse;
  }
}

/**
 * Network Only Strategy
 * Always fetches from network, never uses cache
 */
export class NetworkOnly implements StrategyHandler {
  constructor(private options?: Partial<StrategyOptions>) {}

  async handle(request: Request): Promise<Response> {
    return fetch(request);
  }
}

/**
 * Stale While Revalidate Strategy
 * Returns cached response immediately, updates cache in background
 */
export class StaleWhileRevalidate implements StrategyHandler {
  constructor(private options: StrategyOptions) {}

  async handle(request: Request): Promise<Response> {
    const cache = await caches.open(this.options.cacheName);
    const cachedResponse = await cache.match(request, this.options.matchOptions);

    const fetchPromise = fetch(request).then(networkResponse => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    });

    return cachedResponse || fetchPromise;
  }
}

export { StrategyOptions };
export default { CacheFirst, NetworkFirst, CacheOnly, NetworkOnly, StaleWhileRevalidate };

// CLI Demo
if (import.meta.url.includes("elide-workbox-strategies.ts")) {
  console.log("📋 Workbox Strategies - Caching Strategies (POLYGLOT!)\n");

  console.log("=== Example 1: Cache First Strategy ===");
  const cacheFirst = new CacheFirst({ cacheName: 'images-v1' });
  console.log("✓ Cache First for images");
  console.log("  - Check cache first");
  console.log("  - Fall back to network if not cached");
  console.log("  - Cache network response for future");
  console.log("  - Best for: static assets, images, fonts");
  console.log();

  console.log("=== Example 2: Network First Strategy ===");
  const networkFirst = new NetworkFirst({ cacheName: 'api-v1' });
  console.log("✓ Network First for API");
  console.log("  - Try network first");
  console.log("  - Fall back to cache if network fails");
  console.log("  - Update cache with fresh response");
  console.log("  - Best for: API calls, dynamic content");
  console.log();

  console.log("=== Example 3: Stale While Revalidate ===");
  const swr = new StaleWhileRevalidate({ cacheName: 'css-js-v1' });
  console.log("✓ Stale While Revalidate for CSS/JS");
  console.log("  - Return cached response immediately");
  console.log("  - Fetch fresh response in background");
  console.log("  - Update cache with fresh response");
  console.log("  - Best for: CSS, JS, frequently updated content");
  console.log();

  console.log("=== Example 4: Cache Only Strategy ===");
  const cacheOnly = new CacheOnly({ cacheName: 'precache-v1' });
  console.log("✓ Cache Only for precached assets");
  console.log("  - Only serve from cache");
  console.log("  - Never go to network");
  console.log("  - Throw error if not cached");
  console.log("  - Best for: precached app shell");
  console.log();

  console.log("=== Example 5: Network Only Strategy ===");
  const networkOnly = new NetworkOnly();
  console.log("✓ Network Only for real-time data");
  console.log("  - Always fetch from network");
  console.log("  - Never use cache");
  console.log("  - Best for: real-time data, analytics");
  console.log();

  console.log("=== Example 6: Strategy Comparison ===");
  console.log("┌──────────────────────┬────────┬───────────┬─────────┐");
  console.log("│ Strategy             │ Speed  │ Freshness │ Offline │");
  console.log("├──────────────────────┼────────┼───────────┼─────────┤");
  console.log("│ Cache First          │ ⚡⚡⚡⚡ │ ⭐        │ ✅      │");
  console.log("│ Network First        │ ⚡     │ ⭐⭐⭐⭐  │ ✅      │");
  console.log("│ Stale-While-Revalid. │ ⚡⚡⚡  │ ⭐⭐⭐    │ ✅      │");
  console.log("│ Cache Only           │ ⚡⚡⚡⚡ │ ⭐        │ ✅      │");
  console.log("│ Network Only         │ ⚡     │ ⭐⭐⭐⭐  │ ❌      │");
  console.log("└──────────────────────┴────────┴───────────┴─────────┘");
  console.log();

  console.log("=== Example 7: Real-World Usage ===");
  console.log("// Images - Cache First");
  console.log("registerRoute(");
  console.log("  /\\.(?:png|jpg|jpeg|svg|gif)$/,");
  console.log("  new CacheFirst({ cacheName: 'images' })");
  console.log(");");
  console.log("");
  console.log("// API - Network First");
  console.log("registerRoute(");
  console.log("  /\\/api\\//,");
  console.log("  new NetworkFirst({ cacheName: 'api' })");
  console.log(");");
  console.log("");
  console.log("// CSS/JS - Stale While Revalidate");
  console.log("registerRoute(");
  console.log("  /\\.(?:css|js)$/,");
  console.log("  new StaleWhileRevalidate({ cacheName: 'static' })");
  console.log(");");
  console.log();

  console.log("=== Example 8: Use Case Matrix ===");
  console.log("Cache First:");
  console.log("  ✓ Images, fonts, icons");
  console.log("  ✓ Static assets that rarely change");
  console.log("  ✓ Third-party libraries");
  console.log("");
  console.log("Network First:");
  console.log("  ✓ API responses");
  console.log("  ✓ User-generated content");
  console.log("  ✓ Data that updates frequently");
  console.log("");
  console.log("Stale While Revalidate:");
  console.log("  ✓ CSS, JavaScript");
  console.log("  ✓ HTML pages");
  console.log("  ✓ Content that updates occasionally");
  console.log("");
  console.log("Cache Only:");
  console.log("  ✓ Precached app shell");
  console.log("  ✓ Critical resources");
  console.log("");
  console.log("Network Only:");
  console.log("  ✓ Real-time data");
  console.log("  ✓ Analytics");
  console.log("  ✓ POST requests");
  console.log();

  console.log("=== Example 9: POLYGLOT Use Case ===");
  console.log("🌐 Same caching strategies for ALL backends:");
  console.log("  • Node.js → Workbox strategies");
  console.log("  • Python/FastAPI → Workbox strategies");
  console.log("  • Ruby/Rails → Workbox strategies");
  console.log("  • Java/Spring → Workbox strategies");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ One caching config, all backends");
  console.log("  ✓ Consistent performance characteristics");
  console.log("  ✓ Share caching strategies across projects");
  console.log("  ✓ No need for language-specific solutions");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Static asset caching");
  console.log("- API response caching");
  console.log("- Offline-first applications");
  console.log("- Performance optimization");
  console.log("- Bandwidth reduction");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Fast cache lookups");
  console.log("- Optimized network requests");
  console.log("- ~500K+ downloads/week on npm!");
  console.log();

  console.log("💡 Polyglot Tips:");
  console.log("- Use same strategies across all backend services");
  console.log("- Share caching configs with team");
  console.log("- One performance strategy for all projects");
  console.log("- Perfect for polyglot microservices!");
}
