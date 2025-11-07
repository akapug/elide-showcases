/**
 * Edge CDN Implementation
 *
 * A production-grade edge CDN with content caching, origin shielding,
 * cache purging, geo-routing, and bandwidth optimization.
 */

import { serve } from "http";

// Types and Interfaces
interface CacheEntry {
  content: Uint8Array | string;
  headers: Record<string, string>;
  timestamp: number;
  etag: string;
  size: number;
  hitCount: number;
  region?: string;
}

interface CacheConfig {
  maxAge: number;
  staleWhileRevalidate: number;
  staleIfError: number;
}

interface OriginServer {
  url: string;
  region: string;
  healthy: boolean;
  lastCheck: number;
  priority: number;
}

interface GeoLocation {
  country: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
}

// In-memory cache store
class CacheStore {
  private cache: Map<string, CacheEntry> = new Map();
  private maxSize: number = 100 * 1024 * 1024; // 100MB
  private currentSize: number = 0;

  set(key: string, entry: CacheEntry): void {
    // Evict old entries if cache is full
    while (this.currentSize + entry.size > this.maxSize && this.cache.size > 0) {
      this.evictLRU();
    }

    const existing = this.cache.get(key);
    if (existing) {
      this.currentSize -= existing.size;
    }

    this.cache.set(key, entry);
    this.currentSize += entry.size;
  }

  get(key: string): CacheEntry | undefined {
    const entry = this.cache.get(key);
    if (entry) {
      entry.hitCount++;
      return entry;
    }
    return undefined;
  }

  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      this.currentSize -= entry.size;
      return this.cache.delete(key);
    }
    return false;
  }

  purge(pattern: string): number {
    let count = 0;
    const regex = new RegExp(pattern);

    for (const [key, entry] of this.cache.entries()) {
      if (regex.test(key)) {
        this.currentSize -= entry.size;
        this.cache.delete(key);
        count++;
      }
    }

    return count;
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();
    let lowestHitCount = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.hitCount < lowestHitCount ||
          (entry.hitCount === lowestHitCount && entry.timestamp < oldestTime)) {
        oldestKey = key;
        oldestTime = entry.timestamp;
        lowestHitCount = entry.hitCount;
      }
    }

    if (oldestKey) {
      const entry = this.cache.get(oldestKey);
      if (entry) {
        this.currentSize -= entry.size;
      }
      this.cache.delete(oldestKey);
    }
  }

  getStats() {
    return {
      entries: this.cache.size,
      sizeBytes: this.currentSize,
      maxSizeBytes: this.maxSize,
      utilizationPercent: (this.currentSize / this.maxSize) * 100
    };
  }
}

// Origin Shield - protects origin servers from thundering herd
class OriginShield {
  private origins: OriginServer[] = [
    { url: "https://origin-us-east.example.com", region: "us-east", healthy: true, lastCheck: Date.now(), priority: 1 },
    { url: "https://origin-us-west.example.com", region: "us-west", healthy: true, lastCheck: Date.now(), priority: 2 },
    { url: "https://origin-eu.example.com", region: "eu", healthy: true, lastCheck: Date.now(), priority: 3 }
  ];

  private pendingRequests: Map<string, Promise<Response>> = new Map();

  async fetch(path: string, region: string): Promise<Response> {
    // Check if request is already in flight (collapse duplicate requests)
    const pending = this.pendingRequests.get(path);
    if (pending) {
      return pending.clone();
    }

    // Create the fetch promise
    const fetchPromise = this.performFetch(path, region);
    this.pendingRequests.set(path, fetchPromise);

    try {
      const response = await fetchPromise;
      return response;
    } finally {
      this.pendingRequests.delete(path);
    }
  }

  private async performFetch(path: string, region: string): Promise<Response> {
    const origin = this.selectOrigin(region);
    const url = `${origin.url}${path}`;

    try {
      const response = await fetch(url, {
        headers: {
          "X-Edge-Shield": "true",
          "X-Edge-Region": region
        }
      });

      if (!response.ok) {
        throw new Error(`Origin returned ${response.status}`);
      }

      return response;
    } catch (error) {
      // Mark origin as unhealthy and retry with failover
      origin.healthy = false;
      origin.lastCheck = Date.now();

      return this.failoverFetch(path, region, origin);
    }
  }

  private async failoverFetch(path: string, region: string, failedOrigin: OriginServer): Promise<Response> {
    const healthyOrigins = this.origins.filter(o => o.healthy && o !== failedOrigin);

    if (healthyOrigins.length === 0) {
      throw new Error("All origins unhealthy");
    }

    const fallbackOrigin = healthyOrigins[0];
    const url = `${fallbackOrigin.url}${path}`;

    return fetch(url, {
      headers: {
        "X-Edge-Shield": "true",
        "X-Edge-Region": region,
        "X-Failover": "true"
      }
    });
  }

  private selectOrigin(region: string): OriginServer {
    // Try to find healthy origin in the same region
    const regionalOrigin = this.origins.find(o => o.healthy && o.region === region);
    if (regionalOrigin) {
      return regionalOrigin;
    }

    // Fallback to any healthy origin with lowest priority
    const healthyOrigins = this.origins.filter(o => o.healthy).sort((a, b) => a.priority - b.priority);
    if (healthyOrigins.length > 0) {
      return healthyOrigins[0];
    }

    // Last resort: return first origin even if unhealthy
    return this.origins[0];
  }
}

// Geo-routing based on request headers
class GeoRouter {
  private ipToRegion: Map<string, string> = new Map();

  getRegion(request: Request): string {
    const cfRegion = request.headers.get("CF-IPCountry");
    if (cfRegion) return this.mapCountryToRegion(cfRegion);

    const xForwardedFor = request.headers.get("X-Forwarded-For");
    if (xForwardedFor) {
      const ip = xForwardedFor.split(",")[0].trim();
      return this.getRegionFromIP(ip);
    }

    return "us-east"; // Default region
  }

  private mapCountryToRegion(country: string): string {
    const countryToRegion: Record<string, string> = {
      "US": "us-east",
      "CA": "us-east",
      "GB": "eu",
      "DE": "eu",
      "FR": "eu",
      "JP": "ap",
      "CN": "ap",
      "AU": "ap"
    };

    return countryToRegion[country] || "us-east";
  }

  private getRegionFromIP(ip: string): string {
    // Simplified IP geolocation (in production, use a real GeoIP database)
    const cached = this.ipToRegion.get(ip);
    if (cached) return cached;

    // Default to us-east for unknown IPs
    const region = "us-east";
    this.ipToRegion.set(ip, region);
    return region;
  }
}

// Main CDN Server
class EdgeCDN {
  private cacheStore = new CacheStore();
  private originShield = new OriginShield();
  private geoRouter = new GeoRouter();

  async handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle admin endpoints
    if (path.startsWith("/_cdn/")) {
      return this.handleAdmin(request);
    }

    // Check cache first
    const cacheKey = this.getCacheKey(request);
    const cached = this.cacheStore.get(cacheKey);

    if (cached && this.isCacheValid(cached)) {
      return this.createCachedResponse(cached, "HIT");
    }

    // Serve stale content while revalidating if available
    if (cached && this.canServeStale(cached)) {
      this.revalidateInBackground(request, cacheKey);
      return this.createCachedResponse(cached, "STALE");
    }

    // Fetch from origin
    return this.fetchAndCache(request, cacheKey);
  }

  private getCacheKey(request: Request): string {
    const url = new URL(request.url);
    const acceptEncoding = request.headers.get("Accept-Encoding") || "";
    const acceptWebP = request.headers.get("Accept")?.includes("image/webp") || false;

    return `${url.pathname}:${acceptEncoding.includes("br") ? "br" : acceptEncoding.includes("gzip") ? "gzip" : "none"}:${acceptWebP}`;
  }

  private isCacheValid(entry: CacheEntry): boolean {
    const age = Date.now() - entry.timestamp;
    const maxAge = this.getCacheMaxAge(entry.headers);
    return age < maxAge;
  }

  private canServeStale(entry: CacheEntry): boolean {
    const age = Date.now() - entry.timestamp;
    const maxAge = this.getCacheMaxAge(entry.headers);
    const staleWhileRevalidate = 3600000; // 1 hour
    return age < maxAge + staleWhileRevalidate;
  }

  private getCacheMaxAge(headers: Record<string, string>): number {
    const cacheControl = headers["cache-control"] || "";
    const match = cacheControl.match(/max-age=(\d+)/);
    return match ? parseInt(match[1]) * 1000 : 300000; // Default 5 minutes
  }

  private async fetchAndCache(request: Request, cacheKey: string): Promise<Response> {
    const region = this.geoRouter.getRegion(request);
    const url = new URL(request.url);

    try {
      const originResponse = await this.originShield.fetch(url.pathname, region);

      // Only cache successful GET requests
      if (request.method === "GET" && originResponse.ok) {
        await this.cacheResponse(cacheKey, originResponse, region);
      }

      return originResponse;
    } catch (error) {
      return new Response("Service Unavailable", {
        status: 503,
        headers: { "X-Cache": "ERROR" }
      });
    }
  }

  private async cacheResponse(cacheKey: string, response: Response, region: string): Promise<void> {
    const content = new Uint8Array(await response.arrayBuffer());
    const headers: Record<string, string> = {};

    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const entry: CacheEntry = {
      content,
      headers,
      timestamp: Date.now(),
      etag: headers["etag"] || this.generateETag(content),
      size: content.byteLength,
      hitCount: 0,
      region
    };

    this.cacheStore.set(cacheKey, entry);
  }

  private createCachedResponse(entry: CacheEntry, status: string): Response {
    const age = Math.floor((Date.now() - entry.timestamp) / 1000);

    return new Response(entry.content, {
      headers: {
        ...entry.headers,
        "X-Cache": status,
        "X-Cache-Hits": entry.hitCount.toString(),
        "Age": age.toString(),
        "X-Edge-Region": entry.region || "unknown"
      }
    });
  }

  private async revalidateInBackground(request: Request, cacheKey: string): Promise<void> {
    // Non-blocking revalidation
    const region = this.geoRouter.getRegion(request);
    const url = new URL(request.url);

    this.originShield.fetch(url.pathname, region)
      .then(response => this.cacheResponse(cacheKey, response, region))
      .catch(() => {
        // Keep stale content on revalidation failure
      });
  }

  private async handleAdmin(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/_cdn/stats") {
      return Response.json(this.cacheStore.getStats());
    }

    if (path === "/_cdn/purge" && request.method === "POST") {
      const body = await request.json() as { pattern: string };
      const count = this.cacheStore.purge(body.pattern);
      return Response.json({ purged: count });
    }

    return new Response("Not Found", { status: 404 });
  }

  private generateETag(content: Uint8Array): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      hash = ((hash << 5) - hash) + content[i];
      hash = hash & hash;
    }
    return `"${hash.toString(36)}"`;
  }
}

// Start the server
const cdn = new EdgeCDN();

serve((request: Request) => {
  return cdn.handleRequest(request);
}, { port: 8080 });

console.log("Edge CDN running on http://localhost:8080");
