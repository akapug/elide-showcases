/**
 * API Middleware - Computer Vision Pipeline
 *
 * Middleware functions for request processing
 *
 * @module api/middleware
 */

import { IncomingMessage } from 'http';
import { RequestContext } from './server';

/**
 * CORS middleware
 */
export function corsMiddleware(ctx: RequestContext): void {
  ctx.res.setHeader('Access-Control-Allow-Origin', '*');
  ctx.res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
  ctx.res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

/**
 * Logging middleware
 */
export function loggingMiddleware(ctx: RequestContext): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${ctx.method} ${ctx.path} - ${ctx.requestId}`);
}

/**
 * Parse multipart form data (simplified version)
 */
function parseMultipart(buffer: Buffer, boundary: string): Record<string, any> {
  const parts: Record<string, any> = {};
  const boundaryBuffer = Buffer.from(`--${boundary}`);

  let start = 0;
  let end = buffer.indexOf(boundaryBuffer, start);

  while (end !== -1) {
    const part = buffer.slice(start, end);

    // Find headers section
    const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'));
    if (headerEnd === -1) {
      start = end + boundaryBuffer.length;
      end = buffer.indexOf(boundaryBuffer, start);
      continue;
    }

    const headers = part.slice(0, headerEnd).toString();
    const body = part.slice(headerEnd + 4, part.length - 2); // Remove trailing \r\n

    // Extract field name from Content-Disposition header
    const nameMatch = headers.match(/name="([^"]+)"/);
    if (nameMatch) {
      const fieldName = nameMatch[1];

      // Check if it's a file
      const filenameMatch = headers.match(/filename="([^"]+)"/);
      if (filenameMatch) {
        parts[fieldName] = {
          filename: filenameMatch[1],
          data: body,
          size: body.length,
        };
      } else {
        parts[fieldName] = body.toString();
      }
    }

    start = end + boundaryBuffer.length;
    end = buffer.indexOf(boundaryBuffer, start);
  }

  return parts;
}

/**
 * Upload middleware - handles multipart/form-data and application/json
 */
export async function uploadMiddleware(ctx: RequestContext, maxSize: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const contentType = ctx.headers['content-type'] as string || '';
    let buffer = Buffer.alloc(0);
    let size = 0;

    ctx.req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > maxSize) {
        ctx.req.destroy();
        reject(new Error('Request body too large'));
        return;
      }
      buffer = Buffer.concat([buffer, chunk]);
    });

    ctx.req.on('end', () => {
      try {
        if (contentType.includes('multipart/form-data')) {
          // Parse multipart form data
          const boundaryMatch = contentType.match(/boundary=(.+)$/);
          if (!boundaryMatch) {
            reject(new Error('Invalid multipart boundary'));
            return;
          }

          const boundary = boundaryMatch[1];
          const parts = parseMultipart(buffer, boundary);

          // Convert file data to base64 for processing
          const fileData: Record<string, any> = {};
          for (const [key, value] of Object.entries(parts)) {
            if (typeof value === 'object' && value.data) {
              fileData[`${key}Buffer`] = value.data.toString('base64');
              fileData[`${key}Filename`] = value.filename;
              fileData[`${key}Size`] = value.size;
            } else {
              fileData[key] = value;
            }
          }

          ctx.body = fileData;
          resolve();

        } else if (contentType.includes('application/json')) {
          // Parse JSON
          const json = JSON.parse(buffer.toString());
          ctx.body = json;
          resolve();

        } else if (contentType.includes('application/octet-stream')) {
          // Raw binary data
          ctx.body = {
            imageBuffer: buffer.toString('base64'),
            originalSize: buffer.length,
          };
          resolve();

        } else {
          reject(new Error('Unsupported content type'));
        }
      } catch (error) {
        reject(new Error(`Failed to parse request body: ${error}`));
      }
    });

    ctx.req.on('error', reject);
  });
}

/**
 * Validation middleware
 */
export function validateImageMiddleware(ctx: RequestContext): boolean {
  const { imageBuffer } = ctx.body;

  if (!imageBuffer) {
    return false;
  }

  // Check if valid base64
  try {
    const buffer = Buffer.from(imageBuffer, 'base64');
    return buffer.length > 0;
  } catch {
    return false;
  }
}

/**
 * Rate limiting middleware (simplified)
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function rateLimitMiddleware(ctx: RequestContext, limit: number = 100, windowMs: number = 60000): boolean {
  const key = ctx.headers['x-forwarded-for'] as string || ctx.req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  let entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + windowMs };
    rateLimitStore.set(key, entry);
  }

  entry.count++;

  if (entry.count > limit) {
    return false;
  }

  // Set rate limit headers
  ctx.res.setHeader('X-RateLimit-Limit', limit.toString());
  ctx.res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - entry.count).toString());
  ctx.res.setHeader('X-RateLimit-Reset', new Date(entry.resetAt).toISOString());

  return true;
}

/**
 * Cleanup old rate limit entries
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Cleanup every minute
