/**
 * Middleware Stack
 *
 * Collection of middleware functions for:
 * - CORS handling
 * - Rate limiting
 * - Authentication
 * - Error handling
 * - Request logging
 */

import * as http from 'http';
import { logger } from './utils/logger';

// Rate limiting storage
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Configuration
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10); // 1 minute
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '60', 10); // 60 requests per minute

/**
 * CORS Middleware
 * Handles Cross-Origin Resource Sharing
 */
export function corsMiddleware(req: http.IncomingMessage, res: http.ServerResponse): boolean {
  const origin = req.headers.origin || '*';
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];

  const isAllowed = allowedOrigins.includes('*') || allowedOrigins.includes(origin);

  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    return true;
  }

  res.writeHead(403, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'CORS policy violation' }));
  return false;
}

/**
 * Rate Limiting Middleware
 * Prevents abuse by limiting requests per IP
 */
export async function rateLimitMiddleware(
  req: http.IncomingMessage,
  res: http.ServerResponse
): Promise<boolean> {
  // Skip rate limiting in development
  if (process.env.NODE_ENV === 'development' && process.env.SKIP_RATE_LIMIT === 'true') {
    return true;
  }

  // Get client identifier (IP address)
  const clientId = getClientId(req);
  const now = Date.now();

  // Clean up expired entries
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }

  // Get or create rate limit entry
  let entry = rateLimitStore.get(clientId);
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + RATE_LIMIT_WINDOW,
    };
    rateLimitStore.set(clientId, entry);
  }

  // Increment request count
  entry.count++;

  // Set rate limit headers
  const remaining = Math.max(0, RATE_LIMIT_MAX - entry.count);
  const resetSeconds = Math.ceil((entry.resetTime - now) / 1000);

  res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX.toString());
  res.setHeader('X-RateLimit-Remaining', remaining.toString());
  res.setHeader('X-RateLimit-Reset', resetSeconds.toString());

  // Check if limit exceeded
  if (entry.count > RATE_LIMIT_MAX) {
    logger.warn(`Rate limit exceeded for ${clientId}`);
    res.writeHead(429, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Too many requests',
      message: `Rate limit exceeded. Try again in ${resetSeconds} seconds.`,
      limit: RATE_LIMIT_MAX,
      remaining: 0,
      resetIn: resetSeconds,
    }));
    return false;
  }

  return true;
}

/**
 * Authentication Middleware
 * Validates API keys for protected endpoints
 */
export function authMiddleware(req: http.IncomingMessage, res: http.ServerResponse): boolean {
  // Skip auth in development mode
  if (process.env.NODE_ENV === 'development' && process.env.SKIP_AUTH === 'true') {
    return true;
  }

  // Get API key from headers or query params
  const apiKey = getApiKey(req);

  if (!apiKey) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Unauthorized',
      message: 'API key required. Provide via X-API-Key header or apiKey query parameter.',
    }));
    return false;
  }

  // Validate API key (in production, check against database)
  const validKeys = process.env.VALID_API_KEYS?.split(',') || ['demo_key_123'];
  if (!validKeys.includes(apiKey)) {
    logger.warn(`Invalid API key attempt: ${apiKey}`);
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Forbidden',
      message: 'Invalid API key',
    }));
    return false;
  }

  return true;
}

/**
 * Error Handler Middleware
 * Catches and formats errors
 */
export function errorHandler(
  error: Error,
  req: http.IncomingMessage,
  res: http.ServerResponse
): void {
  logger.error('Request error:', error);

  // Don't expose stack traces in production
  const stack = process.env.NODE_ENV === 'development' ? error.stack : undefined;

  res.writeHead(500, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    error: 'Internal server error',
    message: error.message,
    stack,
    timestamp: new Date().toISOString(),
    path: req.url,
    method: req.method,
  }));
}

/**
 * Request Logger Middleware
 * Logs all incoming requests
 */
export function requestLogger(req: http.IncomingMessage, res: http.ServerResponse, next: () => void): void {
  const start = Date.now();
  const { method, url } = req;

  // Log response after it's sent
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    const logLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

    logger[logLevel](`${method} ${url} - ${statusCode} - ${duration}ms`);
  });

  next();
}

/**
 * Body Parser Middleware
 * Parses request body based on content type
 */
export async function bodyParser(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();

      // Prevent huge payloads
      if (body.length > 10 * 1024 * 1024) { // 10MB
        reject(new Error('Request body too large'));
      }
    });

    req.on('end', () => {
      try {
        const contentType = req.headers['content-type'] || '';

        if (contentType.includes('application/json')) {
          resolve(body ? JSON.parse(body) : {});
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
          resolve(parseFormData(body));
        } else {
          resolve(body);
        }
      } catch (error) {
        reject(new Error('Invalid request body format'));
      }
    });

    req.on('error', reject);
  });
}

/**
 * Validation Middleware
 * Validates request data against schema
 */
export function validateRequest(schema: any) {
  return (data: any): { valid: boolean; errors?: string[] } => {
    const errors: string[] = [];

    for (const [key, rules] of Object.entries(schema)) {
      const value = data[key];
      const fieldRules = rules as any;

      // Required check
      if (fieldRules.required && (value === undefined || value === null)) {
        errors.push(`Field '${key}' is required`);
        continue;
      }

      // Type check
      if (value !== undefined && fieldRules.type) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== fieldRules.type) {
          errors.push(`Field '${key}' must be of type ${fieldRules.type}`);
        }
      }

      // Min/max for numbers
      if (typeof value === 'number') {
        if (fieldRules.min !== undefined && value < fieldRules.min) {
          errors.push(`Field '${key}' must be >= ${fieldRules.min}`);
        }
        if (fieldRules.max !== undefined && value > fieldRules.max) {
          errors.push(`Field '${key}' must be <= ${fieldRules.max}`);
        }
      }

      // Min/max length for strings
      if (typeof value === 'string') {
        if (fieldRules.minLength !== undefined && value.length < fieldRules.minLength) {
          errors.push(`Field '${key}' must be at least ${fieldRules.minLength} characters`);
        }
        if (fieldRules.maxLength !== undefined && value.length > fieldRules.maxLength) {
          errors.push(`Field '${key}' must be at most ${fieldRules.maxLength} characters`);
        }
      }

      // Enum check
      if (fieldRules.enum && !fieldRules.enum.includes(value)) {
        errors.push(`Field '${key}' must be one of: ${fieldRules.enum.join(', ')}`);
      }

      // Pattern check
      if (typeof value === 'string' && fieldRules.pattern) {
        const regex = new RegExp(fieldRules.pattern);
        if (!regex.test(value)) {
          errors.push(`Field '${key}' format is invalid`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  };
}

/**
 * Helper: Get client identifier from request
 */
function getClientId(req: http.IncomingMessage): string {
  // Try to get real IP from proxy headers
  const forwarded = req.headers['x-forwarded-for'] as string;
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = req.headers['x-real-ip'] as string;
  if (realIp) {
    return realIp;
  }

  // Fallback to socket address
  return req.socket.remoteAddress || 'unknown';
}

/**
 * Helper: Get API key from request
 */
function getApiKey(req: http.IncomingMessage): string | null {
  // Check X-API-Key header
  const headerKey = req.headers['x-api-key'] as string;
  if (headerKey) {
    return headerKey;
  }

  // Check Authorization header
  const authHeader = req.headers['authorization'] as string;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check query parameter (less secure, but convenient for testing)
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const queryKey = url.searchParams.get('apiKey');
  if (queryKey) {
    return queryKey;
  }

  return null;
}

/**
 * Helper: Parse form data
 */
function parseFormData(body: string): Record<string, string> {
  const data: Record<string, string> = {};
  const pairs = body.split('&');

  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    if (key) {
      data[decodeURIComponent(key)] = decodeURIComponent(value || '');
    }
  }

  return data;
}
