/**
 * @elide/jsonwebtoken - Production-ready JWT Implementation
 * Complete JSON Web Token signing, verification, and decoding
 *
 * @module @elide/jsonwebtoken
 * @author Elide Security Team
 * @license MIT
 */

// Main functions
export { sign, signSync } from './sign';
export { verify, verifySync } from './verify';
export {
  decode,
  getHeader,
  getPayload,
  isTokenExpired,
  getTokenExpiration,
  getTokenIssuer,
  getTokenSubject
} from './decode';

// Utilities
export {
  parseTimespan,
  formatTimespan,
  getCurrentTimestamp,
  isExpired,
  isNotYetValid
} from './utils/timespan';

// Algorithms
export { HMACAlgorithm, createHMACAlgorithm, isHMACAlgorithm } from './algorithms/hmac';
export { RSAAlgorithm, createRSAAlgorithm, isRSAAlgorithm } from './algorithms/rsa';
export { ECDSAAlgorithm, createECDSAAlgorithm, isECDSAAlgorithm } from './algorithms/ecdsa';

// Types
export type {
  Algorithm,
  JWTHeader,
  JWTPayload,
  SignOptions,
  VerifyOptions,
  DecodeOptions,
  JWT,
  Secret,
  GetSecretCallback,
  SecretOrPublicKey,
  VerifyResult,
  TimeSpan
} from './types';

// Errors
export {
  TokenExpiredError,
  NotBeforeError,
  JsonWebTokenError
} from './types';

/**
 * Version information
 */
export const VERSION = '1.0.0';

/**
 * Default export (sign function)
 */
export default { sign, verify, decode };
