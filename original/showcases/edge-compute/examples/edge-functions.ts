/**
 * Edge Function Examples
 *
 * Comprehensive examples of edge computing patterns including:
 * - Request/response transformation
 * - Authentication and authorization
 * - Content personalization
 * - Image optimization
 * - API composition
 * - Rate limiting
 * - Geolocation-based routing
 * - Header manipulation
 */

interface EdgeRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: any;
  geo?: {
    country: string;
    region: string;
    city: string;
    latitude: number;
    longitude: number;
  };
  ip: string;
}

interface EdgeResponse {
  status: number;
  headers: Record<string, string>;
  body?: any;
}

type EdgeFunction = (req: EdgeRequest) => Promise<EdgeResponse> | EdgeResponse;

/**
 * Example 1: CORS Headers
 */
const corsMiddleware: EdgeFunction = async (req) => {
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    };
  }

  // Pass through with CORS headers
  return {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
    body: { message: 'CORS enabled' },
  };
};

/**
 * Example 2: JWT Authentication
 */
const jwtAuth: EdgeFunction = async (req) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Missing or invalid authorization header' },
    };
  }

  const token = authHeader.substring(7);

  try {
    // Simplified JWT validation (in production, use proper JWT library)
    const payload = decodeJWT(token);

    if (!payload || payload.exp < Date.now() / 1000) {
      return {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
        body: { error: 'Token expired' },
      };
    }

    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        message: 'Authenticated',
        user: payload.sub,
      },
    };
  } catch (error) {
    return {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Invalid token' },
    };
  }
};

function decodeJWT(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf-8')
    );
    return payload;
  } catch {
    return null;
  }
}

/**
 * Example 3: API Key Validation
 */
const apiKeyAuth: EdgeFunction = async (req) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'API key required' },
    };
  }

  // Validate against a list (in production, check database)
  const validKeys = ['key_123', 'key_456', 'key_789'];

  if (!validKeys.includes(apiKey)) {
    return {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Invalid API key' },
    };
  }

  return {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: { message: 'API key validated', key: apiKey.substring(0, 7) + '...' },
  };
};

/**
 * Example 4: Rate Limiting
 */
class RateLimiter {
  private requests: Map<string, number[]>;
  private limit: number;
  private window: number;

  constructor(limit: number, windowSeconds: number) {
    this.requests = new Map();
    this.limit = limit;
    this.window = windowSeconds * 1000;
  }

  check(identifier: string): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(identifier) || [];

    // Remove old timestamps
    const validTimestamps = timestamps.filter((ts) => now - ts < this.window);

    if (validTimestamps.length >= this.limit) {
      return false;
    }

    validTimestamps.push(now);
    this.requests.set(identifier, validTimestamps);
    return true;
  }

  getRemainingRequests(identifier: string): number {
    const timestamps = this.requests.get(identifier) || [];
    const now = Date.now();
    const validTimestamps = timestamps.filter((ts) => now - ts < this.window);
    return Math.max(0, this.limit - validTimestamps.length);
  }
}

const rateLimitMiddleware = (
  limiter: RateLimiter
): EdgeFunction => async (req) => {
  const identifier = req.ip;

  if (!limiter.check(identifier)) {
    return {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': '0',
        'Retry-After': '60',
      },
      body: { error: 'Rate limit exceeded' },
    };
  }

  const remaining = limiter.getRemainingRequests(identifier);

  return {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'X-RateLimit-Limit': '100',
      'X-RateLimit-Remaining': remaining.toString(),
    },
    body: { message: 'Request allowed', remaining },
  };
};

/**
 * Example 5: Geolocation-based Routing
 */
const geoRouting: EdgeFunction = async (req) => {
  const country = req.geo?.country || 'UNKNOWN';

  // Route to regional endpoints
  const regionEndpoints: Record<string, string> = {
    US: 'https://us.api.example.com',
    GB: 'https://eu.api.example.com',
    DE: 'https://eu.api.example.com',
    FR: 'https://eu.api.example.com',
    JP: 'https://asia.api.example.com',
    CN: 'https://asia.api.example.com',
    AU: 'https://apac.api.example.com',
  };

  const endpoint = regionEndpoints[country] || 'https://global.api.example.com';

  return {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'X-Region': country,
    },
    body: {
      message: 'Routed based on geolocation',
      country,
      endpoint,
    },
  };
};

/**
 * Example 6: Content Personalization
 */
const personalizeContent: EdgeFunction = async (req) => {
  const country = req.geo?.country || 'US';
  const language = req.headers['accept-language']?.split(',')[0] || 'en';

  // Personalize content based on location and language
  const content: Record<string, any> = {
    US: {
      en: { greeting: 'Hello!', currency: 'USD' },
      es: { greeting: '¡Hola!', currency: 'USD' },
    },
    GB: {
      en: { greeting: 'Hello!', currency: 'GBP' },
    },
    FR: {
      fr: { greeting: 'Bonjour!', currency: 'EUR' },
      en: { greeting: 'Hello!', currency: 'EUR' },
    },
    JP: {
      ja: { greeting: 'こんにちは!', currency: 'JPY' },
      en: { greeting: 'Hello!', currency: 'JPY' },
    },
  };

  const langCode = language.substring(0, 2);
  const localized =
    content[country]?.[langCode] ||
    content[country]?.['en'] ||
    content['US']['en'];

  return {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Language': langCode,
      'X-Country': country,
    },
    body: {
      ...localized,
      location: req.geo?.city || 'Unknown',
    },
  };
};

/**
 * Example 7: URL Rewriting
 */
const urlRewrite: EdgeFunction = async (req) => {
  let url = req.url;

  // Rewrite rules
  const rewrites: Array<[RegExp, string]> = [
    [/^\/old-api\/(.*)/, '/api/v2/$1'],
    [/^\/products\/(\d+)/, '/api/products?id=$1'],
    [/^\/users\/([^\/]+)\/profile/, '/api/users/$1'],
  ];

  for (const [pattern, replacement] of rewrites) {
    if (pattern.test(url)) {
      const newUrl = url.replace(pattern, replacement);
      console.log(`Rewrote: ${url} -> ${newUrl}`);
      url = newUrl;
      break;
    }
  }

  return {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'X-Original-URL': req.url,
      'X-Rewritten-URL': url,
    },
    body: { originalUrl: req.url, rewrittenUrl: url },
  };
};

/**
 * Example 8: Image Optimization
 */
const imageOptimization: EdgeFunction = async (req) => {
  const url = new URL(req.url);
  const imagePath = url.pathname;

  // Parse optimization parameters
  const width = parseInt(url.searchParams.get('w') || '0');
  const height = parseInt(url.searchParams.get('h') || '0');
  const quality = parseInt(url.searchParams.get('q') || '80');
  const format = url.searchParams.get('format') || 'auto';

  // Check accept header for WebP support
  const acceptsWebP = req.headers['accept']?.includes('image/webp');
  const acceptsAVIF = req.headers['accept']?.includes('image/avif');

  let optimizedFormat = format;
  if (format === 'auto') {
    optimizedFormat = acceptsAVIF ? 'avif' : acceptsWebP ? 'webp' : 'jpeg';
  }

  return {
    status: 200,
    headers: {
      'Content-Type': `image/${optimizedFormat}`,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Image-Width': width.toString(),
      'X-Image-Height': height.toString(),
      'X-Image-Quality': quality.toString(),
      'X-Image-Format': optimizedFormat,
    },
    body: {
      message: 'Image optimization parameters',
      original: imagePath,
      optimized: {
        width,
        height,
        quality,
        format: optimizedFormat,
      },
    },
  };
};

/**
 * Example 9: API Composition
 */
const apiComposition: EdgeFunction = async (req) => {
  // Compose data from multiple APIs
  const userId = new URL(req.url).searchParams.get('userId');

  if (!userId) {
    return {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'userId required' },
    };
  }

  // Simulate parallel API calls
  const [userProfile, userOrders, userPreferences] = await Promise.all([
    fetchUserProfile(userId),
    fetchUserOrders(userId),
    fetchUserPreferences(userId),
  ]);

  return {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'private, max-age=60',
    },
    body: {
      user: userProfile,
      orders: userOrders,
      preferences: userPreferences,
    },
  };
};

async function fetchUserProfile(userId: string) {
  // Simulate API call
  return { id: userId, name: 'John Doe', email: 'john@example.com' };
}

async function fetchUserOrders(userId: string) {
  // Simulate API call
  return [
    { id: 'order1', total: 99.99 },
    { id: 'order2', total: 149.99 },
  ];
}

async function fetchUserPreferences(userId: string) {
  // Simulate API call
  return { theme: 'dark', language: 'en', notifications: true };
}

/**
 * Example 10: A/B Testing Header Injection
 */
const abTestingHeaders: EdgeFunction = async (req) => {
  // Assign user to A/B test variant based on IP
  const variant = hashString(req.ip) % 2 === 0 ? 'A' : 'B';

  return {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'X-AB-Test-Variant': variant,
      'Set-Cookie': `ab_variant=${variant}; Path=/; Max-Age=86400; SameSite=Lax`,
    },
    body: {
      variant,
      message: `You are in variant ${variant}`,
    },
  };
};

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Example 11: Security Headers
 */
const securityHeaders: EdgeFunction = async (req) => {
  return {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Content-Security-Policy':
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    },
    body: { message: 'Security headers applied' },
  };
};

/**
 * Example 12: Request Logging
 */
const requestLogger: EdgeFunction = async (req) => {
  const startTime = Date.now();

  // Log request details
  const logEntry = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    country: req.geo?.country,
  };

  console.log('Request:', JSON.stringify(logEntry));

  // Simulate request processing
  const response: EdgeResponse = {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: { message: 'Request logged' },
  };

  // Log response
  const duration = Date.now() - startTime;
  console.log('Response:', { status: response.status, duration: `${duration}ms` });

  return response;
};

/**
 * Test all edge functions
 */
async function testEdgeFunctions() {
  console.log('=== Edge Function Examples ===\n');

  const testRequest: EdgeRequest = {
    url: 'https://example.com/api/test',
    method: 'GET',
    headers: {
      'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMTIzIiwiZXhwIjo5OTk5OTk5OTk5fQ.test',
      'x-api-key': 'key_123',
      'accept': 'image/webp,image/apng,image/*',
      'accept-language': 'en-US,en;q=0.9',
    },
    ip: '192.168.1.1',
    geo: {
      country: 'US',
      region: 'CA',
      city: 'San Francisco',
      latitude: 37.7749,
      longitude: -122.4194,
    },
  };

  // Test CORS
  console.log('1. CORS Middleware');
  let result = await corsMiddleware(testRequest);
  console.log('Response:', result.status, result.headers['Access-Control-Allow-Origin']);
  console.log();

  // Test JWT Auth
  console.log('2. JWT Authentication');
  result = await jwtAuth(testRequest);
  console.log('Response:', result.status, result.body);
  console.log();

  // Test API Key
  console.log('3. API Key Validation');
  result = await apiKeyAuth(testRequest);
  console.log('Response:', result.status, result.body);
  console.log();

  // Test Rate Limiting
  console.log('4. Rate Limiting');
  const limiter = new RateLimiter(5, 60);
  const rateLimitFn = rateLimitMiddleware(limiter);
  for (let i = 0; i < 7; i++) {
    result = await rateLimitFn(testRequest);
    console.log(`Request ${i + 1}:`, result.status, result.body);
  }
  console.log();

  // Test Geo Routing
  console.log('5. Geolocation Routing');
  result = await geoRouting(testRequest);
  console.log('Response:', result.body);
  console.log();

  // Test Personalization
  console.log('6. Content Personalization');
  result = await personalizeContent(testRequest);
  console.log('Response:', result.body);
  console.log();

  // Test URL Rewriting
  console.log('7. URL Rewriting');
  const rewriteRequest = { ...testRequest, url: 'https://example.com/old-api/users' };
  result = await urlRewrite(rewriteRequest);
  console.log('Response:', result.body);
  console.log();

  // Test Image Optimization
  console.log('8. Image Optimization');
  const imageRequest = {
    ...testRequest,
    url: 'https://example.com/images/photo.jpg?w=800&h=600&q=85&format=auto',
  };
  result = await imageOptimization(imageRequest);
  console.log('Optimized format:', result.headers['X-Image-Format']);
  console.log();

  // Test API Composition
  console.log('9. API Composition');
  const apiRequest = { ...testRequest, url: 'https://example.com/api/user?userId=123' };
  result = await apiComposition(apiRequest);
  console.log('Composed data:', Object.keys(result.body || {}));
  console.log();

  // Test A/B Testing
  console.log('10. A/B Testing');
  result = await abTestingHeaders(testRequest);
  console.log('Variant:', result.headers['X-AB-Test-Variant']);
  console.log();

  console.log('All edge function examples completed!');
}

if (require.main === module) {
  testEdgeFunctions().catch(console.error);
}

export {
  EdgeRequest,
  EdgeResponse,
  EdgeFunction,
  corsMiddleware,
  jwtAuth,
  apiKeyAuth,
  RateLimiter,
  rateLimitMiddleware,
  geoRouting,
  personalizeContent,
  urlRewrite,
  imageOptimization,
  apiComposition,
  abTestingHeaders,
  securityHeaders,
  requestLogger,
};
