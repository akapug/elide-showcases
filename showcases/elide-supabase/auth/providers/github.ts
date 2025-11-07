/**
 * GitHub OAuth Authentication Provider
 */

import { DatabaseManager } from '../../database/manager';
import { OAuthConfig, User } from '../../types';
import { Logger } from '../../utils/logger';

/**
 * GitHub OAuth provider
 */
export class GitHubOAuthProvider {
  private config: OAuthConfig;
  private database: DatabaseManager;
  private logger: Logger;
  private readonly authEndpoint = 'https://github.com/login/oauth/authorize';
  private readonly tokenEndpoint = 'https://github.com/login/oauth/access_token';
  private readonly userEndpoint = 'https://api.github.com/user';
  private readonly emailEndpoint = 'https://api.github.com/user/emails';

  constructor(config: OAuthConfig, database: DatabaseManager, logger: Logger) {
    this.config = config;
    this.database = database;
    this.logger = logger;
  }

  /**
   * Initialize provider
   */
  async initialize(): Promise<void> {
    this.logger.info('GitHub OAuth provider initialized');
  }

  /**
   * Get GitHub OAuth authorization URL
   */
  getAuthorizationURL(redirectUri?: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: redirectUri || this.config.redirectUri,
      scope: this.config.scopes.join(' '),
      state: this.generateState()
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

      // Get user info from GitHub
      const githubUser = await this.getUserInfo(tokens.access_token);

      // Get user emails
      const emails = await this.getUserEmails(tokens.access_token);
      const primaryEmail = emails.find((e: any) => e.primary) || emails[0];

      // Add email to user object
      githubUser.email = githubUser.email || primaryEmail.email;
      githubUser.email_verified = primaryEmail.verified;

      // Find or create user in database
      const user = await this.findOrCreateUser(githubUser);

      this.logger.info(`User authenticated via GitHub: ${user.email}`);

      return user;
    } catch (error) {
      this.logger.error('GitHub OAuth callback failed:', error);
      throw error;
    }
  }

  /**
   * Exchange authorization code for access tokens
   */
  private async exchangeCodeForTokens(code: string): Promise<any> {
    // In real implementation, would make HTTP request to GitHub
    // const response = await fetch(this.tokenEndpoint, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Accept': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     client_id: this.config.clientId,
    //     client_secret: this.config.clientSecret,
    //     code,
    //     redirect_uri: this.config.redirectUri
    //   })
    // });
    // return response.json();

    // Mock response
    return {
      access_token: `github_access_${code}`,
      token_type: 'bearer',
      scope: this.config.scopes.join(',')
    };
  }

  /**
   * Get user info from GitHub
   */
  private async getUserInfo(accessToken: string): Promise<any> {
    // In real implementation, would make HTTP request to GitHub
    // const response = await fetch(this.userEndpoint, {
    //   headers: {
    //     'Authorization': `Bearer ${accessToken}`,
    //     'Accept': 'application/json'
    //   }
    // });
    // return response.json();

    // Mock response
    return {
      id: Date.now(),
      login: 'johndoe',
      name: 'John Doe',
      email: null, // GitHub doesn't always return email in user endpoint
      avatar_url: 'https://avatars.githubusercontent.com/u/123456',
      bio: 'Software developer',
      company: 'Acme Inc',
      location: 'San Francisco, CA',
      blog: 'https://johndoe.com'
    };
  }

  /**
   * Get user emails from GitHub
   */
  private async getUserEmails(accessToken: string): Promise<any[]> {
    // In real implementation, would make HTTP request to GitHub
    // const response = await fetch(this.emailEndpoint, {
    //   headers: {
    //     'Authorization': `Bearer ${accessToken}`,
    //     'Accept': 'application/json'
    //   }
    // });
    // return response.json();

    // Mock response
    return [
      {
        email: 'user@example.com',
        primary: true,
        verified: true,
        visibility: 'public'
      }
    ];
  }

  /**
   * Find or create user in database
   */
  private async findOrCreateUser(githubUser: any): Promise<User> {
    // Check if user exists
    const result = await this.database.select({
      table: 'users',
      filter: [{ column: 'email', operator: 'eq', value: githubUser.email }]
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
      provider: 'github',
      providerId: githubUser.id,
      login: githubUser.login,
      name: githubUser.name,
      avatar: githubUser.avatar_url,
      bio: githubUser.bio,
      company: githubUser.company,
      location: githubUser.location,
      blog: githubUser.blog
    };

    const userData = {
      id: userId,
      email: githubUser.email,
      email_verified: githubUser.email_verified ? 1 : 0,
      password_hash: null,
      role: 'user',
      metadata: JSON.stringify(metadata),
      created_at: now,
      updated_at: now
    };

    await this.database.insert('users', userData);

    this.logger.info(`User created via GitHub OAuth: ${githubUser.email}`);

    return {
      id: userId,
      email: githubUser.email,
      emailVerified: githubUser.email_verified,
      role: 'user',
      metadata,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Generate random state for CSRF protection
   */
  private generateState(): string {
    return Math.random().toString(36).substr(2, 16);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
