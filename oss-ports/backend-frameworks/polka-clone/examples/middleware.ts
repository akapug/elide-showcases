/**
 * Middleware Example for Polka Clone
 *
 * Demonstrates various middleware patterns: logging, CORS, body parsing,
 * authentication, rate limiting, and error handling
 */

import polka from '../src/polka.ts';

const app = polka();

// ==================== CORS MIDDLEWARE ====================

function cors(options: any = {}) {
  const {
    origin = '*',
    methods = 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders = '*',
    credentials = false
  } = options;

  return (req: any, res: any, next: any) => {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', methods);
    res.setHeader('Access-Control-Allow-Headers', allowedHeaders);

    if (credentials) {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    // Handle preflight
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    next && next();
  };
}

// ==================== LOGGING MIDDLEWARE ====================

function logger() {
  return (req: any, res: any, next: any) => {
    const start = Date.now();

    // Capture original end method
    const originalEnd = res.end;

    res.end = function(...args: any[]) {
      const duration = Date.now() - start;
      const timestamp = new Date().toISOString();

      console.log(
        `[${timestamp}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`
      );

      originalEnd.apply(res, args);
    };

    next && next();
  };
}

// ==================== AUTHENTICATION MIDDLEWARE ====================

function authenticate() {
  return (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.statusCode = 401;
      res.json({
        error: 'Unauthorized',
        message: 'Authentication token required'
      });
      return;
    }

    const token = authHeader.substring(7);

    // Simple token validation (in production, use JWT or similar)
    if (token !== 'valid-token') {
      res.statusCode = 401;
      res.json({
        error: 'Unauthorized',
        message: 'Invalid token'
      });
      return;
    }

    // Attach user to request
    req.user = {
      id: 1,
      username: 'testuser',
      role: 'user'
    };

    next && next();
  };
}

// ==================== RATE LIMITING MIDDLEWARE ====================

function rateLimit(options: any = {}) {
  const {
    windowMs = 60000, // 1 minute
    max = 100 // max requests per window
  } = options;

  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: any, res: any, next: any) => {
    const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
    const now = Date.now();

    let record = requests.get(ip);

    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + windowMs };
      requests.set(ip, record);
    }

    record.count++;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
    res.setHeader('X-RateLimit-Reset', record.resetTime);

    if (record.count > max) {
      res.statusCode = 429;
      res.json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded',
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      });
      return;
    }

    next && next();
  };
}

// ==================== COMPRESSION MIDDLEWARE ====================

function compress() {
  return (req: any, res: any, next: any) => {
    const acceptEncoding = req.headers['accept-encoding'] || '';

    // Capture original send method
    const originalSend = res.send;

    res.send = function(data: any) {
      // In production, use zlib for actual compression
      if (acceptEncoding.includes('gzip')) {
        res.setHeader('Content-Encoding', 'gzip');
      } else if (acceptEncoding.includes('deflate')) {
        res.setHeader('Content-Encoding', 'deflate');
      }

      originalSend.call(res, data);
    };

    next && next();
  };
}

// ==================== ERROR HANDLING MIDDLEWARE ====================

function errorHandler() {
  return (err: any, req: any, res: any, next: any) => {
    console.error('Error:', err);

    const statusCode = err.statusCode || err.status || 500;
    const message = err.expose ? err.message : 'Internal Server Error';

    res.statusCode = statusCode;
    res.json({
      error: true,
      status: statusCode,
      message,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
  };
}

// ==================== REQUEST ID MIDDLEWARE ====================

function requestId() {
  return (req: any, res: any, next: any) => {
    const id = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    req.id = id;
    res.setHeader('X-Request-ID', id);

    next && next();
  };
}

// ==================== TIMING MIDDLEWARE ====================

function timing() {
  return (req: any, res: any, next: any) => {
    const start = process.hrtime.bigint();

    const originalEnd = res.end;

    res.end = function(...args: any[]) {
      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1000000; // Convert to milliseconds

      res.setHeader('X-Response-Time', `${duration.toFixed(2)}ms`);

      originalEnd.apply(res, args);
    };

    next && next();
  };
}

// ==================== SECURITY HEADERS MIDDLEWARE ====================

function securityHeaders() {
  return (req: any, res: any, next: any) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Content-Security-Policy', "default-src 'self'");

    next && next();
  };
}

// ==================== CACHE MIDDLEWARE ====================

function cache(options: any = {}) {
  const { maxAge = 3600 } = options;
  const cacheStore = new Map<string, { data: any; expires: number }>();

  return (req: any, res: any, next: any) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      next && next();
      return;
    }

    const cacheKey = req.path + (req.query ? '?' + new URLSearchParams(req.query).toString() : '');
    const cached = cacheStore.get(cacheKey);

    if (cached && Date.now() < cached.expires) {
      res.setHeader('X-Cache', 'HIT');
      res.send(cached.data);
      return;
    }

    // Capture original send
    const originalSend = res.send;

    res.send = function(data: any) {
      cacheStore.set(cacheKey, {
        data,
        expires: Date.now() + (maxAge * 1000)
      });

      res.setHeader('X-Cache', 'MISS');
      res.setHeader('Cache-Control', `public, max-age=${maxAge}`);

      originalSend.call(res, data);
    };

    next && next();
  };
}

// ==================== APPLY MIDDLEWARE ====================

// Global middleware
app.use(requestId());
app.use(timing());
app.use(logger());
app.use(cors({ credentials: true }));
app.use(securityHeaders());
app.use(compress());
app.use(rateLimit({ max: 100, windowMs: 60000 }));

// ==================== ROUTES ====================

// Public routes
app.get('/', (req, res) => {
  res.json({
    message: 'Middleware Demo API',
    requestId: req.id,
    endpoints: [
      'GET /',
      'GET /public',
      'GET /protected (requires auth)',
      'GET /cached (5 min cache)',
      'GET /error (test error handling)'
    ]
  });
});

app.get('/public', (req, res) => {
  res.json({
    message: 'This is a public endpoint',
    timestamp: new Date().toISOString(),
    user: req.user || null
  });
});

// Protected route with authentication middleware
app.get('/protected', authenticate(), (req, res) => {
  res.json({
    message: 'This is a protected endpoint',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// Cached route
app.get('/cached', cache({ maxAge: 300 }), (req, res) => {
  res.json({
    message: 'This response is cached for 5 minutes',
    timestamp: new Date().toISOString(),
    random: Math.random()
  });
});

// Error route for testing error handler
app.get('/error', (req, res) => {
  throw new Error('Test error');
});

// Route with custom middleware
app.get('/custom',
  (req: any, res: any, next: any) => {
    req.customData = 'Added by middleware';
    next && next();
  },
  (req, res) => {
    res.json({
      message: 'Route with custom middleware',
      customData: req.customData
    });
  }
);

// Multiple middleware example
app.post('/upload',
  authenticate(),
  rateLimit({ max: 10, windowMs: 60000 }),
  (req, res) => {
    res.json({
      message: 'File upload endpoint',
      user: req.user,
      note: 'Limited to 10 uploads per minute'
    });
  }
);

// ==================== START SERVER ====================

app.listen(3700, () => {
  console.log('\n🚀 Polka Middleware Demo listening on port 3700\n');
  console.log('Middleware Stack:');
  console.log('  1. Request ID - Unique ID for each request');
  console.log('  2. Timing - Measures response time');
  console.log('  3. Logger - Logs all requests');
  console.log('  4. CORS - Handles cross-origin requests');
  console.log('  5. Security Headers - Sets security headers');
  console.log('  6. Compression - Compresses responses');
  console.log('  7. Rate Limiting - 100 requests/minute\n');
  console.log('Endpoints:');
  console.log('  GET  / - API info');
  console.log('  GET  /public - Public endpoint');
  console.log('  GET  /protected - Protected endpoint (requires Bearer token)');
  console.log('  GET  /cached - Cached endpoint (5 min cache)');
  console.log('  GET  /error - Test error handling');
  console.log('  GET  /custom - Custom middleware example');
  console.log('  POST /upload - Upload with auth + rate limit\n');
  console.log('Usage:');
  console.log('  curl http://localhost:3700/');
  console.log('  curl http://localhost:3700/public');
  console.log('  curl -H "Authorization: Bearer valid-token" http://localhost:3700/protected\n');
});
