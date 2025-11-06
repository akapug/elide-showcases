/**
 * Magic Link Authentication Provider
 *
 * Passwordless authentication via email links
 */

import { DatabaseManager } from '../../database/manager';
import { MagicLinkConfig, User } from '../../types';
import { Logger } from '../../utils/logger';

/**
 * Magic link provider
 */
export class MagicLinkProvider {
  private config: MagicLinkConfig;
  private database: DatabaseManager;
  private logger: Logger;
  private pendingTokens: Map<string, { email: string; expiresAt: Date }> = new Map();

  constructor(config: MagicLinkConfig, database: DatabaseManager, logger: Logger) {
    this.config = config;
    this.database = database;
    this.logger = logger;
  }

  /**
   * Initialize provider
   */
  async initialize(): Promise<void> {
    this.logger.info('Magic link authentication provider initialized');

    // Start token cleanup interval
    setInterval(() => this.cleanupExpiredTokens(), 60000); // Every minute
  }

  /**
   * Send magic link to email
   */
  async sendMagicLink(email: string): Promise<void> {
    // Validate email
    if (!this.isValidEmail(email)) {
      throw new Error('Invalid email address');
    }

    // Check if user exists, create if not
    let user = await this.getUserByEmail(email);
    if (!user) {
      user = await this.createUser(email);
    }

    // Generate magic link token
    const token = this.generateToken();
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + this.config.tokenExpiry);

    // Store token
    this.pendingTokens.set(token, { email, expiresAt });

    // Send email with magic link
    const magicLink = this.buildMagicLink(token);
    await this.sendEmail(email, magicLink);

    this.logger.info(`Magic link sent to: ${email}`);
  }

  /**
   * Verify magic link token and authenticate user
   */
  async verifyToken(token: string): Promise<User> {
    const tokenData = this.pendingTokens.get(token);

    if (!tokenData) {
      throw new Error('Invalid or expired magic link');
    }

    // Check expiration
    if (new Date() > tokenData.expiresAt) {
      this.pendingTokens.delete(token);
      throw new Error('Magic link expired');
    }

    // Get user
    const user = await this.getUserByEmail(tokenData.email);
    if (!user) {
      throw new Error('User not found');
    }

    // Mark email as verified
    await this.database.update('users', user.id, {
      email_verified: 1,
      updated_at: new Date().toISOString()
    });

    // Remove token
    this.pendingTokens.delete(token);

    this.logger.info(`Magic link verified for: ${tokenData.email}`);

    return {
      ...user,
      emailVerified: true
    };
  }

  /**
   * Get user by email
   */
  private async getUserByEmail(email: string): Promise<User | null> {
    const result = await this.database.select({
      table: 'users',
      filter: [{ column: 'email', operator: 'eq', value: email }]
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
   * Create new user
   */
  private async createUser(email: string): Promise<User> {
    const userId = this.generateId();
    const now = new Date().toISOString();

    const userData = {
      id: userId,
      email,
      email_verified: 0,
      password_hash: null,
      role: 'user',
      metadata: null,
      created_at: now,
      updated_at: now
    };

    await this.database.insert('users', userData);

    this.logger.info(`User created via magic link: ${email}`);

    return {
      id: userId,
      email,
      emailVerified: false,
      role: 'user',
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Send email with magic link
   */
  private async sendEmail(email: string, magicLink: string): Promise<void> {
    // In real implementation, would use email service (SendGrid, AWS SES, etc.)
    const template =
      this.config.emailTemplate ||
      `
      <h1>Sign in to ElideSupabase</h1>
      <p>Click the link below to sign in:</p>
      <a href="${magicLink}">Sign In</a>
      <p>This link will expire in ${this.config.tokenExpiry / 60} minutes.</p>
    `;

    this.logger.debug(`Sending magic link email to ${email}:`);
    this.logger.debug(`Link: ${magicLink}`);
    this.logger.debug(`Template: ${template}`);

    // Mock email sending
    // In real implementation: await emailService.send({ to: email, html: template })
  }

  /**
   * Build magic link URL
   */
  private buildMagicLink(token: string): string {
    // In real implementation, would use configured base URL
    return `http://localhost:3000/auth/verify?token=${token}`;
  }

  /**
   * Generate secure random token
   */
  private generateToken(): string {
    // In real implementation, would use crypto.randomBytes
    return `ml_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }

  /**
   * Cleanup expired tokens
   */
  private cleanupExpiredTokens(): void {
    const now = new Date();
    let cleaned = 0;

    for (const [token, data] of this.pendingTokens.entries()) {
      if (now > data.expiresAt) {
        this.pendingTokens.delete(token);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug(`Cleaned up ${cleaned} expired magic link token(s)`);
    }
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
