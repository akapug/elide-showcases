/**
 * Error Formatter - Format GraphQL Errors
 *
 * Provides error formatting and masking capabilities.
 */

import { GraphQLError } from '../graphql/core'

export interface FormattedError {
  message: string
  locations?: Array<{ line: number; column: number }>
  path?: Array<string | number>
  extensions?: Record<string, any>
}

/**
 * Format GraphQL error
 */
export function formatError(error: any, mask: boolean = false): FormattedError {
  if (!(error instanceof GraphQLError)) {
    error = new GraphQLError(error.message || String(error), {
      originalError: error
    })
  }

  const formatted: FormattedError = {
    message: error.message
  }

  if (error.locations) {
    formatted.locations = error.locations
  }

  if (error.path) {
    formatted.path = error.path
  }

  if (error.extensions) {
    formatted.extensions = { ...error.extensions }
  } else {
    formatted.extensions = {}
  }

  // Add error code
  if (error.originalError) {
    if (error.originalError instanceof AuthenticationError) {
      formatted.extensions.code = 'UNAUTHENTICATED'
    } else if (error.originalError instanceof AuthorizationError) {
      formatted.extensions.code = 'FORBIDDEN'
    } else if (error.originalError instanceof ValidationError) {
      formatted.extensions.code = 'BAD_USER_INPUT'
    } else if (error.originalError instanceof UserInputError) {
      formatted.extensions.code = 'BAD_USER_INPUT'
    } else {
      formatted.extensions.code = 'INTERNAL_SERVER_ERROR'
    }
  }

  // Mask internal errors
  if (mask && !formatted.extensions.code) {
    formatted.message = 'Internal server error'
    formatted.extensions.code = 'INTERNAL_SERVER_ERROR'

    // Remove sensitive information
    delete formatted.extensions.exception
  } else if (error.originalError) {
    formatted.extensions.exception = {
      message: error.originalError.message,
      stacktrace: error.originalError.stack?.split('\n') || []
    }
  }

  return formatted
}

/**
 * Custom error classes
 */
export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthorizationError'
  }
}

export class ValidationError extends Error {
  public validationErrors: any[]

  constructor(message: string, validationErrors: any[] = []) {
    super(message)
    this.name = 'ValidationError'
    this.validationErrors = validationErrors
  }
}

export class UserInputError extends Error {
  public invalidArgs: Record<string, any>

  constructor(message: string, invalidArgs: Record<string, any> = {}) {
    super(message)
    this.name = 'UserInputError'
    this.invalidArgs = invalidArgs
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ForbiddenError'
  }
}

export class PersistedQueryNotFoundError extends Error {
  constructor() {
    super('PersistedQueryNotFound')
    this.name = 'PersistedQueryNotFoundError'
  }
}

export class PersistedQueryNotSupportedError extends Error {
  constructor() {
    super('PersistedQueryNotSupported')
    this.name = 'PersistedQueryNotSupportedError'
  }
}
