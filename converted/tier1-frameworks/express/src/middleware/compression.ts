/**
 * Compression Middleware
 *
 * Compresses response bodies using gzip or deflate
 */

import { Request } from '../request';
import { Response } from '../response';
import { NextFunction } from '../application';
import * as zlib from 'zlib';

export interface CompressionOptions {
  threshold?: number | string;
  level?: number;
  filter?: (req: Request, res: Response) => boolean;
}

/**
 * Create compression middleware
 */
export default function compression(options: CompressionOptions = {}): (req: Request, res: Response, next: NextFunction) => void {
  const {
    threshold = 1024,
    level = 6,
    filter = shouldCompress
  } = options;

  const minSize = typeof threshold === 'string' ? parseSize(threshold) : threshold;

  return function compressionMiddleware(req: Request, res: Response, next: NextFunction): void {
    // Check if compression should be applied
    if (!filter(req, res)) {
      return next();
    }

    // Get accepted encodings
    const acceptEncoding = req.get('accept-encoding') || '';

    let encoding: 'gzip' | 'deflate' | null = null;

    if (acceptEncoding.includes('gzip')) {
      encoding = 'gzip';
    } else if (acceptEncoding.includes('deflate')) {
      encoding = 'deflate';
    }

    // No supported encoding
    if (!encoding) {
      return next();
    }

    // Store original send method
    const originalSend = res.send.bind(res);
    const originalJson = res.json.bind(res);
    const originalEnd = res.end.bind(res);

    // Override send method
    res.send = function(body?: any): Response {
      if (shouldCompressBody(body, minSize)) {
        compressAndSend(body, originalSend);
      } else {
        originalSend(body);
      }
      return this;
    };

    // Override json method
    res.json = function(obj: any): Response {
      const body = JSON.stringify(obj);
      if (shouldCompressBody(body, minSize)) {
        compressAndSend(body, originalSend);
      } else {
        originalSend(body);
      }
      return this;
    };

    next();

    /**
     * Compress and send response
     */
    function compressAndSend(body: any, sendFn: Function): void {
      if (typeof body === 'string') {
        body = Buffer.from(body);
      }

      if (!Buffer.isBuffer(body)) {
        return sendFn(body);
      }

      // Create compression stream
      const compress = encoding === 'gzip'
        ? zlib.createGzip({ level })
        : zlib.createDeflate({ level });

      // Set encoding header
      res.setHeader('Content-Encoding', encoding);
      res.vary('Accept-Encoding');

      // Remove content-length (will be different after compression)
      res.res.removeHeader('Content-Length');

      // Compress
      compress.on('data', (chunk) => {
        res.res.write(chunk);
      });

      compress.on('end', () => {
        res.res.end();
      });

      compress.on('error', (err) => {
        res.res.end();
      });

      compress.write(body);
      compress.end();
    }
  };
}

/**
 * Default filter - should compress?
 */
function shouldCompress(req: Request, res: Response): boolean {
  const contentType = res.get('Content-Type');

  if (!contentType) {
    return false;
  }

  // Compress text-based content types
  const compressibleTypes = [
    'text/',
    'application/json',
    'application/javascript',
    'application/xml',
    'application/x-javascript'
  ];

  return compressibleTypes.some(type => (contentType as string).includes(type));
}

/**
 * Check if body should be compressed based on size
 */
function shouldCompressBody(body: any, minSize: number): boolean {
  if (!body) {
    return false;
  }

  const size = typeof body === 'string' ? Buffer.byteLength(body) : body.length || 0;

  return size >= minSize;
}

/**
 * Parse size string to bytes
 */
function parseSize(size: string): number {
  const units: { [key: string]: number } = {
    'b': 1,
    'kb': 1024,
    'mb': 1024 * 1024,
    'gb': 1024 * 1024 * 1024
  };

  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*([a-z]+)?$/);

  if (!match) {
    return 1024;
  }

  const value = parseFloat(match[1]);
  const unit = match[2] || 'b';

  return Math.floor(value * (units[unit] || 1));
}
