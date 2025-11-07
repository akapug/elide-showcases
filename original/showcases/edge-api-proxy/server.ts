/**
 * Edge API Proxy
 *
 * Production-grade API gateway at the edge with request routing,
 * response transformation, failover, load balancing, and API composition.
 */

import { serve } from "http";

// Types and Interfaces
interface Backend {
  id: string;
  url: string;
  weight: number;
  healthy: boolean;
  latency: number;
  activeConnections: number;
  lastHealthCheck: number;
  failureCount: number;
}

interface Route {
  path: string;
  method?: string;
  backends: string[];
  transform?: TransformConfig;
  cache?: CacheConfig;
  rateLimit?: RateLimitConfig;
}

interface TransformConfig {
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  requestBody?: (body: any) => any;
  responseBody?: (body: any) => any;
}

interface CacheConfig {
  ttl: number;
  varyBy?: string[];
  cacheableStatus?: number[];
}

interface RateLimitConfig {
  requestsPerMinute: number;
  burstSize?: number;
}

interface CircuitBreaker {
  state: "closed" | "open" | "half-open";
  failureCount: number;
  lastFailureTime: number;
  nextRetryTime: number;
}

// Load Balancer
class LoadBalancer {
  private backends: Map<string, Backend> = new Map();
  private currentIndex = 0;

  addBackend(backend: Backend): void {
    this.backends.set(backend.id, backend);
  }

  selectBackend(backendIds: string[], strategy: "round-robin" | "least-connections" | "weighted" = "weighted"): Backend | null {
    const availableBackends = backendIds
      .map(id => this.backends.get(id))
      .filter(b => b && b.healthy) as Backend[];

    if (availableBackends.length === 0) {
      return null;
    }

    switch (strategy) {
      case "round-robin":
        return this.roundRobin(availableBackends);
      case "least-connections":
        return this.leastConnections(availableBackends);
      case "weighted":
        return this.weighted(availableBackends);
      default:
        return availableBackends[0];
    }
  }

  private roundRobin(backends: Backend[]): Backend {
    const backend = backends[this.currentIndex % backends.length];
    this.currentIndex++;
    return backend;
  }

  private leastConnections(backends: Backend[]): Backend {
    return backends.reduce((min, b) =>
      b.activeConnections < min.activeConnections ? b : min
    );
  }

  private weighted(backends: Backend[]): Backend {
    const totalWeight = backends.reduce((sum, b) => sum + b.weight, 0);
    let random = Math.random() * totalWeight;

    for (const backend of backends) {
      random -= backend.weight;
      if (random <= 0) {
        return backend;
      }
    }

    return backends[0];
  }

  recordSuccess(backendId: string, latency: number): void {
    const backend = this.backends.get(backendId);
    if (backend) {
      backend.healthy = true;
      backend.latency = latency;
      backend.failureCount = 0;
      backend.activeConnections--;
    }
  }

  recordFailure(backendId: string): void {
    const backend = this.backends.get(backendId);
    if (backend) {
      backend.failureCount++;
      backend.activeConnections--;

      // Mark unhealthy after 3 consecutive failures
      if (backend.failureCount >= 3) {
        backend.healthy = false;
        backend.lastHealthCheck = Date.now();
      }
    }
  }

  incrementConnections(backendId: string): void {
    const backend = this.backends.get(backendId);
    if (backend) {
      backend.activeConnections++;
    }
  }

  getBackendStats(): Record<string, any> {
    const stats: Record<string, any> = {};

    for (const [id, backend] of this.backends.entries()) {
      stats[id] = {
        healthy: backend.healthy,
        latency: backend.latency,
        activeConnections: backend.activeConnections,
        failureCount: backend.failureCount
      };
    }

    return stats;
  }
}

// Circuit Breaker
class CircuitBreakerManager {
  private breakers: Map<string, CircuitBreaker> = new Map();
  private failureThreshold = 5;
  private recoveryTimeout = 30000; // 30 seconds
  private halfOpenMaxRequests = 3;

  getState(backendId: string): CircuitBreaker {
    if (!this.breakers.has(backendId)) {
      this.breakers.set(backendId, {
        state: "closed",
        failureCount: 0,
        lastFailureTime: 0,
        nextRetryTime: 0
      });
    }

    const breaker = this.breakers.get(backendId)!;

    // Transition from open to half-open after timeout
    if (breaker.state === "open" && Date.now() >= breaker.nextRetryTime) {
      breaker.state = "half-open";
      breaker.failureCount = 0;
    }

    return breaker;
  }

  recordSuccess(backendId: string): void {
    const breaker = this.getState(backendId);

    if (breaker.state === "half-open") {
      breaker.state = "closed";
      breaker.failureCount = 0;
    }
  }

  recordFailure(backendId: string): void {
    const breaker = this.getState(backendId);

    breaker.failureCount++;
    breaker.lastFailureTime = Date.now();

    if (breaker.failureCount >= this.failureThreshold) {
      breaker.state = "open";
      breaker.nextRetryTime = Date.now() + this.recoveryTimeout;
    }
  }

  isRequestAllowed(backendId: string): boolean {
    const breaker = this.getState(backendId);

    if (breaker.state === "open") {
      return false;
    }

    return true;
  }
}

// Response Cache
class ResponseCache {
  private cache: Map<string, { data: any; headers: Record<string, string>; timestamp: number }> = new Map();

  getCacheKey(request: Request, varyBy: string[] = []): string {
    const url = new URL(request.url);
    let key = `${request.method}:${url.pathname}`;

    for (const header of varyBy) {
      const value = request.headers.get(header);
      if (value) {
        key += `:${header}=${value}`;
      }
    }

    return key;
  }

  get(key: string, ttl: number): { data: any; headers: Record<string, string> } | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() - entry.timestamp > ttl) {
      this.cache.delete(key);
      return null;
    }

    return { data: entry.data, headers: entry.headers };
  }

  set(key: string, data: any, headers: Record<string, string>): void {
    this.cache.set(key, {
      data,
      headers,
      timestamp: Date.now()
    });
  }

  clear(): void {
    this.cache.clear();
  }

  getStats() {
    return {
      entries: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Request Transformer
class RequestTransformer {
  transformRequest(request: Request, config: TransformConfig): Request {
    const url = new URL(request.url);
    const headers = new Headers(request.headers);

    // Add/modify request headers
    if (config.requestHeaders) {
      for (const [key, value] of Object.entries(config.requestHeaders)) {
        headers.set(key, value);
      }
    }

    return new Request(url.toString(), {
      method: request.method,
      headers,
      body: request.body
    });
  }

  async transformResponse(response: Response, config: TransformConfig): Promise<Response> {
    const headers = new Headers(response.headers);

    // Add/modify response headers
    if (config.responseHeaders) {
      for (const [key, value] of Object.entries(config.responseHeaders)) {
        headers.set(key, value);
      }
    }

    let body = await response.text();

    // Transform response body
    if (config.responseBody) {
      try {
        const jsonBody = JSON.parse(body);
        const transformed = config.responseBody(jsonBody);
        body = JSON.stringify(transformed);
        headers.set("Content-Type", "application/json");
      } catch (error) {
        // Not JSON, return as-is
      }
    }

    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }
}

// API Composer - Combine multiple API calls
class APIComposer {
  async compose(requests: Array<{ name: string; url: string; method?: string }>): Promise<Record<string, any>> {
    const results: Record<string, any> = {};

    // Execute requests in parallel
    const promises = requests.map(async ({ name, url, method = "GET" }) => {
      try {
        const response = await fetch(url, { method });
        const data = await response.json();
        results[name] = { success: true, data };
      } catch (error) {
        results[name] = { success: false, error: (error as Error).message };
      }
    });

    await Promise.all(promises);

    return results;
  }
}

// Main Edge API Proxy
class EdgeAPIProxy {
  private loadBalancer: LoadBalancer;
  private circuitBreaker: CircuitBreakerManager;
  private responseCache: ResponseCache;
  private transformer: RequestTransformer;
  private composer: APIComposer;
  private routes: Route[];

  constructor() {
    this.loadBalancer = new LoadBalancer();
    this.circuitBreaker = new CircuitBreakerManager();
    this.responseCache = new ResponseCache();
    this.transformer = new RequestTransformer();
    this.composer = new APIComposer();
    this.routes = this.defineRoutes();
    this.initializeBackends();
  }

  private initializeBackends(): void {
    // Define backend servers
    const backends: Backend[] = [
      { id: "api-1", url: "https://api1.example.com", weight: 3, healthy: true, latency: 0, activeConnections: 0, lastHealthCheck: Date.now(), failureCount: 0 },
      { id: "api-2", url: "https://api2.example.com", weight: 2, healthy: true, latency: 0, activeConnections: 0, lastHealthCheck: Date.now(), failureCount: 0 },
      { id: "api-3", url: "https://api3.example.com", weight: 1, healthy: true, latency: 0, activeConnections: 0, lastHealthCheck: Date.now(), failureCount: 0 },
      { id: "legacy", url: "https://legacy.example.com", weight: 1, healthy: true, latency: 0, activeConnections: 0, lastHealthCheck: Date.now(), failureCount: 0 }
    ];

    backends.forEach(b => this.loadBalancer.addBackend(b));
  }

  private defineRoutes(): Route[] {
    return [
      {
        path: "/api/users",
        backends: ["api-1", "api-2", "api-3"],
        cache: { ttl: 60000, varyBy: ["Authorization"] },
        transform: {
          requestHeaders: { "X-API-Version": "v2" },
          responseHeaders: { "X-Proxy": "edge" }
        }
      },
      {
        path: "/api/legacy",
        backends: ["legacy"],
        transform: {
          responseBody: (body: any) => ({
            data: body,
            meta: { source: "legacy", transformedAt: new Date().toISOString() }
          })
        }
      },
      {
        path: "/api/products",
        backends: ["api-1", "api-2"],
        cache: { ttl: 300000 },
        rateLimit: { requestsPerMinute: 100 }
      }
    ];
  }

  async handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Admin endpoints
    if (path === "/_proxy/stats") {
      return Response.json({
        backends: this.loadBalancer.getBackendStats(),
        cache: this.responseCache.getStats()
      });
    }

    if (path === "/_proxy/cache/clear") {
      this.responseCache.clear();
      return Response.json({ message: "Cache cleared" });
    }

    // API composition endpoint
    if (path === "/_proxy/compose" && request.method === "POST") {
      return this.handleCompose(request);
    }

    // Route matching
    const route = this.findRoute(path, request.method);

    if (!route) {
      return new Response("Not Found", { status: 404 });
    }

    // Check cache
    if (route.cache) {
      const cacheKey = this.responseCache.getCacheKey(request, route.cache.varyBy);
      const cached = this.responseCache.get(cacheKey, route.cache.ttl);

      if (cached) {
        return new Response(JSON.stringify(cached.data), {
          headers: {
            ...cached.headers,
            "X-Cache": "HIT"
          }
        });
      }
    }

    // Proxy request with failover
    return this.proxyWithFailover(request, route);
  }

  private findRoute(path: string, method: string): Route | null {
    for (const route of this.routes) {
      if (path.startsWith(route.path)) {
        if (!route.method || route.method === method) {
          return route;
        }
      }
    }
    return null;
  }

  private async proxyWithFailover(request: Request, route: Route, attempt: number = 0): Promise<Response> {
    const maxAttempts = Math.min(route.backends.length, 3);

    if (attempt >= maxAttempts) {
      return new Response("Service Unavailable - All backends failed", { status: 503 });
    }

    // Select backend
    const backend = this.loadBalancer.selectBackend(route.backends);

    if (!backend) {
      return new Response("Service Unavailable - No healthy backends", { status: 503 });
    }

    // Check circuit breaker
    if (!this.circuitBreaker.isRequestAllowed(backend.id)) {
      console.log(`Circuit breaker open for ${backend.id}, trying failover`);
      return this.proxyWithFailover(request, route, attempt + 1);
    }

    this.loadBalancer.incrementConnections(backend.id);

    try {
      const startTime = Date.now();

      // Transform request
      let transformedRequest = request;
      if (route.transform) {
        transformedRequest = this.transformer.transformRequest(request, route.transform);
      }

      // Build backend URL
      const url = new URL(transformedRequest.url);
      const backendUrl = `${backend.url}${url.pathname}${url.search}`;

      // Forward request
      const response = await fetch(backendUrl, {
        method: transformedRequest.method,
        headers: transformedRequest.headers,
        body: transformedRequest.body
      });

      const latency = Date.now() - startTime;

      // Record success
      this.loadBalancer.recordSuccess(backend.id, latency);
      this.circuitBreaker.recordSuccess(backend.id);

      // Transform response
      let finalResponse = response;
      if (route.transform) {
        finalResponse = await this.transformer.transformResponse(response, route.transform);
      }

      // Cache response if configured
      if (route.cache && response.ok) {
        const cacheKey = this.responseCache.getCacheKey(request, route.cache.varyBy);
        const data = await finalResponse.clone().json();
        const headers: Record<string, string> = {};
        finalResponse.headers.forEach((v, k) => headers[k] = v);
        this.responseCache.set(cacheKey, data, headers);
      }

      // Add proxy headers
      const headers = new Headers(finalResponse.headers);
      headers.set("X-Backend", backend.id);
      headers.set("X-Backend-Latency", `${latency}ms`);
      headers.set("X-Cache", "MISS");

      return new Response(finalResponse.body, {
        status: finalResponse.status,
        statusText: finalResponse.statusText,
        headers
      });

    } catch (error) {
      console.error(`Backend ${backend.id} failed:`, error);

      // Record failure
      this.loadBalancer.recordFailure(backend.id);
      this.circuitBreaker.recordFailure(backend.id);

      // Retry with different backend
      return this.proxyWithFailover(request, route, attempt + 1);
    }
  }

  private async handleCompose(request: Request): Promise<Response> {
    try {
      const body = await request.json() as { requests: Array<{ name: string; url: string; method?: string }> };
      const results = await this.composer.compose(body.requests);

      return Response.json({
        composed: true,
        results
      });
    } catch (error) {
      return Response.json({ error: "Invalid compose request" }, { status: 400 });
    }
  }
}

// Start the server
const proxy = new EdgeAPIProxy();

serve((request: Request) => {
  return proxy.handleRequest(request);
}, { port: 8083 });

console.log("Edge API Proxy running on http://localhost:8083");
