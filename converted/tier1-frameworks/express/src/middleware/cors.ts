/**
 * CORS Middleware
 *
 * Enables Cross-Origin Resource Sharing (CORS) with configurable options
 */

import { Request } from '../request';
import { Response } from '../response';
import { NextFunction } from '../application';

export interface CorsOptions {
  origin?: string | string[] | boolean | ((origin: string, callback: (err: Error | null, allow?: boolean) => void) => void);
  methods?: string | string[];
  allowedHeaders?: string | string[];
  exposedHeaders?: string | string[];
  credentials?: boolean;
  maxAge?: number;
  preflightContinue?: boolean;
  optionsSuccessStatus?: number;
}

/**
 * Create CORS middleware
 */
export default function cors(options: CorsOptions = {}): (req: Request, res: Response, next: NextFunction) => void {
  const {
    origin = '*',
    methods = 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders,
    exposedHeaders,
    credentials = false,
    maxAge,
    preflightContinue = false,
    optionsSuccessStatus = 204
  } = options;

  return function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
    const requestOrigin = req.get('origin');

    // Set Origin header
    if (typeof origin === 'boolean') {
      if (origin) {
        res.setHeader('Access-Control-Allow-Origin', requestOrigin || '*');
        if (requestOrigin) {
          res.vary('Origin');
        }
      }
    } else if (typeof origin === 'string') {
      res.setHeader('Access-Control-Allow-Origin', origin);
      if (origin !== '*') {
        res.vary('Origin');
      }
    } else if (Array.isArray(origin)) {
      if (requestOrigin && origin.includes(requestOrigin)) {
        res.setHeader('Access-Control-Allow-Origin', requestOrigin);
      }
      res.vary('Origin');
    } else if (typeof origin === 'function') {
      // Async origin check
      if (!requestOrigin) {
        return next();
      }

      origin(requestOrigin, (err, allow) => {
        if (err) {
          return next(err);
        }

        if (allow) {
          res.setHeader('Access-Control-Allow-Origin', requestOrigin);
          res.vary('Origin');
        }

        continueRequest();
      });

      return;
    }

    continueRequest();

    function continueRequest(): void {
      // Set credentials header
      if (credentials) {
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }

      // Set exposed headers
      if (exposedHeaders) {
        const headers = Array.isArray(exposedHeaders) ? exposedHeaders.join(',') : exposedHeaders;
        res.setHeader('Access-Control-Expose-Headers', headers);
      }

      // Handle preflight request
      if (req.method === 'OPTIONS') {
        // Set allowed methods
        const methodsStr = Array.isArray(methods) ? methods.join(',') : methods;
        res.setHeader('Access-Control-Allow-Methods', methodsStr);

        // Set allowed headers
        if (allowedHeaders) {
          const headersStr = Array.isArray(allowedHeaders) ? allowedHeaders.join(',') : allowedHeaders;
          res.setHeader('Access-Control-Allow-Headers', headersStr);
        } else {
          // Echo request headers
          const requestHeaders = req.get('access-control-request-headers');
          if (requestHeaders) {
            res.setHeader('Access-Control-Allow-Headers', requestHeaders);
            res.vary('Access-Control-Request-Headers');
          }
        }

        // Set max age
        if (maxAge !== undefined) {
          res.setHeader('Access-Control-Max-Age', String(maxAge));
        }

        // Handle preflight
        if (!preflightContinue) {
          res.status(optionsSuccessStatus).send('');
          return;
        }
      }

      next();
    }
  };
}
