/**
 * @elide/passport - Core Authenticator
 * Manages authentication strategies and session handling
 */

import {
  Strategy,
  SerializeFunction,
  DeserializeFunction,
  DoneCallback,
  SessionManager,
  Framework,
  AuthenticateOptions,
  Request,
  User
} from './types';
import { SessionStrategy } from './strategies/session';

/**
 * Main Passport Authenticator class
 * Handles strategy registration, user serialization, and authentication
 */
export class Authenticator {
  private _strategies: Map<string, Strategy> = new Map();
  private _serializers: SerializeFunction[] = [];
  private _deserializers: DeserializeFunction[] = [];
  private _infoTransformers: any[] = [];
  private _framework: Framework | null = null;
  private _userProperty: string = 'user';
  private _key: string = 'passport';
  private _sm: SessionManager | null = null;

  /**
   * Initialize Passport with optional configuration
   */
  constructor() {
    this.use(new SessionStrategy());
    this._framework = this._createFramework();
  }

  /**
   * Register an authentication strategy
   * @param name - Strategy name or Strategy instance
   * @param strategy - Strategy instance (if name provided)
   */
  use(name: string | Strategy, strategy?: Strategy): this {
    if (!strategy) {
      strategy = name as Strategy;
      name = strategy.name;
    }

    if (!name || typeof name !== 'string') {
      throw new Error('Authentication strategies must have a name');
    }

    this._strategies.set(name as string, strategy);
    return this;
  }

  /**
   * Remove a registered strategy
   * @param name - Strategy name to remove
   */
  unuse(name: string): this {
    this._strategies.delete(name);
    return this;
  }

  /**
   * Get framework middleware
   */
  framework(fw?: Framework): Framework {
    if (fw) {
      this._framework = fw;
    }
    return this._framework!;
  }

  /**
   * Initialize middleware
   * @param options - Initialization options
   */
  initialize(options: { userProperty?: string } = {}): any {
    this._userProperty = options.userProperty || 'user';
    return this._framework!.initialize(this, options);
  }

  /**
   * Session support middleware
   * @param options - Session options
   */
  session(options: any = {}): any {
    return this.authenticate('session', options);
  }

  /**
   * Authenticate using specified strategy
   * @param strategy - Strategy name or array of names
   * @param options - Authentication options
   * @param callback - Optional callback
   */
  authenticate(
    strategy: string | string[],
    options?: AuthenticateOptions | any,
    callback?: any
  ): any {
    return this._framework!.authenticate(this, strategy, options, callback);
  }

  /**
   * Register user serializer
   * @param fn - Serialization function
   */
  serializeUser(fn: SerializeFunction): void;
  serializeUser(user: any, done: DoneCallback): void;
  serializeUser(fnOrUser: SerializeFunction | any, done?: DoneCallback): void {
    if (typeof fnOrUser === 'function') {
      this._serializers.push(fnOrUser);
    } else {
      this._serializeUser(fnOrUser, done!);
    }
  }

  /**
   * Register user deserializer
   * @param fn - Deserialization function
   */
  deserializeUser(fn: DeserializeFunction): void;
  deserializeUser(obj: any, done: DoneCallback): void;
  deserializeUser(fnOrObj: DeserializeFunction | any, done?: DoneCallback): void {
    if (typeof fnOrObj === 'function') {
      this._deserializers.push(fnOrObj);
    } else {
      this._deserializeUser(fnOrObj, done!);
    }
  }

  /**
   * Transform authentication info
   * @param fn - Transform function
   */
  transformAuthInfo(fn: any): void {
    this._infoTransformers.push(fn);
  }

  /**
   * Internal: Serialize user
   */
  private _serializeUser(user: any, done: DoneCallback): void {
    const stack = this._serializers;
    let layer = 0;

    const serialized = (err: Error | null, obj?: any) => {
      if (err) return done(err);
      if (obj !== undefined) return done(null, obj);

      if (layer >= stack.length) {
        return done(new Error('Failed to serialize user into session'));
      }

      const fn = stack[layer];
      layer++;

      try {
        fn(user, serialized);
      } catch (e) {
        done(e as Error);
      }
    };

    serialized(null);
  }

  /**
   * Internal: Deserialize user
   */
  private _deserializeUser(obj: any, done: DoneCallback): void {
    const stack = this._deserializers;
    let layer = 0;

    const deserialized = (err: Error | null, user?: any) => {
      if (err) return done(err);
      if (user !== undefined) return done(null, user);

      if (layer >= stack.length) {
        return done(null, false);
      }

      const fn = stack[layer];
      layer++;

      try {
        fn(obj, deserialized);
      } catch (e) {
        done(e as Error);
      }
    };

    deserialized(null);
  }

  /**
   * Get strategy by name
   */
  _strategy(name: string): Strategy | undefined {
    return this._strategies.get(name);
  }

  /**
   * Create HTTP framework adapter
   */
  private _createFramework(): Framework {
    return {
      /**
       * Initialize Passport middleware
       */
      initialize: (passport: Authenticator, options: any = {}) => {
        return (req: Request, res: any, next: any) => {
          req.login = req.logIn = (user: User, options: any, done?: any) => {
            if (typeof options === 'function') {
              done = options;
              options = {};
            }
            options = options || {};

            let property = passport._userProperty || 'user';
            let session = options.session !== undefined ? options.session : true;

            req[property] = user;

            if (session && req.session) {
              passport.serializeUser(user, (err: Error | null, serialized: any) => {
                if (err) return done ? done(err) : next(err);
                req.session![passport._key] = { user: serialized };
                if (done) done(null);
              });
            } else {
              if (done) done(null);
            }
          };

          req.logout = req.logOut = (options: any, done?: any) => {
            if (typeof options === 'function') {
              done = options;
              options = {};
            }

            let property = passport._userProperty || 'user';
            req[property] = null;

            if (req.session && req.session[passport._key]) {
              delete req.session[passport._key].user;
            }

            if (done) done(null);
          };

          req.isAuthenticated = () => {
            let property = passport._userProperty || 'user';
            return req[property] ? true : false;
          };

          req.isUnauthenticated = () => {
            return !req.isAuthenticated();
          };

          next();
        };
      },

      /**
       * Authenticate using strategy
       */
      authenticate: (
        passport: Authenticator,
        name: string | string[],
        options: AuthenticateOptions = {},
        callback?: any
      ) => {
        if (typeof options === 'function') {
          callback = options;
          options = {};
        }
        options = options || {};

        let multi = true;
        let names = Array.isArray(name) ? name : [name];

        return (req: Request, res: any, next: any) => {
          let failures: any[] = [];

          const attemptAuthenticate = (i: number) => {
            if (i >= names.length) {
              return allFailed();
            }

            let strategyName = names[i];
            let prototype = passport._strategy(strategyName);

            if (!prototype) {
              return next(new Error(`Unknown authentication strategy "${strategyName}"`));
            }

            let strategy = Object.create(prototype);

            // Override authenticate success
            strategy.success = (user: User, info?: any) => {
              if (callback) {
                return callback(null, user, info);
              }

              info = info || {};
              let property = options.assignProperty || passport._userProperty || 'user';

              req[property] = user;

              if (options.successRedirect) {
                return res.redirect(options.successRedirect);
              }

              if (options.successMessage) {
                req.session!.messages = req.session!.messages || [];
                req.session!.messages.push(options.successMessage);
              }

              next();
            };

            // Override authenticate failure
            strategy.fail = (challenge?: any, status?: number) => {
              if (typeof challenge === 'number') {
                status = challenge;
                challenge = undefined;
              }

              failures.push({ challenge, status: status || 401 });

              if (!multi) {
                return allFailed();
              }

              attemptAuthenticate(i + 1);
            };

            // Override authenticate redirect
            strategy.redirect = (url: string, status?: number) => {
              res.redirect(url);
            };

            // Override authenticate pass
            strategy.pass = () => {
              next();
            };

            // Override authenticate error
            strategy.error = (err: Error) => {
              if (callback) {
                return callback(err);
              }

              if (options.failWithError) {
                return next(err);
              }

              next();
            };

            strategy.authenticate(req, options);
          };

          const allFailed = () => {
            if (callback) {
              return callback(null, false, failures[0]?.challenge);
            }

            if (options.failureRedirect) {
              return res.redirect(options.failureRedirect);
            }

            if (options.failureMessage) {
              req.session!.messages = req.session!.messages || [];
              req.session!.messages.push(options.failureMessage);
            }

            let challenge = failures[0]?.challenge;
            let status = failures[0]?.status || 401;

            if (options.failWithError) {
              let err: any = new Error(challenge || 'Unauthorized');
              err.status = status;
              return next(err);
            }

            res.statusCode = status;
            res.setHeader('Content-Type', 'text/plain');
            res.end(challenge || 'Unauthorized');
          };

          attemptAuthenticate(0);
        };
      }
    };
  }
}

/**
 * Create a new Authenticator instance
 */
export function createPassport(): Authenticator {
  return new Authenticator();
}
