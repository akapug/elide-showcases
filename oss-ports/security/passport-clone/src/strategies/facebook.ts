/**
 * @elide/passport - Facebook OAuth2 Strategy
 * Facebook authentication using OAuth2
 */

import { OAuth2Strategy } from './oauth2';
import { OAuth2StrategyOptions, OAuth2VerifyFunction, Profile } from '../types';

export interface FacebookStrategyOptions extends Partial<OAuth2StrategyOptions> {
  clientID: string;
  clientSecret: string;
  callbackURL?: string;
  scope?: string | string[];
  profileFields?: string[];
  enableProof?: boolean;
  authType?: string;
  display?: string;
}

/**
 * Facebook OAuth2 authentication strategy
 * Authenticates users using their Facebook account
 */
export class FacebookStrategy extends OAuth2Strategy {
  private _profileFields: string[];
  private _enableProof: boolean;
  private _authType?: string;
  private _display?: string;

  constructor(options: FacebookStrategyOptions, verify: OAuth2VerifyFunction) {
    const oauth2Options: OAuth2StrategyOptions = {
      authorizationURL: 'https://www.facebook.com/v12.0/dialog/oauth',
      tokenURL: 'https://graph.facebook.com/v12.0/oauth/access_token',
      clientID: options.clientID,
      clientSecret: options.clientSecret,
      callbackURL: options.callbackURL,
      scope: options.scope || ['email', 'public_profile'],
      scopeSeparator: ',',
      name: 'facebook',
      ...options
    };

    super(oauth2Options, verify);

    this._profileFields = options.profileFields || [
      'id',
      'name',
      'email',
      'picture',
      'first_name',
      'last_name'
    ];
    this._enableProof = options.enableProof !== false;
    this._authType = options.authType;
    this._display = options.display;
  }

  /**
   * Load user profile from Facebook
   */
  protected loadUserProfile(
    accessToken: string,
    callback: (err: Error | null, profile?: Profile) => void
  ): void {
    // In real implementation, this would fetch from Facebook's Graph API
    // https://graph.facebook.com/me?fields=id,name,email,picture

    const mockProfile = {
      id: 'facebook-user-12345',
      name: 'Jane Smith',
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@example.com',
      picture: {
        data: {
          url: 'https://platform-lookaside.fbsbx.com/platform/profilepic/'
        }
      }
    };

    const profile = this.parseProfile(mockProfile);
    callback(null, profile);
  }

  /**
   * Parse Facebook profile
   */
  protected parseProfile(json: any): Profile {
    return {
      provider: 'facebook',
      id: json.id,
      displayName: json.name,
      name: {
        familyName: json.last_name,
        givenName: json.first_name,
        middleName: json.middle_name
      },
      emails: json.email ? [{
        value: json.email
      }] : undefined,
      photos: json.picture?.data?.url ? [{
        value: json.picture.data.url
      }] : undefined,
      _raw: JSON.stringify(json),
      _json: json
    };
  }
}

/**
 * Create a new FacebookStrategy instance
 */
export function createFacebookStrategy(
  options: FacebookStrategyOptions,
  verify: OAuth2VerifyFunction
): FacebookStrategy {
  return new FacebookStrategy(options, verify);
}
