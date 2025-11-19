/**
 * Social Login Providers
 *
 * Integration with popular OAuth2 providers for social login:
 * - Google
 * - GitHub
 * - Facebook
 * - Twitter/X
 * - Microsoft
 * - Apple
 *
 * @module social-providers
 */

export type SocialProvider = 'google' | 'github' | 'facebook' | 'twitter' | 'microsoft' | 'apple';

export interface SocialProviderConfig {
  provider: SocialProvider;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  enabled: boolean;
}

export interface SocialAuthRequest {
  provider: SocialProvider;
  state: string;
  redirectUri: string;
  scopes?: string[];
}

export interface SocialAuthResult {
  provider: SocialProvider;
  providerId: string;
  email: string;
  name: string;
  picture?: string;
  emailVerified: boolean;
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  rawProfile: any;
}

export interface SocialUserProfile {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  picture?: string;
  locale?: string;
  emailVerified: boolean;
}

/**
 * Social Providers Manager
 */
export class SocialProvidersManager {
  private configs: Map<SocialProvider, SocialProviderConfig> = new Map();
  private pendingAuths: Map<string, SocialAuthRequest> = new Map();

  /**
   * Configure social provider
   */
  configureProvider(config: SocialProviderConfig): void {
    this.configs.set(config.provider, config);
  }

  /**
   * Get provider configuration
   */
  getProviderConfig(provider: SocialProvider): SocialProviderConfig | undefined {
    return this.configs.get(provider);
  }

  /**
   * Generate authorization URL for social login
   */
  getAuthorizationUrl(request: SocialAuthRequest): string {
    const config = this.configs.get(request.provider);
    if (!config) {
      throw new Error(`Provider ${request.provider} not configured`);
    }

    if (!config.enabled) {
      throw new Error(`Provider ${request.provider} is disabled`);
    }

    // Store pending auth
    this.pendingAuths.set(request.state, request);

    const scopes = request.scopes || config.scopes;

    switch (request.provider) {
      case 'google':
        return this.getGoogleAuthUrl(config, request.state, scopes);
      case 'github':
        return this.getGitHubAuthUrl(config, request.state, scopes);
      case 'facebook':
        return this.getFacebookAuthUrl(config, request.state, scopes);
      case 'twitter':
        return this.getTwitterAuthUrl(config, request.state, scopes);
      case 'microsoft':
        return this.getMicrosoftAuthUrl(config, request.state, scopes);
      case 'apple':
        return this.getAppleAuthUrl(config, request.state, scopes);
      default:
        throw new Error(`Unsupported provider: ${request.provider}`);
    }
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCode(
    provider: SocialProvider,
    code: string,
    state: string
  ): Promise<SocialAuthResult> {
    const config = this.configs.get(provider);
    if (!config) {
      throw new Error(`Provider ${provider} not configured`);
    }

    const request = this.pendingAuths.get(state);
    if (!request) {
      throw new Error('Invalid state parameter');
    }

    this.pendingAuths.delete(state);

    switch (provider) {
      case 'google':
        return this.exchangeGoogleCode(config, code);
      case 'github':
        return this.exchangeGitHubCode(config, code);
      case 'facebook':
        return this.exchangeFacebookCode(config, code);
      case 'twitter':
        return this.exchangeTwitterCode(config, code);
      case 'microsoft':
        return this.exchangeMicrosoftCode(config, code);
      case 'apple':
        return this.exchangeAppleCode(config, code);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  /**
   * Get user profile from provider
   */
  async getUserProfile(provider: SocialProvider, accessToken: string): Promise<SocialUserProfile> {
    switch (provider) {
      case 'google':
        return this.getGoogleProfile(accessToken);
      case 'github':
        return this.getGitHubProfile(accessToken);
      case 'facebook':
        return this.getFacebookProfile(accessToken);
      case 'twitter':
        return this.getTwitterProfile(accessToken);
      case 'microsoft':
        return this.getMicrosoftProfile(accessToken);
      case 'apple':
        return this.getAppleProfile(accessToken);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  /**
   * Link social account to user
   */
  linkSocialAccount(
    userId: string,
    provider: SocialProvider,
    providerId: string,
    profile: SocialUserProfile
  ): void {
    // Store social account link
    console.log(`Linking ${provider} account ${providerId} to user ${userId}`);
  }

  /**
   * Unlink social account
   */
  unlinkSocialAccount(userId: string, provider: SocialProvider): void {
    console.log(`Unlinking ${provider} account from user ${userId}`);
  }

  // Google OAuth2
  private getGoogleAuthUrl(config: SocialProviderConfig, state: string, scopes: string[]): string {
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      state,
      access_type: 'offline',
      prompt: 'consent'
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  private async exchangeGoogleCode(config: SocialProviderConfig, code: string): Promise<SocialAuthResult> {
    // In production, make actual API call
    console.log('Exchanging Google code:', code);

    return {
      provider: 'google',
      providerId: 'google_123456789',
      email: 'user@gmail.com',
      name: 'Google User',
      picture: 'https://lh3.googleusercontent.com/a/default-user',
      emailVerified: true,
      accessToken: 'google_access_token',
      refreshToken: 'google_refresh_token',
      expiresIn: 3600,
      rawProfile: {}
    };
  }

  private async getGoogleProfile(accessToken: string): Promise<SocialUserProfile> {
    // In production, make actual API call to https://www.googleapis.com/oauth2/v2/userinfo
    return {
      id: 'google_123456789',
      email: 'user@gmail.com',
      name: 'Google User',
      picture: 'https://lh3.googleusercontent.com/a/default-user',
      emailVerified: true
    };
  }

  // GitHub OAuth2
  private getGitHubAuthUrl(config: SocialProviderConfig, state: string, scopes: string[]): string {
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: scopes.join(' '),
      state,
      allow_signup: 'true'
    });
    return `https://github.com/login/oauth/authorize?${params}`;
  }

  private async exchangeGitHubCode(config: SocialProviderConfig, code: string): Promise<SocialAuthResult> {
    // In production, make actual API call
    console.log('Exchanging GitHub code:', code);

    return {
      provider: 'github',
      providerId: 'github_123456',
      email: 'user@github.com',
      name: 'GitHub User',
      picture: 'https://avatars.githubusercontent.com/u/123456',
      emailVerified: true,
      accessToken: 'github_access_token',
      rawProfile: {}
    };
  }

  private async getGitHubProfile(accessToken: string): Promise<SocialUserProfile> {
    // In production, make actual API call to https://api.github.com/user
    return {
      id: 'github_123456',
      email: 'user@github.com',
      name: 'GitHub User',
      picture: 'https://avatars.githubusercontent.com/u/123456',
      emailVerified: true
    };
  }

  // Facebook OAuth2
  private getFacebookAuthUrl(config: SocialProviderConfig, state: string, scopes: string[]): string {
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: scopes.join(','),
      state,
      response_type: 'code'
    });
    return `https://www.facebook.com/v18.0/dialog/oauth?${params}`;
  }

  private async exchangeFacebookCode(config: SocialProviderConfig, code: string): Promise<SocialAuthResult> {
    console.log('Exchanging Facebook code:', code);

    return {
      provider: 'facebook',
      providerId: 'facebook_123456789',
      email: 'user@facebook.com',
      name: 'Facebook User',
      picture: 'https://graph.facebook.com/123456789/picture',
      emailVerified: true,
      accessToken: 'facebook_access_token',
      expiresIn: 5184000,
      rawProfile: {}
    };
  }

  private async getFacebookProfile(accessToken: string): Promise<SocialUserProfile> {
    // In production, make actual API call to https://graph.facebook.com/me
    return {
      id: 'facebook_123456789',
      email: 'user@facebook.com',
      name: 'Facebook User',
      picture: 'https://graph.facebook.com/123456789/picture',
      emailVerified: true
    };
  }

  // Twitter/X OAuth2
  private getTwitterAuthUrl(config: SocialProviderConfig, state: string, scopes: string[]): string {
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: scopes.join(' '),
      state,
      response_type: 'code',
      code_challenge: 'challenge',
      code_challenge_method: 'plain'
    });
    return `https://twitter.com/i/oauth2/authorize?${params}`;
  }

  private async exchangeTwitterCode(config: SocialProviderConfig, code: string): Promise<SocialAuthResult> {
    console.log('Exchanging Twitter code:', code);

    return {
      provider: 'twitter',
      providerId: 'twitter_123456789',
      email: 'user@twitter.com',
      name: 'Twitter User',
      picture: 'https://pbs.twimg.com/profile_images/123456789/avatar.jpg',
      emailVerified: false,
      accessToken: 'twitter_access_token',
      expiresIn: 7200,
      rawProfile: {}
    };
  }

  private async getTwitterProfile(accessToken: string): Promise<SocialUserProfile> {
    return {
      id: 'twitter_123456789',
      email: 'user@twitter.com',
      name: 'Twitter User',
      picture: 'https://pbs.twimg.com/profile_images/123456789/avatar.jpg',
      emailVerified: false
    };
  }

  // Microsoft OAuth2
  private getMicrosoftAuthUrl(config: SocialProviderConfig, state: string, scopes: string[]): string {
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      state,
      response_mode: 'query'
    });
    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`;
  }

  private async exchangeMicrosoftCode(config: SocialProviderConfig, code: string): Promise<SocialAuthResult> {
    console.log('Exchanging Microsoft code:', code);

    return {
      provider: 'microsoft',
      providerId: 'microsoft_123456789',
      email: 'user@outlook.com',
      name: 'Microsoft User',
      picture: 'https://graph.microsoft.com/v1.0/me/photo/$value',
      emailVerified: true,
      accessToken: 'microsoft_access_token',
      refreshToken: 'microsoft_refresh_token',
      expiresIn: 3600,
      rawProfile: {}
    };
  }

  private async getMicrosoftProfile(accessToken: string): Promise<SocialUserProfile> {
    return {
      id: 'microsoft_123456789',
      email: 'user@outlook.com',
      name: 'Microsoft User',
      emailVerified: true
    };
  }

  // Apple OAuth2
  private getAppleAuthUrl(config: SocialProviderConfig, state: string, scopes: string[]): string {
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      state,
      response_mode: 'form_post'
    });
    return `https://appleid.apple.com/auth/authorize?${params}`;
  }

  private async exchangeAppleCode(config: SocialProviderConfig, code: string): Promise<SocialAuthResult> {
    console.log('Exchanging Apple code:', code);

    return {
      provider: 'apple',
      providerId: 'apple_123456789',
      email: 'user@privaterelay.appleid.com',
      name: 'Apple User',
      emailVerified: true,
      accessToken: 'apple_access_token',
      refreshToken: 'apple_refresh_token',
      expiresIn: 3600,
      rawProfile: {}
    };
  }

  private async getAppleProfile(accessToken: string): Promise<SocialUserProfile> {
    return {
      id: 'apple_123456789',
      email: 'user@privaterelay.appleid.com',
      name: 'Apple User',
      emailVerified: true
    };
  }

  /**
   * Get list of enabled providers
   */
  getEnabledProviders(): SocialProvider[] {
    const providers: SocialProvider[] = [];
    for (const [provider, config] of this.configs.entries()) {
      if (config.enabled) {
        providers.push(provider);
      }
    }
    return providers;
  }

  /**
   * Render social login buttons
   */
  renderSocialButtons(): string {
    const providers = this.getEnabledProviders();
    if (providers.length === 0) {
      return '';
    }

    const buttons = providers.map(provider => {
      const config = this.getProviderConfig(provider)!;
      return `
        <button class="social-btn social-btn-${provider}" onclick="loginWith('${provider}')">
          <span class="social-icon">${this.getProviderIcon(provider)}</span>
          <span class="social-text">Continue with ${this.getProviderName(provider)}</span>
        </button>
      `;
    }).join('');

    return `
      <div class="social-login">
        <div class="social-divider">
          <span>or continue with</span>
        </div>
        <div class="social-buttons">
          ${buttons}
        </div>
      </div>
      <style>
        .social-login { margin: 20px 0; }
        .social-divider {
          text-align: center;
          margin: 20px 0;
          position: relative;
        }
        .social-divider::before,
        .social-divider::after {
          content: '';
          position: absolute;
          top: 50%;
          width: 40%;
          height: 1px;
          background: #ddd;
        }
        .social-divider::before { left: 0; }
        .social-divider::after { right: 0; }
        .social-divider span {
          background: white;
          padding: 0 10px;
          color: #666;
          font-size: 14px;
        }
        .social-buttons { display: flex; flex-direction: column; gap: 10px; }
        .social-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px 16px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }
        .social-btn:hover { background: #f5f5f5; transform: translateY(-1px); }
        .social-icon { margin-right: 10px; font-size: 18px; }
        .social-btn-google:hover { border-color: #4285f4; }
        .social-btn-github:hover { border-color: #333; }
        .social-btn-facebook:hover { border-color: #1877f2; }
        .social-btn-twitter:hover { border-color: #1da1f2; }
        .social-btn-microsoft:hover { border-color: #00a4ef; }
        .social-btn-apple:hover { border-color: #000; }
      </style>
    `;
  }

  private getProviderIcon(provider: SocialProvider): string {
    const icons: Record<SocialProvider, string> = {
      google: '🔍',
      github: '🐙',
      facebook: '👤',
      twitter: '🐦',
      microsoft: '⊞',
      apple: '🍎'
    };
    return icons[provider] || '🔐';
  }

  private getProviderName(provider: SocialProvider): string {
    return provider.charAt(0).toUpperCase() + provider.slice(1);
  }
}

/**
 * Create social providers manager instance
 */
export function createSocialProvidersManager(): SocialProvidersManager {
  const manager = new SocialProvidersManager();

  // Configure default providers (in production, load from config)
  manager.configureProvider({
    provider: 'google',
    clientId: 'your-google-client-id',
    clientSecret: 'your-google-client-secret',
    redirectUri: 'http://localhost:3000/oauth/social/google/callback',
    scopes: ['openid', 'email', 'profile'],
    enabled: true
  });

  manager.configureProvider({
    provider: 'github',
    clientId: 'your-github-client-id',
    clientSecret: 'your-github-client-secret',
    redirectUri: 'http://localhost:3000/oauth/social/github/callback',
    scopes: ['user:email', 'read:user'],
    enabled: true
  });

  return manager;
}
