/**
 * @elide/passport - Local Strategy
 * Username and password authentication strategy
 */

import { Strategy } from './strategy';
import { LocalStrategyOptions, VerifyFunction, Request } from '../types';

/**
 * Local authentication strategy
 * Authenticates users using username and password
 */
export class LocalStrategy extends Strategy {
  private _usernameField: string;
  private _passwordField: string;
  private _verify: VerifyFunction;
  private _passReqToCallback: boolean;

  constructor(options: LocalStrategyOptions, verify: VerifyFunction);
  constructor(verify: VerifyFunction);
  constructor(
    optionsOrVerify: LocalStrategyOptions | VerifyFunction,
    verify?: VerifyFunction
  ) {
    let options: LocalStrategyOptions = {};

    if (typeof optionsOrVerify === 'function') {
      verify = optionsOrVerify;
      options = {};
    } else {
      options = optionsOrVerify;
    }

    if (!verify) {
      throw new TypeError('LocalStrategy requires a verify callback');
    }

    super(options.name || 'local');

    this._usernameField = options.usernameField || 'username';
    this._passwordField = options.passwordField || 'password';
    this._verify = verify;
    this._passReqToCallback = options.passReqToCallback || false;
  }

  /**
   * Authenticate request based on username and password
   * @param req - Request object
   * @param options - Authentication options
   */
  authenticate(req: Request, options: any = {}): void {
    const username = this.lookup(req.body, this._usernameField) ||
                     this.lookup(req.query, this._usernameField);
    const password = this.lookup(req.body, this._passwordField) ||
                     this.lookup(req.query, this._passwordField);

    if (!username || !password) {
      return this.fail({ message: options.badRequestMessage || 'Missing credentials' }, 400);
    }

    const verified = (err: Error | null, user?: any, info?: any) => {
      if (err) {
        return this.error(err);
      }

      if (!user) {
        return this.fail(info);
      }

      this.success(user, info);
    };

    try {
      if (this._passReqToCallback) {
        (this._verify as any)(req, username, password, verified);
      } else {
        this._verify(username, password, verified);
      }
    } catch (ex) {
      return this.error(ex as Error);
    }
  }

  /**
   * Lookup field in object
   * @param obj - Object to search
   * @param field - Field name
   */
  private lookup(obj: any, field: string): string | undefined {
    if (!obj) return undefined;

    const chain = field.split(']').join('').split('[');
    let value = obj;

    for (const key of chain) {
      if (value === null || value === undefined) return undefined;
      value = value[key];
    }

    return value;
  }
}

/**
 * Create a new LocalStrategy instance
 */
export function createLocalStrategy(
  options: LocalStrategyOptions | VerifyFunction,
  verify?: VerifyFunction
): LocalStrategy {
  if (typeof options === 'function') {
    return new LocalStrategy(options);
  }
  return new LocalStrategy(options, verify!);
}
