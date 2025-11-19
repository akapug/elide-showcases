/**
 * JSON:API Formatter - Format Resources and Errors
 *
 * Provides JSON:API compliant formatting for resources, collections, and errors.
 */

export interface ResourceObject {
  type: string
  id: string
  attributes?: Record<string, any>
  relationships?: Record<string, RelationshipObject>
  links?: LinksObject
  meta?: any
}

export interface RelationshipObject {
  data?: ResourceIdentifier | ResourceIdentifier[] | null
  links?: LinksObject
  meta?: any
}

export interface ResourceIdentifier {
  type: string
  id: string
  meta?: any
}

export interface LinksObject {
  self?: string
  related?: string
  first?: string
  last?: string
  prev?: string | null
  next?: string | null
}

export interface ErrorObject {
  id?: string
  status?: string
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
 * Format single resource
 */
export function formatResource(
  data: any,
  type: string,
  fields?: Record<string, string[]>,
  baseURL?: string
): ResourceObject {
  const resource: ResourceObject = {
    type,
    id: String(data.id)
  }

  // Format attributes
  const attributes: Record<string, any> = {}
  const fieldList = fields?.[type]

  for (const [key, value] of Object.entries(data)) {
    if (key === 'id') continue
    if (key === 'type') continue

    // Skip if sparse fieldsets specified and field not included
    if (fieldList && !fieldList.includes(key)) continue

    // Check if it's a relationship
    if (isRelationship(data, key)) continue

    attributes[key] = value
  }

  if (Object.keys(attributes).length > 0) {
    resource.attributes = attributes
  }

  // Format relationships
  const relationships = extractRelationships(data)

  if (Object.keys(relationships).length > 0) {
    resource.relationships = {}

    for (const [key, value] of Object.entries(relationships)) {
      resource.relationships[key] = formatRelationship(
        key,
        value,
        type,
        data.id,
        baseURL
      )
    }
  }

  // Add links
  if (baseURL) {
    resource.links = {
      self: `${baseURL}/${type}/${data.id}`
    }
  }

  return resource
}

/**
 * Format relationship
 */
function formatRelationship(
  name: string,
  data: any,
  parentType: string,
  parentId: string,
  baseURL?: string
): RelationshipObject {
  const relationship: RelationshipObject = {}

  // Format relationship data
  if (Array.isArray(data)) {
    relationship.data = data.map((item) => ({
      type: item.type || name,
      id: String(item.id)
    }))
  } else if (data) {
    relationship.data = {
      type: data.type || name,
      id: String(data.id)
    }
  } else {
    relationship.data = null
  }

  // Add links
  if (baseURL) {
    relationship.links = {
      self: `${baseURL}/${parentType}/${parentId}/relationships/${name}`,
      related: `${baseURL}/${parentType}/${parentId}/${name}`
    }
  }

  return relationship
}

/**
 * Format collection
 */
export function formatCollection(
  data: any[],
  type: string,
  fields?: Record<string, string[]>,
  baseURL?: string
): ResourceObject[] {
  return data.map((item) => formatResource(item, type, fields, baseURL))
}

/**
 * Format error
 */
export function formatError(error: ErrorObject | ErrorObject[]): any {
  const errors = Array.isArray(error) ? error : [error]

  return {
    errors: errors.map((err) => ({
      id: err.id,
      status: err.status,
      code: err.code,
      title: err.title,
      detail: err.detail,
      source: err.source,
      meta: err.meta
    }))
  }
}

/**
 * Check if field is a relationship
 */
function isRelationship(data: any, key: string): boolean {
  const value = data[key]

  if (!value) return false

  // Check if it has type and id (resource identifier)
  if (typeof value === 'object' && 'type' in value && 'id' in value) {
    return true
  }

  // Check if it's an array of resource identifiers
  if (Array.isArray(value) && value.length > 0) {
    return typeof value[0] === 'object' && 'type' in value[0] && 'id' in value[0]
  }

  return false
}

/**
 * Extract relationships from data
 */
function extractRelationships(data: any): Record<string, any> {
  const relationships: Record<string, any> = {}

  for (const [key, value] of Object.entries(data)) {
    if (isRelationship(data, key)) {
      relationships[key] = value
    }
  }

  return relationships
}
