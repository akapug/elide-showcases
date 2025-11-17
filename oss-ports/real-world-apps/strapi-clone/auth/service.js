/**
 * Authentication Service
 * Handles user registration, login, and password management
 */

import { getDatabase } from '../database/connection.js';
import { JWTService, PasswordService, APITokenService } from './jwt.js';
import { logger } from '../core/logger.js';

export class AuthService {
  constructor(config) {
    this.config = config;
    this.jwtService = new JWTService(config.jwtSecret, {
      expiresIn: config.jwtExpiration || '30d',
    });
    this.passwordService = new PasswordService();
    this.apiTokenService = new APITokenService(config.apiTokenSalt);
    this.logger = logger.child('AuthService');
  }

  /**
   * Register new user
   */
  async register(data) {
    const db = getDatabase();

    try {
      // Check if user already exists
      const existing = await db.query(
        'SELECT * FROM cms_users WHERE email = ? OR username = ?',
        [data.email, data.username]
      );

      if (existing.length > 0) {
        if (existing[0].email === data.email) {
          throw new Error('Email already in use');
        }
        if (existing[0].username === data.username) {
          throw new Error('Username already taken');
        }
      }

      // Hash password
      const hashedPassword = await this.passwordService.hash(data.password);

      // Get default role
      const defaultRole = await db.query(
        "SELECT * FROM cms_roles WHERE type = 'authenticated' LIMIT 1"
      );

      if (defaultRole.length === 0) {
        throw new Error('Default role not found');
      }

      // Create user
      const result = await db.execute(
        `INSERT INTO cms_users
         (username, email, password, first_name, last_name, role_id, confirmed, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.username,
          data.email,
          hashedPassword,
          data.firstName || null,
          data.lastName || null,
          defaultRole[0].id,
          false, // Require email confirmation
          true,
        ]
      );

      const userId = result.lastInsertRowid || result.insertId;

      // Fetch created user
      const users = await db.query('SELECT * FROM cms_users WHERE id = ?', [userId]);
      const user = users[0];

      // Generate JWT token
      const token = this.jwtService.sign({
        id: user.id,
        email: user.email,
        username: user.username,
      });

      this.logger.info(`User registered: ${user.email}`);

      return {
        jwt: token,
        user: this.sanitizeUser(user),
      };
    } catch (error) {
      this.logger.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(identifier, password) {
    const db = getDatabase();

    try {
      // Find user by email or username
      const users = await db.query(
        'SELECT * FROM cms_users WHERE email = ? OR username = ?',
        [identifier, identifier]
      );

      if (users.length === 0) {
        throw new Error('Invalid credentials');
      }

      const user = users[0];

      // Check if user is blocked
      if (user.blocked) {
        throw new Error('User is blocked');
      }

      // Check if user is active
      if (!user.is_active) {
        throw new Error('User is inactive');
      }

      // Verify password
      const isValid = await this.passwordService.verify(password, user.password);
      if (!isValid) {
        throw new Error('Invalid credentials');
      }

      // Load user role
      const role = await this.loadUserRole(user.role_id);

      // Generate JWT token
      const token = this.jwtService.sign({
        id: user.id,
        email: user.email,
        username: user.username,
        role: role?.type,
      });

      this.logger.info(`User logged in: ${user.email}`);

      return {
        jwt: token,
        user: { ...this.sanitizeUser(user), role },
      };
    } catch (error) {
      this.logger.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Verify token and return user
   */
  async verifyToken(token) {
    try {
      const payload = this.jwtService.verify(token);
      const db = getDatabase();

      const users = await db.query(
        'SELECT * FROM cms_users WHERE id = ? AND is_active = true AND blocked = false',
        [payload.id]
      );

      if (users.length === 0) {
        throw new Error('User not found');
      }

      const user = users[0];
      const role = await this.loadUserRole(user.role_id);

      return { ...this.sanitizeUser(user), role };
    } catch (error) {
      this.logger.error('Token verification error:', error);
      throw error;
    }
  }

  /**
   * Change password
   */
  async changePassword(userId, currentPassword, newPassword) {
    const db = getDatabase();

    try {
      const users = await db.query('SELECT * FROM cms_users WHERE id = ?', [userId]);

      if (users.length === 0) {
        throw new Error('User not found');
      }

      const user = users[0];

      // Verify current password
      const isValid = await this.passwordService.verify(currentPassword, user.password);
      if (!isValid) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const hashedPassword = await this.passwordService.hash(newPassword);

      // Update password
      await db.execute(
        'UPDATE cms_users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [hashedPassword, userId]
      );

      this.logger.info(`Password changed for user: ${user.email}`);

      return true;
    } catch (error) {
      this.logger.error('Change password error:', error);
      throw error;
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email) {
    const db = getDatabase();

    try {
      const users = await db.query('SELECT * FROM cms_users WHERE email = ?', [email]);

      if (users.length === 0) {
        // Don't reveal if email exists
        this.logger.info(`Password reset requested for non-existent email: ${email}`);
        return true;
      }

      const user = users[0];

      // Generate reset token
      const resetToken = this.jwtService.sign(
        { id: user.id, type: 'password-reset' },
        { expiresIn: '1h' }
      );

      this.logger.info(`Password reset token generated for: ${email}`);

      // In production, send email with reset link
      // For now, just log it
      this.logger.info(`Reset token: ${resetToken}`);

      return true;
    } catch (error) {
      this.logger.error('Reset password error:', error);
      throw error;
    }
  }

  /**
   * Confirm email
   */
  async confirmEmail(token) {
    const db = getDatabase();

    try {
      const payload = this.jwtService.verify(token);

      await db.execute(
        'UPDATE cms_users SET confirmed = true, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [payload.id]
      );

      this.logger.info(`Email confirmed for user ID: ${payload.id}`);

      return true;
    } catch (error) {
      this.logger.error('Confirm email error:', error);
      throw error;
    }
  }

  /**
   * Create API token
   */
  async createAPIToken(data, userId) {
    const db = getDatabase();

    try {
      const { token, hash } = this.apiTokenService.generate();

      const expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;

      await db.execute(
        `INSERT INTO cms_api_tokens
         (name, description, type, access_key, expires_at)
         VALUES (?, ?, ?, ?, ?)`,
        [
          data.name,
          data.description || null,
          data.type || 'read-only',
          hash,
          expiresAt,
        ]
      );

      this.logger.info(`API token created: ${data.name}`);

      // Return the actual token (only shown once)
      return {
        token,
        name: data.name,
        type: data.type,
      };
    } catch (error) {
      this.logger.error('Create API token error:', error);
      throw error;
    }
  }

  /**
   * Revoke API token
   */
  async revokeAPIToken(tokenId) {
    const db = getDatabase();

    try {
      await db.execute('DELETE FROM cms_api_tokens WHERE id = ?', [tokenId]);
      this.logger.info(`API token revoked: ${tokenId}`);
      return true;
    } catch (error) {
      this.logger.error('Revoke API token error:', error);
      throw error;
    }
  }

  /**
   * Load user role
   */
  async loadUserRole(roleId) {
    if (!roleId) return null;

    const db = getDatabase();
    const roles = await db.query('SELECT * FROM cms_roles WHERE id = ?', [roleId]);

    return roles.length > 0 ? roles[0] : null;
  }

  /**
   * Remove sensitive data from user object
   */
  sanitizeUser(user) {
    const { password, ...sanitized } = user;
    return sanitized;
  }
}
