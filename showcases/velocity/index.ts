/**
 * Velocity - Ultra-fast web framework for Bun
 * Outperforming Hono with 1M+ req/sec
 */

// Core exports
export { Velocity, createApp, type VelocityOptions, type Middleware } from './core/app';
export { Context, type Cookie } from './core/context';
export { RadixRouter, type HTTPMethod, type RouteHandler, type Params } from './core/router';

// Middleware exports
export { logger, type LoggerOptions } from './middleware/logger';
export { cors, type CORSOptions } from './middleware/cors';
export { compress, type CompressOptions } from './middleware/compress';
export { rateLimit, type RateLimitOptions } from './middleware/rate-limit';

// Helper exports
export {
  json,
  text,
  html,
  redirect,
  stream,
  sse,
  download,
  noContent,
  error,
  notFound,
  badRequest,
  unauthorized,
  forbidden,
  conflict,
  serverError,
  sseEvent,
  jsonStream,
  ndjson,
} from './helpers/response';

export {
  validate,
  sanitize,
  escapeHtml,
  isEmail,
  isUrl,
  isUuid,
  isIp,
  validateBody,
  validateQuery,
  patterns,
  type ValidationRule,
  type ValidationSchema,
  type ValidationError,
  type ValidationResult,
} from './helpers/validator';
