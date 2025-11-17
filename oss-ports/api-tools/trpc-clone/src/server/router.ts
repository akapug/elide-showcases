/**
 * tRPC Router - Router Implementation
 *
 * Provides router functionality for organizing procedures.
 */

import { Procedure } from './procedure'
import { TRPCConfig, TRPCError } from './init'

export type RouterDef = Record<string, Procedure<any, any, any> | Router<any, any>>

/**
 * Router class
 */
export class Router<TContext, TRouterDef extends RouterDef> {
  public readonly _def: TRouterDef
  private config: TRPCConfig

  constructor(def: TRouterDef, config: TRPCConfig) {
    this._def = def
    this.config = config
  }

  /**
   * Get procedure or router by path
   */
  getProcedure(path: string[]): Procedure<any, any, any> | null {
    let current: any = this._def

    for (const segment of path) {
      if (!current[segment]) {
        return null
      }

      current = current[segment]

      if (current instanceof Router) {
        current = current._def
      }
    }

    return current instanceof Procedure ? current : null
  }

  /**
   * Get all procedure paths
   */
  getProcedurePaths(): string[][] {
    const paths: string[][] = []

    const traverse = (obj: any, currentPath: string[] = []) => {
      for (const [key, value] of Object.entries(obj)) {
        const path = [...currentPath, key]

        if (value instanceof Procedure) {
          paths.push(path)
        } else if (value instanceof Router) {
          traverse(value._def, path)
        } else if (typeof value === 'object' && value !== null) {
          traverse(value, path)
        }
      }
    }

    traverse(this._def)

    return paths
  }

  /**
   * Call a procedure
   */
  async call(opts: {
    path: string
    input?: unknown
    ctx: TContext
    type: 'query' | 'mutation' | 'subscription'
  }): Promise<any> {
    const pathArray = opts.path.split('.')
    const procedure = this.getProcedure(pathArray)

    if (!procedure) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `No procedure found for path: ${opts.path}`
      })
    }

    return procedure._call({
      ctx: opts.ctx,
      input: opts.input,
      type: opts.type,
      path: opts.path
    })
  }

  /**
   * Create a caller for this router
   */
  createCaller(ctx: TContext): RouterCaller<TContext, TRouterDef> {
    return createRouterCaller(this, ctx)
  }
}

/**
 * Create router caller
 */
function createRouterCaller<TContext, TRouterDef extends RouterDef>(
  router: Router<TContext, TRouterDef>,
  ctx: TContext
): RouterCaller<TContext, TRouterDef> {
  const caller: any = {}

  for (const [key, value] of Object.entries(router._def)) {
    if (value instanceof Procedure) {
      caller[key] = async (input: any) => {
        return value._call({ ctx, input, type: 'query' })
      }
    } else if (value instanceof Router) {
      caller[key] = createRouterCaller(value, ctx)
    }
  }

  return caller
}

/**
 * Router caller type
 */
export type RouterCaller<TContext, TRouterDef extends RouterDef> = {
  [K in keyof TRouterDef]: TRouterDef[K] extends Procedure<TContext, infer TInput, infer TOutput>
    ? (input: TInput) => Promise<TOutput>
    : TRouterDef[K] extends Router<TContext, infer TNestedDef>
    ? RouterCaller<TContext, TNestedDef>
    : never
}

/**
 * Merge routers
 */
export function mergeRouters<
  TContext,
  TRouters extends Record<string, Router<TContext, any>>
>(routers: TRouters): Router<TContext, MergedRouterDef<TRouters>> {
  const merged: any = {}

  for (const [key, router] of Object.entries(routers)) {
    merged[key] = router
  }

  return new Router(merged, {})
}

type MergedRouterDef<TRouters extends Record<string, Router<any, any>>> = {
  [K in keyof TRouters]: TRouters[K] extends Router<any, infer TDef> ? TDef : never
}

/**
 * Flatten router to get all procedures
 */
export function flattenRouter<TContext, TRouterDef extends RouterDef>(
  router: Router<TContext, TRouterDef>
): Map<string, Procedure<any, any, any>> {
  const procedures = new Map<string, Procedure<any, any, any>>()

  const traverse = (obj: any, path: string[] = []) => {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = [...path, key]

      if (value instanceof Procedure) {
        procedures.set(currentPath.join('.'), value)
      } else if (value instanceof Router) {
        traverse(value._def, currentPath)
      } else if (typeof value === 'object' && value !== null) {
        traverse(value, currentPath)
      }
    }
  }

  traverse(router._def)

  return procedures
}

/**
 * Get router metadata
 */
export function getRouterMetadata<TContext, TRouterDef extends RouterDef>(
  router: Router<TContext, TRouterDef>
): RouterMetadata {
  const procedures = flattenRouter(router)
  const paths = Array.from(procedures.keys())

  return {
    totalProcedures: procedures.size,
    paths,
    procedures: Array.from(procedures.entries()).map(([path, proc]) => ({
      path,
      type: proc._def.type,
      meta: proc._def.meta
    }))
  }
}

export interface RouterMetadata {
  totalProcedures: number
  paths: string[]
  procedures: Array<{
    path: string
    type: 'query' | 'mutation' | 'subscription'
    meta?: any
  }>
}
