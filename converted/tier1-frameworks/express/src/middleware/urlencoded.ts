/**
 * URL-Encoded Body Parser Middleware
 *
 * Parses URL-encoded request bodies (application/x-www-form-urlencoded)
 * and makes them available in req.body
 */

import { Request } from '../request';
import { Response } from '../response';
import { NextFunction } from '../application';
import { parse as parseQuery } from 'querystring';

export interface UrlencodedOptions {
  extended?: boolean;
  limit?: string | number;
  type?: string | string[] | ((req: Request) => boolean);
  verify?: (req: Request, res: Response, buf: Buffer, encoding: string) => void;
  parameterLimit?: number;
}

/**
 * Create URL-encoded parser middleware
 */
export default function urlencoded(options: UrlencodedOptions = {}): (req: Request, res: Response, next: NextFunction) => void {
  const {
    extended = true,
    limit = '100kb',
    type = 'application/x-www-form-urlencoded',
    verify,
    parameterLimit = 1000
  } = options;

  return function urlencodedParser(req: Request, res: Response, next: NextFunction): void {
    // Skip if not applicable
    if (!shouldParse(req, type)) {
      return next();
    }

    // Skip if body already parsed
    if (req.body && Object.keys(req.body).length > 0) {
      return next();
    }

    // Read body
    const chunks: Buffer[] = [];
    let size = 0;
    const maxSize = parseLimit(limit);

    req.req.on('data', (chunk: Buffer) => {
      size += chunk.length;

      // Check size limit
      if (size > maxSize) {
        req.req.removeAllListeners('data');
        req.req.removeAllListeners('end');
        res.status(413).send('Payload Too Large');
        return;
      }

      chunks.push(chunk);
    });

    req.req.on('end', () => {
      try {
        const buffer = Buffer.concat(chunks);

        // Call verify if provided
        if (verify) {
          verify(req, res, buffer, 'utf-8');
        }

        const body = buffer.toString('utf-8');

        // Skip empty bodies
        if (!body) {
          req.body = {};
          return next();
        }

        // Parse URL-encoded data
        const parsed = parseQuery(body, undefined, undefined, {
          maxKeys: parameterLimit
        });

        // Convert to plain object
        req.body = {};
        for (const key in parsed) {
          const value = parsed[key];
          req.body[key] = value;
        }

        next();
      } catch (err: any) {
        // Invalid URL-encoded data
        res.status(400).json({
          error: 'Invalid URL-encoded data',
          message: err.message
        });
      }
    });

    req.req.on('error', (err: Error) => {
      next(err);
    });
  };
}

/**
 * Check if request should be parsed
 */
function shouldParse(req: Request, type: string | string[] | ((req: Request) => boolean)): boolean {
  // Function type checker
  if (typeof type === 'function') {
    return type(req);
  }

  const contentType = req.get('content-type') || '';

  // Array of types
  if (Array.isArray(type)) {
    return type.some(t => contentType.includes(t));
  }

  // Single type
  return contentType.includes(type);
}

/**
 * Parse limit string to bytes
 */
function parseLimit(limit: string | number): number {
  if (typeof limit === 'number') {
    return limit;
  }

  const units: { [key: string]: number } = {
    'b': 1,
    'kb': 1024,
    'mb': 1024 * 1024,
    'gb': 1024 * 1024 * 1024
  };

  const match = limit.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*([a-z]+)?$/);

  if (!match) {
    return 100 * 1024; // Default 100kb
  }

  const value = parseFloat(match[1]);
  const unit = match[2] || 'b';

  return Math.floor(value * (units[unit] || 1));
}
