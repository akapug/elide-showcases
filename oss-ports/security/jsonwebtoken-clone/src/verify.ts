/**
 * @elide/jsonwebtoken - Verify Function
 * Verify and decode JSON Web Tokens
 */

import {
  JWTHeader,
  JWTPayload,
  VerifyOptions,
  SecretOrPublicKey,
  Secret,
  JsonWebTokenError,
  TokenExpiredError,
  NotBeforeError,
  VerifyResult
} from './types';
import { decode } from './decode';
import { parseTimespan, getCurrentTimestamp, isExpired, isNotYetValid } from './utils/timespan';
import { createHMACAlgorithm, isHMACAlgorithm } from './algorithms/hmac';
import { createRSAAlgorithm, isRSAAlgorithm } from './algorithms/rsa';
import { createECDSAAlgorithm, isECDSAAlgorithm } from './algorithms/ecdsa';

/**
 * Verify a JWT
 * @param token - JWT token
 * @param secretOrPublicKey - Secret or public key
 * @param options - Verify options
 */
export function verify(
  token: string,
  secretOrPublicKey: SecretOrPublicKey,
  options: VerifyOptions = {}
): JWTPayload | VerifyResult {
  // Decode token
  const decoded = decode(token, { complete: true });

  if (!decoded || typeof decoded === 'string') {
    throw new JsonWebTokenError('Invalid token');
  }

  const { header, payload, signature } = decoded;

  // Validate header
  if (!header || !header.alg) {
    throw new JsonWebTokenError('Invalid token header');
  }

  // Check algorithm
  if (options.algorithms && !options.algorithms.includes(header.alg)) {
    throw new JsonWebTokenError(`Algorithm not allowed: ${header.alg}`);
  }

  // Get secret/key
  let secret: Secret;

  if (typeof secretOrPublicKey === 'function') {
    // Callback-based secret retrieval (synchronous version)
    throw new JsonWebTokenError('Callback-based secret retrieval not supported in sync mode');
  } else {
    secret = secretOrPublicKey;
  }

  // Verify signature
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new JsonWebTokenError('Invalid token format');
  }

  const signingInput = `${parts[0]}.${parts[1]}`;
  const tokenSignature = parts[2];

  let isValid = false;

  if (header.alg === 'none') {
    isValid = tokenSignature === '';
  } else if (isHMACAlgorithm(header.alg)) {
    const hmac = createHMACAlgorithm(header.alg);
    isValid = hmac.verify(signingInput, tokenSignature, secret);
  } else if (isRSAAlgorithm(header.alg)) {
    const rsa = createRSAAlgorithm(header.alg);
    isValid = rsa.verify(signingInput, tokenSignature, secret);
  } else if (isECDSAAlgorithm(header.alg)) {
    const ecdsa = createECDSAAlgorithm(header.alg);
    isValid = ecdsa.verify(signingInput, tokenSignature, secret);
  } else {
    throw new JsonWebTokenError(`Unsupported algorithm: ${header.alg}`);
  }

  if (!isValid) {
    throw new JsonWebTokenError('Invalid signature');
  }

  // Parse payload
  const jwtPayload = typeof payload === 'string'
    ? JSON.parse(payload)
    : payload;

  // Verify claims
  verifyClaims(jwtPayload, options);

  // Return result
  if (options.complete) {
    return {
      header,
      payload: jwtPayload
    };
  }

  return jwtPayload;
}

/**
 * Verify JWT claims
 */
function verifyClaims(payload: JWTPayload, options: VerifyOptions): void {
  const clockTolerance = options.clockTolerance || 0;
  const clockTimestamp = options.clockTimestamp || getCurrentTimestamp();

  // Verify expiration
  if (payload.exp && !options.ignoreExpiration) {
    if (isExpired(payload.exp, clockTolerance)) {
      const expiredAt = new Date(payload.exp * 1000);
      throw new TokenExpiredError('JWT expired', expiredAt);
    }
  }

  // Verify not before
  if (payload.nbf && !options.ignoreNotBefore) {
    if (isNotYetValid(payload.nbf, clockTolerance)) {
      const date = new Date(payload.nbf * 1000);
      throw new NotBeforeError('JWT not active', date);
    }
  }

  // Verify max age
  if (options.maxAge && payload.iat) {
    const maxAgeSeconds = parseTimespan(options.maxAge, 'maxAge');
    const age = clockTimestamp - payload.iat;

    if (age > maxAgeSeconds + clockTolerance) {
      throw new TokenExpiredError(
        'JWT max age exceeded',
        new Date((payload.iat + maxAgeSeconds) * 1000)
      );
    }
  }

  // Verify audience
  if (options.audience) {
    if (!payload.aud) {
      throw new JsonWebTokenError('JWT audience claim is required');
    }

    const audiences = Array.isArray(options.audience)
      ? options.audience
      : [options.audience];

    const tokenAudiences = Array.isArray(payload.aud)
      ? payload.aud
      : [payload.aud];

    let matched = false;

    for (const audience of audiences) {
      if (audience instanceof RegExp) {
        matched = tokenAudiences.some(aud => audience.test(aud));
      } else {
        matched = tokenAudiences.includes(audience);
      }

      if (matched) break;
    }

    if (!matched) {
      throw new JsonWebTokenError('JWT audience invalid');
    }
  }

  // Verify issuer
  if (options.issuer) {
    if (!payload.iss) {
      throw new JsonWebTokenError('JWT issuer claim is required');
    }

    const issuers = Array.isArray(options.issuer)
      ? options.issuer
      : [options.issuer];

    if (!issuers.includes(payload.iss)) {
      throw new JsonWebTokenError('JWT issuer invalid');
    }
  }

  // Verify subject
  if (options.subject) {
    if (payload.sub !== options.subject) {
      throw new JsonWebTokenError('JWT subject invalid');
    }
  }

  // Verify JWT ID
  if (options.jwtid) {
    if (payload.jti !== options.jwtid) {
      throw new JsonWebTokenError('JWT ID invalid');
    }
  }

  // Verify nonce
  if (options.nonce) {
    if ((payload as any).nonce !== options.nonce) {
      throw new JsonWebTokenError('JWT nonce invalid');
    }
  }
}

/**
 * Synchronous verify (alias)
 */
export function verifySync(
  token: string,
  secretOrPublicKey: SecretOrPublicKey,
  options?: VerifyOptions
): JWTPayload | VerifyResult {
  return verify(token, secretOrPublicKey, options);
}
