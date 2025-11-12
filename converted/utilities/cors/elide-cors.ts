/**
 * Elide CORS - Universal CORS Middleware
 *
 * Cross-Origin Resource Sharing middleware that works across all languages.
 * Provides secure defaults and flexible configuration.
 */

export interface CorsOptions {
  origin?: string | string[] | RegExp | ((origin: string) => boolean);
  methods?: string | string[];
  allowedHeaders?: string | string[];
  exposedHeaders?: string | string[];
  credentials?: boolean;
  maxAge?: number;
  preflightContinue?: boolean;
  optionsSuccessStatus?: number;
}

export interface CorsHeaders {
  'Access-Control-Allow-Origin'?: string;
  'Access-Control-Allow-Methods'?: string;
  'Access-Control-Allow-Headers'?: string;
  'Access-Control-Expose-Headers'?: string;
  'Access-Control-Allow-Credentials'?: string;
  'Access-Control-Max-Age'?: string;
  [key: string]: string | undefined;
}

// Default CORS configuration
const DEFAULT_OPTIONS: CorsOptions = {
  origin: '*',
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: [],
  credentials: false,
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
};

export class Cors {
  private options: CorsOptions;

  constructor(options: CorsOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  // Check if origin is allowed
  private isOriginAllowed(origin: string): boolean {
    const { origin: allowedOrigin } = this.options;

    if (!allowedOrigin || allowedOrigin === '*') {
      return true;
    }

    if (typeof allowedOrigin === 'string') {
      return origin === allowedOrigin;
    }

    if (allowedOrigin instanceof RegExp) {
      return allowedOrigin.test(origin);
    }

    if (Array.isArray(allowedOrigin)) {
      return allowedOrigin.includes(origin);
    }

    if (typeof allowedOrigin === 'function') {
      return allowedOrigin(origin);
    }

    return false;
  }

  // Get CORS headers for a request
  getCorsHeaders(origin: string, method: string): CorsHeaders {
    const headers: CorsHeaders = {};

    // Handle origin
    if (this.isOriginAllowed(origin)) {
      headers['Access-Control-Allow-Origin'] = origin || '*';
    }

    // Handle credentials
    if (this.options.credentials) {
      headers['Access-Control-Allow-Credentials'] = 'true';
    }

    // Handle methods
    if (method === 'OPTIONS') {
      const methods = Array.isArray(this.options.methods)
        ? this.options.methods.join(', ')
        : this.options.methods;
      headers['Access-Control-Allow-Methods'] = methods || 'GET,HEAD,PUT,PATCH,POST,DELETE';

      // Handle allowed headers
      const allowedHeaders = Array.isArray(this.options.allowedHeaders)
        ? this.options.allowedHeaders.join(', ')
        : this.options.allowedHeaders;
      if (allowedHeaders) {
        headers['Access-Control-Allow-Headers'] = allowedHeaders;
      }

      // Handle max age
      if (this.options.maxAge) {
        headers['Access-Control-Max-Age'] = String(this.options.maxAge);
      }
    }

    // Handle exposed headers
    const exposedHeaders = Array.isArray(this.options.exposedHeaders)
      ? this.options.exposedHeaders.join(', ')
      : this.options.exposedHeaders;
    if (exposedHeaders) {
      headers['Access-Control-Expose-Headers'] = exposedHeaders;
    }

    return headers;
  }

  // Middleware function for request handling
  middleware() {
    return (req: any, res: any, next?: () => void) => {
      const origin = req.headers?.origin || req.headers?.Origin || '';
      const method = req.method || 'GET';

      const corsHeaders = this.getCorsHeaders(origin, method);

      // Apply headers to response
      Object.entries(corsHeaders).forEach(([key, value]) => {
        if (value) {
          if (res.setHeader) {
            res.setHeader(key, value);
          } else if (res.headers) {
            res.headers[key] = value;
          }
        }
      });

      // Handle preflight requests
      if (method === 'OPTIONS') {
        if (!this.options.preflightContinue) {
          res.statusCode = this.options.optionsSuccessStatus || 204;
          res.end?.();
          return;
        }
      }

      // Continue to next middleware
      if (next) {
        next();
      }
    };
  }
}

// Factory function
export function cors(options?: CorsOptions) {
  const corsInstance = new Cors(options);
  return corsInstance.middleware();
}

// Convenience functions
export function corsAll() {
  return cors({ origin: '*' });
}

export function corsOrigin(origin: string | string[]) {
  return cors({ origin });
}

export function corsCredentials() {
  return cors({ credentials: true, origin: (origin) => origin !== '' });
}

// Export default
export default cors;

// Demo
if (import.meta.main) {
  console.log('=== Elide CORS Demo ===\n');

  // Example 1: Basic CORS (allow all origins)
  console.log('1. Basic CORS (allow all origins):');
  const basicCors = new Cors();
  const headers1 = basicCors.getCorsHeaders('https://example.com', 'GET');
  console.log('   Headers:', headers1);
  console.log('');

  // Example 2: Specific origin
  console.log('2. Specific origin:');
  const originCors = new Cors({ origin: 'https://myapp.com' });
  const headers2a = originCors.getCorsHeaders('https://myapp.com', 'GET');
  const headers2b = originCors.getCorsHeaders('https://other.com', 'GET');
  console.log('   Allowed origin:', headers2a);
  console.log('   Denied origin:', headers2b);
  console.log('');

  // Example 3: Multiple origins
  console.log('3. Multiple origins:');
  const multiCors = new Cors({
    origin: ['https://app1.com', 'https://app2.com']
  });
  const headers3 = multiCors.getCorsHeaders('https://app1.com', 'GET');
  console.log('   Headers:', headers3);
  console.log('');

  // Example 4: Regex origin
  console.log('4. Regex origin (*.example.com):');
  const regexCors = new Cors({
    origin: /\.example\.com$/
  });
  const headers4a = regexCors.getCorsHeaders('https://api.example.com', 'GET');
  const headers4b = regexCors.getCorsHeaders('https://other.com', 'GET');
  console.log('   Allowed:', headers4a);
  console.log('   Denied:', headers4b);
  console.log('');

  // Example 5: Preflight request
  console.log('5. Preflight request (OPTIONS):');
  const preflightCors = new Cors({
    methods: ['GET', 'POST', 'PUT'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Custom-Header'],
    maxAge: 3600
  });
  const headers5 = preflightCors.getCorsHeaders('https://app.com', 'OPTIONS');
  console.log('   Headers:', headers5);
  console.log('');

  // Example 6: With credentials
  console.log('6. With credentials:');
  const credsCors = new Cors({
    origin: 'https://app.com',
    credentials: true,
    exposedHeaders: ['X-Request-Id', 'X-Rate-Limit']
  });
  const headers6 = credsCors.getCorsHeaders('https://app.com', 'GET');
  console.log('   Headers:', headers6);
  console.log('');

  // Example 7: Custom function origin check
  console.log('7. Custom function origin check:');
  const customCors = new Cors({
    origin: (origin) => origin.includes('.trusted.com')
  });
  const headers7a = customCors.getCorsHeaders('https://api.trusted.com', 'GET');
  const headers7b = customCors.getCorsHeaders('https://untrusted.com', 'GET');
  console.log('   Trusted:', headers7a);
  console.log('   Untrusted:', headers7b);
  console.log('');

  console.log('✓ All examples completed successfully!');
}
