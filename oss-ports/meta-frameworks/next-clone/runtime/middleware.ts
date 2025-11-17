/**
 * Middleware System for Elide Next Clone
 *
 * Provides:
 * - Edge-compatible middleware
 * - Request/response manipulation
 * - Routing middleware
 * - Authentication middleware
 * - CORS middleware
 * - Rate limiting
 */

export interface NextRequest {
  url: string;
  method: string;
  headers: Headers;
  cookies: Map<string, string>;
  geo?: {
    city?: string;
    country?: string;
    region?: string;
    latitude?: string;
    longitude?: string;
  };
  ip?: string;
  nextUrl: URL;
}

export interface NextResponse {
  status: number;
  headers: Headers;
  cookies: Map<string, string>;
  body?: any;
}

export type MiddlewareFunction = (
  request: NextRequest,
  event?: any
) => NextResponse | Promise<NextResponse> | void | Promise<void>;

export interface MiddlewareConfig {
  matcher?: string | string[];
  runtime?: 'edge' | 'nodejs';
}

/**
 * Next Response builder
 */
export class ResponseBuilder {
  static next(init?: ResponseInit): NextResponse {
    return {
      status: init?.status || 200,
      headers: new Headers(init?.headers),
      cookies: new Map(),
    };
  }

  static redirect(url: string | URL, status = 302): NextResponse {
    const headers = new Headers();
    headers.set('Location', url.toString());

    return {
      status,
      headers,
      cookies: new Map(),
    };
  }

  static rewrite(url: string | URL): NextResponse {
    const headers = new Headers();
    headers.set('x-middleware-rewrite', url.toString());

    return {
      status: 200,
      headers,
      cookies: new Map(),
    };
  }

  static json(data: any, init?: ResponseInit): NextResponse {
    const headers = new Headers(init?.headers);
    headers.set('Content-Type', 'application/json');

    return {
      status: init?.status || 200,
      headers,
      cookies: new Map(),
      body: JSON.stringify(data),
    };
  }
}

/**
 * Middleware runner
 */
export class MiddlewareRunner {
  private middleware: Array<{
    fn: MiddlewareFunction;
    config: MiddlewareConfig;
  }> = [];

  /**
   * Register middleware
   */
  use(fn: MiddlewareFunction, config: MiddlewareConfig = {}): void {
    this.middleware.push({ fn, config });
  }

  /**
   * Run middleware chain
   */
  async run(request: NextRequest): Promise<NextResponse | void> {
    for (const { fn, config } of this.middleware) {
      // Check if middleware matches route
      if (config.matcher && !this.matches(request.url, config.matcher)) {
        continue;
      }

      // Run middleware
      const result = await fn(request);

      // If middleware returns response, stop chain
      if (result) {
        return result;
      }
    }
  }

  /**
   * Check if URL matches pattern
   */
  private matches(url: string, matcher: string | string[]): boolean {
    const patterns = Array.isArray(matcher) ? matcher : [matcher];
    const pathname = new URL(url, 'http://localhost').pathname;

    return patterns.some(pattern => {
      // Convert glob pattern to regex
      const regex = new RegExp(
        '^' +
        pattern
          .replace(/\*/g, '.*')
          .replace(/\?/g, '.')
          .replace(/\//g, '\\/') +
        '$'
      );

      return regex.test(pathname);
    });
  }
}

/**
 * Built-in middleware
 */
export class Middleware {
  /**
   * CORS middleware
   */
  static cors(options: {
    origin?: string | string[];
    methods?: string[];
    allowedHeaders?: string[];
    credentials?: boolean;
  } = {}): MiddlewareFunction {
    return (request: NextRequest) => {
      const response = ResponseBuilder.next();

      // Set CORS headers
      const origin = Array.isArray(options.origin)
        ? options.origin.join(', ')
        : options.origin || '*';

      response.headers.set('Access-Control-Allow-Origin', origin);

      if (options.methods) {
        response.headers.set(
          'Access-Control-Allow-Methods',
          options.methods.join(', ')
        );
      }

      if (options.allowedHeaders) {
        response.headers.set(
          'Access-Control-Allow-Headers',
          options.allowedHeaders.join(', ')
        );
      }

      if (options.credentials) {
        response.headers.set('Access-Control-Allow-Credentials', 'true');
      }

      // Handle preflight
      if (request.method === 'OPTIONS') {
        return response;
      }
    };
  }

  /**
   * Rate limiting middleware
   */
  static rateLimit(options: {
    windowMs?: number;
    max?: number;
    keyGenerator?: (req: NextRequest) => string;
  } = {}): MiddlewareFunction {
    const windowMs = options.windowMs || 60000; // 1 minute
    const max = options.max || 100;
    const requests = new Map<string, number[]>();

    return (request: NextRequest) => {
      const key = options.keyGenerator?.(request) || request.ip || 'anonymous';
      const now = Date.now();

      // Get request timestamps
      let timestamps = requests.get(key) || [];

      // Remove old timestamps
      timestamps = timestamps.filter(ts => now - ts < windowMs);

      // Check limit
      if (timestamps.length >= max) {
        return ResponseBuilder.json(
          { error: 'Too many requests' },
          { status: 429 }
        );
      }

      // Add new timestamp
      timestamps.push(now);
      requests.set(key, timestamps);
    };
  }

  /**
   * Authentication middleware
   */
  static auth(options: {
    secret: string;
    cookieName?: string;
    redirectTo?: string;
  }): MiddlewareFunction {
    const cookieName = options.cookieName || 'auth-token';

    return (request: NextRequest) => {
      const token = request.cookies.get(cookieName);

      if (!token) {
        if (options.redirectTo) {
          return ResponseBuilder.redirect(options.redirectTo);
        }
        return ResponseBuilder.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      // Verify token (simplified - use proper JWT in production)
      // In real implementation, verify JWT signature
    };
  }

  /**
   * Compression middleware
   */
  static compression(): MiddlewareFunction {
    return (request: NextRequest) => {
      const response = ResponseBuilder.next();
      const acceptEncoding = request.headers.get('accept-encoding') || '';

      if (acceptEncoding.includes('gzip')) {
        response.headers.set('Content-Encoding', 'gzip');
      } else if (acceptEncoding.includes('br')) {
        response.headers.set('Content-Encoding', 'br');
      }
    };
  }

  /**
   * Security headers middleware
   */
  static security(options: {
    contentSecurityPolicy?: string;
    xFrameOptions?: string;
    xContentTypeOptions?: boolean;
    referrerPolicy?: string;
  } = {}): MiddlewareFunction {
    return (request: NextRequest) => {
      const response = ResponseBuilder.next();

      if (options.contentSecurityPolicy) {
        response.headers.set(
          'Content-Security-Policy',
          options.contentSecurityPolicy
        );
      }

      if (options.xFrameOptions) {
        response.headers.set('X-Frame-Options', options.xFrameOptions);
      }

      if (options.xContentTypeOptions) {
        response.headers.set('X-Content-Type-Options', 'nosniff');
      }

      if (options.referrerPolicy) {
        response.headers.set('Referrer-Policy', options.referrerPolicy);
      }
    };
  }

  /**
   * Logging middleware
   */
  static logger(): MiddlewareFunction {
    return (request: NextRequest) => {
      const start = Date.now();

      console.log(`[${request.method}] ${request.url}`);

      // Log response time
      const response = ResponseBuilder.next();
      const elapsed = Date.now() - start;

      response.headers.set('X-Response-Time', `${elapsed}ms`);
    };
  }

  /**
   * Redirect middleware
   */
  static redirects(rules: Array<{
    source: string | RegExp;
    destination: string;
    permanent?: boolean;
  }>): MiddlewareFunction {
    return (request: NextRequest) => {
      const pathname = request.nextUrl.pathname;

      for (const rule of rules) {
        let match = false;
        let destination = rule.destination;

        if (typeof rule.source === 'string') {
          match = pathname === rule.source;
        } else {
          const matches = pathname.match(rule.source);
          if (matches) {
            match = true;
            // Replace captured groups in destination
            destination = destination.replace(/\$(\d+)/g, (_, n) => {
              return matches[parseInt(n)] || '';
            });
          }
        }

        if (match) {
          return ResponseBuilder.redirect(
            destination,
            rule.permanent ? 301 : 302
          );
        }
      }
    };
  }

  /**
   * Rewrites middleware
   */
  static rewrites(rules: Array<{
    source: string | RegExp;
    destination: string;
  }>): MiddlewareFunction {
    return (request: NextRequest) => {
      const pathname = request.nextUrl.pathname;

      for (const rule of rules) {
        let match = false;
        let destination = rule.destination;

        if (typeof rule.source === 'string') {
          match = pathname === rule.source;
        } else {
          const matches = pathname.match(rule.source);
          if (matches) {
            match = true;
            destination = destination.replace(/\$(\d+)/g, (_, n) => {
              return matches[parseInt(n)] || '';
            });
          }
        }

        if (match) {
          return ResponseBuilder.rewrite(destination);
        }
      }
    };
  }
}

/**
 * Cookie parser
 */
export class CookieParser {
  static parse(cookieHeader: string): Map<string, string> {
    const cookies = new Map<string, string>();

    if (!cookieHeader) return cookies;

    const pairs = cookieHeader.split(';');
    for (const pair of pairs) {
      const [key, value] = pair.trim().split('=');
      if (key && value) {
        cookies.set(key, decodeURIComponent(value));
      }
    }

    return cookies;
  }

  static serialize(name: string, value: string, options: {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    maxAge?: number;
    path?: string;
    domain?: string;
  } = {}): string {
    let cookie = `${name}=${encodeURIComponent(value)}`;

    if (options.httpOnly) cookie += '; HttpOnly';
    if (options.secure) cookie += '; Secure';
    if (options.sameSite) cookie += `; SameSite=${options.sameSite}`;
    if (options.maxAge) cookie += `; Max-Age=${options.maxAge}`;
    if (options.path) cookie += `; Path=${options.path}`;
    if (options.domain) cookie += `; Domain=${options.domain}`;

    return cookie;
  }
}

export { ResponseBuilder as NextResponse };
export default MiddlewareRunner;
