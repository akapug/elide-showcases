/**
 * Base64 - Encoding utilities for API Gateway
 *
 * Re-exports base64 functionality from the conversions directory.
 * Used for authentication tokens, data encoding, and API responses.
 */

// Import from conversions directory
export {
  encode,
  decode,
  urlEncode,
  urlDecode,
  isValid,
  basicAuth,
  parseBasicAuth,
  toDataUrl,
  fromDataUrl
} from '../../../conversions/base64/elide-base64.ts';
export { default } from '../../../conversions/base64/elide-base64.ts';

/**
 * Encode API token
 */
export function encodeApiToken(userId: string, timestamp: number, secret: string): string {
  const payload = JSON.stringify({ userId, timestamp, secret });
  return encode(payload);
}

/**
 * Decode API token
 */
export function decodeApiToken(token: string): { userId: string; timestamp: number; secret: string } | null {
  try {
    const payload = decode(token);
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

/**
 * Create JWT-like token (simplified)
 */
export function createJWT(header: object, payload: object): string {
  const encodedHeader = urlEncode(JSON.stringify(header));
  const encodedPayload = urlEncode(JSON.stringify(payload));
  // Note: Real JWT would have signature
  return `${encodedHeader}.${encodedPayload}.signature`;
}

/**
 * Parse JWT-like token (simplified)
 */
export function parseJWT(token: string): { header: any; payload: any } | null {
  try {
    const [headerPart, payloadPart] = token.split('.');
    const header = JSON.parse(urlDecode(headerPart));
    const payload = JSON.parse(urlDecode(payloadPart));
    return { header, payload };
  } catch {
    return null;
  }
}
