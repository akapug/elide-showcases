/**
 * tRPC Procedure - Procedure Implementation
 *
 * Provides procedure functionality for defining queries, mutations, and subscriptions.
 */

import { Middleware, MiddlewareBuilder } from './middleware'
import { TRPCConfig, TRPCError, ProcedureType, formatError } from './init'
import { Parser } from '../validation/parser'

export interface ProcedureDef<TContext, TInput, TOutput> {
  type: ProcedureType
  input?: Parser<TInput>
  output?: Parser<TOutput>
  meta?: any
  middlewares: Middleware<any, any>[]
  resolver?: ResolverFn<TContext, TInput, TOutput>
}

export type ResolverFn<TContext, TInput, TOutput> = (opts: {
  ctx: TContext
  input: TInput
  type: ProcedureType
  path?: string
}) => Promise<TOutput> | TOutput

/**
 * Procedure class
 */
export class Procedure<TContext, TInput, TOutput> {
  public readonly _def: ProcedureDef<TContext, TInput, TOutput>
  private config: TRPCConfig

  constructor(
    def: ProcedureDef<TContext, TInput, TOutput>,
    config: TRPCConfig
  ) {
    this._def = def
    this.config = config
  }

  /**
   * Call the procedure
   */
  async _call(opts: {
    ctx: TContext
    input?: unknown
    type: ProcedureType
    path?: string
  }): Promise<TOutput> {
    try {
      // Parse and validate input
      let validatedInput: TInput = opts.input as TInput

      if (this._def.input) {
        validatedInput = await this._def.input.parse(opts.input)
      }

      // Run middleware chain
      let currentCtx = opts.ctx

      for (const middleware of this._def.middlewares) {
        const result = await middleware._fn({
          ctx: currentCtx,
          next: async (nextOpts?: any) => ({
            ok: true,
            ctx: nextOpts?.ctx || currentCtx
          }),
          path: opts.path || '',
          type: opts.type,
          input: validatedInput
        })

        if (!result.ok) {
          throw result.error || new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Middleware failed'
          })
        }

        if (result.ctx) {
          currentCtx = result.ctx
        }
      }

      // Execute resolver
      if (!this._def.resolver) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Procedure has no resolver'
        })
      }

      const output = await this._def.resolver({
        ctx: currentCtx,
        input: validatedInput,
        type: opts.type,
        path: opts.path
      })

      // Validate output
      if (this._def.output) {
        return await this._def.output.parse(output)
      }

      return output
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error
      }

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        cause: error instanceof Error ? error : undefined
      })
    }
  }
}

/**
 * Procedure builder
 */
export class ProcedureBuilder<TContext, TInput, TOutput> {
  private middlewares: Middleware<any, any>[]
  private config: TRPCConfig
  private inputParser?: Parser<TInput>
  private outputParser?: Parser<TOutput>
  private metadata?: any

  constructor(
    middlewares: Middleware<any, any>[],
    config: TRPCConfig,
    inputParser?: Parser<TInput>,
    outputParser?: Parser<TOutput>,
    metadata?: any
  ) {
    this.middlewares = middlewares
    this.config = config
    this.inputParser = inputParser
    this.outputParser = outputParser
    this.metadata = metadata
  }

  /**
   * Add input parser
   */
  input<TNewInput>(
    parser: Parser<TNewInput>
  ): ProcedureBuilder<TContext, TNewInput, TOutput> {
    return new ProcedureBuilder(
      this.middlewares,
      this.config,
      parser,
      this.outputParser,
      this.metadata
    )
  }

  /**
   * Add output parser
   */
  output<TNewOutput>(
    parser: Parser<TNewOutput>
  ): ProcedureBuilder<TContext, TInput, TNewOutput> {
    return new ProcedureBuilder(
      this.middlewares,
      this.config,
      this.inputParser,
      parser,
      this.metadata
    )
  }

  /**
   * Add metadata
   */
  meta(meta: any): ProcedureBuilder<TContext, TInput, TOutput> {
    return new ProcedureBuilder(
      this.middlewares,
      this.config,
      this.inputParser,
      this.outputParser,
      meta
    )
  }

  /**
   * Add middleware
   */
  use<TNewContext>(
    middleware: Middleware<TContext, TNewContext>
  ): ProcedureBuilder<TNewContext, TInput, TOutput> {
    return new ProcedureBuilder(
      [...this.middlewares, middleware],
      this.config,
      this.inputParser as any,
      this.outputParser,
      this.metadata
    )
  }

  /**
   * Define a query procedure
   */
  query(
    resolver: ResolverFn<TContext, TInput, TOutput>
  ): Procedure<TContext, TInput, TOutput> {
    return new Procedure(
      {
        type: 'query',
        input: this.inputParser,
        output: this.outputParser,
        meta: this.metadata,
        middlewares: this.middlewares,
        resolver
      },
      this.config
    )
  }

  /**
   * Define a mutation procedure
   */
  mutation(
    resolver: ResolverFn<TContext, TInput, TOutput>
  ): Procedure<TContext, TInput, TOutput> {
    return new Procedure(
      {
        type: 'mutation',
        input: this.inputParser,
        output: this.outputParser,
        meta: this.metadata,
        middlewares: this.middlewares,
        resolver
      },
      this.config
    )
  }

  /**
   * Define a subscription procedure
   */
  subscription(
    resolver: ResolverFn<TContext, TInput, AsyncIterable<TOutput>>
  ): Procedure<TContext, TInput, AsyncIterable<TOutput>> {
    return new Procedure(
      {
        type: 'subscription',
        input: this.inputParser,
        output: this.outputParser,
        meta: this.metadata,
        middlewares: this.middlewares,
        resolver: resolver as any
      },
      this.config
    )
  }
}

/**
 * Infer procedure input type
 */
export type inferProcedureInput<TProcedure> = TProcedure extends Procedure<
  any,
  infer TInput,
  any
>
  ? TInput
  : never

/**
 * Infer procedure output type
 */
export type inferProcedureOutput<TProcedure> = TProcedure extends Procedure<
  any,
  any,
  infer TOutput
>
  ? TOutput
  : never

/**
 * Infer procedure context type
 */
export type inferProcedureContext<TProcedure> = TProcedure extends Procedure<
  infer TContext,
  any,
  any
>
  ? TContext
  : never
