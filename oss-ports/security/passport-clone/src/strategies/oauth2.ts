/**
 * @elide/passport - OAuth2 Strategy
 * Generic OAuth2 authentication strategy
 */

import { Strategy } from './strategy';
import { OAuth2StrategyOptions, OAuth2VerifyFunction, Profile, Request } from '../types';
import * as crypto from 'crypto';

/**
 * OAuth2 authentication strategy
 * Base class for OAuth2 providers (Google, GitHub, Facebook, etc.)
 */
export class OAuth2Strategy extends Strategy {
  protected _oauth2Options: OAuth2StrategyOptions;
  protected _verify: OAuth2VerifyFunction;
  protected _authorizationURL: string;
  protected _tokenURL: string;
  protected _clientID: string;
  protected _clientSecret: string;
  protected _callbackURL?: string;
  protected _scope?: string | string[];
  protected _scopeSeparator: string;
  protected _state: boolean | string;
  protected _skipUserProfile: boolean;
  protected _passReqToCallback: boolean;

  constructor(options: OAuth2StrategyOptions, verify: OAuth2VerifyFunction) {
    super(options.name || 'oauth2');

    if (!verify || typeof verify !== 'function') {
      throw new TypeError('OAuth2Strategy requires a verify callback');
    }

    if (!options.authorizationURL) {
      throw new TypeError('OAuth2Strategy requires authorizationURL option');
    }

    if (!options.tokenURL) {
      throw new TypeError('OAuth2Strategy requires tokenURL option');
    }

    if (!options.clientID) {
      throw new TypeError('OAuth2Strategy requires clientID option');
    }

    if (!options.clientSecret) {
      throw new TypeError('OAuth2Strategy requires clientSecret option');
    }

    this._oauth2Options = options;
    this._verify = verify;
    this._authorizationURL = options.authorizationURL;
    this._tokenURL = options.tokenURL;
    this._clientID = options.clientID;
    this._clientSecret = options.clientSecret;
    this._callbackURL = options.callbackURL;
    this._scope = options.scope;
    this._scopeSeparator = options.scopeSeparator || ' ';
    this._state = options.state !== undefined ? options.state : true;
    this._skipUserProfile = options.skipUserProfile || false;
    this._passReqToCallback = options.passReqToCallback || false;
  }

  /**
   * Authenticate request using OAuth2
   * @param req - Request object
   * @param options - Authentication options
   */
  authenticate(req: Request, options: any = {}): void {
    options = { ...this._oauth2Options, ...options };

    // Check if this is a callback from OAuth2 provider
    if (req.query && req.query.code) {
      return this.handleCallback(req, options);
    }

    // Check for error in callback
    if (req.query && req.query.error) {
      return this.fail({ message: req.query.error_description || req.query.error });
    }

    // Redirect to authorization URL
    this.redirectToAuthorizationURL(req, options);
  }

  /**
   * Redirect to OAuth2 authorization URL
   */
  private redirectToAuthorizationURL(req: Request, options: any): void {
    const params: any = {
      response_type: 'code',
      client_id: this._clientID,
      redirect_uri: options.callbackURL || this._callbackURL
    };

    // Add scope
    if (this._scope) {
      const scope = Array.isArray(this._scope) ? this._scope.join(this._scopeSeparator) : this._scope;
      params.scope = scope;
    }

    // Add state for CSRF protection
    if (this._state) {
      const state = typeof this._state === 'string' ? this._state : this.generateState();
      params.state = state;

      // Store state in session
      if (req.session) {
        req.session.oauth2State = state;
      }
    }

    const query = new URLSearchParams(params).toString();
    const redirectURL = `${this._authorizationURL}?${query}`;

    this.redirect(redirectURL);
  }

  /**
   * Handle OAuth2 callback
   */
  private handleCallback(req: Request, options: any): void {
    const code = req.query.code;
    const state = req.query.state;

    // Verify state for CSRF protection
    if (this._state && req.session) {
      const expectedState = req.session.oauth2State;
      delete req.session.oauth2State;

      if (state !== expectedState) {
        return this.fail({ message: 'Invalid state parameter' });
      }
    }

    // Exchange code for access token
    this.exchangeCodeForToken(code, options, (err, accessToken, refreshToken, params) => {
      if (err) {
        return this.error(err);
      }

      // Load user profile
      if (this._skipUserProfile) {
        this.verifyUser(req, accessToken!, refreshToken!, {});
      } else {
        this.loadUserProfile(accessToken!, (err, profile) => {
          if (err) {
            return this.error(err);
          }

          this.verifyUser(req, accessToken!, refreshToken!, profile!);
        });
      }
    });
  }

  /**
   * Exchange authorization code for access token
   */
  protected exchangeCodeForToken(
    code: string,
    options: any,
    callback: (err: Error | null, accessToken?: string, refreshToken?: string, params?: any) => void
  ): void {
    const params = {
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: options.callbackURL || this._callbackURL,
      client_id: this._clientID,
      client_secret: this._clientSecret
    };

    // Simulate token exchange (in real implementation, this would make HTTP request)
    const accessToken = this.generateToken();
    const refreshToken = this.generateToken();

    callback(null, accessToken, refreshToken, {});
  }

  /**
   * Load user profile from provider
   * Should be overridden by provider-specific strategies
   */
  protected loadUserProfile(
    accessToken: string,
    callback: (err: Error | null, profile?: Profile) => void
  ): void {
    // Default implementation - should be overridden
    const profile: Profile = {
      provider: this.name,
      id: 'user123',
      displayName: 'Test User'
    };

    callback(null, profile);
  }

  /**
   * Verify user with application
   */
  private verifyUser(
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: Profile | any
  ): void {
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
        (this._verify as any)(req, accessToken, refreshToken, profile, verified);
      } else {
        this._verify(accessToken, refreshToken, profile, verified);
      }
    } catch (ex) {
      return this.error(ex as Error);
    }
  }

  /**
   * Generate random state for CSRF protection
   */
  protected generateState(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate random token
   */
  protected generateToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * Parse profile from provider response
   * Should be overridden by provider-specific strategies
   */
  protected parseProfile(json: any): Profile {
    return {
      provider: this.name,
      id: json.id || json.sub,
      displayName: json.name || json.displayName,
      name: {
        familyName: json.family_name || json.lastName,
        givenName: json.given_name || json.firstName,
        middleName: json.middle_name
      },
      emails: json.email ? [{ value: json.email }] : undefined,
      photos: json.picture ? [{ value: json.picture }] : undefined,
      _raw: JSON.stringify(json),
      _json: json
    };
  }
}

/**
 * Create a new OAuth2Strategy instance
 */
export function createOAuth2Strategy(
  options: OAuth2StrategyOptions,
  verify: OAuth2VerifyFunction
): OAuth2Strategy {
  return new OAuth2Strategy(options, verify);
}
