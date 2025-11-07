/**
 * CORS Middleware
 * Handle Cross-Origin Resource Sharing
 */

import type { Context } from '../core/context';

export interface CORSOptions {
  origin?: string | string[] | ((origin: string) => boolean);
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

export function cors(options: CORSOptions = {}) {
  const {
    origin = '*',
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
    allowedHeaders = ['Content-Type', 'Authorization'],
    exposedHeaders = [],
    credentials = false,
    maxAge = 86400,
  } = options;

  return async (ctx: Context, next: () => Promise<any>) => {
    const requestOrigin = ctx.header('Origin') || '';

    // Determine allowed origin
    let allowedOrigin = '*';
    if (typeof origin === 'string') {
      allowedOrigin = origin;
    } else if (Array.isArray(origin)) {
      if (origin.includes(requestOrigin)) {
        allowedOrigin = requestOrigin;
      }
    } else if (typeof origin === 'function') {
      if (origin(requestOrigin)) {
        allowedOrigin = requestOrigin;
      }
    }

    // Set CORS headers
    ctx.setHeader('Access-Control-Allow-Origin', allowedOrigin);

    if (credentials) {
      ctx.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    if (methods.length > 0) {
      ctx.setHeader('Access-Control-Allow-Methods', methods.join(', '));
    }

    if (allowedHeaders.length > 0) {
      ctx.setHeader('Access-Control-Allow-Headers', allowedHeaders.join(', '));
    }

    if (exposedHeaders.length > 0) {
      ctx.setHeader('Access-Control-Expose-Headers', exposedHeaders.join(', '));
    }

    if (maxAge > 0) {
      ctx.setHeader('Access-Control-Max-Age', maxAge.toString());
    }

    // Handle preflight request
    if (ctx.method === 'OPTIONS') {
      return ctx.status(204).textResponse('');
    }

    return await next();
  };
}
