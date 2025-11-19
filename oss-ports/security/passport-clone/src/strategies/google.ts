/**
 * @elide/passport - Google OAuth2 Strategy
 * Google authentication using OAuth2
 */

import { OAuth2Strategy } from './oauth2';
import { OAuth2StrategyOptions, OAuth2VerifyFunction, Profile } from '../types';

export interface GoogleStrategyOptions extends Partial<OAuth2StrategyOptions> {
  clientID: string;
  clientSecret: string;
  callbackURL?: string;
  scope?: string | string[];
  hostedDomain?: string;
  prompt?: string;
  accessType?: string;
  includeGrantedScopes?: boolean;
}

/**
 * Google OAuth2 authentication strategy
 * Authenticates users using their Google account
 */
export class GoogleStrategy extends OAuth2Strategy {
  private _hostedDomain?: string;
  private _prompt?: string;
  private _accessType?: string;
  private _includeGrantedScopes?: boolean;

  constructor(options: GoogleStrategyOptions, verify: OAuth2VerifyFunction) {
    const oauth2Options: OAuth2StrategyOptions = {
      authorizationURL: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenURL: 'https://oauth2.googleapis.com/token',
      clientID: options.clientID,
      clientSecret: options.clientSecret,
      callbackURL: options.callbackURL,
      scope: options.scope || ['profile', 'email'],
      name: 'google',
      ...options
    };

    super(oauth2Options, verify);

    this._hostedDomain = options.hostedDomain;
    this._prompt = options.prompt;
    this._accessType = options.accessType;
    this._includeGrantedScopes = options.includeGrantedScopes;
  }

  /**
   * Load user profile from Google
   */
  protected loadUserProfile(
    accessToken: string,
    callback: (err: Error | null, profile?: Profile) => void
  ): void {
    // In real implementation, this would fetch from Google's userinfo endpoint
    // https://www.googleapis.com/oauth2/v3/userinfo

    const mockProfile = {
      sub: 'google-user-12345',
      name: 'John Doe',
      given_name: 'John',
      family_name: 'Doe',
      picture: 'https://lh3.googleusercontent.com/a/default-user',
      email: 'john.doe@gmail.com',
      email_verified: true,
      locale: 'en'
    };

    const profile = this.parseProfile(mockProfile);
    callback(null, profile);
  }

  /**
   * Parse Google profile
   */
  protected parseProfile(json: any): Profile {
    return {
      provider: 'google',
      id: json.sub || json.id,
      displayName: json.name,
      name: {
        familyName: json.family_name,
        givenName: json.given_name
      },
      emails: json.email ? [{
        value: json.email,
        type: json.email_verified ? 'verified' : 'unverified'
      }] : undefined,
      photos: json.picture ? [{
        value: json.picture
      }] : undefined,
      _raw: JSON.stringify(json),
      _json: json
    };
  }
}

/**
 * Create a new GoogleStrategy instance
 */
export function createGoogleStrategy(
  options: GoogleStrategyOptions,
  verify: OAuth2VerifyFunction
): GoogleStrategy {
  return new GoogleStrategy(options, verify);
}
