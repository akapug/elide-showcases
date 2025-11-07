/**
 * Google OAuth Authentication Provider
 */

import { DatabaseManager } from '../../database/manager';
import { OAuthConfig, User } from '../../types';
import { Logger } from '../../utils/logger';

/**
 * Google OAuth provider
 */
export class GoogleOAuthProvider {
  private config: OAuthConfig;
  private database: DatabaseManager;
  private logger: Logger;
  private readonly authEndpoint = 'https://accounts.google.com/o/oauth2/v2/auth';
  private readonly tokenEndpoint = 'https://oauth2.googleapis.com/token';
  private readonly userInfoEndpoint = 'https://www.googleapis.com/oauth2/v2/userinfo';

  constructor(config: OAuthConfig, database: DatabaseManager, logger: Logger) {
    this.config = config;
    this.database = database;
    this.logger = logger;
  }

  /**
   * Initialize provider
   */
  async initialize(): Promise<void> {
    this.logger.info('Google OAuth provider initialized');
  }

  /**
   * Get Google OAuth authorization URL
   */
  getAuthorizationURL(redirectUri?: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: redirectUri || this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent'
    });

    return `${this.authEndpoint}?${params.toString()}`;
  }

  /**
   * Handle OAuth callback and exchange code for tokens
   */
  async handleCallback(code: string): Promise<User> {
    try {
      // Exchange authorization code for access token
      const tokens = await this.exchangeCodeForTokens(code);

      // Get user info from Google
      const googleUser = await this.getUserInfo(tokens.access_token);

      // Find or create user in database
      const user = await this.findOrCreateUser(googleUser);

      this.logger.info(`User authenticated via Google: ${user.email}`);

      return user;
    } catch (error) {
      this.logger.error('Google OAuth callback failed:', error);
      throw error;
    }
  }

  /**
   * Exchange authorization code for access tokens
   */
  private async exchangeCodeForTokens(code: string): Promise<any> {
    // In real implementation, would make HTTP request to Google
    // const response = await fetch(this.tokenEndpoint, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    //   body: new URLSearchParams({
    //     code,
    //     client_id: this.config.clientId,
    //     client_secret: this.config.clientSecret,
    //     redirect_uri: this.config.redirectUri,
    //     grant_type: 'authorization_code'
    //   })
    // });
    // return response.json();

    // Mock response
    return {
      access_token: `google_access_${code}`,
      refresh_token: `google_refresh_${code}`,
      expires_in: 3600,
      token_type: 'Bearer'
    };
  }

  /**
   * Get user info from Google
   */
  private async getUserInfo(accessToken: string): Promise<any> {
    // In real implementation, would make HTTP request to Google
    // const response = await fetch(this.userInfoEndpoint, {
    //   headers: { Authorization: `Bearer ${accessToken}` }
    // });
    // return response.json();

    // Mock response
    return {
      id: `google_${Date.now()}`,
      email: 'user@gmail.com',
      verified_email: true,
      name: 'John Doe',
      given_name: 'John',
      family_name: 'Doe',
      picture: 'https://example.com/avatar.jpg'
    };
  }

  /**
   * Find or create user in database
   */
  private async findOrCreateUser(googleUser: any): Promise<User> {
    // Check if user exists
    const result = await this.database.select({
      table: 'users',
      filter: [{ column: 'email', operator: 'eq', value: googleUser.email }]
    });

    if (result.data.length > 0) {
      // Update existing user
      const userData = result.data[0];

      return {
        id: userData.id,
        email: userData.email,
        emailVerified: Boolean(userData.email_verified),
        role: userData.role,
        metadata: userData.metadata ? JSON.parse(userData.metadata) : {},
        createdAt: new Date(userData.created_at),
        updatedAt: new Date(userData.updated_at),
        lastLogin: userData.last_login ? new Date(userData.last_login) : undefined
      };
    }

    // Create new user
    const userId = this.generateId();
    const now = new Date().toISOString();

    const metadata = {
      provider: 'google',
      providerId: googleUser.id,
      name: googleUser.name,
      picture: googleUser.picture
    };

    const userData = {
      id: userId,
      email: googleUser.email,
      email_verified: googleUser.verified_email ? 1 : 0,
      password_hash: null,
      role: 'user',
      metadata: JSON.stringify(metadata),
      created_at: now,
      updated_at: now
    };

    await this.database.insert('users', userData);

    this.logger.info(`User created via Google OAuth: ${googleUser.email}`);

    return {
      id: userId,
      email: googleUser.email,
      emailVerified: googleUser.verified_email,
      role: 'user',
      metadata,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
