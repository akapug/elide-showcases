/**
 * Authentication Middleware
 * Handles JWT and API token authentication
 */

import { JWTService, APITokenService } from './jwt.js';
import { getDatabase } from '../database/connection.js';
import { logger } from '../core/logger.js';

export function authMiddleware(config) {
  const jwtService = new JWTService(config.jwtSecret);
  const apiTokenService = new APITokenService(config.apiTokenSalt);
  const authLogger = logger.child('Auth');

  return async (req, res, next) => {
    try {
      // Extract token from header
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        // Public access
        req.user = null;
        return next();
      }

      if (authHeader.startsWith('Bearer ')) {
        // JWT authentication
        const token = authHeader.slice(7);
        const payload = jwtService.verify(token);

        // Load user from database
        const db = getDatabase();
        const users = await db.query(
          'SELECT * FROM cms_users WHERE id = ? AND is_active = true AND blocked = false',
          [payload.id]
        );

        if (users.length === 0) {
          return unauthorized(res, 'User not found or inactive');
        }

        req.user = users[0];
        req.user.role = await loadUserRole(users[0].role_id);
      } else if (authHeader.startsWith('Token ')) {
        // API token authentication
        const token = authHeader.slice(6);
        const hash = apiTokenService.hash(token);

        const db = getDatabase();
        const tokens = await db.query(
          'SELECT * FROM cms_api_tokens WHERE access_key = ? AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)',
          [hash]
        );

        if (tokens.length === 0) {
          return unauthorized(res, 'Invalid or expired API token');
        }

        // Update last used timestamp
        await db.execute(
          'UPDATE cms_api_tokens SET last_used_at = CURRENT_TIMESTAMP WHERE id = ?',
          [tokens[0].id]
        );

        req.user = {
          id: null,
          type: 'api-token',
          tokenType: tokens[0].type,
          tokenName: tokens[0].name,
        };
      } else {
        return unauthorized(res, 'Invalid authorization header format');
      }

      next();
    } catch (error) {
      authLogger.error('Authentication error:', error);
      return unauthorized(res, 'Authentication failed');
    }
  };
}

async function loadUserRole(roleId) {
  if (!roleId) return null;

  const db = getDatabase();
  const roles = await db.query('SELECT * FROM cms_roles WHERE id = ?', [roleId]);

  return roles.length > 0 ? roles[0] : null;
}

function unauthorized(res, message) {
  res.status(401).json({
    error: {
      status: 401,
      name: 'UnauthorizedError',
      message,
    },
  });
}

/**
 * Require Authentication
 * Middleware to enforce authentication
 */
export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: {
        status: 401,
        name: 'UnauthorizedError',
        message: 'Authentication required',
      },
    });
  }
  next();
}

/**
 * Require Role
 * Middleware to enforce specific role
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          status: 401,
          name: 'UnauthorizedError',
          message: 'Authentication required',
        },
      });
    }

    if (req.user.type === 'api-token') {
      // API tokens have different permission model
      return next();
    }

    if (!req.user.role || !roles.includes(req.user.role.type)) {
      return res.status(403).json({
        error: {
          status: 403,
          name: 'ForbiddenError',
          message: 'Insufficient permissions',
        },
      });
    }

    next();
  };
}
