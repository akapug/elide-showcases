/**
 * Compress Middleware
 * Compress response bodies with gzip/deflate/brotli
 */

import type { Context } from '../core/context';

export interface CompressOptions {
  threshold?: number;
  level?: number;
  encodings?: string[];
}

export function compress(options: CompressOptions = {}) {
  const {
    threshold = 1024,
    encodings = ['br', 'gzip', 'deflate'],
  } = options;

  return async (ctx: Context, next: () => Promise<any>) => {
    const result = await next();

    // Skip compression for non-Response objects
    if (!(result instanceof Response)) {
      return result;
    }

    // Skip if already encoded
    if (result.headers.has('Content-Encoding')) {
      return result;
    }

    // Get accepted encodings
    const acceptEncoding = ctx.header('Accept-Encoding') || '';
    let encoding: string | null = null;

    // Find best encoding
    for (const enc of encodings) {
      if (acceptEncoding.includes(enc)) {
        encoding = enc;
        break;
      }
    }

    // No compression if no encoding match
    if (!encoding) {
      return result;
    }

    // Get response body
    const body = await result.arrayBuffer();

    // Skip compression if body is too small
    if (body.byteLength < threshold) {
      return result;
    }

    // Compress based on encoding
    let compressed: ArrayBuffer;
    try {
      if (encoding === 'br') {
        compressed = Bun.gzipSync(new Uint8Array(body));
      } else if (encoding === 'gzip') {
        compressed = Bun.gzipSync(new Uint8Array(body));
      } else if (encoding === 'deflate') {
        compressed = Bun.deflateSync(new Uint8Array(body));
      } else {
        return result;
      }
    } catch (error) {
      // Return uncompressed on error
      return result;
    }

    // Create new response with compressed body
    const headers = new Headers(result.headers);
    headers.set('Content-Encoding', encoding);
    headers.set('Content-Length', compressed.byteLength.toString());
    headers.delete('Content-Length'); // Let Bun handle it

    return new Response(compressed, {
      status: result.status,
      statusText: result.statusText,
      headers,
    });
  };
}
