/**
 * Email/Password Authentication Provider
 *
 * Handles user registration and authentication with email/password
 */

import { DatabaseManager } from '../../database/manager';
import { EmailAuthConfig, User } from '../../types';
import { Logger } from '../../utils/logger';

/**
 * Email authentication provider
 */
export class EmailAuthProvider {
  private config: EmailAuthConfig;
  private database: DatabaseManager;
  private logger: Logger;

  constructor(config: EmailAuthConfig, database: DatabaseManager, logger: Logger) {
    this.config = config;
    this.database = database;
    this.logger = logger;
  }

  /**
   * Initialize provider
   */
  async initialize(): Promise<void> {
    this.logger.info('Email authentication provider initialized');
  }

  /**
   * Register new user
   */
  async register(
    email: string,
    password: string,
    metadata?: Record<string, any>
  ): Promise<User> {
    // Validate email
    if (!this.isValidEmail(email)) {
      throw new Error('Invalid email address');
    }

    // Validate password
    this.validatePassword(password);

    // Check if user already exists
    const existing = await this.database.select({
      table: 'users',
      filter: [{ column: 'email', operator: 'eq', value: email }]
    });

    if (existing.data.length > 0) {
      throw new Error('Email already registered');
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create user
    const userId = this.generateId();
    const now = new Date().toISOString();

    const userData = {
      id: userId,
      email,
      email_verified: this.config.requireEmailVerification ? 0 : 1,
      password_hash: passwordHash,
      role: 'user',
      metadata: metadata ? JSON.stringify(metadata) : null,
      created_at: now,
      updated_at: now
    };

    await this.database.insert('users', userData);

    // Send verification email if required
    if (this.config.requireEmailVerification) {
      await this.sendVerificationEmail(email, userId);
    }

    const user: User = {
      id: userId,
      email,
      emailVerified: !this.config.requireEmailVerification,
      role: 'user',
      metadata: metadata || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.logger.info(`User registered: ${email}`);

    return user;
  }

  /**
   * Authenticate user
   */
  async authenticate(email: string, password: string): Promise<User> {
    // Get user from database
    const result = await this.database.select({
      table: 'users',
      filter: [{ column: 'email', operator: 'eq', value: email }]
    });

    if (result.data.length === 0) {
      throw new Error('Invalid email or password');
    }

    const userData = result.data[0];

    // Verify password
    const valid = await this.verifyPassword(password, userData.password_hash);
    if (!valid) {
      throw new Error('Invalid email or password');
    }

    // Check email verification if required
    if (this.config.requireEmailVerification && !userData.email_verified) {
      throw new Error('Email not verified');
    }

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

    return user;
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(email: string, userId: string): Promise<void> {
    const token = this.generateVerificationToken(userId);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.config.verificationTokenExpiry / 3600);

    // Store token in database
    // In real implementation, would have a verification_tokens table

    // Send email
    this.logger.info(`Verification email sent to ${email} (token: ${token})`);
    // In real implementation, would use email service
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<User> {
    // In real implementation, would verify token from database
    // For mock, we'll extract userId from token
    const userId = this.extractUserIdFromToken(token);

    // Update user
    await this.database.update('users', userId, {
      email_verified: 1,
      updated_at: new Date().toISOString()
    });

    // Get updated user
    const result = await this.database.select({
      table: 'users',
      filter: [{ column: 'id', operator: 'eq', value: userId }]
    });

    const userData = result.data[0];

    return {
      id: userData.id,
      email: userData.email,
      emailVerified: true,
      role: userData.role,
      metadata: userData.metadata ? JSON.parse(userData.metadata) : {},
      createdAt: new Date(userData.created_at),
      updatedAt: new Date(userData.updated_at)
    };
  }

  /**
   * Change password
   */
  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    // Get user
    const result = await this.database.select({
      table: 'users',
      filter: [{ column: 'id', operator: 'eq', value: userId }]
    });

    if (result.data.length === 0) {
      throw new Error('User not found');
    }

    const userData = result.data[0];

    // Verify old password
    const valid = await this.verifyPassword(oldPassword, userData.password_hash);
    if (!valid) {
      throw new Error('Invalid password');
    }

    // Validate new password
    this.validatePassword(newPassword);

    // Hash new password
    const newPasswordHash = await this.hashPassword(newPassword);

    // Update password
    await this.database.update('users', userId, {
      password_hash: newPasswordHash,
      updated_at: new Date().toISOString()
    });

    this.logger.info(`Password changed for user: ${userId}`);
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<void> {
    const result = await this.database.select({
      table: 'users',
      filter: [{ column: 'email', operator: 'eq', value: email }]
    });

    if (result.data.length === 0) {
      // Don't reveal if email exists
      this.logger.info(`Password reset requested for non-existent email: ${email}`);
      return;
    }

    const userData = result.data[0];

    // Generate reset token
    const token = this.generateResetToken(userData.id);

    // Send reset email
    this.logger.info(`Password reset email sent to ${email} (token: ${token})`);
    // In real implementation, would use email service
  }

  /**
   * Validate password against policy
   */
  private validatePassword(password: string): void {
    // This is a placeholder - in real implementation, would check against passwordPolicy
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    // Check for uppercase, lowercase, numbers, special chars based on policy
    // For now, just check minimum length
  }

  /**
   * Hash password
   */
  private async hashPassword(password: string): Promise<string> {
    // In real implementation, would use bcrypt or argon2
    // return bcrypt.hash(password, 10);

    // Mock hashing
    return `hashed_${password}_${Date.now()}`;
  }

  /**
   * Verify password
   */
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    // In real implementation, would use bcrypt or argon2
    // return bcrypt.compare(password, hash);

    // Mock verification - check if hash contains password
    return hash.includes(password);
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Generate verification token
   */
  private generateVerificationToken(userId: string): string {
    return `verify_${userId}_${Date.now()}`;
  }

  /**
   * Generate password reset token
   */
  private generateResetToken(userId: string): string {
    return `reset_${userId}_${Date.now()}`;
  }

  /**
   * Extract user ID from token
   */
  private extractUserIdFromToken(token: string): string {
    const parts = token.split('_');
    return parts[1] || '';
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
