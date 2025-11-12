/**
 * Production-Grade API Gateway with Elide
 *
 * Demonstrates enterprise API gateway patterns including:
 * - JWT authentication with refresh tokens
 * - OAuth2 integration
 * - API key management
 * - Advanced rate limiting (per user, IP, endpoint)
 * - Request/response transformation
 * - GraphQL gateway support
 * - WebSocket proxying
 * - Multi-tier caching with Redis simulation
 * - Load balancing with health checks
 * - Metrics, analytics & alerting
 * - API versioning
 * - CORS management
 * - Request logging
 */

import { AuthService } from './auth-strategies.ts';
import { MultiTierRateLimiter } from './rate-limiter.ts';
import { TransformationPipeline } from './transformer.ts';
import { GraphQLGateway } from './graphql-gateway.ts';
import { WebSocketProxy } from './websocket-proxy.ts';
import { AnalyticsService } from './analytics.ts';
import { LoadBalancer } from './load-balancer.ts';
import { CacheManager } from './cache-manager.ts';
import { CORSManager, CORSPresets } from './cors-manager.ts';

import type { RequestMetrics } from './analytics.ts';

interface RouteConfig {
  path: string;
  method: string;
  targetUrl?: string;
  version: string;
  requiresAuth: boolean;
  authType?: 'jwt' | 'apikey' | 'oauth2';
  rateLimit?: { perUser?: number; perIP?: number; perEndpoint?: number };
  cache?: { ttl: number; tags?: string[] };
  transformRequest?: boolean;
  transformResponse?: boolean;
  loadBalance?: boolean;
}

// ==================== Production API Gateway ====================

class ProductionAPIGateway {
  private authService: AuthService;
  private rateLimiter: MultiTierRateLimiter;
  private transformer: TransformationPipeline;
  private graphqlGateway: GraphQLGateway;
  private wsProxy: WebSocketProxy;
  private analytics: AnalyticsService;
  private loadBalancer: LoadBalancer;
  private cacheManager: CacheManager;
  private corsManager: CORSManager;
  private routes: Map<string, RouteConfig>;

  constructor() {
    // Initialize all services
    this.authService = new AuthService();
    this.rateLimiter = new MultiTierRateLimiter();
    this.transformer = new TransformationPipeline();
    this.graphqlGateway = new GraphQLGateway({
      maxComplexity: 1000,
      maxDepth: 10,
      enableCaching: true,
      cacheTTL: 60000
    });
    this.wsProxy = new WebSocketProxy();
    this.analytics = new AnalyticsService();
    this.loadBalancer = new LoadBalancer({
      algorithm: 'round-robin',
      retries: 3,
      retryDelay: 100,
      healthCheck: {
        interval: 10000,
        timeout: 5000,
        healthyThreshold: 2,
        unhealthyThreshold: 3,
        path: '/health'
      }
    });
    this.cacheManager = new CacheManager({
      maxSize: 1000,
      defaultTTL: 60000,
      evictionPolicy: 'lru',
      enableL2: true
    });
    this.corsManager = new CORSManager(
      CORSPresets.api(['http://localhost:3001', 'https://example.com'])
    );

    this.routes = new Map();

    this.initializeServices();
    this.initializeRoutes();
  }

  private initializeServices(): void {
    // Add backend servers
    this.loadBalancer.addBackend({
      id: 'backend-1',
      url: 'http://localhost:4001',
      weight: 1,
      healthy: true
    });

    this.loadBalancer.addBackend({
      id: 'backend-2',
      url: 'http://localhost:4002',
      weight: 1,
      healthy: true
    });

    // Start health checks
    this.loadBalancer.startHealthChecks();

    // Configure rate limiting per endpoint
    this.rateLimiter.setEndpointLimit('/api/v1/orders', 'POST', {
      algorithm: 'token-bucket',
      maxRequests: 50,
      windowMs: 60000,
      identifier: 'user',
      burstSize: 10
    });

    // Configure request validation
    this.transformer.getRequestTransformer().setValidationRules('/api/v1/orders', [
      { field: 'productId', type: 'string', required: true },
      { field: 'quantity', type: 'number', required: true, min: 1, max: 100 }
    ]);

    // Register WebSocket routes
    this.wsProxy.registerRoute({
      path: '/ws/chat',
      targetUrl: 'ws://localhost:4001/chat',
      requiresAuth: true
    });

    // Start cleanups
    this.authService.startCleanup();
    this.rateLimiter.startCleanup();
    this.graphqlGateway.startCleanup();
  }

  private initializeRoutes(): void {
    // API v1 routes
    this.addRoute({
      path: '/api/v1/users',
      method: 'GET',
      version: 'v1',
      requiresAuth: true,
      authType: 'jwt',
      rateLimit: { perUser: 100, perIP: 500 },
      cache: { ttl: 30000, tags: ['users'] },
      transformResponse: true,
      loadBalance: true
    });

    this.addRoute({
      path: '/api/v1/products',
      method: 'GET',
      version: 'v1',
      requiresAuth: false,
      rateLimit: { perIP: 1000 },
      cache: { ttl: 300000, tags: ['products'] },
      transformResponse: true,
      loadBalance: true
    });

    this.addRoute({
      path: '/api/v1/orders',
      method: 'POST',
      version: 'v1',
      requiresAuth: true,
      authType: 'jwt',
      rateLimit: { perUser: 50, perEndpoint: 100 },
      transformRequest: true,
      transformResponse: true,
      loadBalance: true
    });

    // API v2 routes
    this.addRoute({
      path: '/api/v2/users',
      method: 'GET',
      version: 'v2',
      requiresAuth: true,
      authType: 'apikey',
      rateLimit: { perUser: 200, perIP: 1000 },
      cache: { ttl: 60000, tags: ['users'] },
      transformResponse: true,
      loadBalance: true
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
    const startTime = Date.now();
    const requestId = crypto.randomUUID();
    const url = new URL(request.url);
    const ipAddress = request.headers.get('X-Forwarded-For') || request.headers.get('CF-Connecting-IP') || 'unknown';

    try {
      // Apply CORS
      const corsResult = this.corsManager.handleRequest(request);
      if (!corsResult.isOriginAllowed) {
        return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Get route
      const route = this.getRoute(request.method, url.pathname);
      if (!route) {
        this.recordMetrics(requestId, request, 404, Date.now() - startTime, ipAddress);
        return this.applyHeaders(
          new Response(JSON.stringify({ error: 'Route not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          }),
          request,
          corsResult.headers
        );
      }

      // Authentication
      let userId: string | null = null;

      if (route.requiresAuth) {
        const authResult = await this.authenticate(request, route.authType || 'jwt');

        if (!authResult.success) {
          this.recordMetrics(requestId, request, 401, Date.now() - startTime, ipAddress);
          return this.applyHeaders(
            new Response(JSON.stringify({ error: authResult.error || 'Authentication failed' }), {
              status: 401,
              headers: { 'Content-Type': 'application/json' }
            }),
            request,
            corsResult.headers
          );
        }

        userId = authResult.user!.id;
      }

      // Rate limiting
      if (route.rateLimit) {
        const rateLimitResult = await this.rateLimiter.checkAll(
          userId,
          ipAddress,
          url.pathname,
          request.method
        );

        if (!rateLimitResult.allowed) {
          this.recordMetrics(requestId, request, 429, Date.now() - startTime, ipAddress, userId);

          const result = rateLimitResult.results.user || rateLimitResult.results.ip;
          return this.applyHeaders(
            new Response(JSON.stringify({
              error: 'Rate limit exceeded',
              limitedBy: rateLimitResult.limitedBy
            }), {
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'X-RateLimit-Limit': result.limit.toString(),
                'X-RateLimit-Remaining': '0',
                'Retry-After': result.retryAfter?.toString() || '60'
              }
            }),
            request,
            corsResult.headers
          );
        }
      }

      // Check cache for GET requests
      if (request.method === 'GET' && route.cache) {
        const cacheKey = `${route.path}:${url.search}`;
        const cached = await this.cacheManager.get(cacheKey);

        if (cached) {
          this.recordMetrics(requestId, request, 200, Date.now() - startTime, ipAddress, userId, true);
          return this.applyHeaders(
            new Response(JSON.stringify(cached), {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                'X-Cache': 'HIT',
                'X-Request-ID': requestId
              }
            }),
            request,
            corsResult.headers
          );
        }
      }

      // Load balance the request
      let response: Response;

      if (route.loadBalance) {
        const backendResponse = await this.loadBalancer.forwardRequest(request, ipAddress);

        if (!backendResponse) {
          this.recordMetrics(requestId, request, 503, Date.now() - startTime, ipAddress, userId);
          return this.applyHeaders(
            new Response(JSON.stringify({ error: 'Service unavailable' }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            }),
            request,
            corsResult.headers
          );
        }

        response = backendResponse;
      } else {
        // Simulate backend response
        response = new Response(JSON.stringify({
          success: true,
          data: { message: 'Simulated response' }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Transform response
      let responseData = await response.json();

      if (route.transformResponse) {
        const transformed = await this.transformer.processResponse(
          responseData,
          { wrap: true, addMetadata: { version: route.version, requestId } }
        );
        responseData = JSON.parse(transformed.data);
      }

      // Cache successful responses
      if (request.method === 'GET' && route.cache && response.ok) {
        const cacheKey = `${route.path}:${url.search}`;
        await this.cacheManager.set(cacheKey, responseData, {
          ttl: route.cache.ttl,
          tags: route.cache.tags
        });
      }

      this.recordMetrics(requestId, request, response.status, Date.now() - startTime, ipAddress, userId);

      return this.applyHeaders(
        new Response(JSON.stringify(responseData), {
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
            'X-Cache': 'MISS',
            'X-Request-ID': requestId,
            'X-API-Version': route.version
          }
        }),
        request,
        corsResult.headers
      );
    } catch (error) {
      this.analytics.getLogger().error('Gateway error', { requestId, path: url.pathname }, error as Error);
      this.recordMetrics(requestId, request, 500, Date.now() - startTime, ipAddress, undefined, false, (error as Error).message);

      return new Response(JSON.stringify({
        error: 'Internal server error',
        requestId
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  private async authenticate(request: Request, authType: 'jwt' | 'apikey' | 'oauth2'): Promise<{
    success: boolean;
    user?: any;
    error?: string;
  }> {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return { success: false, error: 'Authorization header required' };
    }

    if (authType === 'jwt') {
      if (!authHeader.startsWith('Bearer ')) {
        return { success: false, error: 'Bearer token required' };
      }

      const token = authHeader.substring(7);
      return await this.authService.authenticateJWT(token);
    } else if (authType === 'apikey') {
      const apiKey = authHeader.replace(/^(Bearer|ApiKey)\s+/i, '');
      return await this.authService.authenticateAPIKey(apiKey);
    }

    return { success: false, error: 'Unsupported auth type' };
  }

  private recordMetrics(
    requestId: string,
    request: Request,
    statusCode: number,
    duration: number,
    ipAddress: string,
    userId?: string,
    cached: boolean = false,
    error?: string
  ): void {
    const url = new URL(request.url);

    const metrics: RequestMetrics = {
      requestId,
      method: request.method,
      path: url.pathname,
      statusCode,
      duration,
      timestamp: Date.now(),
      userId,
      ipAddress,
      userAgent: request.headers.get('User-Agent') || undefined,
      bytesIn: 0,
      bytesOut: 0,
      cached,
      error
    };

    this.analytics.recordRequest(metrics);
  }

  private applyHeaders(response: Response, request: Request, corsHeaders: any): Response {
    const newHeaders = new Headers(response.headers);

    for (const [key, value] of Object.entries(corsHeaders)) {
      if (value) {
        newHeaders.set(key, value as string);
      }
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  }

  // Service getters
  getAuthService(): AuthService { return this.authService; }
  getAnalytics(): AnalyticsService { return this.analytics; }
  getGraphQLGateway(): GraphQLGateway { return this.graphqlGateway; }
  getLoadBalancer(): LoadBalancer { return this.loadBalancer; }
  getCacheManager(): CacheManager { return this.cacheManager; }
  getRoutes(): RouteConfig[] { return Array.from(this.routes.values()); }
}

// Create gateway instance
const gateway = new ProductionAPIGateway();

/**
 * Native Elide beta11-rc1 HTTP Server - Fetch Handler Pattern
 * Run with: elide serve --port 3000 server.ts
 */
export default async function fetch(request: Request): Promise<Response> {
  const url = new URL(request.url);

  // ==================== Authentication Endpoints ====================

  // JWT Login
  if (url.pathname === '/auth/login' && request.method === 'POST') {
    try {
      const { email, password } = await request.json();
      const result = await gateway.getAuthService().authenticateCredentials(email, password);

      if (result.success) {
        return new Response(JSON.stringify({
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresIn: 900,
          user: result.user
        }), {
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

  // Refresh Token
  if (url.pathname === '/auth/refresh' && request.method === 'POST') {
    try {
      const { refreshToken } = await request.json();
      const result = await gateway.getAuthService().refreshToken(refreshToken);

      if (result) {
        return new Response(JSON.stringify({
          accessToken: result.accessToken,
          expiresIn: result.expiresIn
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ error: 'Invalid refresh token' }), {
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

  // OAuth2 Authorization URL
  if (url.pathname.startsWith('/auth/oauth2/') && request.method === 'GET') {
    const provider = url.pathname.split('/')[3] as 'google' | 'github' | 'microsoft';
    const state = crypto.randomUUID();

    try {
      const authUrl = gateway.getAuthService().getOAuth2AuthUrl(provider, state);
      return new Response(JSON.stringify({ authUrl, state }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: (error as Error).message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // Generate API Key
  if (url.pathname === '/auth/apikey/generate' && request.method === 'POST') {
    try {
      const { name, permissions, expiresInDays } = await request.json();
      const userId = 'user-123'; // Get from auth

      const apiKey = gateway.getAuthService().getAPIKeyManager().generateKey(
        userId,
        name,
        permissions || ['read', 'write'],
        undefined,
        expiresInDays
      );

      return new Response(JSON.stringify({
        apiKey: apiKey.key,
        name: apiKey.name,
        permissions: Array.from(apiKey.permissions),
        expiresAt: apiKey.expiresAt
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Failed to generate API key' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // ==================== GraphQL Endpoint ====================

  if (url.pathname === '/graphql') {
    return await gateway.getGraphQLGateway().handleRequest(request);
  }

  // ==================== Admin Endpoints ====================

  // Analytics Dashboard
  if (url.pathname === '/admin/analytics') {
    const snapshot = gateway.getAnalytics().getSnapshot();
    return new Response(JSON.stringify(snapshot, null, 2), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Metrics
  if (url.pathname === '/admin/metrics') {
    const metrics = gateway.getAnalytics().getOverallMetrics();
    return new Response(JSON.stringify(metrics, null, 2), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Alerts
  if (url.pathname === '/admin/alerts') {
    const alerts = gateway.getAnalytics().getAlertManager().getActiveAlerts();
    return new Response(JSON.stringify(alerts, null, 2), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Logs
  if (url.pathname === '/admin/logs') {
    const level = url.searchParams.get('level') as 'error' | 'warn' | 'info' | undefined;
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const logs = gateway.getAnalytics().getLogger().getLogs(level, limit);
    return new Response(JSON.stringify(logs, null, 2), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Cache Management
  if (url.pathname === '/admin/cache/stats') {
    const stats = gateway.getCacheManager().getStats();
    return new Response(JSON.stringify(stats, null, 2), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (url.pathname === '/admin/cache/invalidate' && request.method === 'POST') {
    try {
      const { type, value } = await request.json();
      const count = await gateway.getCacheManager().invalidate({ type, value });
      return new Response(JSON.stringify({ success: true, invalidated: count }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // Load Balancer Status
  if (url.pathname === '/admin/backends') {
    const backends = gateway.getLoadBalancer().getStats();
    return new Response(JSON.stringify(backends, null, 2), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Routes Listing
  if (url.pathname === '/admin/routes') {
    const routes = gateway.getRoutes();
    return new Response(JSON.stringify(routes, null, 2), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Health Check
  if (url.pathname === '/health') {
    const backends = gateway.getLoadBalancer().getStats();
    const healthyBackends = backends.filter(b => b.healthy).length;

    return new Response(JSON.stringify({
      status: healthyBackends > 0 ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      backends: {
        total: backends.length,
        healthy: healthyBackends,
        unhealthy: backends.length - healthyBackends
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // ==================== API Routes ====================

  // Route all API requests through gateway
  if (url.pathname.startsWith('/api/')) {
    return await gateway.handleRequest(request);
  }

  // ==================== Default Response ====================

  return new Response(JSON.stringify({
    name: 'Production API Gateway',
    version: '2.0.0',
    features: [
      'JWT Authentication with Refresh Tokens',
      'OAuth2 Integration',
      'API Key Management',
      'Advanced Rate Limiting',
      'Request/Response Transformation',
      'GraphQL Gateway',
      'WebSocket Proxying',
      'Multi-Tier Caching',
      'Load Balancing',
      'Health Checking',
      'Metrics & Analytics',
      'Alert System',
      'API Versioning',
      'CORS Management',
      'Request Logging'
    ],
    endpoints: {
      auth: ['/auth/login', '/auth/refresh', '/auth/oauth2/*', '/auth/apikey/generate'],
      api: ['/api/v1/*', '/api/v2/*'],
      graphql: ['/graphql'],
      admin: [
        '/admin/analytics',
        '/admin/metrics',
        '/admin/alerts',
        '/admin/logs',
        '/admin/cache/stats',
        '/admin/cache/invalidate',
        '/admin/backends',
        '/admin/routes'
      ],
      health: ['/health']
    }
  }, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

if (import.meta.url.includes("server.ts")) {
  console.log('🚀 Production API Gateway ready on port 3000');
  console.log('');
  console.log('Features:');
  console.log('  ✓ JWT Auth + Refresh Tokens');
  console.log('  ✓ OAuth2 Integration');
  console.log('  ✓ API Key Management');
  console.log('  ✓ Advanced Rate Limiting');
  console.log('  ✓ Request/Response Transformation');
  console.log('  ✓ GraphQL Gateway');
  console.log('  ✓ WebSocket Proxying');
  console.log('  ✓ Multi-Tier Caching');
  console.log('  ✓ Load Balancing');
  console.log('  ✓ Health Checking');
  console.log('  ✓ Metrics & Analytics');
  console.log('  ✓ Alert System');
  console.log('  ✓ API Versioning');
  console.log('  ✓ CORS Management');
  console.log('  ✓ Request Logging');
  console.log('');
  console.log('Try: curl http://localhost:3000');
}
