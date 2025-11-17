/**
 * tRPC Type Utilities
 *
 * Provides type inference utilities for tRPC.
 */

import { Router, RouterDef } from './router'
import { Procedure } from './procedure'

/**
 * Infer async return type
 */
export type inferAsyncReturnType<TFunction extends (...args: any) => any> =
  TFunction extends (...args: any) => Promise<infer TReturn>
    ? TReturn
    : TFunction extends (...args: any) => infer TReturn
    ? TReturn
    : never

/**
 * Infer router context type
 */
export type inferRouterContext<TRouter> = TRouter extends Router<infer TContext, any>
  ? TContext
  : never

/**
 * Infer router inputs
 */
export type inferRouterInputs<TRouter extends Router<any, any>> =
  TRouter extends Router<any, infer TRouterDef>
    ? {
        [TPath in keyof TRouterDef]: TRouterDef[TPath] extends Procedure<any, infer TInput, any>
          ? TInput
          : TRouterDef[TPath] extends Router<any, any>
          ? inferRouterInputs<TRouterDef[TPath]>
          : never
      }
    : never

/**
 * Infer router outputs
 */
export type inferRouterOutputs<TRouter extends Router<any, any>> =
  TRouter extends Router<any, infer TRouterDef>
    ? {
        [TPath in keyof TRouterDef]: TRouterDef[TPath] extends Procedure<any, any, infer TOutput>
          ? TOutput
          : TRouterDef[TPath] extends Router<any, any>
          ? inferRouterOutputs<TRouterDef[TPath]>
          : never
      }
    : never

/**
 * Infer procedure input
 */
export type inferProcedureInput<TProcedure> = TProcedure extends Procedure<any, infer TInput, any>
  ? undefined extends TInput
    ? TInput | void
    : TInput
  : never

/**
 * Infer procedure output
 */
export type inferProcedureOutput<TProcedure> = TProcedure extends Procedure<any, any, infer TOutput>
  ? TOutput
  : never

/**
 * Infer subscription output
 */
export type inferSubscriptionOutput<TRouter, TPath extends string> = any

/**
 * Merge routers type
 */
export type MergeRouters<TRouters extends readonly Router<any, any>[]> = Router<
  TRouters[number] extends Router<infer TContext, any> ? TContext : never,
  UnionToIntersection<
    TRouters[number] extends Router<any, infer TRouterDef> ? TRouterDef : never
  >
>

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never

/**
 * Procedure type
 */
export type AnyProcedure = Procedure<any, any, any>

/**
 * Router type
 */
export type AnyRouter = Router<any, any>

/**
 * Procedure builder type
 */
export type AnyProcedureBuilder = any

/**
 * Create router input types
 */
export type CreateRouterInner<TContext, TRouterDef extends RouterDef> = Router<
  TContext,
  TRouterDef
>

/**
 * Flatten router type
 */
export type FlattenRouter<TRouter extends AnyRouter> = TRouter extends Router<
  any,
  infer TRouterDef
>
  ? {
      [K in keyof TRouterDef]: TRouterDef[K] extends AnyRouter
        ? FlattenRouter<TRouterDef[K]>
        : TRouterDef[K]
    }
  : never

/**
 * Procedure params type
 */
export type ProcedureParams<
  TContext = any,
  TMeta = any,
  TInput = any,
  TOutput = any
> = {
  _config: any
  _meta: TMeta
  _ctx_out: TContext
  _input_in: TInput
  _input_out: TInput
  _output_in: TOutput
  _output_out: TOutput
}

/**
 * Unwrap promise type
 */
export type UnwrapPromise<T> = T extends Promise<infer U> ? U : T

/**
 * Maybe promise type
 */
export type MaybePromise<T> = T | Promise<T>

/**
 * Simplify type (for better IDE support)
 */
export type Simplify<T> = { [K in keyof T]: T[K] } & {}
