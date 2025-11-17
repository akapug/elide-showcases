/**
 * @elide/jsonwebtoken - Decode Function
 * Decode JWT without verification
 */

import {
  JWT,
  JWTHeader,
  JWTPayload,
  DecodeOptions,
  JsonWebTokenError
} from './types';

/**
 * Decode a JWT without verifying signature
 * @param token - JWT token
 * @param options - Decode options
 */
export function decode(
  token: string,
  options: DecodeOptions = {}
): JWT | JWTPayload | string | null {
  if (typeof token !== 'string') {
    throw new JsonWebTokenError('Token must be a string');
  }

  const parts = token.split('.');

  if (parts.length !== 3) {
    throw new JsonWebTokenError('Invalid token format');
  }

  const [headerB64, payloadB64, signatureB64] = parts;

  let header: JWTHeader;
  let payload: JWTPayload | string;

  // Decode header
  try {
    const headerJson = base64urlDecode(headerB64);
    header = JSON.parse(headerJson);
  } catch (error) {
    throw new JsonWebTokenError('Invalid token header encoding');
  }

  // Decode payload
  try {
    const payloadJson = base64urlDecode(payloadB64);

    if (options.json !== false) {
      payload = JSON.parse(payloadJson);
    } else {
      payload = payloadJson;
    }
  } catch (error) {
    if (options.json === false) {
      payload = base64urlDecode(payloadB64);
    } else {
      throw new JsonWebTokenError('Invalid token payload encoding');
    }
  }

  // Return result
  if (options.complete) {
    return {
      header,
      payload,
      signature: signatureB64
    };
  }

  return payload;
}

/**
 * Base64URL decode
 */
function base64urlDecode(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf8');
}

/**
 * Get token header without full decode
 * @param token - JWT token
 */
export function getHeader(token: string): JWTHeader | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const headerJson = base64urlDecode(parts[0]);
    return JSON.parse(headerJson);
  } catch (error) {
    return null;
  }
}

/**
 * Get token payload without verification
 * @param token - JWT token
 */
export function getPayload(token: string): JWTPayload | string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payloadJson = base64urlDecode(parts[1]);
    return JSON.parse(payloadJson);
  } catch (error) {
    return null;
  }
}

/**
 * Check if token is expired (without full verification)
 * @param token - JWT token
 */
export function isTokenExpired(token: string): boolean {
  const payload = getPayload(token);

  if (!payload || typeof payload === 'string') {
    return true;
  }

  if (!payload.exp) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  return now >= payload.exp;
}

/**
 * Get token expiration time
 * @param token - JWT token
 */
export function getTokenExpiration(token: string): Date | null {
  const payload = getPayload(token);

  if (!payload || typeof payload === 'string') {
    return null;
  }

  if (!payload.exp) {
    return null;
  }

  return new Date(payload.exp * 1000);
}

/**
 * Get token issuer
 * @param token - JWT token
 */
export function getTokenIssuer(token: string): string | null {
  const payload = getPayload(token);

  if (!payload || typeof payload === 'string') {
    return null;
  }

  return payload.iss || null;
}

/**
 * Get token subject
 * @param token - JWT token
 */
export function getTokenSubject(token: string): string | null {
  const payload = getPayload(token);

  if (!payload || typeof payload === 'string') {
    return null;
  }

  return payload.sub || null;
}
