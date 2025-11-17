/**
 * JSON:API Validator - Validate JSON:API Documents
 *
 * Validates JSON:API request and response documents.
 */

export interface ValidationError {
  message: string
  path?: string
}

/**
 * Validate JSON:API document
 */
export function validateJSONAPI(
  document: any,
  type: 'create' | 'update' | 'response'
): void {
  const errors: ValidationError[] = []

  // Top-level validation
  if (!document || typeof document !== 'object') {
    errors.push({ message: 'Document must be an object' })
    throw new ValidationError(errors)
  }

  // Must have data or errors
  if (!('data' in document) && !('errors' in document) && !('meta' in document)) {
    errors.push({ message: 'Document must contain at least one of: data, errors, meta' })
  }

  // Cannot have both data and errors
  if ('data' in document && 'errors' in document) {
    errors.push({ message: 'Document cannot contain both data and errors' })
  }

  // Validate data
  if ('data' in document) {
    validateData(document.data, type, errors)
  }

  // Validate included
  if ('included' in document) {
    validateIncluded(document.included, errors)
  }

  if (errors.length > 0) {
    throw new ValidationError(errors)
  }
}

/**
 * Validate data
 */
function validateData(data: any, type: string, errors: ValidationError[]): void {
  if (data === null) return

  if (Array.isArray(data)) {
    data.forEach((item, index) => {
      validateResourceObject(item, type, errors, `/data/${index}`)
    })
  } else {
    validateResourceObject(data, type, errors, '/data')
  }
}

/**
 * Validate resource object
 */
function validateResourceObject(
  resource: any,
  type: string,
  errors: ValidationError[],
  path: string
): void {
  if (!resource || typeof resource !== 'object') {
    errors.push({ message: 'Resource must be an object', path })
    return
  }

  // Type is required
  if (!resource.type) {
    errors.push({ message: 'Resource must have a type', path })
  } else if (typeof resource.type !== 'string') {
    errors.push({ message: 'Resource type must be a string', path: `${path}/type` })
  }

  // ID validation
  if (type === 'create') {
    if ('id' in resource) {
      errors.push({
        message: 'Resource ID should not be provided for create',
        path: `${path}/id`
      })
    }
  } else if (type === 'update') {
    if (!resource.id) {
      errors.push({ message: 'Resource must have an ID for update', path })
    }
  }

  if (resource.id && typeof resource.id !== 'string') {
    errors.push({ message: 'Resource ID must be a string', path: `${path}/id` })
  }

  // Validate attributes
  if ('attributes' in resource) {
    if (typeof resource.attributes !== 'object' || resource.attributes === null) {
      errors.push({
        message: 'Attributes must be an object',
        path: `${path}/attributes`
      })
    }
  }

  // Validate relationships
  if ('relationships' in resource) {
    if (typeof resource.relationships !== 'object' || resource.relationships === null) {
      errors.push({
        message: 'Relationships must be an object',
        path: `${path}/relationships`
      })
    } else {
      for (const [key, rel] of Object.entries(resource.relationships)) {
        validateRelationship(rel, errors, `${path}/relationships/${key}`)
      }
    }
  }
}

/**
 * Validate relationship
 */
function validateRelationship(rel: any, errors: ValidationError[], path: string): void {
  if (!rel || typeof rel !== 'object') {
    errors.push({ message: 'Relationship must be an object', path })
    return
  }

  // Must have at least one of: links, data, meta
  if (!('links' in rel) && !('data' in rel) && !('meta' in rel)) {
    errors.push({
      message: 'Relationship must contain at least one of: links, data, meta',
      path
    })
  }

  // Validate relationship data
  if ('data' in rel) {
    validateRelationshipData(rel.data, errors, `${path}/data`)
  }
}

/**
 * Validate relationship data
 */
function validateRelationshipData(data: any, errors: ValidationError[], path: string): void {
  if (data === null) return

  if (Array.isArray(data)) {
    data.forEach((item, index) => {
      validateResourceIdentifier(item, errors, `${path}/${index}`)
    })
  } else {
    validateResourceIdentifier(data, errors, path)
  }
}

/**
 * Validate resource identifier
 */
function validateResourceIdentifier(
  identifier: any,
  errors: ValidationError[],
  path: string
): void {
  if (!identifier || typeof identifier !== 'object') {
    errors.push({ message: 'Resource identifier must be an object', path })
    return
  }

  if (!identifier.type) {
    errors.push({ message: 'Resource identifier must have a type', path })
  }

  if (!identifier.id) {
    errors.push({ message: 'Resource identifier must have an ID', path })
  }
}

/**
 * Validate included resources
 */
function validateIncluded(included: any, errors: ValidationError[]): void {
  if (!Array.isArray(included)) {
    errors.push({ message: 'Included must be an array', path: '/included' })
    return
  }

  included.forEach((resource, index) => {
    validateResourceObject(resource, 'response', errors, `/included/${index}`)
  })
}

/**
 * Validation error class
 */
class ValidationError extends Error {
  public errors: ValidationError[]

  constructor(errors: ValidationError[]) {
    super('Validation failed')
    this.name = 'ValidationError'
    this.errors = errors
  }
}
