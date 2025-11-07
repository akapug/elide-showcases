/**
 * Advanced API Gateway with Elide
 *
 * Demonstrates enterprise API gateway patterns including:
 * - Rate limiting per client with sliding window
 * - JWT validation and authentication
 * - Request/response transformation
 * - Multi-layer caching
 * - API versioning and routing
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  identifier: string;
}

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
  etag: string;
}

interface RouteConfig {
  path: string;
  method: string;
  targetUrl: string;
  version: string;
  requiresAuth: boolean;
  rateLimit?: RateLimitConfig;
  cache?: { ttl: number };
  transformRequest?: (body: any) => any;
  transformResponse?: (body: any) => any;
}

interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  exp: number;
  iat: number;
}

class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  isAllowed(identifier: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(identifier) || [];

    // Remove expired timestamps (sliding window)
    const validTimestamps = timestamps.filter(ts => now - ts < windowMs);

    if (validTimestamps.length >= maxRequests) {
      this.requests.set(identifier, validTimestamps);
      return false;
    }

    validTimestamps.push(now);
    this.requests.set(identifier, validTimestamps);
    return true;
  }

  getRemainingRequests(identifier: string, maxRequests: number, windowMs: number): number {
    const now = Date.now();
    const timestamps = this.requests.get(identifier) || [];
    const validTimestamps = timestamps.filter(ts => now - ts < windowMs);
    return Math.max(0, maxRequests - validTimestamps.length);
  }

  getResetTime(identifier: string, windowMs: number): number {
    const timestamps = this.requests.get(identifier) || [];
    if (timestamps.length === 0) return 0;
    return timestamps[0] + windowMs;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [identifier, timestamps] of this.requests.entries()) {
      const valid = timestamps.filter(ts => now - ts < 3600000); // Keep 1 hour
      if (valid.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, valid);
      }
    }
  }
}

class JWTValidator {
  private readonly secret: string;

  constructor(secret: string = 'your-secret-key-change-in-production') {
    this.secret = secret;
  }

  async validate(token: string): Promise<JWTPayload | null> {
    try {
      // Simple JWT validation (in production, use a proper library)
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = JSON.parse(atob(parts[1]));

      // Check expiration
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        return null;
      }

      // In production, verify signature with crypto
      return payload as JWTPayload;
    } catch (error) {
      console.error('JWT validation error:', error);
      return null;
    }
  }

  createToken(payload: Omit<JWTPayload, 'exp' | 'iat'>): string {
    const now = Math.floor(Date.now() / 1000);
    const fullPayload: JWTPayload = {
      ...payload,
      iat: now,
      exp: now + 3600 // 1 hour expiration
    };

    // Simple encoding (in production, use proper signing)
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = btoa(JSON.stringify(fullPayload));
    const signature = btoa(`${header}.${body}.${this.secret}`);

    return `${header}.${body}.${signature}`;
  }
}

class ResponseCache {
  private cache: Map<string, CacheEntry> = new Map();

  set(key: string, data: any, ttl: number): void {
    const etag = this.generateETag(data);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      etag
    });
  }

  get(key: string): CacheEntry | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry;
  }

  has(key: string, etag?: string): boolean {
    const entry = this.get(key);
    if (!entry) return false;
    if (etag && entry.etag !== etag) return false;
    return true;
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  private generateETag(data: any): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `"${Math.abs(hash).toString(36)}"`;
  }

  getStats(): any {
    return {
      totalEntries: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        age: Math.round((Date.now() - entry.timestamp) / 1000) + 's',
        ttl: Math.round(entry.ttl / 1000) + 's',
        etag: entry.etag
      }))
    };
  }
}

class RequestTransformer {
  static transform(data: any, transformFn?: (body: any) => any): any {
    if (!transformFn) return data;
    return transformFn(data);
  }

  static addTimestamp(data: any): any {
    return { ...data, timestamp: new Date().toISOString() };
  }

  static sanitizeInput(data: any): any {
    // Remove potentially harmful fields
    const { __proto__, constructor, ...safe } = data;
    return safe;
  }

  static enrichWithMetadata(data: any, metadata: Record<string, any>): any {
    return {
      data,
      metadata: {
        ...metadata,
        processedAt: new Date().toISOString()
      }
    };
  }
}

class APIGateway {
  private rateLimiter: RateLimiter;
  private jwtValidator: JWTValidator;
  private cache: ResponseCache;
  private routes: Map<string, RouteConfig>;

  constructor() {
    this.rateLimiter = new RateLimiter();
    this.jwtValidator = new JWTValidator();
    this.cache = new ResponseCache();
    this.routes = new Map();

    this.initializeRoutes();
    this.startCleanupJobs();
  }

  private initializeRoutes(): void {
    // API v1 routes
    this.addRoute({
      path: '/api/v1/users',
      method: 'GET',
      targetUrl: 'http://localhost:4001/users',
      version: 'v1',
      requiresAuth: true,
      rateLimit: { maxRequests: 100, windowMs: 60000, identifier: 'client' },
      cache: { ttl: 30000 },
      transformResponse: (data) => RequestTransformer.enrichWithMetadata(data, { version: 'v1' })
    });

    // API v2 routes with different rate limits
    this.addRoute({
      path: '/api/v2/users',
      method: 'GET',
      targetUrl: 'http://localhost:4002/users',
      version: 'v2',
      requiresAuth: true,
      rateLimit: { maxRequests: 200, windowMs: 60000, identifier: 'client' },
      cache: { ttl: 60000 },
      transformResponse: (data) => RequestTransformer.enrichWithMetadata(data, { version: 'v2' })
    });

    this.addRoute({
      path: '/api/v1/products',
      method: 'GET',
      targetUrl: 'http://localhost:4001/products',
      version: 'v1',
      requiresAuth: false,
      rateLimit: { maxRequests: 500, windowMs: 60000, identifier: 'ip' },
      cache: { ttl: 120000 }
    });

    this.addRoute({
      path: '/api/v1/orders',
      method: 'POST',
      targetUrl: 'http://localhost:4001/orders',
      version: 'v1',
      requiresAuth: true,
      rateLimit: { maxRequests: 50, windowMs: 60000, identifier: 'client' },
      transformRequest: RequestTransformer.sanitizeInput
    });
  }

  private addRoute(config: RouteConfig): void {
    const key = `${config.method}:${config.path}`;
    this.routes.set(key, config);
  }

  private getRoute(method: string, path: string): RouteConfig | null {
    const key = `${method}:${path}`;
    return this.routes.get(key) || null;
  }

  async handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const route = this.getRoute(request.method, url.pathname);

    if (!route) {
      return new Response(JSON.stringify({ error: 'Route not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Authentication check
    if (route.requiresAuth) {
      const authHeader = request.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Authentication required' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const token = authHeader.substring(7);
      const payload = await this.jwtValidator.validate(token);

      if (!payload) {
        return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      request.headers.set('X-User-Id', payload.sub);
      request.headers.set('X-User-Role', payload.role);
    }

    // Rate limiting
    if (route.rateLimit) {
      const identifier = route.rateLimit.identifier === 'ip'
        ? request.headers.get('X-Forwarded-For') || 'unknown'
        : request.headers.get('X-User-Id') || 'anonymous';

      const allowed = this.rateLimiter.isAllowed(
        identifier,
        route.rateLimit.maxRequests,
        route.rateLimit.windowMs
      );

      if (!allowed) {
        const resetTime = this.rateLimiter.getResetTime(identifier, route.rateLimit.windowMs);
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': route.rateLimit.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(resetTime).toISOString()
          }
        });
      }

      const remaining = this.rateLimiter.getRemainingRequests(
        identifier,
        route.rateLimit.maxRequests,
        route.rateLimit.windowMs
      );

      request.headers.set('X-RateLimit-Remaining', remaining.toString());
    }

    // Check cache for GET requests
    if (request.method === 'GET' && route.cache) {
      const cacheKey = `${route.path}:${url.search}`;
      const ifNoneMatch = request.headers.get('If-None-Match');

      if (ifNoneMatch && this.cache.has(cacheKey, ifNoneMatch)) {
        return new Response(null, { status: 304 });
      }

      const cached = this.cache.get(cacheKey);
      if (cached) {
        return new Response(JSON.stringify(cached.data), {
          headers: {
            'Content-Type': 'application/json',
            'X-Cache': 'HIT',
            'ETag': cached.etag,
            'Age': Math.round((Date.now() - cached.timestamp) / 1000).toString()
          }
        });
      }
    }

    // Forward request to target service
    try {
      let body = null;
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        const rawBody = await request.json();
        body = route.transformRequest
          ? RequestTransformer.transform(rawBody, route.transformRequest)
          : rawBody;
      }

      const targetResponse = await fetch(route.targetUrl + url.search, {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
          'X-Gateway': 'true',
          'X-Request-ID': crypto.randomUUID()
        },
        body: body ? JSON.stringify(body) : undefined
      });

      let responseData = await targetResponse.json();

      // Transform response
      if (route.transformResponse) {
        responseData = RequestTransformer.transform(responseData, route.transformResponse);
      }

      // Cache successful GET responses
      if (request.method === 'GET' && route.cache && targetResponse.ok) {
        const cacheKey = `${route.path}:${url.search}`;
        this.cache.set(cacheKey, responseData, route.cache.ttl);
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'X-Cache': 'MISS',
        'X-API-Version': route.version
      };

      if (request.headers.get('X-RateLimit-Remaining')) {
        headers['X-RateLimit-Remaining'] = request.headers.get('X-RateLimit-Remaining')!;
      }

      return new Response(JSON.stringify(responseData), {
        status: targetResponse.status,
        headers
      });
    } catch (error) {
      console.error('Gateway error:', error);
      return new Response(JSON.stringify({
        error: 'Gateway error',
        message: (error as Error).message
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  private startCleanupJobs(): void {
    // Cleanup rate limiter every 5 minutes
    setInterval(() => this.rateLimiter.cleanup(), 300000);
  }

  getCacheStats(): any {
    return this.cache.getStats();
  }

  invalidateCache(pattern?: string): void {
    this.cache.invalidate(pattern);
  }

  getJWTValidator(): JWTValidator {
    return this.jwtValidator;
  }

  getRoutes(): RouteConfig[] {
    return Array.from(this.routes.values());
  }
}

// Create gateway instance
const gateway = new APIGateway();

// Elide server
Elide.serve({
  port: 3000,

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Auth endpoint - generate JWT token
    if (url.pathname === '/auth/login' && request.method === 'POST') {
      try {
        const { email, password } = await request.json();
        // Simplified auth (in production, validate credentials)
        if (email && password) {
          const token = gateway.getJWTValidator().createToken({
            sub: crypto.randomUUID(),
            email,
            role: 'user'
          });
          return new Response(JSON.stringify({ token, expiresIn: 3600 }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
        return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: 'Invalid request' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Cache management
    if (url.pathname === '/admin/cache/stats') {
      return new Response(JSON.stringify(gateway.getCacheStats(), null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (url.pathname === '/admin/cache/invalidate' && request.method === 'POST') {
      const { pattern } = await request.json();
      gateway.invalidateCache(pattern);
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Routes listing
    if (url.pathname === '/admin/routes') {
      const routes = gateway.getRoutes();
      return new Response(JSON.stringify(routes, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'healthy' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Route all API requests through gateway
    if (url.pathname.startsWith('/api/')) {
      return await gateway.handleRequest(request);
    }

    return new Response('Advanced API Gateway', { status: 200 });
  }
});

console.log('🚪 Advanced API Gateway running on http://localhost:3000');
console.log('Features: Rate Limiting | JWT Auth | Caching | Transformation | Versioning');
