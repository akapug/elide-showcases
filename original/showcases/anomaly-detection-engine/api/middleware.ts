/**
 * Express middleware for the anomaly detection API.
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import pino from 'pino';

// Logger
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname'
    }
  } : undefined
});

/**
 * Request logging middleware.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
      ip: req.ip
    });
  });

  next();
}

/**
 * Error handling middleware.
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error({
    error: err.message,
    stack: err.stack,
    path: req.path
  });

  res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    timestamp: Date.now()
  });
}

/**
 * Rate limiting middleware.
 */
export const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '60000'),
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  message: {
    status: 'error',
    message: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Request validation middleware.
 */
export function validateRequest(schema: {
  body?: any;
  query?: any;
  params?: any;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schema.body) {
        schema.body.parse(req.body);
      }
      if (schema.query) {
        schema.query.parse(req.query);
      }
      if (schema.params) {
        schema.params.parse(req.params);
      }
      next();
    } catch (error: any) {
      res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: error.errors || [error.message]
      });
    }
  };
}

/**
 * Request timeout middleware.
 */
export function requestTimeout(timeoutMs: number = 30000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          status: 'error',
          message: 'Request timeout',
          timestamp: Date.now()
        });
      }
    }, timeoutMs);

    res.on('finish', () => {
      clearTimeout(timeout);
    });

    next();
  };
}

/**
 * CORS configuration.
 */
export const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

/**
 * Health check response.
 */
export function healthCheck(req: Request, res: Response) {
  res.json({
    status: 'healthy',
    timestamp: Date.now(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0'
  });
}

/**
 * Metrics middleware.
 */
export class MetricsCollector {
  private requests = new Map<string, number>();
  private latencies = new Map<string, number[]>();
  private errors = new Map<string, number>();

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();
      const route = `${req.method} ${req.path}`;

      res.on('finish', () => {
        const latency = Date.now() - start;

        // Count requests
        this.requests.set(route, (this.requests.get(route) || 0) + 1);

        // Track latencies
        const latencies = this.latencies.get(route) || [];
        latencies.push(latency);
        if (latencies.length > 1000) latencies.shift();
        this.latencies.set(route, latencies);

        // Count errors
        if (res.statusCode >= 400) {
          this.errors.set(route, (this.errors.get(route) || 0) + 1);
        }
      });

      next();
    };
  }

  getMetrics() {
    const metrics: any = {
      requests: {},
      latencies: {},
      errors: {}
    };

    for (const [route, count] of this.requests.entries()) {
      metrics.requests[route] = count;

      const latencies = this.latencies.get(route) || [];
      if (latencies.length > 0) {
        metrics.latencies[route] = {
          mean: latencies.reduce((a, b) => a + b, 0) / latencies.length,
          min: Math.min(...latencies),
          max: Math.max(...latencies),
          p50: this.percentile(latencies, 0.5),
          p95: this.percentile(latencies, 0.95),
          p99: this.percentile(latencies, 0.99)
        };
      }

      const errors = this.errors.get(route) || 0;
      if (errors > 0) {
        metrics.errors[route] = errors;
      }
    }

    return metrics;
  }

  reset() {
    this.requests.clear();
    this.latencies.clear();
    this.errors.clear();
  }

  private percentile(values: number[], p: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[index];
  }
}
