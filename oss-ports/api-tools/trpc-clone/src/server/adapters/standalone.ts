/**
 * tRPC Standalone Adapter - HTTP Server Adapter
 *
 * Provides HTTP server adapter for tRPC routers.
 */

import { Router } from '../router'
import { TRPCConfig, TRPCError, formatError, getHTTPStatusFromError } from '../init'
import { createServer, IncomingMessage, ServerResponse } from 'http'

export interface HTTPServerOptions<TRouter extends Router<any, any>> {
  router: TRouter
  createContext?: (opts: { req: IncomingMessage; res: ServerResponse }) => Promise<any> | any
  batching?: {
    enabled: boolean
  }
  onError?: (opts: { error: TRPCError; path: string; type: string; ctx: any }) => void
  responseMeta?: (opts: { ctx: any; path: string; type: string }) => Record<string, string>
}

/**
 * Create HTTP server for tRPC
 */
export function createHTTPServer<TRouter extends Router<any, any>>(
  options: HTTPServerOptions<TRouter>
) {
  const { router, createContext, batching, onError, responseMeta } = options

  const server = createServer(async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (req.method === 'OPTIONS') {
      res.writeHead(204)
      res.end()
      return
    }

    try {
      // Create context
      const ctx = createContext ? await createContext({ req, res }) : {}

      // Handle request
      if (req.method === 'GET') {
        const url = new URL(req.url!, `http://${req.headers.host}`)
        const path = url.searchParams.get('path')
        const inputStr = url.searchParams.get('input')

        if (!path) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Missing path parameter'
          })
        }

        const input = inputStr ? JSON.parse(inputStr) : undefined

        const result = await router.call({
          path,
          input,
          ctx,
          type: 'query'
        })

        res.setHeader('Content-Type', 'application/json')

        if (responseMeta) {
          const meta = responseMeta({ ctx, path, type: 'query' })
          for (const [key, value] of Object.entries(meta)) {
            res.setHeader(key, value)
          }
        }

        res.writeHead(200)
        res.end(JSON.stringify({ data: result }))
      } else if (req.method === 'POST') {
        const body = await getBody(req)
        const parsed = JSON.parse(body)

        // Batch request
        if (Array.isArray(parsed)) {
          if (!batching?.enabled) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Batching is not enabled'
            })
          }

          const results = await Promise.all(
            parsed.map(async (item) => {
              try {
                const result = await router.call({
                  path: item.path,
                  input: item.input,
                  ctx,
                  type: 'mutation'
                })
                return { data: result }
              } catch (error) {
                return {
                  error: formatError(
                    error instanceof TRPCError ? error : new TRPCError({
                      code: 'INTERNAL_SERVER_ERROR',
                      message: error instanceof Error ? error.message : 'Unknown error'
                    }),
                    {}
                  )
                }
              }
            })
          )

          res.setHeader('Content-Type', 'application/json')
          res.writeHead(200)
          res.end(JSON.stringify(results))
        }
        // Single request
        else {
          const { path, input } = parsed

          if (!path) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Missing path in request body'
            })
          }

          const result = await router.call({
            path,
            input,
            ctx,
            type: 'mutation'
          })

          res.setHeader('Content-Type', 'application/json')

          if (responseMeta) {
            const meta = responseMeta({ ctx, path, type: 'mutation' })
            for (const [key, value] of Object.entries(meta)) {
              res.setHeader(key, value)
            }
          }

          res.writeHead(200)
          res.end(JSON.stringify({ data: result }))
        }
      } else {
        throw new TRPCError({
          code: 'METHOD_NOT_SUPPORTED',
          message: `Method ${req.method} not supported`
        })
      }
    } catch (error) {
      const trpcError =
        error instanceof TRPCError
          ? error
          : new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: error instanceof Error ? error.message : 'Unknown error'
            })

      if (onError) {
        onError({
          error: trpcError,
          path: '',
          type: req.method === 'GET' ? 'query' : 'mutation',
          ctx: {}
        })
      }

      const formatted = formatError(trpcError, {})
      const status = getHTTPStatusFromError(trpcError)

      res.setHeader('Content-Type', 'application/json')
      res.writeHead(status)
      res.end(JSON.stringify({ error: formatted }))
    }
  })

  return server
}

/**
 * Get request body
 */
function getBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = ''

    req.on('data', (chunk) => {
      body += chunk
    })

    req.on('end', () => {
      resolve(body)
    })

    req.on('error', reject)
  })
}

/**
 * Create fetch adapter (for use with frameworks like Express, Fastify)
 */
export function createHTTPHandler<TRouter extends Router<any, any>>(
  options: HTTPServerOptions<TRouter>
) {
  return async (req: Request): Promise<Response> => {
    const { router, createContext, batching, onError } = options

    try {
      // Create context
      const ctx = createContext ? await createContext({ req: req as any, res: null as any }) : {}

      const url = new URL(req.url)

      // Handle GET request
      if (req.method === 'GET') {
        const path = url.searchParams.get('path')
        const inputStr = url.searchParams.get('input')

        if (!path) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Missing path parameter'
          })
        }

        const input = inputStr ? JSON.parse(inputStr) : undefined

        const result = await router.call({
          path,
          input,
          ctx,
          type: 'query'
        })

        return new Response(JSON.stringify({ data: result }), {
          headers: { 'Content-Type': 'application/json' }
        })
      }

      // Handle POST request
      if (req.method === 'POST') {
        const body = await req.json()

        // Batch request
        if (Array.isArray(body)) {
          if (!batching?.enabled) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Batching is not enabled'
            })
          }

          const results = await Promise.all(
            body.map(async (item) => {
              try {
                const result = await router.call({
                  path: item.path,
                  input: item.input,
                  ctx,
                  type: 'mutation'
                })
                return { data: result }
              } catch (error) {
                return {
                  error: formatError(
                    error instanceof TRPCError ? error : new TRPCError({
                      code: 'INTERNAL_SERVER_ERROR',
                      message: error instanceof Error ? error.message : 'Unknown error'
                    }),
                    {}
                  )
                }
              }
            })
          )

          return new Response(JSON.stringify(results), {
            headers: { 'Content-Type': 'application/json' }
          })
        }

        // Single request
        const { path, input } = body

        if (!path) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Missing path in request body'
          })
        }

        const result = await router.call({
          path,
          input,
          ctx,
          type: 'mutation'
        })

        return new Response(JSON.stringify({ data: result }), {
          headers: { 'Content-Type': 'application/json' }
        })
      }

      throw new TRPCError({
        code: 'METHOD_NOT_SUPPORTED',
        message: `Method ${req.method} not supported`
      })
    } catch (error) {
      const trpcError =
        error instanceof TRPCError
          ? error
          : new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: error instanceof Error ? error.message : 'Unknown error'
            })

      if (onError) {
        onError({
          error: trpcError,
          path: '',
          type: req.method === 'GET' ? 'query' : 'mutation',
          ctx: {}
        })
      }

      const formatted = formatError(trpcError, {})
      const status = getHTTPStatusFromError(trpcError)

      return new Response(JSON.stringify({ error: formatted }), {
        status,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
}
