import type { Request, Response, NextFunction } from 'express';
import type { Logger } from 'pino';

export function requestLogger(logger: Logger) {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      logger.info({
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        userAgent: req.get('user-agent')
      });
    });

    next();
  };
}

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || 'unknown';
  const window = parseInt(process.env.RATE_LIMIT_WINDOW || '60000');
  const max = parseInt(process.env.RATE_LIMIT_MAX || '1000');

  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + window });
    next();
    return;
  }

  if (record.count >= max) {
    res.status(429).json({
      status: 'error',
      message: 'Too many requests',
      retryAfter: Math.ceil((record.resetTime - now) / 1000)
    });
    return;
  }

  record.count++;
  next();
}

export function errorHandler(logger: Logger) {
  return (err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error({
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method
    });

    if (err.name === 'ZodError') {
      res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors: err.errors
      });
      return;
    }

    res.status(500).json({
      status: 'error',
      message: err.message || 'Internal server error'
    });
  };
}
