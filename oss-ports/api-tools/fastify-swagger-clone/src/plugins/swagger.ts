/**
 * Fastify Swagger Plugin - Auto-generate OpenAPI from Route Schemas
 *
 * Provides comprehensive OpenAPI generation from Fastify route schemas.
 */

export interface SwaggerOptions {
  openapi?: OpenAPIObject
  swagger?: any
  exposeRoute?: boolean
  routePrefix?: string
  staticCSP?: boolean
  transformStaticCSP?: (header: string) => string
  transform?: (schema: RouteSchema) => RouteSchema
  transformObject?: (spec: any) => any
  hiddenTag?: string
  hideUntagged?: boolean
  stripBasePath?: boolean
  yaml?: boolean
}

export interface OpenAPIObject {
  openapi?: string
  info: InfoObject
  servers?: ServerObject[]
  paths?: PathsObject
  components?: ComponentsObject
  security?: SecurityRequirement[]
  tags?: TagObject[]
}

export interface InfoObject {
  title: string
  version: string
  description?: string
  termsOfService?: string
  contact?: ContactObject
  license?: LicenseObject
}

export interface ContactObject {
  name?: string
  url?: string
  email?: string
}

export interface LicenseObject {
  name: string
  url?: string
}

export interface ServerObject {
  url: string
  description?: string
  variables?: Record<string, ServerVariable>
}

export interface ServerVariable {
  enum?: string[]
  default: string
  description?: string
}

export interface PathsObject {
  [path: string]: PathItemObject
}

export interface PathItemObject {
  summary?: string
  description?: string
  [method: string]: OperationObject | any
}

export interface OperationObject {
  tags?: string[]
  summary?: string
  description?: string
  operationId?: string
  parameters?: ParameterObject[]
  requestBody?: RequestBodyObject
  responses: ResponsesObject
  deprecated?: boolean
  security?: SecurityRequirement[]
}

export interface ParameterObject {
  name: string
  in: 'query' | 'header' | 'path' | 'cookie'
  description?: string
  required?: boolean
  schema: SchemaObject
}

export interface RequestBodyObject {
  description?: string
  required?: boolean
  content: Record<string, MediaTypeObject>
}

export interface MediaTypeObject {
  schema: SchemaObject
  example?: any
  examples?: Record<string, ExampleObject>
}

export interface ResponsesObject {
  [statusCode: string]: ResponseObject
}

export interface ResponseObject {
  description: string
  content?: Record<string, MediaTypeObject>
  headers?: Record<string, HeaderObject>
}

export interface HeaderObject {
  description?: string
  schema: SchemaObject
}

export interface ComponentsObject {
  schemas?: Record<string, SchemaObject>
  securitySchemes?: Record<string, SecuritySchemeObject>
  parameters?: Record<string, ParameterObject>
  requestBodies?: Record<string, RequestBodyObject>
  responses?: Record<string, ResponseObject>
}

export interface SchemaObject {
  type?: string
  properties?: Record<string, SchemaObject>
  required?: string[]
  items?: SchemaObject
  format?: string
  pattern?: string
  minimum?: number
  maximum?: number
  minLength?: number
  maxLength?: number
  enum?: any[]
  default?: any
  description?: string
  $ref?: string
  $id?: string
  allOf?: SchemaObject[]
  anyOf?: SchemaObject[]
  oneOf?: SchemaObject[]
  not?: SchemaObject
}

export interface SecuritySchemeObject {
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect'
  description?: string
  name?: string
  in?: 'query' | 'header' | 'cookie'
  scheme?: string
  bearerFormat?: string
  flows?: OAuthFlowsObject
  openIdConnectUrl?: string
}

export interface OAuthFlowsObject {
  implicit?: OAuthFlowObject
  password?: OAuthFlowObject
  clientCredentials?: OAuthFlowObject
  authorizationCode?: OAuthFlowObject
}

export interface OAuthFlowObject {
  authorizationUrl?: string
  tokenUrl?: string
  refreshUrl?: string
  scopes: Record<string, string>
}

export interface SecurityRequirement {
  [name: string]: string[]
}

export interface TagObject {
  name: string
  description?: string
  externalDocs?: ExternalDocsObject
}

export interface ExternalDocsObject {
  description?: string
  url: string
}

export interface ExampleObject {
  summary?: string
  description?: string
  value?: any
}

export interface RouteSchema {
  body?: SchemaObject
  querystring?: SchemaObject
  params?: SchemaObject
  headers?: SchemaObject
  response?: Record<number | string, SchemaObject>
  tags?: string[]
  summary?: string
  description?: string
  operationId?: string
  deprecated?: boolean
  security?: SecurityRequirement[]
  hide?: boolean
}

/**
 * Fastify Swagger Plugin
 */
export function fastifySwagger(fastify: any, options: SwaggerOptions, done: () => void) {
  const opts = {
    routePrefix: '/documentation',
    exposeRoute: false,
    hiddenTag: 'X-HIDDEN',
    hideUntagged: false,
    stripBasePath: false,
    yaml: false,
    ...options
  }

  // Store spec
  const spec: OpenAPIObject = {
    openapi: '3.0.0',
    info: opts.openapi?.info || { title: 'API', version: '1.0.0' },
    servers: opts.openapi?.servers || [],
    paths: {},
    components: opts.openapi?.components || {},
    security: opts.openapi?.security,
    tags: opts.openapi?.tags
  }

  // Store schemas
  const schemas = new Map<string, SchemaObject>()

  /**
   * Add schema
   */
  fastify.addSchema = (schema: SchemaObject) => {
    if (schema.$id) {
      schemas.set(schema.$id, schema)

      if (!spec.components!.schemas) {
        spec.components!.schemas = {}
      }

      spec.components!.schemas[schema.$id] = schema
    }
  }

  /**
   * Get swagger spec
   */
  fastify.swagger = (options?: { yaml?: boolean }) => {
    if (opts.transformObject) {
      return opts.transformObject(spec)
    }

    if (options?.yaml) {
      return convertToYAML(spec)
    }

    return spec
  }

  /**
   * Hook into route registration
   */
  fastify.addHook('onRoute', (routeOptions: any) => {
    const { method, url, schema } = routeOptions

    if (!schema || schema.hide) return
    if (opts.hideUntagged && !schema.tags) return
    if (schema.tags?.includes(opts.hiddenTag!)) return

    // Transform schema
    const transformedSchema = opts.transform ? opts.transform(schema) : schema

    // Convert to OpenAPI
    const path = convertPath(url)
    const operation = convertRouteSchemaToOperation(transformedSchema, method)

    if (!spec.paths![path]) {
      spec.paths![path] = {}
    }

    spec.paths![path][method.toLowerCase()] = operation
  })

  // Expose Swagger UI route
  if (opts.exposeRoute) {
    fastify.get(opts.routePrefix!, (request: any, reply: any) => {
      reply.type('text/html').send(generateSwaggerUI(opts.routePrefix!))
    })

    fastify.get(`${opts.routePrefix}/json`, (request: any, reply: any) => {
      reply.send(spec)
    })

    if (opts.yaml) {
      fastify.get(`${opts.routePrefix}/yaml`, (request: any, reply: any) => {
        reply.type('text/yaml').send(convertToYAML(spec))
      })
    }
  }

  done()
}

/**
 * Convert Fastify path to OpenAPI path
 */
function convertPath(path: string): string {
  return path.replace(/:(\w+)/g, '{$1}')
}

/**
 * Convert route schema to OpenAPI operation
 */
function convertRouteSchemaToOperation(schema: RouteSchema, method: string): OperationObject {
  const operation: OperationObject = {
    tags: schema.tags,
    summary: schema.summary,
    description: schema.description,
    operationId: schema.operationId,
    deprecated: schema.deprecated,
    security: schema.security,
    parameters: [],
    responses: {}
  }

  // Query parameters
  if (schema.querystring) {
    const props = schema.querystring.properties || {}
    for (const [name, prop] of Object.entries(props)) {
      operation.parameters!.push({
        name,
        in: 'query',
        required: schema.querystring.required?.includes(name),
        schema: prop as SchemaObject
      })
    }
  }

  // Path parameters
  if (schema.params) {
    const props = schema.params.properties || {}
    for (const [name, prop] of Object.entries(props)) {
      operation.parameters!.push({
        name,
        in: 'path',
        required: true,
        schema: prop as SchemaObject
      })
    }
  }

  // Header parameters
  if (schema.headers) {
    const props = schema.headers.properties || {}
    for (const [name, prop] of Object.entries(props)) {
      operation.parameters!.push({
        name,
        in: 'header',
        required: schema.headers.required?.includes(name),
        schema: prop as SchemaObject
      })
    }
  }

  // Request body
  if (schema.body) {
    operation.requestBody = {
      description: schema.body.description,
      required: true,
      content: {
        'application/json': {
          schema: schema.body
        }
      }
    }
  }

  // Responses
  if (schema.response) {
    for (const [code, responseSchema] of Object.entries(schema.response)) {
      operation.responses[code] = {
        description: responseSchema.description || `Response ${code}`,
        content: {
          'application/json': {
            schema: responseSchema
          }
        }
      }
    }
  }

  // Default response
  if (Object.keys(operation.responses).length === 0) {
    operation.responses['200'] = {
      description: 'Success'
    }
  }

  return operation
}

/**
 * Generate Swagger UI HTML
 */
function generateSwaggerUI(routePrefix: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@4/swagger-ui.css" />
  <style>
    html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin: 0; padding: 0; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@4/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@4/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '${routePrefix}/json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      });
    };
  </script>
</body>
</html>
  `
}

/**
 * Convert OpenAPI object to YAML
 */
function convertToYAML(obj: any, indent: number = 0): string {
  const spaces = '  '.repeat(indent)
  let yaml = ''

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) continue

    if (typeof value === 'object' && !Array.isArray(value)) {
      yaml += `${spaces}${key}:\n${convertToYAML(value, indent + 1)}`
    } else if (Array.isArray(value)) {
      yaml += `${spaces}${key}:\n`
      for (const item of value) {
        if (typeof item === 'object') {
          yaml += `${spaces}  -\n${convertToYAML(item, indent + 2)}`
        } else {
          yaml += `${spaces}  - ${item}\n`
        }
      }
    } else {
      const val = typeof value === 'string' ? `"${value}"` : value
      yaml += `${spaces}${key}: ${val}\n`
    }
  }

  return yaml
}
