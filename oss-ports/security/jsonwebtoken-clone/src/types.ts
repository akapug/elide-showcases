/**
 * @elide/jsonwebtoken - Type Definitions
 * Complete type definitions for JWT operations
 */

/**
 * Supported signing algorithms
 */
export type Algorithm =
  | 'HS256' | 'HS384' | 'HS512'
  | 'RS256' | 'RS384' | 'RS512'
  | 'ES256' | 'ES384' | 'ES512'
  | 'PS256' | 'PS384' | 'PS512'
  | 'none';

/**
 * JWT Header
 */
export interface JWTHeader {
  alg: Algorithm;
  typ?: string;
  kid?: string;
  jku?: string;
  x5u?: string;
  x5c?: string[];
  x5t?: string;
  cty?: string;
  [key: string]: any;
}

/**
 * JWT Payload (standard claims)
 */
export interface JWTPayload {
  // Registered claims
  iss?: string;        // Issuer
  sub?: string;        // Subject
  aud?: string | string[]; // Audience
  exp?: number;        // Expiration time
  nbf?: number;        // Not before
  iat?: number;        // Issued at
  jti?: string;        // JWT ID

  // Custom claims
  [key: string]: any;
}

/**
 * Sign options
 */
export interface SignOptions {
  algorithm?: Algorithm;
  expiresIn?: string | number;
  notBefore?: string | number;
  audience?: string | string[];
  issuer?: string;
  jwtid?: string;
  subject?: string;
  noTimestamp?: boolean;
  header?: Partial<JWTHeader>;
  keyid?: string;
  mutatePayload?: boolean;
  allowInsecureKeySizes?: boolean;
  allowInvalidAsymmetricKeyTypes?: boolean;
}

/**
 * Verify options
 */
export interface VerifyOptions {
  algorithms?: Algorithm[];
  audience?: string | string[] | RegExp;
  clockTolerance?: number;
  clockTimestamp?: number;
  complete?: boolean;
  issuer?: string | string[];
  ignoreExpiration?: boolean;
  ignoreNotBefore?: boolean;
  jwtid?: string;
  subject?: string;
  maxAge?: string | number;
  nonce?: string;
  allowInvalidAsymmetricKeyTypes?: boolean;
}

/**
 * Decode options
 */
export interface DecodeOptions {
  complete?: boolean;
  json?: boolean;
}

/**
 * JWT (decoded without verification)
 */
export interface JWT {
  header: JWTHeader;
  payload: JWTPayload | string;
  signature: string;
}

/**
 * Secret or key for signing/verification
 */
export type Secret = string | Buffer | { key: string | Buffer; passphrase: string };

/**
 * Get secret or public key callback
 */
export type GetSecretCallback = (
  header: JWTHeader,
  callback: (err: Error | null, secret?: Secret) => void
) => void;

/**
 * Secret or public key
 */
export type SecretOrPublicKey = Secret | GetSecretCallback;

/**
 * Verification result
 */
export interface VerifyResult {
  payload: JWTPayload;
  header: JWTHeader;
}

/**
 * Token expired error
 */
export class TokenExpiredError extends Error {
  name = 'TokenExpiredError';
  expiredAt: Date;

  constructor(message: string, expiredAt: Date) {
    super(message);
    this.expiredAt = expiredAt;
  }
}

/**
 * Not before error
 */
export class NotBeforeError extends Error {
  name = 'NotBeforeError';
  date: Date;

  constructor(message: string, date: Date) {
    super(message);
    this.date = date;
  }
}

/**
 * JSON Web Token error
 */
export class JsonWebTokenError extends Error {
  name = 'JsonWebTokenError';

  constructor(message: string) {
    super(message);
  }
}

/**
 * Time span (ms, seconds, minutes, hours, days, weeks, years)
 */
export type TimeSpan = string | number;
