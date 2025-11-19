/**
 * Permissions Middleware
 * Role-based access control (RBAC) implementation
 */

import { getDatabase } from '../database/connection.js';
import { PermissionChecker } from './checker.js';
import { logger } from '../core/logger.js';

export function permissionMiddleware(config) {
  const permissionLogger = logger.child('Permissions');

  return async (req, res, next) => {
    try {
      // Skip permission check for public endpoints
      if (!config.enabled) {
        return next();
      }

      // Extract action from request
      const action = getActionFromRequest(req);

      // Extract subject from request
      const subject = getSubjectFromRequest(req);

      // Check permissions
      const checker = new PermissionChecker(req.user);
      const hasPermission = await checker.can(action, subject);

      if (!hasPermission) {
        permissionLogger.warn(
          `Permission denied: ${req.user?.email || 'anonymous'} attempted ${action} on ${subject}`
        );

        return res.status(403).json({
          error: {
            status: 403,
            name: 'ForbiddenError',
            message: 'You do not have permission to perform this action',
          },
        });
      }

      next();
    } catch (error) {
      permissionLogger.error('Permission check error:', error);
      return res.status(500).json({
        error: {
          status: 500,
          name: 'InternalError',
          message: 'Permission check failed',
        },
      });
    }
  };
}

/**
 * Extract action from HTTP request
 */
function getActionFromRequest(req) {
  const method = req.method.toLowerCase();

  // Map HTTP methods to CRUD actions
  const actionMap = {
    get: 'read',
    post: 'create',
    put: 'update',
    patch: 'update',
    delete: 'delete',
  };

  const baseAction = actionMap[method] || 'read';

  // Check for special actions in path
  if (req.path.includes('/publish')) return 'publish';
  if (req.path.includes('/unpublish')) return 'unpublish';
  if (req.path.includes('/count')) return 'read';

  return baseAction;
}

/**
 * Extract subject from HTTP request path
 */
function getSubjectFromRequest(req) {
  // Extract content type from path
  // Example: /api/articles/1 -> articles
  const pathParts = req.path.split('/').filter(p => p);

  if (pathParts.length >= 2) {
    const contentType = pathParts[1];
    return `api::${contentType}.${contentType}`;
  }

  return null;
}

/**
 * Check specific permission
 * Use as route middleware
 */
export function checkPermission(action, subject) {
  return async (req, res, next) => {
    try {
      const checker = new PermissionChecker(req.user);
      const hasPermission = await checker.can(action, subject);

      if (!hasPermission) {
        return res.status(403).json({
          error: {
            status: 403,
            name: 'ForbiddenError',
            message: 'Insufficient permissions',
          },
        });
      }

      next();
    } catch (error) {
      logger.error('Permission check error:', error);
      return res.status(500).json({
        error: {
          status: 500,
          name: 'InternalError',
          message: 'Permission check failed',
        },
      });
    }
  };
}

/**
 * Field-level permission filter
 * Filters response data based on field permissions
 */
export async function filterFields(data, contentType, user, action = 'read') {
  if (!user) {
    // Public user - apply strictest filtering
    return filterPublicFields(data, contentType);
  }

  const checker = new PermissionChecker(user);
  const permissions = await checker.getPermissions(action, contentType);

  if (!permissions || !permissions.fields) {
    // No field restrictions
    return data;
  }

  // Filter fields
  if (Array.isArray(data)) {
    return data.map(item => filterObjectFields(item, permissions.fields));
  } else {
    return filterObjectFields(data, permissions.fields);
  }
}

function filterObjectFields(obj, allowedFields) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const filtered = {};

  for (const field of allowedFields) {
    if (field in obj) {
      filtered[field] = obj[field];
    }
  }

  // Always include id and timestamps
  if ('id' in obj) filtered.id = obj.id;
  if ('createdAt' in obj) filtered.createdAt = obj.createdAt;
  if ('updatedAt' in obj) filtered.updatedAt = obj.updatedAt;

  return filtered;
}

function filterPublicFields(data, contentType) {
  // In production, load public field configuration from database
  // For now, return all fields
  return data;
}
