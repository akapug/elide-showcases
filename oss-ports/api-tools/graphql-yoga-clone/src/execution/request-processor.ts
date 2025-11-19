/**
 * Request Processor - Process GraphQL Requests
 *
 * Handles parsing and processing of GraphQL requests from various sources.
 */

export interface GraphQLParams {
  query: string
  variables?: Record<string, any>
  operationName?: string
  extensions?: Record<string, any>
}

/**
 * Process GraphQL request
 */
export async function processRequest(request: Request): Promise<GraphQLParams | GraphQLParams[]> {
  const contentType = request.headers.get('content-type') || ''

  // GET request
  if (request.method === 'GET') {
    return processGETRequest(request)
  }

  // JSON request
  if (contentType.includes('application/json')) {
    return processJSONRequest(request)
  }

  // GraphQL request
  if (contentType.includes('application/graphql')) {
    return processGraphQLRequest(request)
  }

  // Multipart request (file uploads)
  if (contentType.includes('multipart/form-data')) {
    return processMultipartRequest(request)
  }

  throw new Error('Unsupported content type')
}

/**
 * Process GET request
 */
function processGETRequest(request: Request): GraphQLParams {
  const url = new URL(request.url)
  const params = url.searchParams

  const query = params.get('query')

  if (!query) {
    throw new Error('Must provide query string')
  }

  const variables = params.get('variables')
  const operationName = params.get('operationName')
  const extensions = params.get('extensions')

  return {
    query,
    variables: variables ? JSON.parse(variables) : undefined,
    operationName: operationName || undefined,
    extensions: extensions ? JSON.parse(extensions) : undefined
  }
}

/**
 * Process JSON request
 */
async function processJSONRequest(request: Request): Promise<GraphQLParams | GraphQLParams[]> {
  const body = await request.json()

  if (Array.isArray(body)) {
    return body.map(normalizeParams)
  }

  return normalizeParams(body)
}

/**
 * Process GraphQL request
 */
async function processGraphQLRequest(request: Request): Promise<GraphQLParams> {
  const query = await request.text()

  return {
    query
  }
}

/**
 * Process multipart request
 */
async function processMultipartRequest(request: Request): Promise<GraphQLParams> {
  const formData = await request.formData()

  const operations = formData.get('operations')
  const map = formData.get('map')

  if (!operations) {
    throw new Error('Missing operations in multipart request')
  }

  const params = JSON.parse(operations as string)

  if (map) {
    const fileMap = JSON.parse(map as string)

    // Map files to variables
    for (const [fileKey, paths] of Object.entries(fileMap)) {
      const file = formData.get(fileKey)

      for (const path of paths as string[]) {
        setValueAtPath(params, path, file)
      }
    }
  }

  return normalizeParams(params)
}

/**
 * Normalize GraphQL params
 */
function normalizeParams(params: any): GraphQLParams {
  return {
    query: params.query,
    variables: params.variables,
    operationName: params.operationName,
    extensions: params.extensions
  }
}

/**
 * Set value at object path
 */
function setValueAtPath(obj: any, path: string, value: any): void {
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
 * Validate GraphQL params
 */
export function validateParams(params: GraphQLParams): void {
  if (!params.query) {
    throw new Error('Must provide query string')
  }

  if (params.variables && typeof params.variables !== 'object') {
    throw new Error('Variables must be an object')
  }

  if (params.operationName && typeof params.operationName !== 'string') {
    throw new Error('Operation name must be a string')
  }
}

/**
 * Parse batch request
 */
export function parseBatchRequest(body: any): GraphQLParams[] {
  if (!Array.isArray(body)) {
    throw new Error('Batch request must be an array')
  }

  return body.map(normalizeParams)
}
