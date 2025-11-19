/**
 * @elide/passport - GitHub OAuth2 Strategy
 * GitHub authentication using OAuth2
 */

import { OAuth2Strategy } from './oauth2';
import { OAuth2StrategyOptions, OAuth2VerifyFunction, Profile } from '../types';

export interface GitHubStrategyOptions extends Partial<OAuth2StrategyOptions> {
  clientID: string;
  clientSecret: string;
  callbackURL?: string;
  scope?: string | string[];
  userAgent?: string;
  allowSignup?: boolean;
}

/**
 * GitHub OAuth2 authentication strategy
 * Authenticates users using their GitHub account
 */
export class GitHubStrategy extends OAuth2Strategy {
  private _userAgent: string;
  private _allowSignup?: boolean;
  private _userProfileURL: string;

  constructor(options: GitHubStrategyOptions, verify: OAuth2VerifyFunction) {
    const oauth2Options: OAuth2StrategyOptions = {
      authorizationURL: 'https://github.com/login/oauth/authorize',
      tokenURL: 'https://github.com/login/oauth/access_token',
      clientID: options.clientID,
      clientSecret: options.clientSecret,
      callbackURL: options.callbackURL,
      scope: options.scope || ['user:email'],
      name: 'github',
      ...options
    };

    super(oauth2Options, verify);

    this._userAgent = options.userAgent || 'passport-github';
    this._allowSignup = options.allowSignup;
    this._userProfileURL = 'https://api.github.com/user';
  }

  /**
   * Load user profile from GitHub
   */
  protected loadUserProfile(
    accessToken: string,
    callback: (err: Error | null, profile?: Profile) => void
  ): void {
    // In real implementation, this would fetch from GitHub's API
    // https://api.github.com/user

    const mockProfile = {
      id: 123456,
      login: 'johndoe',
      name: 'John Doe',
      email: 'john.doe@example.com',
      avatar_url: 'https://avatars.githubusercontent.com/u/123456',
      html_url: 'https://github.com/johndoe',
      bio: 'Software Developer',
      company: 'Acme Corp',
      location: 'San Francisco, CA',
      public_repos: 42,
      public_gists: 5,
      followers: 100,
      following: 50,
      created_at: '2010-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    };

    const profile = this.parseProfile(mockProfile);
    callback(null, profile);
  }

  /**
   * Parse GitHub profile
   */
  protected parseProfile(json: any): Profile {
    return {
      provider: 'github',
      id: String(json.id),
      displayName: json.name || json.login,
      username: json.login,
      name: json.name ? {
        familyName: json.name.split(' ').pop(),
        givenName: json.name.split(' ').shift()
      } : undefined,
      emails: json.email ? [{
        value: json.email
      }] : undefined,
      photos: json.avatar_url ? [{
        value: json.avatar_url
      }] : undefined,
      _raw: JSON.stringify(json),
      _json: json
    };
  }
}

/**
 * Create a new GitHubStrategy instance
 */
export function createGitHubStrategy(
  options: GitHubStrategyOptions,
  verify: OAuth2VerifyFunction
): GitHubStrategy {
  return new GitHubStrategy(options, verify);
}
