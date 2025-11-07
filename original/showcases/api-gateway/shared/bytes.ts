/**
 * Bytes - Byte size utilities for API Gateway
 *
 * Re-exports bytes functionality from the conversions directory.
 * Used for request size limits, response formatting, and rate limiting.
 */

// Import from conversions directory (assuming bytes has similar structure)
import bytes from '../../../conversions/bytes/elide-bytes.ts';
export default bytes;

/**
 * Request size limits
 */
export const SIZE_LIMITS = {
  JSON_BODY: bytes('10MB'),
  FILE_UPLOAD: bytes('50MB'),
  MULTIPART: bytes('100MB'),
  URL_LENGTH: bytes('8KB'),
  HEADER: bytes('16KB'),
};

/**
 * Format bytes for API responses
 */
export function formatBytes(value: number): string {
  return bytes(value);
}

/**
 * Parse size string to bytes
 */
export function parseSize(size: string): number {
  const result = bytes(size);
  if (typeof result !== 'number') {
    throw new Error(`Invalid size format: ${size}`);
  }
  return result;
}

/**
 * Check if request size is within limit
 */
export function isWithinSizeLimit(size: number, limit: string): boolean {
  return size <= parseSize(limit);
}
