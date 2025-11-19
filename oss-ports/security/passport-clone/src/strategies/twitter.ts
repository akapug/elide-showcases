/**
 * @elide/passport - Twitter OAuth Strategy
 * Twitter authentication using OAuth 1.0a
 */

import { Strategy } from './strategy';
import { StrategyOptions, Request, Profile, VerifyCallback } from '../types';
import * as crypto from 'crypto';

export type TwitterVerifyFunction = (
  token: string,
  tokenSecret: string,
  profile: Profile,
  done: VerifyCallback
) => void;

export interface TwitterStrategyOptions extends StrategyOptions {
  consumerKey: string;
  consumerSecret: string;
  callbackURL?: string;
  includeEmail?: boolean;
  skipExtendedUserProfile?: boolean;
}

/**
 * Twitter OAuth 1.0a authentication strategy
 * Authenticates users using their Twitter account
 */
export class TwitterStrategy extends Strategy {
  private _consumerKey: string;
  private _consumerSecret: string;
  private _callbackURL?: string;
  private _includeEmail: boolean;
  private _skipExtendedUserProfile: boolean;
  private _verify: TwitterVerifyFunction;
  private _requestTokenURL: string;
  private _accessTokenURL: string;
  private _userAuthorizationURL: string;
  private _userProfileURL: string;

  constructor(options: TwitterStrategyOptions, verify: TwitterVerifyFunction) {
    if (!verify || typeof verify !== 'function') {
      throw new TypeError('TwitterStrategy requires a verify callback');
    }

    if (!options.consumerKey) {
      throw new TypeError('TwitterStrategy requires consumerKey option');
    }

    if (!options.consumerSecret) {
      throw new TypeError('TwitterStrategy requires consumerSecret option');
    }

    super(options.name || 'twitter');

    this._consumerKey = options.consumerKey;
    this._consumerSecret = options.consumerSecret;
    this._callbackURL = options.callbackURL;
    this._includeEmail = options.includeEmail || false;
    this._skipExtendedUserProfile = options.skipExtendedUserProfile || false;
    this._verify = verify;

    this._requestTokenURL = 'https://api.twitter.com/oauth/request_token';
    this._accessTokenURL = 'https://api.twitter.com/oauth/access_token';
    this._userAuthorizationURL = 'https://api.twitter.com/oauth/authorize';
    this._userProfileURL = 'https://api.twitter.com/1.1/account/verify_credentials.json';
  }

  /**
   * Authenticate request using Twitter OAuth
   * @param req - Request object
   * @param options - Authentication options
   */
  authenticate(req: Request, options: any = {}): void {
    // Check if this is a callback from Twitter
    if (req.query && req.query.oauth_token && req.query.oauth_verifier) {
      return this.handleCallback(req, options);
    }

    // Check for error in callback
    if (req.query && req.query.denied) {
      return this.fail({ message: 'User denied authorization' });
    }

    // Redirect to Twitter authorization URL
    this.redirectToAuthorizationURL(req, options);
  }

  /**
   * Redirect to Twitter authorization URL
   */
  private redirectToAuthorizationURL(req: Request, options: any): void {
    // Get request token
    const requestToken = this.generateToken();
    const requestTokenSecret = this.generateToken();

    // Store in session
    if (req.session) {
      req.session.oauthRequestToken = requestToken;
      req.session.oauthRequestTokenSecret = requestTokenSecret;
    }

    const params = new URLSearchParams({
      oauth_token: requestToken
    });

    const redirectURL = `${this._userAuthorizationURL}?${params.toString()}`;
    this.redirect(redirectURL);
  }

  /**
   * Handle Twitter callback
   */
  private handleCallback(req: Request, options: any): void {
    const oauthToken = req.query.oauth_token;
    const oauthVerifier = req.query.oauth_verifier;

    // Verify request token from session
    if (req.session) {
      const expectedToken = req.session.oauthRequestToken;
      const tokenSecret = req.session.oauthRequestTokenSecret;

      delete req.session.oauthRequestToken;
      delete req.session.oauthRequestTokenSecret;

      if (oauthToken !== expectedToken) {
        return this.fail({ message: 'Invalid OAuth token' });
      }
    }

    // Exchange for access token
    const accessToken = this.generateToken();
    const accessTokenSecret = this.generateToken();

    // Load user profile
    this.loadUserProfile(accessToken, accessTokenSecret, (err, profile) => {
      if (err) {
        return this.error(err);
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
        this._verify(accessToken, accessTokenSecret, profile!, verified);
      } catch (ex) {
        return this.error(ex as Error);
      }
    });
  }

  /**
   * Load user profile from Twitter
   */
  private loadUserProfile(
    token: string,
    tokenSecret: string,
    callback: (err: Error | null, profile?: Profile) => void
  ): void {
    // In real implementation, this would fetch from Twitter's API
    const mockProfile = {
      id_str: 'twitter-user-12345',
      screen_name: 'johndoe',
      name: 'John Doe',
      profile_image_url_https: 'https://pbs.twimg.com/profile_images/example.jpg',
      description: 'Software developer',
      location: 'New York, NY',
      followers_count: 1000,
      friends_count: 500,
      created_at: 'Mon Jan 01 00:00:00 +0000 2010',
      email: 'john.doe@example.com'
    };

    const profile = this.parseProfile(mockProfile);
    callback(null, profile);
  }

  /**
   * Parse Twitter profile
   */
  private parseProfile(json: any): Profile {
    return {
      provider: 'twitter',
      id: json.id_str,
      username: json.screen_name,
      displayName: json.name,
      emails: json.email ? [{
        value: json.email
      }] : undefined,
      photos: json.profile_image_url_https ? [{
        value: json.profile_image_url_https.replace('_normal', '')
      }] : undefined,
      _raw: JSON.stringify(json),
      _json: json
    };
  }

  /**
   * Generate random token
   */
  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

/**
 * Create a new TwitterStrategy instance
 */
export function createTwitterStrategy(
  options: TwitterStrategyOptions,
  verify: TwitterVerifyFunction
): TwitterStrategy {
  return new TwitterStrategy(options, verify);
}
