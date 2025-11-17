/**
 * @elide/passport - Authentication Middleware
 * Middleware factories for authentication
 */

import { Authenticator } from '../authenticator';
import { AuthenticateOptions, Request } from '../types';

/**
 * Create authentication middleware
 * @param passport - Authenticator instance
 * @param strategy - Strategy name or names
 * @param options - Authentication options
 */
export function authenticate(
  passport: Authenticator,
  strategy: string | string[],
  options?: AuthenticateOptions
): (req: Request, res: any, next: any) => void {
  return passport.authenticate(strategy, options);
}

/**
 * Require authentication middleware
 * Ensures user is authenticated, otherwise returns 401
 */
export function ensureAuthenticated(
  options: { redirectTo?: string } = {}
): (req: Request, res: any, next: any) => void {
  return (req: Request, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }

    if (options.redirectTo) {
      return res.redirect(options.redirectTo);
    }

    res.statusCode = 401;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Unauthorized');
  };
}

/**
 * Require unauthenticated middleware
 * Ensures user is NOT authenticated
 */
export function ensureUnauthenticated(
  options: { redirectTo?: string } = {}
): (req: Request, res: any, next: any) => void {
  return (req: Request, res: any, next: any) => {
    if (req.isUnauthenticated()) {
      return next();
    }

    if (options.redirectTo) {
      return res.redirect(options.redirectTo);
    }

    res.statusCode = 403;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Forbidden');
  };
}

/**
 * Require specific role middleware
 * @param roles - Required roles
 */
export function ensureRole(
  ...roles: string[]
): (req: Request, res: any, next: any) => void {
  return (req: Request, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'text/plain');
      return res.end('Unauthorized');
    }

    const userRoles = req.user?.roles || [];
    const hasRole = roles.some(role => userRoles.includes(role));

    if (!hasRole) {
      res.statusCode = 403;
      res.setHeader('Content-Type', 'text/plain');
      return res.end('Forbidden: Insufficient permissions');
    }

    next();
  };
}

/**
 * Require any of the specified permissions
 * @param permissions - Required permissions
 */
export function ensurePermission(
  ...permissions: string[]
): (req: Request, res: any, next: any) => void {
  return (req: Request, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'text/plain');
      return res.end('Unauthorized');
    }

    const userPermissions = req.user?.permissions || [];
    const hasPermission = permissions.some(perm => userPermissions.includes(perm));

    if (!hasPermission) {
      res.statusCode = 403;
      res.setHeader('Content-Type', 'text/plain');
      return res.end('Forbidden: Insufficient permissions');
    }

    next();
  };
}

/**
 * Optional authentication middleware
 * Attempts to authenticate but doesn't fail if not authenticated
 */
export function optionalAuthentication(
  passport: Authenticator,
  strategy: string | string[]
): (req: Request, res: any, next: any) => void {
  return (req: Request, res: any, next: any) => {
    passport.authenticate(strategy, { session: false })(req, res, (err?: any) => {
      // Always proceed to next middleware regardless of authentication result
      next();
    });
  };
}
