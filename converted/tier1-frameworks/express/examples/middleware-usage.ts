/**
 * Middleware Usage Example
 *
 * Demonstrates various middleware patterns in Express
 */

import express from '../src/index';
import { cors, compression } from '../src/middleware';

const app = express();

// ===================================================================
// Built-in Middleware
// ===================================================================

// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// Enable compression
app.use(compression({
  threshold: 1024,
  level: 6
}));

// ===================================================================
// Custom Middleware
// ===================================================================

// Logger middleware
app.use((req, res, next) => {
  const start = Date.now();

  // Log when request completes
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });

  next();
});

// Request ID middleware
app.use((req, res, next) => {
  const requestId = Math.random().toString(36).substring(7);
  (req as any).id = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
});

// Timing middleware
app.use((req, res, next) => {
  (req as any).startTime = Date.now();
  next();
});

// ===================================================================
// Route-specific Middleware
// ===================================================================

// Authentication middleware
const requireAuth = (req: any, res: any, next: any) => {
  const token = req.get('Authorization');

  if (!token || !token.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid token' });
  }

  // In production, validate the token properly
  req.user = {
    id: 1,
    name: 'Test User'
  };

  next();
};

// Validation middleware factory
const validateBody = (schema: any) => {
  return (req: any, res: any, next: any) => {
    const errors: string[] = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];
      const fieldRules = rules as any;

      if (fieldRules.required && !value) {
        errors.push(`${field} is required`);
      }

      if (fieldRules.type && value && typeof value !== fieldRules.type) {
        errors.push(`${field} must be a ${fieldRules.type}`);
      }

      if (fieldRules.min && value && value.length < fieldRules.min) {
        errors.push(`${field} must be at least ${fieldRules.min} characters`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    next();
  };
};

// Rate limiting middleware (simple version)
const rateLimits = new Map<string, { count: number; resetAt: number }>();

const rateLimit = (maxRequests: number, windowMs: number) => {
  return (req: any, res: any, next: any) => {
    const ip = req.ip || 'unknown';
    const now = Date.now();
    const limit = rateLimits.get(ip);

    if (!limit || now > limit.resetAt) {
      rateLimits.set(ip, {
        count: 1,
        resetAt: now + windowMs
      });
      return next();
    }

    if (limit.count >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((limit.resetAt - now) / 1000)
      });
    }

    limit.count++;
    next();
  };
};

// ===================================================================
// Routes
// ===================================================================

// Public route
app.get('/', (req, res) => {
  res.json({
    message: 'Middleware Example API',
    requestId: (req as any).id
  });
});

// Route with validation
app.post('/users',
  validateBody({
    name: { required: true, type: 'string', min: 2 },
    email: { required: true, type: 'string' }
  }),
  (req, res) => {
    res.status(201).json({
      message: 'User created',
      user: req.body,
      requestId: (req as any).id
    });
  }
);

// Protected route
app.get('/profile', requireAuth, (req, res) => {
  res.json({
    user: (req as any).user,
    requestId: (req as any).id
  });
});

// Rate limited route
app.get('/limited', rateLimit(5, 60000), (req, res) => {
  res.json({
    message: 'Limited to 5 requests per minute',
    requestId: (req as any).id
  });
});

// Route with multiple middleware
app.post('/secure-action',
  requireAuth,
  validateBody({ action: { required: true, type: 'string' } }),
  rateLimit(10, 60000),
  (req, res) => {
    res.json({
      message: 'Action executed',
      action: req.body.action,
      user: (req as any).user,
      requestId: (req as any).id
    });
  }
);

// Timing route
app.get('/timing', (req, res) => {
  const duration = Date.now() - (req as any).startTime;
  res.json({
    message: 'Request timing',
    processingTime: `${duration}ms`,
    requestId: (req as any).id
  });
});

// ===================================================================
// Error Handling Middleware
// ===================================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    requestId: (req as any).id
  });
});

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Error:', err);

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    requestId: req.id,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ===================================================================
// Start Server
// ===================================================================

const PORT = 3003;
app.listen(PORT, () => {
  console.log(`\n✓ Middleware example running on http://localhost:${PORT}`);
  console.log('\nTry these commands:');
  console.log(`  curl http://localhost:${PORT}/`);
  console.log(`  curl -X POST http://localhost:${PORT}/users -H "Content-Type: application/json" -d '{"name":"John","email":"john@example.com"}'`);
  console.log(`  curl http://localhost:${PORT}/profile -H "Authorization: Bearer test"`);
  console.log(`  curl http://localhost:${PORT}/limited`);
  console.log(`  curl http://localhost:${PORT}/timing`);
  console.log('');
});
