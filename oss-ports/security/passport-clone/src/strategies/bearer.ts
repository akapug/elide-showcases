/**
 * @elide/passport - Bearer Token Strategy
 * HTTP Bearer token authentication strategy
 */

import { Strategy } from './strategy';
import { StrategyOptions, Request, VerifyCallback } from '../types';

export type BearerVerifyFunction = (
  token: string,
  done: VerifyCallback
) => void;

export interface BearerStrategyOptions extends StrategyOptions {
  realm?: string;
  scope?: string | string[];
}

/**
 * Bearer token authentication strategy
 * Authenticates users using Bearer tokens in Authorization header
 */
export class BearerStrategy extends Strategy {
  private _verify: BearerVerifyFunction;
  private _realm: string;
  private _scope?: string | string[];

  constructor(options: BearerStrategyOptions, verify: BearerVerifyFunction);
  constructor(verify: BearerVerifyFunction);
  constructor(
    optionsOrVerify: BearerStrategyOptions | BearerVerifyFunction,
    verify?: BearerVerifyFunction
  ) {
    let options: BearerStrategyOptions = {};

    if (typeof optionsOrVerify === 'function') {
      verify = optionsOrVerify;
      options = {};
    } else {
      options = optionsOrVerify;
    }

    if (!verify) {
      throw new TypeError('BearerStrategy requires a verify callback');
    }

    super(options.name || 'bearer');

    this._verify = verify;
    this._realm = options.realm || 'Users';
    this._scope = options.scope;
  }

  /**
   * Authenticate request based on Bearer token
   * @param req - Request object
   */
  authenticate(req: Request, options: any = {}): void {
    const token = this.parseToken(req);

    if (!token) {
      return this.fail(this.buildChallenge(), 401);
    }

    const verified = (err: Error | null, user?: any, info?: any) => {
      if (err) {
        return this.error(err);
      }

      if (!user) {
        return this.fail(this.buildChallenge(info?.message), 401);
      }

      this.success(user, info);
    };

    try {
      this._verify(token, verified);
    } catch (ex) {
      return this.error(ex as Error);
    }
  }

  /**
   * Parse Bearer token from request
   */
  private parseToken(req: Request): string | null {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }

  /**
   * Build WWW-Authenticate challenge
   */
  private buildChallenge(message?: string): string {
    let challenge = `Bearer realm="${this._realm}"`;

    if (this._scope) {
      const scope = Array.isArray(this._scope)
        ? this._scope.join(' ')
        : this._scope;
      challenge += `, scope="${scope}"`;
    }

    if (message) {
      challenge += `, error="${message}"`;
    }

    return challenge;
  }
}

/**
 * Create a new BearerStrategy instance
 */
export function createBearerStrategy(
  options: BearerStrategyOptions | BearerVerifyFunction,
  verify?: BearerVerifyFunction
): BearerStrategy {
  if (typeof options === 'function') {
    return new BearerStrategy(options);
  }
  return new BearerStrategy(options, verify!);
}
