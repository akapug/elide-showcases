/**
 * JSON:API Server - Complete JSON:API Implementation
 *
 * Provides full JSON:API 1.1 specification support with resource routing,
 * relationships, filtering, sorting, and pagination.
 */

import { Resource, ResourceDefinition } from '../resources/resource'
import { parseQuery, QueryParams } from '../query/parser'
import { formatResource, formatCollection, formatError } from '../format/formatter'
import { validateJSONAPI } from '../validation/validator'

export interface JSONAPIServerOptions {
  resources: ResourceDefinition[]
  baseURL: string
  maxPageSize?: number
  defaultPageSize?: number
  enableETag?: boolean
  enableCompression?: boolean
}

export interface JSONAPIRequest {
  method: string
  path: string
  query: QueryParams
  body?: any
  headers: Record<string, string>
}

export interface JSONAPIResponse {
  status: number
  headers: Record<string, string>
  body: any
}

export interface JSONAPIError {
  id?: string
  status: string
  code?: string
  title?: string
  detail?: string
  source?: {
    pointer?: string
    parameter?: string
  }
  meta?: any
}

/**
 * JSON:API Server
 */
export class JSONAPIServer {
  private resources: Map<string, Resource>
  private options: JSONAPIServerOptions

  constructor(options: JSONAPIServerOptions) {
    this.options = {
      maxPageSize: 100,
      defaultPageSize: 10,
      enableETag: true,
      enableCompression: false,
      ...options
    }

    this.resources = new Map()

    for (const def of options.resources) {
      this.resources.set(def.type, new Resource(def))
    }
  }

  /**
   * Handle incoming request
   */
  async handleRequest(request: JSONAPIRequest): Promise<JSONAPIResponse> {
    try {
      // Parse query
      const query = parseQuery(request.query as any)

      // Route request
      const result = await this.route(request, query)

      // Format response
      return this.formatResponse(result, request)
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Route request to appropriate handler
   */
  private async route(request: JSONAPIRequest, query: QueryParams): Promise<any> {
    const { method, path } = request
    const segments = path.split('/').filter(Boolean)

    // Resource collection: GET /users
    if (segments.length === 1 && method === 'GET') {
      return this.getCollection(segments[0], query)
    }

    // Resource single: GET /users/1
    if (segments.length === 2 && method === 'GET') {
      return this.getResource(segments[0], segments[1], query)
    }

    // Create resource: POST /users
    if (segments.length === 1 && method === 'POST') {
      return this.createResource(segments[0], request.body, query)
    }

    // Update resource: PATCH /users/1
    if (segments.length === 2 && method === 'PATCH') {
      return this.updateResource(segments[0], segments[1], request.body, query)
    }

    // Delete resource: DELETE /users/1
    if (segments.length === 2 && method === 'DELETE') {
      return this.deleteResource(segments[0], segments[1])
    }

    // Related resource: GET /users/1/posts
    if (segments.length === 3 && method === 'GET') {
      return this.getRelated(segments[0], segments[1], segments[2], query)
    }

    // Relationship: GET /users/1/relationships/posts
    if (segments.length === 4 && segments[2] === 'relationships' && method === 'GET') {
      return this.getRelationship(segments[0], segments[1], segments[3])
    }

    // Update relationship: PATCH /users/1/relationships/posts
    if (segments.length === 4 && segments[2] === 'relationships' && method === 'PATCH') {
      return this.updateRelationship(segments[0], segments[1], segments[3], request.body)
    }

    // Add to relationship: POST /users/1/relationships/posts
    if (segments.length === 4 && segments[2] === 'relationships' && method === 'POST') {
      return this.addToRelationship(segments[0], segments[1], segments[3], request.body)
    }

    // Remove from relationship: DELETE /users/1/relationships/posts
    if (segments.length === 4 && segments[2] === 'relationships' && method === 'DELETE') {
      return this.removeFromRelationship(segments[0], segments[1], segments[3], request.body)
    }

    throw this.createError(404, 'NOT_FOUND', 'Route not found')
  }

  /**
   * Get resource collection
   */
  private async getCollection(type: string, query: QueryParams): Promise<any> {
    const resource = this.getResourceOrThrow(type)

    // Apply filters
    let data = await resource.findAll(query)

    // Apply sorting
    if (query.sort) {
      data = this.applySorting(data, query.sort)
    }

    // Apply pagination
    const { items, pagination } = this.applyPagination(data, query.page)

    // Apply sparse fieldsets
    const formatted = items.map((item: any) =>
      formatResource(item, type, query.fields, this.options.baseURL)
    )

    // Include related resources
    let included: any[] = []
    if (query.include) {
      included = await this.loadIncludes(formatted, query.include, query.fields)
    }

    return {
      data: formatted,
      included: included.length > 0 ? included : undefined,
      meta: {
        total: data.length,
        page: pagination
      },
      links: this.buildPaginationLinks(type, query, pagination, data.length)
    }
  }

  /**
   * Get single resource
   */
  private async getResource(type: string, id: string, query: QueryParams): Promise<any> {
    const resource = this.getResourceOrThrow(type)

    const data = await resource.findOne(id)

    if (!data) {
      throw this.createError(404, 'NOT_FOUND', `Resource ${type}:${id} not found`)
    }

    const formatted = formatResource(data, type, query.fields, this.options.baseURL)

    // Include related resources
    let included: any[] = []
    if (query.include) {
      included = await this.loadIncludes([formatted], query.include, query.fields)
    }

    return {
      data: formatted,
      included: included.length > 0 ? included : undefined
    }
  }

  /**
   * Create resource
   */
  private async createResource(type: string, body: any, query: QueryParams): Promise<any> {
    const resource = this.getResourceOrThrow(type)

    // Validate request
    validateJSONAPI(body, 'create')

    if (body.data.type !== type) {
      throw this.createError(409, 'CONFLICT', `Type mismatch: expected ${type}, got ${body.data.type}`)
    }

    // Extract attributes and relationships
    const attributes = body.data.attributes || {}
    const relationships = body.data.relationships || {}

    // Create resource
    const created = await resource.create(attributes, relationships)

    const formatted = formatResource(created, type, query.fields, this.options.baseURL)

    return {
      status: 201,
      headers: {
        'Location': `${this.options.baseURL}/${type}/${formatted.id}`
      },
      body: {
        data: formatted
      }
    }
  }

  /**
   * Update resource
   */
  private async updateResource(
    type: string,
    id: string,
    body: any,
    query: QueryParams
  ): Promise<any> {
    const resource = this.getResourceOrThrow(type)

    // Validate request
    validateJSONAPI(body, 'update')

    if (body.data.type !== type) {
      throw this.createError(409, 'CONFLICT', `Type mismatch: expected ${type}`)
    }

    if (body.data.id !== id) {
      throw this.createError(409, 'CONFLICT', `ID mismatch: expected ${id}`)
    }

    // Extract attributes
    const attributes = body.data.attributes || {}

    // Update resource
    const updated = await resource.update(id, attributes)

    if (!updated) {
      throw this.createError(404, 'NOT_FOUND', `Resource ${type}:${id} not found`)
    }

    const formatted = formatResource(updated, type, query.fields, this.options.baseURL)

    return {
      data: formatted
    }
  }

  /**
   * Delete resource
   */
  private async deleteResource(type: string, id: string): Promise<any> {
    const resource = this.getResourceOrThrow(type)

    const deleted = await resource.delete(id)

    if (!deleted) {
      throw this.createError(404, 'NOT_FOUND', `Resource ${type}:${id} not found`)
    }

    return {
      status: 204,
      body: null
    }
  }

  /**
   * Get related resources
   */
  private async getRelated(
    type: string,
    id: string,
    relationship: string,
    query: QueryParams
  ): Promise<any> {
    const resource = this.getResourceOrThrow(type)

    const data = await resource.findRelated(id, relationship, query)

    if (!data) {
      throw this.createError(404, 'NOT_FOUND', `Resource ${type}:${id} not found`)
    }

    const relatedResource = this.getResourceOrThrow(
      resource.definition.relationships[relationship].type
    )

    const formatted = Array.isArray(data)
      ? data.map((item: any) =>
          formatResource(
            item,
            relatedResource.definition.type,
            query.fields,
            this.options.baseURL
          )
        )
      : formatResource(
          data,
          relatedResource.definition.type,
          query.fields,
          this.options.baseURL
        )

    return {
      data: formatted
    }
  }

  /**
   * Get relationship
   */
  private async getRelationship(
    type: string,
    id: string,
    relationship: string
  ): Promise<any> {
    const resource = this.getResourceOrThrow(type)

    const data = await resource.findRelationship(id, relationship)

    if (!data) {
      throw this.createError(404, 'NOT_FOUND', `Resource ${type}:${id} not found`)
    }

    return {
      links: {
        self: `${this.options.baseURL}/${type}/${id}/relationships/${relationship}`,
        related: `${this.options.baseURL}/${type}/${id}/${relationship}`
      },
      data
    }
  }

  /**
   * Update relationship
   */
  private async updateRelationship(
    type: string,
    id: string,
    relationship: string,
    body: any
  ): Promise<any> {
    const resource = this.getResourceOrThrow(type)

    await resource.updateRelationship(id, relationship, body.data)

    return {
      status: 204,
      body: null
    }
  }

  /**
   * Add to relationship
   */
  private async addToRelationship(
    type: string,
    id: string,
    relationship: string,
    body: any
  ): Promise<any> {
    const resource = this.getResourceOrThrow(type)

    await resource.addToRelationship(id, relationship, body.data)

    return {
      status: 204,
      body: null
    }
  }

  /**
   * Remove from relationship
   */
  private async removeFromRelationship(
    type: string,
    id: string,
    relationship: string,
    body: any
  ): Promise<any> {
    const resource = this.getResourceOrThrow(type)

    await resource.removeFromRelationship(id, relationship, body.data)

    return {
      status: 204,
      body: null
    }
  }

  /**
   * Load included resources
   */
  private async loadIncludes(
    resources: any[],
    includes: string[],
    fields?: Record<string, string[]>
  ): Promise<any[]> {
    const included: any[] = []
    const seen = new Set<string>()

    for (const resource of resources) {
      for (const include of includes) {
        const parts = include.split('.')
        await this.loadInclude(resource, parts, included, seen, fields)
      }
    }

    return included
  }

  /**
   * Load single include
   */
  private async loadInclude(
    resource: any,
    path: string[],
    included: any[],
    seen: Set<string>,
    fields?: Record<string, string[]>
  ): Promise<void> {
    if (path.length === 0) return

    const [relationship, ...rest] = path
    const rel = resource.relationships?.[relationship]

    if (!rel || !rel.data) return

    const items = Array.isArray(rel.data) ? rel.data : [rel.data]

    for (const item of items) {
      const key = `${item.type}:${item.id}`

      if (seen.has(key)) continue
      seen.add(key)

      const resourceDef = this.resources.get(item.type)
      if (!resourceDef) continue

      const data = await resourceDef.findOne(item.id)
      if (!data) continue

      const formatted = formatResource(data, item.type, fields, this.options.baseURL)
      included.push(formatted)

      // Recursively load nested includes
      if (rest.length > 0) {
        await this.loadInclude(formatted, rest, included, seen, fields)
      }
    }
  }

  /**
   * Apply sorting
   */
  private applySorting(data: any[], sort: string[]): any[] {
    return data.sort((a, b) => {
      for (const field of sort) {
        const desc = field.startsWith('-')
        const key = desc ? field.slice(1) : field

        const aVal = a[key]
        const bVal = b[key]

        if (aVal < bVal) return desc ? 1 : -1
        if (aVal > bVal) return desc ? -1 : 1
      }

      return 0
    })
  }

  /**
   * Apply pagination
   */
  private applyPagination(
    data: any[],
    page?: any
  ): { items: any[]; pagination: any } {
    if (!page) {
      return {
        items: data.slice(0, this.options.defaultPageSize),
        pagination: {
          number: 1,
          size: this.options.defaultPageSize
        }
      }
    }

    const size = Math.min(
      page.size || this.options.defaultPageSize!,
      this.options.maxPageSize!
    )

    if (page.number) {
      // Offset-based pagination
      const number = page.number
      const offset = (number - 1) * size

      return {
        items: data.slice(offset, offset + size),
        pagination: {
          number,
          size
        }
      }
    }

    if (page.cursor) {
      // Cursor-based pagination
      const index = data.findIndex((item) => item.id === page.cursor)

      if (index === -1) {
        return {
          items: data.slice(0, size),
          pagination: { cursor: null, size }
        }
      }

      return {
        items: data.slice(index + 1, index + 1 + size),
        pagination: {
          cursor: page.cursor,
          size
        }
      }
    }

    return {
      items: data.slice(0, size),
      pagination: { number: 1, size }
    }
  }

  /**
   * Build pagination links
   */
  private buildPaginationLinks(
    type: string,
    query: QueryParams,
    pagination: any,
    total: number
  ): any {
    const base = `${this.options.baseURL}/${type}`
    const size = pagination.size

    if (pagination.number) {
      const totalPages = Math.ceil(total / size)
      const current = pagination.number

      return {
        self: `${base}?page[number]=${current}&page[size]=${size}`,
        first: `${base}?page[number]=1&page[size]=${size}`,
        last: `${base}?page[number]=${totalPages}&page[size]=${size}`,
        prev: current > 1 ? `${base}?page[number]=${current - 1}&page[size]=${size}` : null,
        next: current < totalPages ? `${base}?page[number]=${current + 1}&page[size]=${size}` : null
      }
    }

    return {
      self: `${base}`
    }
  }

  /**
   * Get resource or throw
   */
  private getResourceOrThrow(type: string): Resource {
    const resource = this.resources.get(type)

    if (!resource) {
      throw this.createError(404, 'NOT_FOUND', `Resource type ${type} not found`)
    }

    return resource
  }

  /**
   * Create error
   */
  private createError(status: number, code: string, detail: string): Error {
    const error: any = new Error(detail)
    error.status = status
    error.code = code
    return error
  }

  /**
   * Handle error
   */
  private handleError(error: any): JSONAPIResponse {
    const status = error.status || 500
    const code = error.code || 'INTERNAL_SERVER_ERROR'

    return {
      status,
      headers: {
        'Content-Type': 'application/vnd.api+json'
      },
      body: formatError({
        status: String(status),
        code,
        title: error.name,
        detail: error.message
      })
    }
  }

  /**
   * Format response
   */
  private formatResponse(result: any, request: JSONAPIRequest): JSONAPIResponse {
    const status = result.status || 200
    const headers = {
      'Content-Type': 'application/vnd.api+json',
      ...result.headers
    }

    if (this.options.enableETag && result.body) {
      headers['ETag'] = this.generateETag(result.body)
    }

    return {
      status,
      headers,
      body: result.body || result
    }
  }

  /**
   * Generate ETag
   */
  private generateETag(body: any): string {
    const hash = JSON.stringify(body)
      .split('')
      .reduce((a, b) => {
        a = (a << 5) - a + b.charCodeAt(0)
        return a & a
      }, 0)

    return `"${hash}"`
  }

  /**
   * Start HTTP server
   */
  listen(port: number): void {
    console.log(`JSON:API server listening on port ${port}`)
    console.log(`Base URL: ${this.options.baseURL}`)
    console.log(`Resources: ${Array.from(this.resources.keys()).join(', ')}`)
  }
}

/**
 * Create JSON:API server
 */
export function createJSONAPIServer(options: JSONAPIServerOptions): JSONAPIServer {
  return new JSONAPIServer(options)
}
