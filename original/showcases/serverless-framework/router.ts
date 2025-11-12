/**
 * Request Router
 *
 * Intelligent request routing system for serverless functions.
 * Handles HTTP, WebSocket, and event-based routing with rate limiting.
 */

import { FunctionRuntime, InvocationResult } from "./function-runtime.ts";
import { MonitoringService } from "./monitoring.ts";

// =============================================================================
// Type Definitions
// =============================================================================

export interface RouteConfig {
  functionId: string;
  path: string;
  methods: string[];
  customDomain?: string;
  rateLimit?: RateLimitConfig;
  cors?: CorsConfig;
  authentication?: AuthConfig;
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (req: any) => string;
}

export interface CorsConfig {
  origins: string[];
  methods: string[];
  allowedHeaders: string[];
  credentials: boolean;
}

export interface AuthConfig {
  type: "jwt" | "apikey" | "oauth";
  config: any;
}

export interface RoutingRequest {
  functionId: string;
  payload: any;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  path?: string;
  method?: string;
}

export interface RoutingResult extends InvocationResult {
  route?: RouteConfig;
  rateLimited?: boolean;
}

// =============================================================================
// Rate Limiter
// =============================================================================

class RateLimiter {
  private requests = new Map<string, { count: number; resetAt: number }>();

  isAllowed(key: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const record = this.requests.get(key);

    if (!record || now >= record.resetAt) {
      // New window
      this.requests.set(key, {
        count: 1,
        resetAt: now + config.windowMs,
      });
      return true;
    }

    if (record.count >= config.maxRequests) {
      return false;
    }

    record.count++;
    return true;
  }

  getRemainingRequests(key: string, config: RateLimitConfig): number {
    const record = this.requests.get(key);
    if (!record || Date.now() >= record.resetAt) {
      return config.maxRequests;
    }
    return Math.max(0, config.maxRequests - record.count);
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.requests.entries()) {
      if (now >= record.resetAt) {
        this.requests.delete(key);
      }
    }
  }
}

// =============================================================================
// Router
// =============================================================================

export class Router {
  private runtime: FunctionRuntime;
  private monitoring: MonitoringService;
  private rateLimiter: RateLimiter;
  private routes = new Map<string, RouteConfig>();
  private requestQueues = new Map<string, RoutingRequest[]>();

  constructor(runtime: FunctionRuntime, monitoring: MonitoringService) {
    this.runtime = runtime;
    this.monitoring = monitoring;
    this.rateLimiter = new RateLimiter();

    console.log("[ROUTER] Initializing Request Router...");
    this.startCleanupTask();
  }

  // ==========================================================================
  // Route Management
  // ==========================================================================

  registerRoute(config: RouteConfig): void {
    const routeKey = this.getRouteKey(config.path, config.methods);
    this.routes.set(routeKey, config);
    console.log(`[ROUTER] Registered route: ${config.methods.join(",")} ${config.path} -> ${config.functionId}`);
  }

  unregisterRoute(path: string, methods: string[]): void {
    const routeKey = this.getRouteKey(path, methods);
    this.routes.delete(routeKey);
    console.log(`[ROUTER] Unregistered route: ${methods.join(",")} ${path}`);
  }

  getRoute(path: string, method: string): RouteConfig | undefined {
    // Try exact match first
    const exactKey = this.getRouteKey(path, [method]);
    const exact = this.routes.get(exactKey);
    if (exact) return exact;

    // Try wildcard match
    for (const [_, config] of this.routes.entries()) {
      if (this.matchPath(path, config.path) && config.methods.includes(method)) {
        return config;
      }
    }

    return undefined;
  }

  private getRouteKey(path: string, methods: string[]): string {
    return `${methods.sort().join(",")}:${path}`;
  }

  private matchPath(requestPath: string, routePath: string): boolean {
    // Simple wildcard matching
    if (routePath === "*") return true;
    if (routePath.endsWith("/*")) {
      const prefix = routePath.slice(0, -2);
      return requestPath.startsWith(prefix);
    }
    return requestPath === routePath;
  }

  // ==========================================================================
  // Request Routing
  // ==========================================================================

  async routeRequest(request: RoutingRequest): Promise<RoutingResult> {
    const startTime = Date.now();

    // Find route configuration
    const route = request.path && request.method
      ? this.getRoute(request.path, request.method)
      : undefined;

    // Apply rate limiting
    if (route?.rateLimit) {
      const rateLimitKey = this.getRateLimitKey(request, route.rateLimit);
      const allowed = this.rateLimiter.isAllowed(rateLimitKey, route.rateLimit);

      if (!allowed) {
        console.log(`[ROUTER] Rate limit exceeded for ${rateLimitKey}`);
        this.monitoring.recordRateLimitHit(request.functionId);

        return {
          requestId: `req-${Date.now()}`,
          statusCode: 429,
          body: {
            error: "Too Many Requests",
            message: "Rate limit exceeded. Please try again later.",
          },
          duration: Date.now() - startTime,
          memoryUsed: 0,
          coldStart: false,
          logs: [],
          rateLimited: true,
          route,
        };
      }
    }

    // Queue management
    const queue = this.requestQueues.get(request.functionId) || [];
    queue.push(request);
    this.requestQueues.set(request.functionId, queue);

    try {
      // Invoke function
      const result = await this.runtime.invoke(
        request.functionId,
        request.payload,
        request.headers
      );

      // Apply CORS headers if configured
      if (route?.cors) {
        result.headers = {
          ...result.headers,
          ...this.getCorsHeaders(route.cors, request.headers?.["origin"]),
        };
      }

      // Record metrics
      this.monitoring.recordInvocation(request.functionId, {
        duration: result.duration,
        statusCode: result.statusCode,
        coldStart: result.coldStart,
        memoryUsed: result.memoryUsed,
      });

      return {
        ...result,
        route,
      };

    } finally {
      // Remove from queue
      const currentQueue = this.requestQueues.get(request.functionId) || [];
      const index = currentQueue.indexOf(request);
      if (index > -1) {
        currentQueue.splice(index, 1);
      }
      this.requestQueues.set(request.functionId, currentQueue);
    }
  }

  // ==========================================================================
  // WebSocket Routing
  // ==========================================================================

  async routeWebSocket(
    functionId: string,
    event: "connect" | "message" | "disconnect",
    data: any
  ): Promise<InvocationResult> {
    console.log(`[ROUTER] WebSocket ${event} for function ${functionId}`);

    const payload = {
      event,
      data,
      timestamp: Date.now(),
    };

    return await this.runtime.invoke(functionId, payload);
  }

  // ==========================================================================
  // Event Routing
  // ==========================================================================

  async routeEvent(functionId: string, eventType: string, data: any): Promise<InvocationResult> {
    console.log(`[ROUTER] Event ${eventType} for function ${functionId}`);

    const payload = {
      eventType,
      data,
      timestamp: Date.now(),
    };

    return await this.runtime.invoke(functionId, payload);
  }

  // ==========================================================================
  // Scheduled Routing (Cron)
  // ==========================================================================

  async routeScheduled(functionId: string, schedule: string): Promise<InvocationResult> {
    console.log(`[ROUTER] Scheduled execution (${schedule}) for function ${functionId}`);

    const payload = {
      type: "scheduled",
      schedule,
      timestamp: Date.now(),
    };

    return await this.runtime.invoke(functionId, payload);
  }

  // ==========================================================================
  // Custom Domain Routing
  // ==========================================================================

  getFunctionByDomain(domain: string): string | undefined {
    for (const [_, config] of this.routes.entries()) {
      if (config.customDomain === domain) {
        return config.functionId;
      }
    }
    return undefined;
  }

  // ==========================================================================
  // Rate Limiting Helpers
  // ==========================================================================

  private getRateLimitKey(request: RoutingRequest, config: RateLimitConfig): string {
    if (config.keyGenerator) {
      return config.keyGenerator(request);
    }

    // Default: use function ID + IP (or header)
    const ip = request.headers?.["x-forwarded-for"] || request.headers?.["x-real-ip"] || "unknown";
    return `${request.functionId}:${ip}`;
  }

  getRateLimitStatus(request: RoutingRequest): {
    limit: number;
    remaining: number;
    reset: number;
  } {
    const route = request.path && request.method
      ? this.getRoute(request.path, request.method)
      : undefined;

    if (!route?.rateLimit) {
      return {
        limit: Infinity,
        remaining: Infinity,
        reset: 0,
      };
    }

    const key = this.getRateLimitKey(request, route.rateLimit);
    const remaining = this.rateLimiter.getRemainingRequests(key, route.rateLimit);

    return {
      limit: route.rateLimit.maxRequests,
      remaining,
      reset: Date.now() + route.rateLimit.windowMs,
    };
  }

  // ==========================================================================
  // CORS Helpers
  // ==========================================================================

  private getCorsHeaders(config: CorsConfig, origin?: string): Record<string, string> {
    const headers: Record<string, string> = {
      "Access-Control-Allow-Methods": config.methods.join(", "),
      "Access-Control-Allow-Headers": config.allowedHeaders.join(", "),
    };

    if (origin && (config.origins.includes("*") || config.origins.includes(origin))) {
      headers["Access-Control-Allow-Origin"] = origin;
    }

    if (config.credentials) {
      headers["Access-Control-Allow-Credentials"] = "true";
    }

    return headers;
  }

  // ==========================================================================
  // Load Balancing
  // ==========================================================================

  async routeWithLoadBalancing(requests: RoutingRequest[]): Promise<RoutingResult[]> {
    // Simple round-robin load balancing
    const results = await Promise.all(
      requests.map((req) => this.routeRequest(req))
    );

    return results;
  }

  // ==========================================================================
  // Circuit Breaker
  // ==========================================================================

  private circuitBreakers = new Map<string, {
    failures: number;
    lastFailure: number;
    state: "closed" | "open" | "half-open";
  }>();

  private checkCircuitBreaker(functionId: string): boolean {
    const breaker = this.circuitBreakers.get(functionId);

    if (!breaker || breaker.state === "closed") {
      return true;
    }

    if (breaker.state === "open") {
      // Check if enough time has passed to try half-open
      if (Date.now() - breaker.lastFailure > 30000) {
        breaker.state = "half-open";
        return true;
      }
      return false;
    }

    return true; // half-open, allow request
  }

  private recordFailure(functionId: string): void {
    const breaker = this.circuitBreakers.get(functionId) || {
      failures: 0,
      lastFailure: 0,
      state: "closed" as const,
    };

    breaker.failures++;
    breaker.lastFailure = Date.now();

    if (breaker.failures >= 5) {
      breaker.state = "open";
      console.log(`[ROUTER] Circuit breaker opened for ${functionId}`);
    }

    this.circuitBreakers.set(functionId, breaker);
  }

  private recordSuccess(functionId: string): void {
    const breaker = this.circuitBreakers.get(functionId);

    if (breaker) {
      if (breaker.state === "half-open") {
        breaker.state = "closed";
        breaker.failures = 0;
        console.log(`[ROUTER] Circuit breaker closed for ${functionId}`);
      } else {
        breaker.failures = Math.max(0, breaker.failures - 1);
      }

      this.circuitBreakers.set(functionId, breaker);
    }
  }

  // ==========================================================================
  // Metrics
  // ==========================================================================

  getQueueLength(functionId: string): number {
    return (this.requestQueues.get(functionId) || []).length;
  }

  getAllQueueLengths(): Record<string, number> {
    const lengths: Record<string, number> = {};
    for (const [functionId, queue] of this.requestQueues.entries()) {
      lengths[functionId] = queue.length;
    }
    return lengths;
  }

  // ==========================================================================
  // Cleanup
  // ==========================================================================

  private startCleanupTask(): void {
    setInterval(() => {
      this.rateLimiter.cleanup();
    }, 60000); // Clean up every minute
  }
}
