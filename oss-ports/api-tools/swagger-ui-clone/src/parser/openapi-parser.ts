/**
 * OpenAPI Parser - Parse and Validate OpenAPI 3.0 Specifications
 *
 * Provides comprehensive OpenAPI 3.0 spec parsing and validation.
 */

export interface OpenAPISpec {
  openapi: string
  info: InfoObject
  servers?: ServerObject[]
  paths: PathsObject
  components?: ComponentsObject
  security?: SecurityRequirementObject[]
  tags?: TagObject[]
  externalDocs?: ExternalDocumentationObject
}

export interface InfoObject {
  title: string
  description?: string
  termsOfService?: string
  contact?: ContactObject
  license?: LicenseObject
  version: string
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
  variables?: Record<string, ServerVariableObject>
}

export interface ServerVariableObject {
  enum?: string[]
  default: string
  description?: string
}

export interface PathsObject {
  [path: string]: PathItemObject
}

export interface PathItemObject {
  $ref?: string
  summary?: string
  description?: string
  get?: OperationObject
  put?: OperationObject
  post?: OperationObject
  delete?: OperationObject
  options?: OperationObject
  head?: OperationObject
  patch?: OperationObject
  trace?: OperationObject
  servers?: ServerObject[]
  parameters?: (ParameterObject | ReferenceObject)[]
}

export interface OperationObject {
  tags?: string[]
  summary?: string
  description?: string
  externalDocs?: ExternalDocumentationObject
  operationId?: string
  parameters?: (ParameterObject | ReferenceObject)[]
  requestBody?: RequestBodyObject | ReferenceObject
  responses: ResponsesObject
  callbacks?: Record<string, CallbackObject | ReferenceObject>
  deprecated?: boolean
  security?: SecurityRequirementObject[]
  servers?: ServerObject[]
}

export interface ParameterObject {
  name: string
  in: 'query' | 'header' | 'path' | 'cookie'
  description?: string
  required?: boolean
  deprecated?: boolean
  allowEmptyValue?: boolean
  schema?: SchemaObject | ReferenceObject
  example?: any
  examples?: Record<string, ExampleObject | ReferenceObject>
}

export interface RequestBodyObject {
  description?: string
  content: Record<string, MediaTypeObject>
  required?: boolean
}

export interface MediaTypeObject {
  schema?: SchemaObject | ReferenceObject
  example?: any
  examples?: Record<string, ExampleObject | ReferenceObject>
  encoding?: Record<string, EncodingObject>
}

export interface EncodingObject {
  contentType?: string
  headers?: Record<string, HeaderObject | ReferenceObject>
  style?: string
  explode?: boolean
  allowReserved?: boolean
}

export interface ResponsesObject {
  [statusCode: string]: ResponseObject | ReferenceObject
}

export interface ResponseObject {
  description: string
  headers?: Record<string, HeaderObject | ReferenceObject>
  content?: Record<string, MediaTypeObject>
  links?: Record<string, LinkObject | ReferenceObject>
}

export interface HeaderObject extends Omit<ParameterObject, 'name' | 'in'> {}

export interface LinkObject {
  operationRef?: string
  operationId?: string
  parameters?: Record<string, any>
  requestBody?: any
  description?: string
  server?: ServerObject
}

export interface CallbackObject {
  [expression: string]: PathItemObject
}

export interface ComponentsObject {
  schemas?: Record<string, SchemaObject | ReferenceObject>
  responses?: Record<string, ResponseObject | ReferenceObject>
  parameters?: Record<string, ParameterObject | ReferenceObject>
  examples?: Record<string, ExampleObject | ReferenceObject>
  requestBodies?: Record<string, RequestBodyObject | ReferenceObject>
  headers?: Record<string, HeaderObject | ReferenceObject>
  securitySchemes?: Record<string, SecuritySchemeObject | ReferenceObject>
  links?: Record<string, LinkObject | ReferenceObject>
  callbacks?: Record<string, CallbackObject | ReferenceObject>
}

export interface SchemaObject {
  title?: string
  multipleOf?: number
  maximum?: number
  exclusiveMaximum?: boolean
  minimum?: number
  exclusiveMinimum?: boolean
  maxLength?: number
  minLength?: number
  pattern?: string
  maxItems?: number
  minItems?: number
  uniqueItems?: boolean
  maxProperties?: number
  minProperties?: number
  required?: string[]
  enum?: any[]
  type?: string
  allOf?: (SchemaObject | ReferenceObject)[]
  oneOf?: (SchemaObject | ReferenceObject)[]
  anyOf?: (SchemaObject | ReferenceObject)[]
  not?: SchemaObject | ReferenceObject
  items?: SchemaObject | ReferenceObject
  properties?: Record<string, SchemaObject | ReferenceObject>
  additionalProperties?: boolean | SchemaObject | ReferenceObject
  description?: string
  format?: string
  default?: any
  nullable?: boolean
  discriminator?: DiscriminatorObject
  readOnly?: boolean
  writeOnly?: boolean
  xml?: XMLObject
  externalDocs?: ExternalDocumentationObject
  example?: any
  deprecated?: boolean
}

export interface DiscriminatorObject {
  propertyName: string
  mapping?: Record<string, string>
}

export interface XMLObject {
  name?: string
  namespace?: string
  prefix?: string
  attribute?: boolean
  wrapped?: boolean
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

export interface SecurityRequirementObject {
  [name: string]: string[]
}

export interface TagObject {
  name: string
  description?: string
  externalDocs?: ExternalDocumentationObject
}

export interface ExternalDocumentationObject {
  description?: string
  url: string
}

export interface ExampleObject {
  summary?: string
  description?: string
  value?: any
  externalValue?: string
}

export interface ReferenceObject {
  $ref: string
}

/**
 * Parse OpenAPI specification
 */
export async function parseOpenAPISpec(input: string | object): Promise<OpenAPISpec> {
  let spec: any

  if (typeof input === 'string') {
    // Try to parse as JSON
    try {
      spec = JSON.parse(input)
    } catch {
      // Try to parse as YAML
      spec = parseYAML(input)
    }
  } else {
    spec = input
  }

  // Validate OpenAPI version
  if (!spec.openapi || !spec.openapi.startsWith('3.0')) {
    throw new Error('Invalid OpenAPI version. Expected 3.0.x')
  }

  // Validate required fields
  if (!spec.info || !spec.info.title || !spec.info.version) {
    throw new Error('Missing required info fields')
  }

  if (!spec.paths) {
    throw new Error('Missing paths object')
  }

  return spec as OpenAPISpec
}

/**
 * Simple YAML parser (basic implementation)
 */
function parseYAML(yaml: string): any {
  const lines = yaml.split('\n')
  const result: any = {}
  const stack: any[] = [result]
  let currentIndent = 0

  for (let line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) continue

    const indent = line.search(/\S/)
    const content = line.trim()

    if (content.includes(':')) {
      const [key, ...valueParts] = content.split(':')
      const value = valueParts.join(':').trim()

      if (indent < currentIndent) {
        stack.pop()
      }

      const current = stack[stack.length - 1]

      if (value) {
        current[key.trim()] = parseValue(value)
      } else {
        current[key.trim()] = {}
        stack.push(current[key.trim()])
        currentIndent = indent
      }
    }
  }

  return result
}

function parseValue(value: string): any {
  if (value === 'true') return true
  if (value === 'false') return false
  if (value === 'null') return null
  if (!isNaN(Number(value))) return Number(value)
  if (value.startsWith('"') || value.startsWith("'")) {
    return value.slice(1, -1)
  }
  return value
}

/**
 * Resolve $ref references
 */
export function resolveRef(
  spec: OpenAPISpec,
  ref: string
): any {
  const parts = ref.replace('#/', '').split('/')
  let current: any = spec

  for (const part of parts) {
    current = current[part]
    if (!current) {
      throw new Error(`Reference not found: ${ref}`)
    }
  }

  return current
}

/**
 * Get all operations from spec
 */
export function getAllOperations(spec: OpenAPISpec): Array<{
  path: string
  method: string
  operation: OperationObject
}> {
  const operations: Array<{
    path: string
    method: string
    operation: OperationObject
  }> = []

  for (const [path, pathItem] of Object.entries(spec.paths)) {
    const methods = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace']

    for (const method of methods) {
      const operation = (pathItem as any)[method]

      if (operation) {
        operations.push({
          path,
          method: method.toUpperCase(),
          operation
        })
      }
    }
  }

  return operations
}

/**
 * Validate request against schema
 */
export function validateRequest(
  spec: OpenAPISpec,
  path: string,
  method: string,
  request: any
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  const pathItem = spec.paths[path]
  if (!pathItem) {
    errors.push(`Path ${path} not found`)
    return { valid: false, errors }
  }

  const operation = (pathItem as any)[method.toLowerCase()]
  if (!operation) {
    errors.push(`Method ${method} not found for path ${path}`)
    return { valid: false, errors }
  }

  // Validate parameters
  if (operation.parameters) {
    for (const param of operation.parameters) {
      const p = (param as ParameterObject)

      if (p.required && !request.parameters?.[p.name]) {
        errors.push(`Required parameter ${p.name} is missing`)
      }
    }
  }

  // Validate request body
  if (operation.requestBody) {
    const rb = operation.requestBody as RequestBodyObject

    if (rb.required && !request.body) {
      errors.push('Request body is required')
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Generate example value from schema
 */
export function generateExample(schema: SchemaObject | ReferenceObject): any {
  const s = schema as SchemaObject

  if (s.example !== undefined) {
    return s.example
  }

  if (s.default !== undefined) {
    return s.default
  }

  switch (s.type) {
    case 'string':
      if (s.format === 'date-time') return new Date().toISOString()
      if (s.format === 'date') return new Date().toISOString().split('T')[0]
      if (s.format === 'email') return 'user@example.com'
      if (s.format === 'uri') return 'https://example.com'
      if (s.enum) return s.enum[0]
      return 'string'

    case 'number':
    case 'integer':
      if (s.enum) return s.enum[0]
      return s.minimum || 0

    case 'boolean':
      return true

    case 'array':
      if (s.items) {
        return [generateExample(s.items)]
      }
      return []

    case 'object':
      const obj: any = {}

      if (s.properties) {
        for (const [key, value] of Object.entries(s.properties)) {
          obj[key] = generateExample(value)
        }
      }

      return obj

    default:
      return null
  }
}
