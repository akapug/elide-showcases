/**
 * tRPC Initialization - Core Server Setup
 *
 * Provides the main tRPC initialization and configuration.
 */

import { Router, RouterDef } from './router'
import { Procedure, ProcedureBuilder } from './procedure'
import { Middleware, MiddlewareBuilder } from './middleware'

export interface TRPCConfig {
  transformer?: DataTransformer
  errorFormatter?: ErrorFormatter
  isDev?: boolean
  allowOutsideOfServer?: boolean
}

export interface DataTransformer {
  serialize(object: any): any
  deserialize(object: any): any
}

export interface ErrorFormatter {
  (opts: { shape: ErrorShape; error: TRPCError }): any
}

export interface ErrorShape {
  message: string
  code: string
  data?: any
}

/**
 * tRPC Error
 */
export class TRPCError extends Error {
  public readonly code: TRPC_ERROR_CODE
  public readonly cause?: Error

  constructor(opts: { code: TRPC_ERROR_CODE; message?: string; cause?: Error }) {
    super(opts.message || opts.code)
    this.code = opts.code
    this.cause = opts.cause
    this.name = 'TRPCError'
  }
}

export type TRPC_ERROR_CODE =
  | 'PARSE_ERROR'
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'METHOD_NOT_SUPPORTED'
  | 'TIMEOUT'
  | 'CONFLICT'
  | 'PRECONDITION_FAILED'
  | 'PAYLOAD_TOO_LARGE'
  | 'UNPROCESSABLE_CONTENT'
  | 'TOO_MANY_REQUESTS'
  | 'CLIENT_CLOSED_REQUEST'
  | 'INTERNAL_SERVER_ERROR'

/**
 * tRPC Builder - Main initialization class
 */
export class TRPCBuilder<TContext = {}> {
  private config: TRPCConfig

  constructor(config: TRPCConfig = {}) {
    this.config = config
  }

  /**
   * Create context-aware builder
   */
  context<TNewContext>(): TRPCBuilder<TNewContext> {
    return new TRPCBuilder<TNewContext>(this.config)
  }

  /**
   * Create tRPC instance
   */
  create() {
    return {
      /**
       * Create a router
       */
      router: <TRouterDef extends RouterDef>(
        routerDef: TRouterDef
      ): Router<TContext, TRouterDef> => {
        return new Router<TContext, TRouterDef>(routerDef, this.config)
      },

      /**
       * Create a procedure
       */
      procedure: new ProcedureBuilder<TContext, unknown, unknown>(
        [],
        this.config
      ),

      /**
       * Create middleware
       */
      middleware: <TNewContext = TContext>(
        fn: MiddlewareFn<TContext, TNewContext>
      ): Middleware<TContext, TNewContext> => {
        return new Middleware(fn)
      },

      /**
       * Merge routers
       */
      mergeRouters: <T extends Record<string, Router<any, any>>>(
        routers: T
      ): Router<TContext, MergeRouters<T>> => {
        const merged: any = {}

        for (const [key, router] of Object.entries(routers)) {
          merged[key] = router._def
        }

        return new Router(merged, this.config)
      }
    }
  }
}

/**
 * Middleware function type
 */
export type MiddlewareFn<TContext, TNewContext = TContext> = (opts: {
  ctx: TContext
  next: (opts?: { ctx?: any }) => Promise<MiddlewareResult<any>>
  path: string
  type: ProcedureType
  input?: unknown
}) => Promise<MiddlewareResult<TNewContext>>

export interface MiddlewareResult<TContext> {
  ok: boolean
  ctx?: TContext
  data?: any
  error?: TRPCError
}

export type ProcedureType = 'query' | 'mutation' | 'subscription'

/**
 * Type utilities
 */
type MergeRouters<T extends Record<string, Router<any, any>>> = {
  [K in keyof T]: T[K] extends Router<any, infer TDef> ? TDef : never
}

/**
 * Initialize tRPC
 */
export const initTRPC = new TRPCBuilder()

/**
 * Create tRPC with context
 */
export function createTRPCContext<TContext>(): TRPCBuilder<TContext> {
  return new TRPCBuilder<TContext>()
}

/**
 * HTTP status codes for errors
 */
export const TRPC_ERROR_CODES_BY_KEY: Record<TRPC_ERROR_CODE, number> = {
  PARSE_ERROR: 400,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_SUPPORTED: 405,
  TIMEOUT: 408,
  CONFLICT: 409,
  PRECONDITION_FAILED: 412,
  PAYLOAD_TOO_LARGE: 413,
  UNPROCESSABLE_CONTENT: 422,
  TOO_MANY_REQUESTS: 429,
  CLIENT_CLOSED_REQUEST: 499,
  INTERNAL_SERVER_ERROR: 500
}

/**
 * Get HTTP status from error code
 */
export function getHTTPStatusFromError(error: TRPCError): number {
  return TRPC_ERROR_CODES_BY_KEY[error.code] || 500
}

/**
 * Format error
 */
export function formatError(error: TRPCError, config: TRPCConfig): ErrorShape {
  const shape: ErrorShape = {
    message: error.message,
    code: error.code,
    data: {
      code: error.code,
      httpStatus: getHTTPStatusFromError(error)
    }
  }

  if (config.isDev && error.cause) {
    shape.data = {
      ...shape.data,
      stack: error.cause.stack,
      cause: error.cause.message
    }
  }

  if (config.errorFormatter) {
    return config.errorFormatter({ shape, error })
  }

  return shape
}

/**
 * Create caller - Execute procedures programmatically
 */
export function createCallerFactory<TRouter extends Router<any, any>>() {
  return function createCaller(
    router: TRouter,
    ctx: any
  ): CallerType<TRouter> {
    const caller: any = {}

    for (const [key, value] of Object.entries(router._def)) {
      if (value instanceof Procedure) {
        caller[key] = {
          query: (input: any) => value._call({ ctx, input, type: 'query' }),
          mutate: (input: any) => value._call({ ctx, input, type: 'mutation' })
        }
      } else if (value instanceof Router) {
        caller[key] = createCaller(value, ctx)
      }
    }

    return caller
  }
}

type CallerType<TRouter> = TRouter extends Router<any, infer TDef>
  ? {
      [K in keyof TDef]: TDef[K] extends Procedure<any, any, any>
        ? {
            query: (input: any) => Promise<any>
            mutate: (input: any) => Promise<any>
          }
        : TDef[K] extends Router<any, any>
        ? CallerType<TDef[K]>
        : never
    }
  : never
