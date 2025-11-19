/**
 * GraphQL Yoga Server - Main Entry Point
 *
 * Provides a complete GraphQL server implementation with:
 * - Schema execution
 * - Subscription support
 * - File uploads
 * - Middleware/plugin system
 * - Error handling
 * - Context management
 */

import { GraphQLSchema, execute, subscribe, parse, validate, GraphQLError } from '../graphql/core'
import { createPubSub, PubSub } from '../pubsub/pubsub'
import { WebSocketServer } from '../transport/websocket'
import { processRequest } from '../execution/request-processor'
import { formatError } from '../errors/formatter'

export interface YogaServerOptions {
  schema: GraphQLSchema
  context?: ContextFactory
  plugins?: Plugin[]
  cors?: CORSOptions
  graphiql?: boolean | GraphiQLOptions
  maskedErrors?: boolean
  batching?: boolean
  logging?: boolean | LoggingOptions
  multipart?: MultipartOptions
  parserCache?: boolean
  validationCache?: boolean
}

export interface ContextFactory {
  (params: ContextParams): Promise<Record<string, any>> | Record<string, any>
}

export interface ContextParams {
  request: Request
  params: URLSearchParams
  pubsub: PubSub
}

export interface Plugin {
  name: string
  onRequest?: (request: Request) => Promise<void> | void
  onParse?: (params: ParseParams) => void
  onValidate?: (params: ValidateParams) => void
  onExecute?: (params: ExecuteParams) => void
  onSubscribe?: (params: SubscribeParams) => void
  onResponse?: (response: Response) => void
}

export interface ParseParams {
  query: string
  operationName?: string
}

export interface ValidateParams {
  schema: GraphQLSchema
  documentAST: any
}

export interface ExecuteParams {
  schema: GraphQLSchema
  document: any
  rootValue?: any
  contextValue?: any
  variableValues?: any
  operationName?: string
}

export interface SubscribeParams extends ExecuteParams {}

export interface CORSOptions {
  origin?: string | string[]
  credentials?: boolean
  allowedHeaders?: string[]
  methods?: string[]
}

export interface GraphiQLOptions {
  title?: string
  endpoint?: string
  subscriptionEndpoint?: string
  defaultQuery?: string
}

export interface LoggingOptions {
  level?: 'debug' | 'info' | 'warn' | 'error'
  logFn?: (message: string, ...args: any[]) => void
}

export interface MultipartOptions {
  maxFileSize?: number
  maxFiles?: number
}

/**
 * GraphQL Yoga Server Instance
 */
export class YogaServer {
  private schema: GraphQLSchema
  private contextFactory?: ContextFactory
  private plugins: Plugin[]
  private options: YogaServerOptions
  private pubsub: PubSub
  private wsServer?: WebSocketServer
  private parseCache: Map<string, any>
  private validationCache: Map<string, readonly GraphQLError[]>

  constructor(options: YogaServerOptions) {
    this.schema = options.schema
    this.contextFactory = options.context
    this.plugins = options.plugins || []
    this.options = options
    this.pubsub = createPubSub()
    this.parseCache = new Map()
    this.validationCache = new Map()

    if (options.parserCache === undefined || options.parserCache) {
      this.enableParserCache()
    }

    if (options.validationCache === undefined || options.validationCache) {
      this.enableValidationCache()
    }
  }

  /**
   * Handle incoming HTTP request
   */
  async handleRequest(request: Request): Promise<Response> {
    // Run request plugins
    for (const plugin of this.plugins) {
      if (plugin.onRequest) {
        await plugin.onRequest(request)
      }
    }

    // CORS handling
    if (this.options.cors) {
      const corsHeaders = this.getCORSHeaders(request)
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders })
      }
    }

    const url = new URL(request.url)

    // GraphiQL interface
    if (request.method === 'GET' && this.options.graphiql) {
      if (url.pathname === '/graphql' || url.pathname === '/') {
        return this.renderGraphiQL()
      }
    }

    // Process GraphQL request
    try {
      const params = await this.parseRequestParams(request)
      const context = await this.createContext(request, params)

      if (Array.isArray(params)) {
        // Batched queries
        const results = await Promise.all(
          params.map(p => this.executeRequest(p, context))
        )
        return this.createResponse(results)
      } else {
        const result = await this.executeRequest(params, context)
        return this.createResponse(result)
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Parse request parameters
   */
  private async parseRequestParams(request: Request): Promise<any> {
    const contentType = request.headers.get('content-type') || ''

    if (request.method === 'GET') {
      const url = new URL(request.url)
      return {
        query: url.searchParams.get('query'),
        variables: url.searchParams.get('variables')
          ? JSON.parse(url.searchParams.get('variables')!)
          : undefined,
        operationName: url.searchParams.get('operationName') || undefined
      }
    }

    if (contentType.includes('application/json')) {
      const body = await request.json()
      return body
    }

    if (contentType.includes('multipart/form-data')) {
      return this.parseMultipartRequest(request)
    }

    if (contentType.includes('application/graphql')) {
      const query = await request.text()
      return { query }
    }

    throw new Error('Unsupported content type')
  }

  /**
   * Parse multipart request (file uploads)
   */
  private async parseMultipartRequest(request: Request): Promise<any> {
    const formData = await request.formData()
    const operations = JSON.parse(formData.get('operations') as string)
    const map = JSON.parse(formData.get('map') as string)

    // Map files to operations
    for (const [key, paths] of Object.entries(map)) {
      const file = formData.get(key)
      for (const path of paths as string[]) {
        this.setValueAtPath(operations, path, file)
      }
    }

    return operations
  }

  /**
   * Set value at object path
   */
  private setValueAtPath(obj: any, path: string, value: any): void {
    const parts = path.split('.')
    let current = obj

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]
      const match = part.match(/(\w+)\[(\d+)\]/)

      if (match) {
        const [, key, index] = match
        if (!current[key]) current[key] = []
        if (!current[key][index]) current[key][index] = {}
        current = current[key][index]
      } else {
        if (!current[part]) current[part] = {}
        current = current[part]
      }
    }

    const lastPart = parts[parts.length - 1]
    const match = lastPart.match(/(\w+)\[(\d+)\]/)

    if (match) {
      const [, key, index] = match
      if (!current[key]) current[key] = []
      current[key][index] = value
    } else {
      current[lastPart] = value
    }
  }

  /**
   * Create execution context
   */
  private async createContext(
    request: Request,
    params: URLSearchParams
  ): Promise<any> {
    const baseContext = {
      request,
      params,
      pubsub: this.pubsub
    }

    if (this.contextFactory) {
      const customContext = await this.contextFactory(baseContext)
      return { ...baseContext, ...customContext }
    }

    return baseContext
  }

  /**
   * Execute GraphQL request
   */
  private async executeRequest(params: any, context: any): Promise<any> {
    const { query, variables, operationName, extensions } = params

    if (!query) {
      throw new GraphQLError('Must provide query string')
    }

    // Check for persisted queries
    let documentAST
    let queryString = query

    if (extensions?.persistedQuery) {
      const { sha256Hash, version } = extensions.persistedQuery
      if (version !== 1) {
        throw new GraphQLError('Unsupported persisted query version')
      }

      // Try to get from cache
      const cached = this.parseCache.get(sha256Hash)
      if (cached) {
        documentAST = cached
      } else if (!query) {
        throw new GraphQLError('PersistedQueryNotFound')
      }
    }

    // Parse query
    if (!documentAST) {
      const cacheKey = queryString
      const cached = this.parseCache.get(cacheKey)

      if (cached) {
        documentAST = cached
      } else {
        // Run parse plugins
        for (const plugin of this.plugins) {
          if (plugin.onParse) {
            plugin.onParse({ query: queryString, operationName })
          }
        }

        documentAST = parse(queryString)

        if (this.options.parserCache) {
          this.parseCache.set(cacheKey, documentAST)
        }
      }
    }

    // Validate query
    const validationCacheKey = JSON.stringify(documentAST)
    let validationErrors = this.validationCache.get(validationCacheKey)

    if (validationErrors === undefined) {
      // Run validation plugins
      for (const plugin of this.plugins) {
        if (plugin.onValidate) {
          plugin.onValidate({ schema: this.schema, documentAST })
        }
      }

      validationErrors = validate(this.schema, documentAST)

      if (this.options.validationCache) {
        this.validationCache.set(validationCacheKey, validationErrors)
      }
    }

    if (validationErrors.length > 0) {
      return { errors: validationErrors.map(formatError) }
    }

    // Determine operation type
    const operation = this.getOperation(documentAST, operationName)

    if (operation?.operation === 'subscription') {
      throw new GraphQLError(
        'Subscriptions are not supported over HTTP. Use WebSocket instead.'
      )
    }

    // Run execution plugins
    for (const plugin of this.plugins) {
      if (plugin.onExecute) {
        plugin.onExecute({
          schema: this.schema,
          document: documentAST,
          contextValue: context,
          variableValues: variables,
          operationName
        })
      }
    }

    // Execute query
    const result = await execute({
      schema: this.schema,
      document: documentAST,
      contextValue: context,
      variableValues: variables,
      operationName
    })

    // Format errors
    if (result.errors) {
      result.errors = result.errors.map(error => {
        if (this.options.maskedErrors) {
          return formatError(error, true)
        }
        return formatError(error)
      })
    }

    return result
  }

  /**
   * Get operation from document
   */
  private getOperation(documentAST: any, operationName?: string): any {
    const operations = documentAST.definitions.filter(
      (def: any) => def.kind === 'OperationDefinition'
    )

    if (operationName) {
      return operations.find((op: any) => op.name?.value === operationName)
    }

    if (operations.length === 1) {
      return operations[0]
    }

    return null
  }

  /**
   * Create HTTP response
   */
  private createResponse(result: any): Response {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    if (this.options.cors) {
      const corsHeaders = this.getCORSHeaders()
      Object.assign(headers, corsHeaders)
    }

    const response = new Response(JSON.stringify(result), { headers })

    // Run response plugins
    for (const plugin of this.plugins) {
      if (plugin.onResponse) {
        plugin.onResponse(response)
      }
    }

    return response
  }

  /**
   * Get CORS headers
   */
  private getCORSHeaders(request?: Request): Record<string, string> {
    const headers: Record<string, string> = {}

    if (!this.options.cors) return headers

    const { origin, credentials, allowedHeaders, methods } = this.options.cors

    if (origin) {
      if (Array.isArray(origin)) {
        const requestOrigin = request?.headers.get('origin')
        if (requestOrigin && origin.includes(requestOrigin)) {
          headers['Access-Control-Allow-Origin'] = requestOrigin
        }
      } else {
        headers['Access-Control-Allow-Origin'] = origin
      }
    } else {
      headers['Access-Control-Allow-Origin'] = '*'
    }

    if (credentials) {
      headers['Access-Control-Allow-Credentials'] = 'true'
    }

    if (allowedHeaders) {
      headers['Access-Control-Allow-Headers'] = allowedHeaders.join(', ')
    }

    if (methods) {
      headers['Access-Control-Allow-Methods'] = methods.join(', ')
    }

    return headers
  }

  /**
   * Render GraphiQL interface
   */
  private renderGraphiQL(): Response {
    const options =
      typeof this.options.graphiql === 'object'
        ? this.options.graphiql
        : {}

    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>${options.title || 'GraphiQL'}</title>
  <link rel="stylesheet" href="https://unpkg.com/graphiql/graphiql.min.css" />
</head>
<body style="margin: 0;">
  <div id="graphiql" style="height: 100vh;"></div>
  <script
    crossorigin
    src="https://unpkg.com/react/umd/react.production.min.js"
  ></script>
  <script
    crossorigin
    src="https://unpkg.com/react-dom/umd/react-dom.production.min.js"
  ></script>
  <script
    crossorigin
    src="https://unpkg.com/graphiql/graphiql.min.js"
  ></script>
  <script>
    const fetcher = GraphiQL.createFetcher({
      url: '${options.endpoint || '/graphql'}',
      subscriptionUrl: '${options.subscriptionEndpoint || 'ws://localhost:4000/graphql'}'
    });

    ReactDOM.render(
      React.createElement(GraphiQL, {
        fetcher,
        defaultQuery: ${JSON.stringify(options.defaultQuery || '# Write your query here')}
      }),
      document.getElementById('graphiql'),
    );
  </script>
</body>
</html>
    `

    return new Response(html, {
      headers: { 'Content-Type': 'text/html' }
    })
  }

  /**
   * Handle WebSocket connection for subscriptions
   */
  handleWebSocket(socket: WebSocket, request: Request): void {
    if (!this.wsServer) {
      this.wsServer = new WebSocketServer({
        schema: this.schema,
        context: this.contextFactory,
        pubsub: this.pubsub
      })
    }

    this.wsServer.handleConnection(socket, request)
  }

  /**
   * Handle errors
   */
  private handleError(error: any): Response {
    const formattedError = formatError(error, this.options.maskedErrors)

    return new Response(
      JSON.stringify({ errors: [formattedError] }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  /**
   * Enable parser cache
   */
  private enableParserCache(): void {
    // Limit cache size
    const MAX_CACHE_SIZE = 1000
    setInterval(() => {
      if (this.parseCache.size > MAX_CACHE_SIZE) {
        const keysToDelete = Array.from(this.parseCache.keys()).slice(
          0,
          this.parseCache.size - MAX_CACHE_SIZE
        )
        keysToDelete.forEach(key => this.parseCache.delete(key))
      }
    }, 60000) // Clean up every minute
  }

  /**
   * Enable validation cache
   */
  private enableValidationCache(): void {
    const MAX_CACHE_SIZE = 1000
    setInterval(() => {
      if (this.validationCache.size > MAX_CACHE_SIZE) {
        const keysToDelete = Array.from(this.validationCache.keys()).slice(
          0,
          this.validationCache.size - MAX_CACHE_SIZE
        )
        keysToDelete.forEach(key => this.validationCache.delete(key))
      }
    }, 60000)
  }
}

/**
 * Create a new GraphQL Yoga server
 */
export function createYoga(options: YogaServerOptions): YogaServer {
  return new YogaServer(options)
}

/**
 * Helper to create a fetch-compatible handler
 */
export function createYogaHandler(
  options: YogaServerOptions
): (request: Request) => Promise<Response> {
  const yoga = createYoga(options)
  return (request: Request) => yoga.handleRequest(request)
}
