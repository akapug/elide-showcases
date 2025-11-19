/**
 * @elide/passport - JWT Strategy
 * JSON Web Token authentication strategy
 */

import { Strategy } from './strategy';
import { JWTStrategyOptions, JWTVerifyFunction, Request } from '../types';
import * as crypto from 'crypto';

/**
 * JWT extraction methods
 */
export class ExtractJwt {
  /**
   * Extract JWT from Authorization header as Bearer token
   */
  static fromAuthHeaderAsBearerToken() {
    return (req: Request): string | null => {
      const authHeader = req.headers['authorization'];
      if (!authHeader) return null;

      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        return parts[1];
      }
      return null;
    };
  }

  /**
   * Extract JWT from Authorization header with custom scheme
   */
  static fromAuthHeaderWithScheme(scheme: string) {
    return (req: Request): string | null => {
      const authHeader = req.headers['authorization'];
      if (!authHeader) return null;

      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === scheme) {
        return parts[1];
      }
      return null;
    };
  }

  /**
   * Extract JWT from request body field
   */
  static fromBodyField(fieldName: string) {
    return (req: Request): string | null => {
      if (req.body && req.body[fieldName]) {
        return req.body[fieldName];
      }
      return null;
    };
  }

  /**
   * Extract JWT from URL query parameter
   */
  static fromUrlQueryParameter(paramName: string) {
    return (req: Request): string | null => {
      if (req.query && req.query[paramName]) {
        return req.query[paramName];
      }
      return null;
    };
  }

  /**
   * Extract JWT from cookie
   */
  static fromCookie(cookieName: string) {
    return (req: Request): string | null => {
      if (req.cookies && req.cookies[cookieName]) {
        return req.cookies[cookieName];
      }
      return null;
    };
  }

  /**
   * Extract JWT from custom header
   */
  static fromHeader(headerName: string) {
    return (req: Request): string | null => {
      if (req.headers && req.headers[headerName]) {
        return req.headers[headerName];
      }
      return null;
    };
  }

  /**
   * Try multiple extractors in sequence
   */
  static fromExtractors(extractors: Array<(req: Request) => string | null>) {
    return (req: Request): string | null => {
      for (const extractor of extractors) {
        const token = extractor(req);
        if (token) return token;
      }
      return null;
    };
  }
}

/**
 * JWT authentication strategy
 * Authenticates users using JSON Web Tokens
 */
export class JWTStrategy extends Strategy {
  private _secretOrKey: string | Buffer;
  private _secretOrKeyProvider?: (request: any, rawJwtToken: any, done: any) => void;
  private _verify: JWTVerifyFunction;
  private _jwtFromRequest: (request: any) => string | null;
  private _issuer?: string;
  private _audience?: string;
  private _algorithms: string[];
  private _ignoreExpiration: boolean;
  private _passReqToCallback: boolean;
  private _jsonWebTokenOptions: any;

  constructor(options: JWTStrategyOptions, verify: JWTVerifyFunction) {
    super(options.name || 'jwt');

    if (!options.secretOrKey && !options.secretOrKeyProvider) {
      throw new TypeError('JWTStrategy requires either secretOrKey or secretOrKeyProvider');
    }

    if (!options.jwtFromRequest) {
      throw new TypeError('JWTStrategy requires jwtFromRequest option');
    }

    if (!verify || typeof verify !== 'function') {
      throw new TypeError('JWTStrategy requires a verify callback');
    }

    this._secretOrKey = options.secretOrKey;
    this._secretOrKeyProvider = options.secretOrKeyProvider;
    this._verify = verify;
    this._jwtFromRequest = options.jwtFromRequest;
    this._issuer = options.issuer;
    this._audience = options.audience;
    this._algorithms = options.algorithms || ['HS256'];
    this._ignoreExpiration = options.ignoreExpiration || false;
    this._passReqToCallback = options.passReqToCallback || false;
    this._jsonWebTokenOptions = options.jsonWebTokenOptions || {};
  }

  /**
   * Authenticate request based on JWT
   * @param req - Request object
   * @param options - Authentication options
   */
  authenticate(req: Request, options: any = {}): void {
    const token = this._jwtFromRequest(req);

    if (!token) {
      return this.fail({ message: 'No auth token' });
    }

    const verified = (err: Error | null, user?: any, info?: any) => {
      if (err) {
        return this.error(err);
      }

      if (!user) {
        return this.fail(info || { message: 'JWT authentication failed' });
      }

      this.success(user, info);
    };

    try {
      // Decode and verify JWT
      const getSecret = (callback: (err: any, secret?: string | Buffer) => void) => {
        if (this._secretOrKeyProvider) {
          this._secretOrKeyProvider(req, token, callback);
        } else {
          callback(null, this._secretOrKey);
        }
      };

      getSecret((err, secret) => {
        if (err) {
          return this.error(err);
        }

        try {
          const payload = this.verifyToken(token, secret!);

          // Verify issuer
          if (this._issuer && payload.iss !== this._issuer) {
            return this.fail({ message: 'JWT issuer invalid' });
          }

          // Verify audience
          if (this._audience) {
            const audience = Array.isArray(this._audience) ? this._audience : [this._audience];
            const tokenAud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
            const hasValidAudience = audience.some(aud => tokenAud.includes(aud));

            if (!hasValidAudience) {
              return this.fail({ message: 'JWT audience invalid' });
            }
          }

          // Verify expiration
          if (!this._ignoreExpiration && payload.exp) {
            const now = Math.floor(Date.now() / 1000);
            if (now >= payload.exp) {
              return this.fail({ message: 'JWT expired' });
            }
          }

          // Call verify callback
          if (this._passReqToCallback) {
            (this._verify as any)(req, payload, verified);
          } else {
            this._verify(payload, verified);
          }
        } catch (ex) {
          return this.fail({ message: 'Invalid JWT token' });
        }
      });
    } catch (ex) {
      return this.error(ex as Error);
    }
  }

  /**
   * Verify JWT token (simplified implementation)
   * @param token - JWT token
   * @param secret - Secret key
   */
  private verifyToken(token: string, secret: string | Buffer): any {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT token format');
    }

    const [headerB64, payloadB64, signatureB64] = parts;

    // Decode payload
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());

    // Verify signature
    const algorithm = this._algorithms[0];
    let hmacAlg: string;

    switch (algorithm) {
      case 'HS256':
        hmacAlg = 'sha256';
        break;
      case 'HS384':
        hmacAlg = 'sha384';
        break;
      case 'HS512':
        hmacAlg = 'sha512';
        break;
      default:
        throw new Error(`Unsupported algorithm: ${algorithm}`);
    }

    const hmac = crypto.createHmac(hmacAlg, secret);
    hmac.update(`${headerB64}.${payloadB64}`);
    const expectedSignature = hmac.digest('base64url');

    if (expectedSignature !== signatureB64) {
      throw new Error('JWT signature verification failed');
    }

    return payload;
  }
}

/**
 * Create a new JWTStrategy instance
 */
export function createJWTStrategy(
  options: JWTStrategyOptions,
  verify: JWTVerifyFunction
): JWTStrategy {
  return new JWTStrategy(options, verify);
}
