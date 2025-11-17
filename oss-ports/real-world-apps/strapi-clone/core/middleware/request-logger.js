/**
 * Request Logger Middleware
 * Logs HTTP requests
 */

import { logger } from '../logger.js';

export function requestLogger(req, res, next) {
  const start = Date.now();
  const requestLogger = logger.child('HTTP');

  // Log request
  requestLogger.info(`→ ${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
    userAgent: req.headers['user-agent'],
  });

  // Override end to log response
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - start;

    requestLogger.info(`← ${req.method} ${req.path} ${res.statusCode} ${duration}ms`, {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
    });

    return originalEnd.apply(this, args);
  };

  next();
}
