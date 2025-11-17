/**
 * tRPC Middleware - Middleware Implementation
 *
 * Provides middleware functionality for composing reusable logic.
 */

import { MiddlewareFn, MiddlewareResult, TRPCError } from './init'

/**
 * Middleware class
 */
export class Middleware<TContext, TNewContext = TContext> {
  public readonly _fn: MiddlewareFn<TContext, TNewContext>

  constructor(fn: MiddlewareFn<TContext, TNewContext>) {
    this._fn = fn
  }

  /**
   * Unstable pipe - compose middlewares
   */
  unstable_pipe<TNextContext>(
    next: Middleware<TNewContext, TNextContext>
  ): Middleware<TContext, TNextContext> {
    return new Middleware(async (opts) => {
      const result = await this._fn(opts)

      if (!result.ok) {
        return result as any
      }

      return next._fn({
        ...opts,
        ctx: result.ctx || opts.ctx
      })
    })
  }
}

/**
 * Middleware builder
 */
export class MiddlewareBuilder<TContext> {
  private middlewares: Middleware<any, any>[]

  constructor(middlewares: Middleware<any, any>[] = []) {
    this.middlewares = middlewares
  }

  /**
   * Create middleware
   */
  create<TNewContext = TContext>(
    fn: MiddlewareFn<TContext, TNewContext>
  ): Middleware<TContext, TNewContext> {
    return new Middleware(fn)
  }

  /**
   * Use middleware
   */
  use<TNewContext>(
    middleware: Middleware<TContext, TNewContext>
  ): MiddlewareBuilder<TNewContext> {
    return new MiddlewareBuilder([...this.middlewares, middleware])
  }
}

/**
 * Built-in middleware helpers
 */

/**
 * Logging middleware
 */
export function createLoggingMiddleware<TContext>(): Middleware<TContext, TContext> {
  return new Middleware(async ({ ctx, next, path, type }) => {
    const start = Date.now()
    console.log(`[tRPC] ${type.toUpperCase()} ${path} - Start`)

    const result = await next()

    const duration = Date.now() - start
    console.log(`[tRPC] ${type.toUpperCase()} ${path} - ${result.ok ? 'Success' : 'Error'} (${duration}ms)`)

    return result
  })
}

/**
 * Performance middleware
 */
export function createPerformanceMiddleware<TContext>(
  maxDuration: number = 5000
): Middleware<TContext, TContext> {
  return new Middleware(async ({ ctx, next, path, type }) => {
    const start = Date.now()
    const result = await next()
    const duration = Date.now() - start

    if (duration > maxDuration) {
      console.warn(
        `[tRPC] Slow ${type} detected: ${path} took ${duration}ms (max: ${maxDuration}ms)`
      )
    }

    return result
  })
}

/**
 * Error handling middleware
 */
export function createErrorHandlingMiddleware<TContext>(
  handler: (error: Error) => void
): Middleware<TContext, TContext> {
  return new Middleware(async ({ ctx, next }) => {
    try {
      return await next()
    } catch (error) {
      handler(error as Error)
      throw error
    }
  })
}

/**
 * Caching middleware
 */
export function createCachingMiddleware<TContext>(
  cache: Map<string, any>,
  ttl: number = 60000
): Middleware<TContext, TContext> {
  return new Middleware(async ({ ctx, next, path, input, type }) => {
    // Only cache queries
    if (type !== 'query') {
      return next()
    }

    const cacheKey = `${path}:${JSON.stringify(input)}`
    const cached = cache.get(cacheKey)

    if (cached && cached.expires > Date.now()) {
      return {
        ok: true,
        ctx,
        data: cached.data
      }
    }

    const result = await next()

    if (result.ok && result.data) {
      cache.set(cacheKey, {
        data: result.data,
        expires: Date.now() + ttl
      })
    }

    return result
  })
}

/**
 * Rate limiting middleware
 */
export function createRateLimitMiddleware<TContext>(
  limit: number,
  window: number = 60000
): Middleware<TContext, TContext> {
  const requests = new Map<string, number[]>()

  return new Middleware(async ({ ctx, next, path }) => {
    const key = `${path}`
    const now = Date.now()
    const windowStart = now - window

    // Get requests within window
    let requestTimes = requests.get(key) || []
    requestTimes = requestTimes.filter(time => time > windowStart)

    if (requestTimes.length >= limit) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: `Rate limit exceeded: ${limit} requests per ${window}ms`
      })
    }

    requestTimes.push(now)
    requests.set(key, requestTimes)

    return next()
  })
}

/**
 * Authentication middleware
 */
export function createAuthMiddleware<TContext extends { user?: any }>(
  authenticate: (ctx: TContext) => Promise<any> | any
): Middleware<TContext, TContext & { user: any }> {
  return new Middleware(async ({ ctx, next }) => {
    const user = await authenticate(ctx)

    if (!user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Not authenticated'
      })
    }

    return next({
      ctx: {
        ...ctx,
        user
      }
    })
  })
}

/**
 * Authorization middleware
 */
export function createAuthorizationMiddleware<TContext extends { user?: any }>(
  authorize: (ctx: TContext) => Promise<boolean> | boolean,
  message: string = 'Forbidden'
): Middleware<TContext, TContext> {
  return new Middleware(async ({ ctx, next }) => {
    const allowed = await authorize(ctx)

    if (!allowed) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message
      })
    }

    return next()
  })
}

/**
 * Validation middleware
 */
export function createValidationMiddleware<TContext>(
  validate: (input: any) => Promise<boolean> | boolean
): Middleware<TContext, TContext> {
  return new Middleware(async ({ ctx, next, input }) => {
    const isValid = await validate(input)

    if (!isValid) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid input'
      })
    }

    return next()
  })
}

/**
 * Transformation middleware
 */
export function createTransformMiddleware<TContext>(
  transform: (data: any) => any
): Middleware<TContext, TContext> {
  return new Middleware(async ({ ctx, next }) => {
    const result = await next()

    if (result.ok && result.data) {
      result.data = transform(result.data)
    }

    return result
  })
}
