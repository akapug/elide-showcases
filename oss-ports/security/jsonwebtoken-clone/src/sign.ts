/**
 * @elide/jsonwebtoken - Sign Function
 * Create and sign JSON Web Tokens
 */

import {
  JWTHeader,
  JWTPayload,
  SignOptions,
  Algorithm,
  Secret,
  JsonWebTokenError
} from './types';
import { parseTimespan, getCurrentTimestamp } from './utils/timespan';
import { createHMACAlgorithm, isHMACAlgorithm } from './algorithms/hmac';
import { createRSAAlgorithm, isRSAAlgorithm } from './algorithms/rsa';
import { createECDSAAlgorithm, isECDSAAlgorithm } from './algorithms/ecdsa';

/**
 * Sign a JWT
 * @param payload - Payload to sign
 * @param secretOrPrivateKey - Secret or private key
 * @param options - Sign options
 */
export function sign(
  payload: string | object | Buffer,
  secretOrPrivateKey: Secret,
  options: SignOptions = {}
): string {
  // Validate inputs
  if (typeof payload === 'undefined') {
    throw new JsonWebTokenError('payload is required');
  }

  if (!secretOrPrivateKey && options.algorithm !== 'none') {
    throw new JsonWebTokenError('secretOrPrivateKey must be provided');
  }

  // Default algorithm
  const algorithm: Algorithm = options.algorithm || 'HS256';

  // Build header
  const header: JWTHeader = {
    alg: algorithm,
    typ: options.header?.typ || 'JWT',
    ...options.header
  };

  if (options.keyid) {
    header.kid = options.keyid;
  }

  // Build payload
  let jwtPayload: JWTPayload;

  if (typeof payload === 'string') {
    jwtPayload = { data: payload };
  } else if (Buffer.isBuffer(payload)) {
    jwtPayload = { data: payload.toString() };
  } else {
    jwtPayload = options.mutatePayload ? payload : { ...payload };
  }

  // Add timestamp
  if (!options.noTimestamp) {
    jwtPayload.iat = getCurrentTimestamp();
  }

  // Add expiration
  if (options.expiresIn) {
    const seconds = parseTimespan(options.expiresIn, 'expiresIn');
    jwtPayload.exp = getCurrentTimestamp() + seconds;
  }

  // Add not before
  if (options.notBefore) {
    const seconds = parseTimespan(options.notBefore, 'notBefore');
    jwtPayload.nbf = getCurrentTimestamp() + seconds;
  }

  // Add audience
  if (options.audience) {
    jwtPayload.aud = options.audience;
  }

  // Add issuer
  if (options.issuer) {
    jwtPayload.iss = options.issuer;
  }

  // Add subject
  if (options.subject) {
    jwtPayload.sub = options.subject;
  }

  // Add JWT ID
  if (options.jwtid) {
    jwtPayload.jti = options.jwtid;
  }

  // Encode header and payload
  const headerEncoded = base64urlEncode(JSON.stringify(header));
  const payloadEncoded = base64urlEncode(JSON.stringify(jwtPayload));

  // Create signing input
  const signingInput = `${headerEncoded}.${payloadEncoded}`;

  // Sign
  let signature: string;

  if (algorithm === 'none') {
    signature = '';
  } else if (isHMACAlgorithm(algorithm)) {
    const hmac = createHMACAlgorithm(algorithm);
    signature = hmac.sign(signingInput, secretOrPrivateKey);
  } else if (isRSAAlgorithm(algorithm)) {
    const rsa = createRSAAlgorithm(algorithm);
    signature = rsa.sign(signingInput, secretOrPrivateKey);
  } else if (isECDSAAlgorithm(algorithm)) {
    const ecdsa = createECDSAAlgorithm(algorithm);
    signature = ecdsa.sign(signingInput, secretOrPrivateKey);
  } else {
    throw new JsonWebTokenError(`Unsupported algorithm: ${algorithm}`);
  }

  // Build JWT
  return `${signingInput}.${signature}`;
}

/**
 * Base64URL encode
 */
function base64urlEncode(input: string): string {
  return Buffer.from(input)
    .toString('base64url');
}

/**
 * Synchronous sign (alias)
 */
export function signSync(
  payload: string | object | Buffer,
  secretOrPrivateKey: Secret,
  options?: SignOptions
): string {
  return sign(payload, secretOrPrivateKey, options);
}
