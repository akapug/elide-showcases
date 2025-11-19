/**
 * REST API Setup
 * Configures REST API routes for all content types
 */

import { Router } from '@elide/http';
import { contentTypeBuilder } from '../content-types/builder.js';
import { RESTController } from './rest-controller.js';
import { APIRouteBuilder } from './generator.js';
import { logger } from '../core/logger.js';

export function setupRESTAPI(config) {
  const router = new Router();
  const routeBuilder = new APIRouteBuilder();
  const restLogger = logger.child('REST');

  // Load all content types and create routes
  (async () => {
    try {
      const contentTypes = await contentTypeBuilder.findAll();

      for (const contentType of contentTypes) {
        if (contentType.kind === 'component') {
          continue; // Skip components
        }

        const controller = new RESTController(contentType);
        const routes = routeBuilder.buildRoutes(contentType);

        for (const route of routes) {
          const handler = async (req, res) => {
            const ctx = { request: req, params: req.params, query: req.query, body: null, status: 200 };

            await controller[route.handler](ctx);

            res.status(ctx.status).json(ctx.body);
          };

          switch (route.method) {
            case 'GET':
              router.get(route.path, handler);
              break;
            case 'POST':
              router.post(route.path, handler);
              break;
            case 'PUT':
              router.put(route.path, handler);
              break;
            case 'DELETE':
              router.delete(route.path, handler);
              break;
          }

          restLogger.debug(`Registered ${route.method} ${route.path}`);
        }
      }

      restLogger.info(`Registered ${contentTypes.length} content type APIs`);
    } catch (error) {
      restLogger.error('Failed to setup REST API:', error);
    }
  })();

  // API documentation endpoint
  router.get('/', (req, res) => {
    res.json({
      message: 'REST API',
      version: '1.0.0',
      documentation: '/api/docs',
    });
  });

  return router;
}

/**
 * API Response Formatter
 * Standardizes API responses
 */
export class ResponseFormatter {
  static success(data, meta = {}) {
    return {
      data,
      meta,
    };
  }

  static error(message, details = null, statusCode = 400) {
    return {
      error: {
        status: statusCode,
        name: 'ApplicationError',
        message,
        details,
      },
    };
  }

  static validationError(errors) {
    return {
      error: {
        status: 400,
        name: 'ValidationError',
        message: 'Validation failed',
        details: {
          errors,
        },
      },
    };
  }

  static notFound(message = 'Not found') {
    return {
      error: {
        status: 404,
        name: 'NotFoundError',
        message,
      },
    };
  }

  static unauthorized(message = 'Unauthorized') {
    return {
      error: {
        status: 401,
        name: 'UnauthorizedError',
        message,
      },
    };
  }

  static forbidden(message = 'Forbidden') {
    return {
      error: {
        status: 403,
        name: 'ForbiddenError',
        message,
      },
    };
  }
}
