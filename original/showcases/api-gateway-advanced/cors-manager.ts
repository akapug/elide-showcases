/**
 * CORS Manager Module
 *
 * Provides comprehensive CORS management:
 * - Origin validation and whitelisting
 * - Dynamic CORS policies per route
 * - Preflight request handling
 * - Credential support
 * - Header management
 * - Method restrictions
 */

// ==================== Types & Interfaces ====================

export interface CORSConfig {
  origins?: string[] | string | ((origin: string) => boolean);
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
  preflightContinue?: boolean;
  optionsSuccessStatus?: number;
}

export interface CORSPolicy {
  path: string;
  config: CORSConfig;
  priority?: number;
}

export interface CORSHeaders {
  'Access-Control-Allow-Origin'?: string;
  'Access-Control-Allow-Methods'?: string;
  'Access-Control-Allow-Headers'?: string;
  'Access-Control-Expose-Headers'?: string;
  'Access-Control-Allow-Credentials'?: string;
  'Access-Control-Max-Age'?: string;
  'Vary'?: string;
}

// ==================== CORS Manager ====================

export class CORSManager {
  private defaultConfig: CORSConfig;
  private policies: Map<string, CORSPolicy> = new Map();
  private originCache: Map<string, boolean> = new Map();

  constructor(defaultConfig?: CORSConfig) {
    this.defaultConfig = {
      origins: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: [],
      credentials: false,
      maxAge: 86400, // 24 hours
      preflightContinue: false,
      optionsSuccessStatus: 204,
      ...defaultConfig
    };
  }

  /**
   * Add a path-specific CORS policy
   */
  addPolicy(policy: CORSPolicy): void {
    this.policies.set(policy.path, policy);
  }

  /**
   * Remove a CORS policy
   */
  removePolicy(path: string): boolean {
    return this.policies.delete(path);
  }

  /**
   * Get CORS policy for a path
   */
  getPolicy(path: string): CORSConfig {
    // Check for exact match
    const exactPolicy = this.policies.get(path);
    if (exactPolicy) {
      return exactPolicy.config;
    }

    // Check for pattern match
    for (const [pattern, policy] of this.policies.entries()) {
      if (this.matchPath(path, pattern)) {
        return policy.config;
      }
    }

    return this.defaultConfig;
  }

  /**
   * Handle CORS for incoming request
   */
  handleRequest(request: Request): {
    headers: CORSHeaders;
    isPreflightAllowed: boolean;
    isOriginAllowed: boolean;
  } {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');
    const method = request.method;

    const config = this.getPolicy(url.pathname);

    // Check if this is a preflight request
    const isPreflight = method === 'OPTIONS' &&
      request.headers.has('Access-Control-Request-Method');

    // Validate origin
    const isOriginAllowed = origin ? this.isOriginAllowed(origin, config) : true;

    if (!isOriginAllowed) {
      return {
        headers: {},
        isPreflightAllowed: false,
        isOriginAllowed: false
      };
    }

    // Generate CORS headers
    const headers: CORSHeaders = {};

    // Origin header
    if (config.origins === '*' && !config.credentials) {
      headers['Access-Control-Allow-Origin'] = '*';
    } else if (origin) {
      headers['Access-Control-Allow-Origin'] = origin;
      headers['Vary'] = 'Origin';
    }

    // Credentials
    if (config.credentials) {
      headers['Access-Control-Allow-Credentials'] = 'true';
    }

    // Preflight-specific headers
    if (isPreflight) {
      const requestMethod = request.headers.get('Access-Control-Request-Method');
      const requestHeaders = request.headers.get('Access-Control-Request-Headers');

      // Check if method is allowed
      const isMethodAllowed = requestMethod &&
        config.methods!.includes(requestMethod.toUpperCase());

      if (!isMethodAllowed) {
        return {
          headers: {},
          isPreflightAllowed: false,
          isOriginAllowed: true
        };
      }

      // Methods
      headers['Access-Control-Allow-Methods'] = config.methods!.join(', ');

      // Headers
      if (requestHeaders) {
        const requestedHeaders = requestHeaders.split(',').map(h => h.trim());
        const allowedHeaders = this.getAllowedHeaders(requestedHeaders, config);
        headers['Access-Control-Allow-Headers'] = allowedHeaders.join(', ');
      } else if (config.allowedHeaders && config.allowedHeaders.length > 0) {
        headers['Access-Control-Allow-Headers'] = config.allowedHeaders.join(', ');
      }

      // Max age
      if (config.maxAge) {
        headers['Access-Control-Max-Age'] = config.maxAge.toString();
      }
    } else {
      // Regular request - expose headers
      if (config.exposedHeaders && config.exposedHeaders.length > 0) {
        headers['Access-Control-Expose-Headers'] = config.exposedHeaders.join(', ');
      }
    }

    return {
      headers,
      isPreflightAllowed: !isPreflight || true,
      isOriginAllowed: true
    };
  }

  /**
   * Create a preflight response
   */
  createPreflightResponse(request: Request): Response {
    const result = this.handleRequest(request);

    if (!result.isOriginAllowed || !result.isPreflightAllowed) {
      return new Response(null, {
        status: 403,
        statusText: 'Forbidden'
      });
    }

    const url = new URL(request.url);
    const config = this.getPolicy(url.pathname);

    return new Response(null, {
      status: config.optionsSuccessStatus || 204,
      headers: result.headers as HeadersInit
    });
  }

  /**
   * Apply CORS headers to a response
   */
  applyCORSHeaders(request: Request, response: Response): Response {
    const result = this.handleRequest(request);

    if (!result.isOriginAllowed) {
      return response;
    }

    // Clone response to add headers
    const newHeaders = new Headers(response.headers);

    for (const [key, value] of Object.entries(result.headers)) {
      if (value) {
        newHeaders.set(key, value);
      }
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  }

  /**
   * Check if origin is allowed
   */
  private isOriginAllowed(origin: string, config: CORSConfig): boolean {
    // Check cache first
    const cached = this.originCache.get(`${origin}:${JSON.stringify(config.origins)}`);
    if (cached !== undefined) {
      return cached;
    }

    let allowed = false;

    if (config.origins === '*') {
      allowed = true;
    } else if (typeof config.origins === 'function') {
      allowed = config.origins(origin);
    } else if (Array.isArray(config.origins)) {
      allowed = config.origins.some(allowedOrigin => {
        if (allowedOrigin === '*') return true;
        if (allowedOrigin.includes('*')) {
          return this.matchWildcard(origin, allowedOrigin);
        }
        return origin === allowedOrigin;
      });
    } else if (typeof config.origins === 'string') {
      if (config.origins === '*') {
        allowed = true;
      } else if (config.origins.includes('*')) {
        allowed = this.matchWildcard(origin, config.origins);
      } else {
        allowed = origin === config.origins;
      }
    }

    // Cache result
    this.originCache.set(`${origin}:${JSON.stringify(config.origins)}`, allowed);

    // Limit cache size
    if (this.originCache.size > 1000) {
      const firstKey = this.originCache.keys().next().value;
      this.originCache.delete(firstKey);
    }

    return allowed;
  }

  /**
   * Get allowed headers
   */
  private getAllowedHeaders(requestedHeaders: string[], config: CORSConfig): string[] {
    if (!config.allowedHeaders) {
      return requestedHeaders;
    }

    // If config has '*', allow all requested headers
    if (config.allowedHeaders.includes('*')) {
      return requestedHeaders;
    }

    const allowedLower = config.allowedHeaders.map(h => h.toLowerCase());
    return requestedHeaders.filter(h => allowedLower.includes(h.toLowerCase()));
  }

  /**
   * Match wildcard pattern
   */
  private matchWildcard(value: string, pattern: string): boolean {
    const regexPattern = pattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*');

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(value);
  }

  /**
   * Match path pattern
   */
  private matchPath(path: string, pattern: string): boolean {
    if (pattern === '*') return true;
    if (pattern === path) return true;

    // Convert pattern to regex
    const regexPattern = pattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*');

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(path);
  }

  /**
   * Get all policies
   */
  getPolicies(): CORSPolicy[] {
    return Array.from(this.policies.values());
  }

  /**
   * Clear origin cache
   */
  clearCache(): void {
    this.originCache.clear();
  }
}

// ==================== Preset CORS Configurations ====================

export const CORSPresets = {
  /**
   * Allow all origins (development only!)
   */
  allowAll: (): CORSConfig => ({
    origins: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    allowedHeaders: '*',
    credentials: false
  }),

  /**
   * Strict CORS for production
   */
  strict: (allowedOrigins: string[]): CORSConfig => ({
    origins: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-Request-Id'],
    credentials: true,
    maxAge: 86400
  }),

  /**
   * API-specific CORS
   */
  api: (allowedOrigins: string[]): CORSConfig => ({
    origins: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-API-Key',
      'X-Request-Id'
    ],
    exposedHeaders: [
      'X-Request-Id',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset'
    ],
    credentials: true,
    maxAge: 3600
  }),

  /**
   * Read-only CORS
   */
  readOnly: (allowedOrigins: string[]): CORSConfig => ({
    origins: allowedOrigins,
    methods: ['GET', 'HEAD', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    credentials: false,
    maxAge: 86400
  }),

  /**
   * GraphQL-specific CORS
   */
  graphql: (allowedOrigins: string[]): CORSConfig => ({
    origins: allowedOrigins,
    methods: ['POST', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Apollo-Tracing',
      'apollographql-client-name',
      'apollographql-client-version'
    ],
    exposedHeaders: ['X-Request-Id'],
    credentials: true,
    maxAge: 3600
  }),

  /**
   * WebSocket CORS
   */
  websocket: (allowedOrigins: string[]): CORSConfig => ({
    origins: allowedOrigins,
    methods: ['GET', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Sec-WebSocket-Protocol',
      'Sec-WebSocket-Extensions'
    ],
    credentials: true,
    maxAge: 86400
  })
};

// ==================== CORS Middleware ====================

export class CORSMiddleware {
  private corsManager: CORSManager;

  constructor(corsManager: CORSManager) {
    this.corsManager = corsManager;
  }

  /**
   * Handle CORS for any request
   */
  async handle(request: Request, next: (request: Request) => Promise<Response>): Promise<Response> {
    // Handle preflight
    if (request.method === 'OPTIONS' &&
        request.headers.has('Access-Control-Request-Method')) {
      return this.corsManager.createPreflightResponse(request);
    }

    // Process request
    const response = await next(request);

    // Apply CORS headers
    return this.corsManager.applyCORSHeaders(request, response);
  }
}
