/**
 * Authentication Plugin
 *
 * Provides authentication middleware for GraphQL Yoga.
 */

import { Plugin } from '../server/yoga'
import { AuthenticationError } from '../errors/formatter'

export interface AuthPluginOptions {
  getUser?: (token: string) => Promise<any> | any
  validateToken?: (token: string) => Promise<boolean> | boolean
  extractToken?: (request: Request) => string | null
}

/**
 * Authentication plugin
 */
export function useAuth(options: AuthPluginOptions = {}): Plugin {
  const {
    getUser,
    validateToken,
    extractToken = defaultExtractToken
  } = options

  return {
    name: 'auth',
    async onRequest(request: Request) {
      const token = extractToken(request)

      if (!token) {
        return
      }

      // Validate token
      if (validateToken) {
        const isValid = await validateToken(token)

        if (!isValid) {
          throw new AuthenticationError('Invalid token')
        }
      }

      // Get user
      if (getUser) {
        const user = await getUser(token)

        if (!user) {
          throw new AuthenticationError('User not found')
        }

        // Add user to request context
        ;(request as any).user = user
      }
    }
  }
}

function defaultExtractToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization')

  if (!authHeader) {
    return null
  }

  const parts = authHeader.split(' ')

  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null
  }

  return parts[1]
}

/**
 * Role-based authorization
 */
export function requireRole(roles: string | string[]): any {
  const roleArray = Array.isArray(roles) ? roles : [roles]

  return (next: any) => async (root: any, args: any, context: any, info: any) => {
    if (!context.user) {
      throw new AuthenticationError('Not authenticated')
    }

    if (!roleArray.includes(context.user.role)) {
      throw new AuthenticationError('Insufficient permissions')
    }

    return next(root, args, context, info)
  }
}
