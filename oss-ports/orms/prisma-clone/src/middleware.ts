/**
 * Middleware system
 */

import { Middleware, QueryEvent } from './types';

/**
 * Create logging middleware
 */
export function createLoggingMiddleware(options: {
  logQueries?: boolean;
  logResults?: boolean;
  logDuration?: boolean;
}): Middleware {
  return async (params, next) => {
    const startTime = Date.now();

    if (options.logQueries) {
      console.log(`[Prisma] ${params.model}.${params.action}`, params.args);
    }

    const result = await next();
    const duration = Date.now() - startTime;

    if (options.logDuration) {
      console.log(`[Prisma] Query took ${duration}ms`);
    }

    if (options.logResults) {
      console.log('[Prisma] Result:', result);
    }

    return result;
  };
}

/**
 * Create timing middleware
 */
export function createTimingMiddleware(): Middleware {
  const timings: Record<string, number[]> = {};

  return async (params, next) => {
    const startTime = Date.now();
    const result = await next();
    const duration = Date.now() - startTime;

    const key = `${params.model}.${params.action}`;
    if (!timings[key]) {
      timings[key] = [];
    }
    timings[key].push(duration);

    return result;
  };
}

/**
 * Create caching middleware
 */
export function createCachingMiddleware(options: {
  ttl?: number;
  maxSize?: number;
}): Middleware {
  const cache = new Map<string, { data: any; expires: number }>();
  const ttl = options.ttl || 60000; // 1 minute default
  const maxSize = options.maxSize || 1000;

  return async (params, next) => {
    // Only cache read operations
    if (!['findUnique', 'findFirst', 'findMany'].includes(params.action)) {
      return next();
    }

    const cacheKey = JSON.stringify({ model: params.model, action: params.action, args: params.args });
    const cached = cache.get(cacheKey);

    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    const result = await next();

    // Add to cache
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    cache.set(cacheKey, {
      data: result,
      expires: Date.now() + ttl
    });

    return result;
  };
}

/**
 * Create validation middleware
 */
export function createValidationMiddleware(
  validators: Record<string, (data: any) => void>
): Middleware {
  return async (params, next) => {
    const validator = validators[params.model];

    if (validator && params.action in ['create', 'update', 'upsert']) {
      validator(params.args.data);
    }

    return next();
  };
}

/**
 * Create soft delete middleware
 */
export function createSoftDeleteMiddleware(options: {
  field?: string;
  models?: string[];
}): Middleware {
  const field = options.field || 'deletedAt';
  const models = options.models || [];

  return async (params, next) => {
    if (models.length > 0 && !models.includes(params.model)) {
      return next();
    }

    // Convert delete to update with deletedAt
    if (params.action === 'delete') {
      params.action = 'update';
      params.args.data = { [field]: new Date() };
    } else if (params.action === 'deleteMany') {
      params.action = 'updateMany';
      params.args.data = { [field]: new Date() };
    }

    // Filter out soft-deleted records in find operations
    if (params.action.startsWith('find')) {
      params.args.where = {
        ...params.args.where,
        [field]: null
      };
    }

    return next();
  };
}

/**
 * Create audit middleware
 */
export function createAuditMiddleware(options: {
  userIdField?: string;
  createdByField?: string;
  updatedByField?: string;
  getCurrentUserId: () => string | number;
}): Middleware {
  return async (params, next) => {
    const userId = options.getCurrentUserId();

    if (params.action === 'create' && options.createdByField) {
      params.args.data[options.createdByField] = userId;
    }

    if (params.action in ['update', 'upsert'] && options.updatedByField) {
      params.args.data[options.updatedByField] = userId;
    }

    return next();
  };
}
