/**
 * Production-Ready API Example
 *
 * Demonstrates best practices for production Express applications:
 * - Proper error handling
 * - Request validation
 * - Security middleware
 * - Structured logging
 * - Health checks
 * - Graceful shutdown
 */

import express from '../src/index';
import { cors, compression } from '../src/middleware';

const app = express();

// ===================================================================
// Configuration
// ===================================================================

const CONFIG = {
  port: parseInt(process.env.PORT || '3004'),
  env: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info'
};

const isDevelopment = CONFIG.env === 'development';

// ===================================================================
// Middleware Stack
// ===================================================================

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// CORS
app.use(cors({
  origin: isDevelopment ? '*' : process.env.ALLOWED_ORIGINS?.split(',') || [],
  credentials: true
}));

// Compression
app.use(compression({ threshold: 1024 }));

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  (req as any).id = requestId;
  (req as any).startTime = start;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      timestamp: new Date().toISOString(),
      requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    };

    if (res.statusCode >= 400) {
      console.error('Request error:', JSON.stringify(log));
    } else {
      console.log('Request:', JSON.stringify(log));
    }
  });

  next();
});

// ===================================================================
// Health & Monitoring
// ===================================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      unit: 'MB'
    },
    env: CONFIG.env
  });
});

app.get('/health/ready', (req, res) => {
  // Check if app is ready to serve requests
  // In production, check database connections, external services, etc.
  res.json({
    ready: true,
    timestamp: new Date().toISOString()
  });
});

app.get('/health/live', (req, res) => {
  // Liveness check for orchestrators like Kubernetes
  res.json({
    alive: true,
    timestamp: new Date().toISOString()
  });
});

// ===================================================================
// API Routes
// ===================================================================

// API version prefix
const apiRouter = express.Router();

// Input validation helper
const validate = (schema: any) => (req: any, res: any, next: any) => {
  const errors: string[] = [];

  for (const [field, rules] of Object.entries(schema)) {
    const value = req.body[field];
    const r = rules as any;

    if (r.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`);
      continue;
    }

    if (value !== undefined && value !== null) {
      if (r.type && typeof value !== r.type) {
        errors.push(`${field} must be a ${r.type}`);
      }

      if (r.min !== undefined && value < r.min) {
        errors.push(`${field} must be at least ${r.min}`);
      }

      if (r.max !== undefined && value > r.max) {
        errors.push(`${field} must be at most ${r.max}`);
      }

      if (r.pattern && !r.pattern.test(value)) {
        errors.push(`${field} has invalid format`);
      }
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      errors,
      requestId: (req as any).id
    });
  }

  next();
};

// Example API endpoints
apiRouter.get('/status', (req, res) => {
  res.json({
    api: 'v1',
    status: 'operational',
    timestamp: new Date().toISOString()
  });
});

apiRouter.post('/echo',
  validate({
    message: { required: true, type: 'string' }
  }),
  (req, res) => {
    res.json({
      echo: req.body.message,
      timestamp: new Date().toISOString(),
      requestId: (req as any).id
    });
  }
);

apiRouter.post('/calculate',
  validate({
    operation: { required: true, type: 'string', pattern: /^(add|subtract|multiply|divide)$/ },
    a: { required: true, type: 'number' },
    b: { required: true, type: 'number' }
  }),
  (req, res) => {
    const { operation, a, b } = req.body;
    let result: number;

    switch (operation) {
      case 'add': result = a + b; break;
      case 'subtract': result = a - b; break;
      case 'multiply': result = a * b; break;
      case 'divide':
        if (b === 0) {
          return res.status(400).json({ error: 'Division by zero' });
        }
        result = a / b;
        break;
      default:
        return res.status(400).json({ error: 'Invalid operation' });
    }

    res.json({
      operation,
      operands: [a, b],
      result,
      requestId: (req as any).id
    });
  }
);

// Mount API router
app.use('/api/v1', apiRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Production API',
    version: '1.0.0',
    environment: CONFIG.env,
    endpoints: {
      '/health': 'Health check',
      '/health/ready': 'Readiness probe',
      '/health/live': 'Liveness probe',
      '/api/v1/status': 'API status',
      '/api/v1/echo': 'Echo endpoint',
      '/api/v1/calculate': 'Calculator'
    }
  });
});

// ===================================================================
// Error Handling
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
  const statusCode = err.status || err.statusCode || 500;

  console.error('Application error:', {
    requestId: req.id,
    error: err.message,
    stack: err.stack
  });

  res.status(statusCode).json({
    error: err.message || 'Internal server error',
    requestId: req.id,
    ...(isDevelopment && {
      stack: err.stack,
      details: err
    })
  });
});

// ===================================================================
// Server Lifecycle
// ===================================================================

const server = app.listen(CONFIG.port, () => {
  console.log(`\n✓ Production API started`);
  console.log(`  Environment: ${CONFIG.env}`);
  console.log(`  Port: ${CONFIG.port}`);
  console.log(`  URL: http://localhost:${CONFIG.port}`);
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\nSIGTERM received, shutting down gracefully...');

  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');

  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
