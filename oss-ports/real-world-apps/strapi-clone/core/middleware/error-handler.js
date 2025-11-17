/**
 * Error Handler Middleware
 * Centralized error handling
 */

import { logger } from '../logger.js';

export function errorHandler(err, req, res, next) {
  const errorLogger = logger.child('ErrorHandler');

  // Log error
  errorLogger.error('Request error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    user: req.user?.email,
  });

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // Determine error name
  const errorName = err.name || 'InternalError';

  // Build error response
  const errorResponse = {
    error: {
      status: statusCode,
      name: errorName,
      message: err.message || 'An unexpected error occurred',
    },
  };

  // Add details in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.details = {
      stack: err.stack,
      ...err.details,
    };
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
}

/**
 * Not Found Handler
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    error: {
      status: 404,
      name: 'NotFoundError',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
}

/**
 * Async Error Wrapper
 * Wraps async route handlers to catch errors
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
