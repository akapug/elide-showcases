/**
 * tRPC Client - Type-Safe Client Implementation
 *
 * Provides end-to-end type-safe client for tRPC.
 */

import { Router, RouterDef } from '../server/router'
import { Procedure } from '../server/procedure'
import { TRPCError } from '../server/init'

export interface TRPCClientOptions {
  url: string
  headers?: Record<string, string>
  fetch?: typeof fetch
  batching?: boolean
  batchInterval?: number
  transformer?: DataTransformer
}

export interface DataTransformer {
  serialize(data: any): any
  deserialize(data: any): any
}

/**
 * tRPC Client
 */
export class TRPCClient<TRouter extends Router<any, any>> {
  private options: TRPCClientOptions
  private batchQueue: Array<{
    path: string
    input: any
    resolve: (value: any) => void
    reject: (error: any) => void
  }> = []
  private batchTimer: any = null

  constructor(options: TRPCClientOptions) {
    this.options = {
      fetch: globalThis.fetch,
      batching: false,
      batchInterval: 10,
      ...options
    }
  }

  /**
   * Create client proxy
   */
  private createProxy(path: string[] = []): any {
    return new Proxy(() => {}, {
      get: (_target, prop: string) => {
        if (prop === 'query') {
          return (input?: any) => this.query([...path].join('.'), input)
        }

        if (prop === 'mutate') {
          return (input?: any) => this.mutate([...path].join('.'), input)
        }

        if (prop === 'subscribe') {
          return (input: any, callbacks: SubscriptionCallbacks<any>) =>
            this.subscribe([...path].join('.'), input, callbacks)
        }

        return this.createProxy([...path, prop])
      }
    })
  }

  /**
   * Execute query
   */
  private async query(path: string, input?: any): Promise<any> {
    if (this.options.batching) {
      return this.addToBatch(path, input, 'query')
    }

    return this.request(path, input, 'query')
  }

  /**
   * Execute mutation
   */
  private async mutate(path: string, input?: any): Promise<any> {
    if (this.options.batching) {
      return this.addToBatch(path, input, 'mutation')
    }

    return this.request(path, input, 'mutation')
  }

  /**
   * Execute subscription
   */
  private subscribe<T>(
    path: string,
    input: any,
    callbacks: SubscriptionCallbacks<T>
  ): Subscription {
    const ws = this.createWebSocket()
    const id = Math.random().toString(36).substring(7)

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          id,
          type: 'subscribe',
          path,
          input
        })
      )
    }

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)

      if (message.id === id) {
        if (message.type === 'data') {
          callbacks.onData?.(message.data)
        } else if (message.type === 'error') {
          callbacks.onError?.(message.error)
        } else if (message.type === 'complete') {
          callbacks.onComplete?.()
        }
      }
    }

    ws.onerror = (error) => {
      callbacks.onError?.(error)
    }

    return {
      unsubscribe: () => {
        ws.send(
          JSON.stringify({
            id,
            type: 'unsubscribe'
          })
        )
        ws.close()
      }
    }
  }

  /**
   * Make HTTP request
   */
  private async request(path: string, input: any, type: string): Promise<any> {
    const url = new URL(this.options.url)

    if (type === 'query') {
      url.searchParams.set('path', path)
      if (input !== undefined) {
        url.searchParams.set('input', JSON.stringify(input))
      }
    }

    const headers = {
      'Content-Type': 'application/json',
      ...this.options.headers
    }

    const fetchOptions: RequestInit = {
      method: type === 'query' ? 'GET' : 'POST',
      headers
    }

    if (type === 'mutation') {
      fetchOptions.body = JSON.stringify({ path, input })
    }

    const response = await this.options.fetch!(url.toString(), fetchOptions)

    if (!response.ok) {
      const error = await response.json()
      throw new TRPCClientError(error)
    }

    const result = await response.json()

    if (result.error) {
      throw new TRPCClientError(result.error)
    }

    return this.options.transformer
      ? this.options.transformer.deserialize(result.data)
      : result.data
  }

  /**
   * Add to batch queue
   */
  private addToBatch(path: string, input: any, type: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.batchQueue.push({ path, input, resolve, reject })

      if (!this.batchTimer) {
        this.batchTimer = setTimeout(
          () => this.processBatch(),
          this.options.batchInterval
        )
      }
    })
  }

  /**
   * Process batch
   */
  private async processBatch(): Promise<void> {
    const batch = this.batchQueue.splice(0)
    this.batchTimer = null

    if (batch.length === 0) return

    try {
      const requests = batch.map((item) => ({
        path: item.path,
        input: item.input
      }))

      const response = await this.options.fetch!(this.options.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.options.headers
        },
        body: JSON.stringify(requests)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const results = await response.json()

      for (let i = 0; i < batch.length; i++) {
        const result = results[i]
        const item = batch[i]

        if (result.error) {
          item.reject(new TRPCClientError(result.error))
        } else {
          item.resolve(
            this.options.transformer
              ? this.options.transformer.deserialize(result.data)
              : result.data
          )
        }
      }
    } catch (error) {
      for (const item of batch) {
        item.reject(error)
      }
    }
  }

  /**
   * Create WebSocket connection
   */
  private createWebSocket(): WebSocket {
    const wsUrl = this.options.url.replace(/^http/, 'ws')
    return new WebSocket(wsUrl)
  }

  /**
   * Get proxy client
   */
  get proxy(): TRPCClientProxy<TRouter> {
    return this.createProxy() as any
  }
}

/**
 * tRPC Client Error
 */
export class TRPCClientError extends Error {
  public code: string
  public data?: any

  constructor(error: any) {
    super(error.message)
    this.name = 'TRPCClientError'
    this.code = error.code
    this.data = error.data
  }
}

/**
 * Subscription interface
 */
export interface Subscription {
  unsubscribe(): void
}

export interface SubscriptionCallbacks<T> {
  onData?: (data: T) => void
  onError?: (error: any) => void
  onComplete?: () => void
}

/**
 * Create tRPC client
 */
export function createTRPCClient<TRouter extends Router<any, any>>(
  options: TRPCClientOptions
): TRPCClientProxy<TRouter> {
  const client = new TRPCClient<TRouter>(options)
  return client.proxy
}

/**
 * Client proxy type
 */
export type TRPCClientProxy<TRouter> = TRouter extends Router<any, infer TDef>
  ? TRPCRouterProxy<TDef>
  : never

type TRPCRouterProxy<TRouterDef extends RouterDef> = {
  [K in keyof TRouterDef]: TRouterDef[K] extends Procedure<any, infer TInput, infer TOutput>
    ? {
        query: (input: TInput) => Promise<TOutput>
        mutate: (input: TInput) => Promise<TOutput>
        subscribe: (
          input: TInput,
          callbacks: SubscriptionCallbacks<TOutput>
        ) => Subscription
      }
    : TRouterDef[K] extends Router<any, infer TNestedDef>
    ? TRPCRouterProxy<TNestedDef>
    : never
}

/**
 * React hooks integration (optional)
 */
export function createTRPCReact<TRouter extends Router<any, any>>() {
  return {
    createClient: (options: TRPCClientOptions) => createTRPCClient<TRouter>(options),
    Provider: ({ children, client }: any) => children,
    useQuery: (path: any) => {
      // Simplified implementation - real version would use React hooks
      return {
        data: null,
        isLoading: true,
        error: null
      }
    },
    useMutation: (path: any) => {
      return {
        mutate: async (input: any) => {},
        mutateAsync: async (input: any) => {},
        isLoading: false,
        error: null
      }
    }
  }
}
