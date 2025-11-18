/**
 * FastAPI Middleware Module
 *
 * Provides middleware support for request/response processing.
 */

export interface MiddlewareFunction {
  (request: any, next: () => Promise<any>): Promise<any>;
}

export interface CORSOptions {
  allow_origins?: string[];
  allow_methods?: string[];
  allow_headers?: string[];
  allow_credentials?: boolean;
  expose_headers?: string[];
  max_age?: number;
}

/**
 * CORS middleware
 */
export function CORSMiddleware(options: CORSOptions = {}): MiddlewareFunction {
  const {
    allow_origins = ['*'],
    allow_methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allow_headers = ['*'],
    allow_credentials = false,
    expose_headers = [],
    max_age = 600,
  } = options;

  return async (request: any, next: () => Promise<any>) => {
    // Handle preflight OPTIONS request
    if (request.method === 'OPTIONS') {
      const response = {
        status_code: 200,
        content: '',
        headers: {
          'Access-Control-Allow-Origin': allow_origins.join(', '),
          'Access-Control-Allow-Methods': allow_methods.join(', '),
          'Access-Control-Allow-Headers': allow_headers.join(', '),
          'Access-Control-Max-Age': max_age.toString(),
        },
      };

      if (allow_credentials) {
        response.headers['Access-Control-Allow-Credentials'] = 'true';
      }

      return response;
    }

    // Process request
    const result = await next();

    // Add CORS headers to response
    if (!result.headers) {
      result.headers = {};
    }

    result.headers['Access-Control-Allow-Origin'] = allow_origins.join(', ');

    if (allow_credentials) {
      result.headers['Access-Control-Allow-Credentials'] = 'true';
    }

    if (expose_headers.length > 0) {
      result.headers['Access-Control-Expose-Headers'] = expose_headers.join(', ');
    }

    return result;
  };
}

/**
 * Logging middleware
 */
export function LoggingMiddleware(options: {
  log_requests?: boolean;
  log_responses?: boolean;
  logger?: (message: string) => void;
} = {}): MiddlewareFunction {
  const {
    log_requests = true,
    log_responses = true,
    logger = console.log,
  } = options;

  return async (request: any, next: () => Promise<any>) => {
    const start = Date.now();

    if (log_requests) {
      logger(`${request.method} ${request.url}`);
    }

    const result = await next();
    const duration = Date.now() - start;

    if (log_responses) {
      const status = result.status_code || 200;
      logger(`${request.method} ${request.url} ${status} ${duration}ms`);
    }

    return result;
  };
}

/**
 * Compression middleware
 */
export function GZipMiddleware(options: {
  minimum_size?: number;
  compression_level?: number;
} = {}): MiddlewareFunction {
  const {
    minimum_size = 500,
    compression_level = 6,
  } = options;

  return async (request: any, next: () => Promise<any>) => {
    const result = await next();

    // Check if compression is supported
    const acceptEncoding = request.headers['accept-encoding'] || '';
    if (!acceptEncoding.includes('gzip')) {
      return result;
    }

    // Check if content is large enough to compress
    const content = result.content;
    if (!content || typeof content !== 'string' || content.length < minimum_size) {
      return result;
    }

    // In real implementation, would compress content with zlib
    // For now, just add the header
    if (!result.headers) {
      result.headers = {};
    }
    result.headers['Content-Encoding'] = 'gzip';

    return result;
  };
}

/**
 * Rate limiting middleware
 */
export function RateLimitMiddleware(options: {
  requests_per_minute?: number;
  identifier?: (request: any) => string;
} = {}): MiddlewareFunction {
  const {
    requests_per_minute = 60,
    identifier = (req: any) => req.headers['x-forwarded-for'] || req.raw.socket.remoteAddress,
  } = options;

  const requests = new Map<string, number[]>();

  return async (request: any, next: () => Promise<any>) => {
    const id = identifier(request);
    const now = Date.now();
    const minute_ago = now - 60000;

    // Get request timestamps for this identifier
    let timestamps = requests.get(id) || [];
    timestamps = timestamps.filter(t => t > minute_ago);

    // Check if rate limit exceeded
    if (timestamps.length >= requests_per_minute) {
      return {
        status_code: 429,
        content: { detail: 'Too Many Requests' },
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60',
        },
      };
    }

    // Add current request
    timestamps.push(now);
    requests.set(id, timestamps);

    return await next();
  };
}

/**
 * Request ID middleware
 */
export function RequestIDMiddleware(options: {
  header_name?: string;
  generator?: () => string;
} = {}): MiddlewareFunction {
  const {
    header_name = 'X-Request-ID',
    generator = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  } = options;

  return async (request: any, next: () => Promise<any>) => {
    // Generate or get request ID
    const request_id = request.headers[header_name.toLowerCase()] || generator();

    // Add to request
    request.request_id = request_id;

    // Process request
    const result = await next();

    // Add to response
    if (!result.headers) {
      result.headers = {};
    }
    result.headers[header_name] = request_id;

    return result;
  };
}

/**
 * Security headers middleware
 */
export function SecurityHeadersMiddleware(options: {
  hsts?: boolean;
  nosniff?: boolean;
  xss_protection?: boolean;
  frame_options?: string;
} = {}): MiddlewareFunction {
  const {
    hsts = true,
    nosniff = true,
    xss_protection = true,
    frame_options = 'DENY',
  } = options;

  return async (request: any, next: () => Promise<any>) => {
    const result = await next();

    if (!result.headers) {
      result.headers = {};
    }

    if (hsts) {
      result.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
    }

    if (nosniff) {
      result.headers['X-Content-Type-Options'] = 'nosniff';
    }

    if (xss_protection) {
      result.headers['X-XSS-Protection'] = '1; mode=block';
    }

    if (frame_options) {
      result.headers['X-Frame-Options'] = frame_options;
    }

    return result;
  };
}

/**
 * Timing middleware
 */
export function TimingMiddleware(): MiddlewareFunction {
  return async (request: any, next: () => Promise<any>) => {
    const start = Date.now();
    const result = await next();
    const duration = Date.now() - start;

    if (!result.headers) {
      result.headers = {};
    }
    result.headers['X-Response-Time'] = `${duration}ms`;

    return result;
  };
}

export default CORSMiddleware;
