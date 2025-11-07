/**
 * Authentication Manager
 *
 * Handles user authentication via multiple providers:
 * - Email/password
 * - Magic links
 * - OAuth (Google, GitHub, etc.)
 * - JWT token management
 */

import { DatabaseManager } from '../database/manager';
import { AuthConfig, User, Session } from '../types';
import { EmailAuthProvider } from './providers/email';
import { MagicLinkProvider } from './providers/magic-link';
import { GoogleOAuthProvider } from './providers/google';
import { GitHubOAuthProvider } from './providers/github';
import { JWTManager } from './jwt';
import { Logger } from '../utils/logger';

/**
 * Authentication manager
 */
export class AuthManager {
  private config: AuthConfig;
  private database: DatabaseManager;
  private logger: Logger;
  private jwtManager: JWTManager;
  private emailProvider?: EmailAuthProvider;
  private magicLinkProvider?: MagicLinkProvider;
  private googleProvider?: GoogleOAuthProvider;
  private githubProvider?: GitHubOAuthProvider;
  private stats = {
    logins: 0,
    registrations: 0,
    failures: 0
  };

  constructor(config: AuthConfig, database: DatabaseManager, logger: Logger) {
    this.config = config;
    this.database = database;
    this.logger = logger;
    this.jwtManager = new JWTManager(config.jwt, logger);
  }

  /**
   * Initialize authentication manager
   */
  async initialize(): Promise<void> {
    this.logger.info('Initializing authentication manager...');

    // Initialize providers
    if (this.config.providers.email?.enabled) {
      this.emailProvider = new EmailAuthProvider(
        this.config.providers.email,
        this.database,
        this.logger
      );
      await this.emailProvider.initialize();
    }

    if (this.config.providers.magicLink?.enabled) {
      this.magicLinkProvider = new MagicLinkProvider(
        this.config.providers.magicLink,
        this.database,
        this.logger
      );
      await this.magicLinkProvider.initialize();
    }

    if (this.config.providers.google?.enabled) {
      this.googleProvider = new GoogleOAuthProvider(
        this.config.providers.google,
        this.database,
        this.logger
      );
      await this.googleProvider.initialize();
    }

    if (this.config.providers.github?.enabled) {
      this.githubProvider = new GitHubOAuthProvider(
        this.config.providers.github,
        this.database,
        this.logger
      );
      await this.githubProvider.initialize();
    }

    this.logger.info('Authentication manager initialized');
  }

  /**
   * Register new user with email/password
   */
  async register(email: string, password: string, metadata?: Record<string, any>): Promise<User> {
    if (!this.emailProvider) {
      throw new Error('Email authentication is not enabled');
    }

    try {
      const user = await this.emailProvider.register(email, password, metadata);
      this.stats.registrations++;
      this.logger.info(`User registered: ${email}`);
      return user;
    } catch (error) {
      this.stats.failures++;
      this.logger.error('Registration failed:', error);
      throw error;
    }
  }

  /**
   * Login with email/password
   */
  async login(email: string, password: string): Promise<Session> {
    if (!this.emailProvider) {
      throw new Error('Email authentication is not enabled');
    }

    try {
      const user = await this.emailProvider.authenticate(email, password);

      // Create session
      const session = await this.createSession(user);

      this.stats.logins++;
      this.logger.info(`User logged in: ${email}`);

      return session;
    } catch (error) {
      this.stats.failures++;
      this.logger.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * Send magic link to email
   */
  async sendMagicLink(email: string): Promise<void> {
    if (!this.magicLinkProvider) {
      throw new Error('Magic link authentication is not enabled');
    }

    try {
      await this.magicLinkProvider.sendMagicLink(email);
      this.logger.info(`Magic link sent to: ${email}`);
    } catch (error) {
      this.logger.error('Failed to send magic link:', error);
      throw error;
    }
  }

  /**
   * Verify magic link token
   */
  async verifyMagicLink(token: string): Promise<Session> {
    if (!this.magicLinkProvider) {
      throw new Error('Magic link authentication is not enabled');
    }

    try {
      const user = await this.magicLinkProvider.verifyToken(token);

      // Create session
      const session = await this.createSession(user);

      this.stats.logins++;
      this.logger.info(`User logged in via magic link: ${user.email}`);

      return session;
    } catch (error) {
      this.stats.failures++;
      this.logger.error('Magic link verification failed:', error);
      throw error;
    }
  }

  /**
   * Get OAuth authorization URL
   */
  async getOAuthURL(provider: 'google' | 'github', redirectUri?: string): Promise<string> {
    switch (provider) {
      case 'google':
        if (!this.googleProvider) {
          throw new Error('Google OAuth is not enabled');
        }
        return this.googleProvider.getAuthorizationURL(redirectUri);

      case 'github':
        if (!this.githubProvider) {
          throw new Error('GitHub OAuth is not enabled');
        }
        return this.githubProvider.getAuthorizationURL(redirectUri);

      default:
        throw new Error(`Unsupported OAuth provider: ${provider}`);
    }
  }

  /**
   * Handle OAuth callback
   */
  async handleOAuthCallback(
    provider: 'google' | 'github',
    code: string
  ): Promise<Session> {
    try {
      let user: User;

      switch (provider) {
        case 'google':
          if (!this.googleProvider) {
            throw new Error('Google OAuth is not enabled');
          }
          user = await this.googleProvider.handleCallback(code);
          break;

        case 'github':
          if (!this.githubProvider) {
            throw new Error('GitHub OAuth is not enabled');
          }
          user = await this.githubProvider.handleCallback(code);
          break;

        default:
          throw new Error(`Unsupported OAuth provider: ${provider}`);
      }

      // Create session
      const session = await this.createSession(user);

      this.stats.logins++;
      this.logger.info(`User logged in via ${provider}: ${user.email}`);

      return session;
    } catch (error) {
      this.stats.failures++;
      this.logger.error(`OAuth ${provider} callback failed:`, error);
      throw error;
    }
  }

  /**
   * Create a new session
   */
  async createSession(user: User, ipAddress?: string, userAgent?: string): Promise<Session> {
    const token = this.jwtManager.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    const refreshToken = this.jwtManager.generateRefreshToken(user.id);

    const expiresAt = new Date();
    expiresAt.setSeconds(
      expiresAt.getSeconds() + this.parseExpiry(this.config.jwt.expiresIn)
    );

    const session: Session = {
      id: this.generateId(),
      userId: user.id,
      token,
      refreshToken,
      expiresAt,
      createdAt: new Date(),
      ipAddress,
      userAgent
    };

    // Store session in database
    await this.database.insert('sessions', {
      id: session.id,
      user_id: session.userId,
      token: session.token,
      refresh_token: session.refreshToken,
      expires_at: session.expiresAt.toISOString(),
      ip_address: session.ipAddress,
      user_agent: session.userAgent
    });

    // Update last login
    await this.database.update('users', user.id, {
      last_login: new Date().toISOString()
    });

    return session;
  }

  /**
   * Verify JWT token
   */
  async verifyToken(token: string): Promise<Session> {
    try {
      const payload = this.jwtManager.verifyToken(token);

      // Get session from database
      const result = await this.database.select({
        table: 'sessions',
        filter: [{ column: 'token', operator: 'eq', value: token }]
      });

      if (result.data.length === 0) {
        throw new Error('Session not found');
      }

      const sessionData = result.data[0];

      // Check if session expired
      if (new Date(sessionData.expires_at) < new Date()) {
        throw new Error('Session expired');
      }

      return {
        id: sessionData.id,
        userId: sessionData.user_id,
        token: sessionData.token,
        refreshToken: sessionData.refresh_token,
        expiresAt: new Date(sessionData.expires_at),
        createdAt: new Date(sessionData.created_at),
        ipAddress: sessionData.ip_address,
        userAgent: sessionData.user_agent
      };
    } catch (error) {
      this.logger.error('Token verification failed:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<Session> {
    try {
      const userId = this.jwtManager.verifyRefreshToken(refreshToken);

      // Get user
      const result = await this.database.select({
        table: 'users',
        filter: [{ column: 'id', operator: 'eq', value: userId }]
      });

      if (result.data.length === 0) {
        throw new Error('User not found');
      }

      const userData = result.data[0];
      const user: User = {
        id: userData.id,
        email: userData.email,
        emailVerified: Boolean(userData.email_verified),
        role: userData.role,
        metadata: userData.metadata ? JSON.parse(userData.metadata) : {},
        createdAt: new Date(userData.created_at),
        updatedAt: new Date(userData.updated_at),
        lastLogin: userData.last_login ? new Date(userData.last_login) : undefined
      };

      // Create new session
      return await this.createSession(user);
    } catch (error) {
      this.logger.error('Token refresh failed:', error);
      throw error;
    }
  }

  /**
   * Logout (invalidate session)
   */
  async logout(token: string): Promise<void> {
    try {
      // Delete session from database
      await this.database.query('DELETE FROM sessions WHERE token = ?', [token]);

      this.logger.info('User logged out');
    } catch (error) {
      this.logger.error('Logout failed:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUser(userId: string): Promise<User | null> {
    const result = await this.database.select({
      table: 'users',
      filter: [{ column: 'id', operator: 'eq', value: userId }]
    });

    if (result.data.length === 0) {
      return null;
    }

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

  /**
   * Update user
   */
  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    await this.database.update('users', userId, {
      email: updates.email,
      email_verified: updates.emailVerified ? 1 : 0,
      role: updates.role,
      metadata: updates.metadata ? JSON.stringify(updates.metadata) : undefined,
      updated_at: new Date().toISOString()
    });

    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found after update');
    }

    return user;
  }

  /**
   * Get health status
   */
  async getHealth(): Promise<any> {
    return {
      status: 'healthy',
      providers: {
        email: this.emailProvider !== undefined,
        magicLink: this.magicLinkProvider !== undefined,
        google: this.googleProvider !== undefined,
        github: this.githubProvider !== undefined
      }
    };
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<any> {
    return {
      logins: this.stats.logins,
      registrations: this.stats.registrations,
      failures: this.stats.failures,
      failureRate: this.stats.logins > 0 ? this.stats.failures / this.stats.logins : 0
    };
  }

  /**
   * Parse expiry string to seconds
   */
  private parseExpiry(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 3600; // Default 1 hour
    }

    const [, value, unit] = match;
    const num = parseInt(value, 10);

    switch (unit) {
      case 's':
        return num;
      case 'm':
        return num * 60;
      case 'h':
        return num * 3600;
      case 'd':
        return num * 86400;
      default:
        return 3600;
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
