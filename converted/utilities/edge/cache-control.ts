/**
 * Cache Control
 * Edge caching utilities
 */

export interface CacheOptions {
  maxAge?: number;
  sMaxAge?: number;
  staleWhileRevalidate?: number;
  staleIfError?: number;
  public?: boolean;
  private?: boolean;
  noCache?: boolean;
  noStore?: boolean;
  mustRevalidate?: boolean;
}

export function buildCacheControl(options: CacheOptions): string {
  const directives: string[] = [];

  if (options.public) directives.push('public');
  if (options.private) directives.push('private');
  if (options.noCache) directives.push('no-cache');
  if (options.noStore) directives.push('no-store');
  if (options.mustRevalidate) directives.push('must-revalidate');

  if (options.maxAge !== undefined) directives.push(`max-age=${options.maxAge}`);
  if (options.sMaxAge !== undefined) directives.push(`s-maxage=${options.sMaxAge}`);
  if (options.staleWhileRevalidate !== undefined) {
    directives.push(`stale-while-revalidate=${options.staleWhileRevalidate}`);
  }
  if (options.staleIfError !== undefined) {
    directives.push(`stale-if-error=${options.staleIfError}`);
  }

  return directives.join(', ');
}

export function parseCacheControl(header: string): CacheOptions {
  const options: CacheOptions = {};
  const directives = header.split(',').map(d => d.trim());

  directives.forEach(directive => {
    const [key, value] = directive.split('=');

    switch (key.toLowerCase()) {
      case 'public':
        options.public = true;
        break;
      case 'private':
        options.private = true;
        break;
      case 'no-cache':
        options.noCache = true;
        break;
      case 'no-store':
        options.noStore = true;
        break;
      case 'must-revalidate':
        options.mustRevalidate = true;
        break;
      case 'max-age':
        options.maxAge = parseInt(value, 10);
        break;
      case 's-maxage':
        options.sMaxAge = parseInt(value, 10);
        break;
      case 'stale-while-revalidate':
        options.staleWhileRevalidate = parseInt(value, 10);
        break;
      case 'stale-if-error':
        options.staleIfError = parseInt(value, 10);
        break;
    }
  });

  return options;
}

// Common presets
export const CachePresets = {
  noCache: (): string => buildCacheControl({ noCache: true, noStore: true }),

  staticAsset: (): string => buildCacheControl({
    public: true,
    maxAge: 31536000, // 1 year
    mustRevalidate: true
  }),

  api: (seconds: number = 60): string => buildCacheControl({
    public: true,
    maxAge: seconds,
    staleWhileRevalidate: seconds * 2
  }),

  private: (seconds: number = 300): string => buildCacheControl({
    private: true,
    maxAge: seconds
  }),

  cdn: (seconds: number = 3600): string => buildCacheControl({
    public: true,
    maxAge: 60,
    sMaxAge: seconds,
    staleWhileRevalidate: seconds * 2
  })
};

// CLI demo
if (import.meta.url.includes("cache-control.ts")) {
  console.log("Cache Control Demo\n");

  console.log("Build cache control:");
  const header = buildCacheControl({
    public: true,
    maxAge: 3600,
    staleWhileRevalidate: 86400
  });
  console.log("  ", header);

  console.log("\nParse cache control:");
  const parsed = parseCacheControl(header);
  console.log("  ", JSON.stringify(parsed, null, 2));

  console.log("\nPresets:");
  console.log("  No cache:", CachePresets.noCache());
  console.log("  Static asset:", CachePresets.staticAsset());
  console.log("  API (60s):", CachePresets.api(60));
  console.log("  Private (5m):", CachePresets.private(300));
  console.log("  CDN (1h):", CachePresets.cdn(3600));

  console.log("\n✅ Cache control test passed");
}
