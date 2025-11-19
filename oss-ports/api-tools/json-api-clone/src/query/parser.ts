/**
 * JSON:API Query Parser - Parse Query Parameters
 *
 * Parses JSON:API query parameters for filtering, sorting, pagination, and sparse fieldsets.
 */

export interface QueryParams {
  filter?: Record<string, any>
  sort?: string[]
  page?: PageParams
  include?: string[]
  fields?: Record<string, string[]>
}

export interface PageParams {
  number?: number
  size?: number
  cursor?: string
  offset?: number
  limit?: number
}

/**
 * Parse query parameters
 */
export function parseQuery(query: Record<string, any>): QueryParams {
  const params: QueryParams = {}

  // Parse filter
  if (query.filter) {
    params.filter = parseFilter(query.filter)
  }

  // Parse sort
  if (query.sort) {
    params.sort = parseSort(query.sort)
  }

  // Parse page
  if (query.page) {
    params.page = parsePage(query.page)
  }

  // Parse include
  if (query.include) {
    params.include = parseInclude(query.include)
  }

  // Parse fields
  if (query.fields) {
    params.fields = parseFields(query.fields)
  }

  return params
}

/**
 * Parse filter parameters
 */
function parseFilter(filter: any): Record<string, any> {
  if (typeof filter === 'string') {
    return JSON.parse(filter)
  }

  return filter
}

/**
 * Parse sort parameters
 */
function parseSort(sort: string): string[] {
  return sort.split(',').map((s) => s.trim())
}

/**
 * Parse page parameters
 */
function parsePage(page: any): PageParams {
  const params: PageParams = {}

  if (typeof page === 'string') {
    page = JSON.parse(page)
  }

  if (page.number) {
    params.number = parseInt(page.number)
  }

  if (page.size) {
    params.size = parseInt(page.size)
  }

  if (page.cursor) {
    params.cursor = page.cursor
  }

  if (page.offset) {
    params.offset = parseInt(page.offset)
  }

  if (page.limit) {
    params.limit = parseInt(page.limit)
  }

  return params
}

/**
 * Parse include parameters
 */
function parseInclude(include: string): string[] {
  return include.split(',').map((i) => i.trim())
}

/**
 * Parse fields parameters
 */
function parseFields(fields: any): Record<string, string[]> {
  const result: Record<string, string[]> = {}

  if (typeof fields === 'string') {
    fields = JSON.parse(fields)
  }

  for (const [type, fieldList] of Object.entries(fields)) {
    if (typeof fieldList === 'string') {
      result[type] = fieldList.split(',').map((f: string) => f.trim())
    } else if (Array.isArray(fieldList)) {
      result[type] = fieldList
    }
  }

  return result
}
