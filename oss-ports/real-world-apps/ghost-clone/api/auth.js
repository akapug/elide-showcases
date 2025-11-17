/**
 * Authentication Service
 *
 * Handles user authentication, JWT tokens, password management,
 * and session handling.
 */

import { hash, compare } from 'bcrypt';
import { sign, verify } from 'jsonwebtoken';
import { randomBytes } from 'crypto';

export class AuthenticationService {
  constructor(db, config) {
    this.db = db;
    this.config = config;
  }

  async login(req, res) {
    const { email, password } = await req.json();

    if (!email || !password) {
      throw {
        status: 400,
        code: 'MISSING_CREDENTIALS',
        message: 'Email and password are required',
      };
    }

    // Find user
    const user = await this.db.findOne('users', { email, status: 'active' });

    if (!user) {
      throw {
        status: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      };
    }

    // Verify password
    const valid = await compare(password, user.password);

    if (!valid) {
      throw {
        status: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      };
    }

    // Generate tokens
    const accessToken = this.generateToken(user);
    const refreshToken = await this.generateRefreshToken(user);

    // Remove password from response
    delete user.password;

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async logout(req, res) {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      // Invalidate refresh token if it exists
      await this.db.execute(
        'DELETE FROM sessions WHERE token = ?',
        [token]
      );
    }

    return { success: true };
  }

  async requestPasswordReset(req, res) {
    const { email } = await req.json();

    if (!email) {
      throw {
        status: 400,
        code: 'MISSING_EMAIL',
        message: 'Email is required',
      };
    }

    const user = await this.db.findOne('users', { email });

    if (!user) {
      // Don't reveal if user exists
      return { success: true };
    }

    // Generate reset token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    await this.db.create('password_reset_tokens', {
      user_id: user.id,
      token,
      expires_at: expiresAt.toISOString(),
    });

    // TODO: Send email with reset link
    console.log(`Password reset token for ${email}: ${token}`);

    return { success: true };
  }

  async resetPassword(req, res) {
    const { token } = req.params;
    const { password } = await req.json();

    if (!password || password.length < this.config.passwordMinLength) {
      throw {
        status: 400,
        code: 'WEAK_PASSWORD',
        message: `Password must be at least ${this.config.passwordMinLength} characters`,
      };
    }

    // Find valid token
    const resetToken = await this.db.queryOne(
      'SELECT * FROM password_reset_tokens WHERE token = ? AND expires_at > ?',
      [token, new Date().toISOString()]
    );

    if (!resetToken) {
      throw {
        status: 400,
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired reset token',
      };
    }

    // Hash new password
    const hashedPassword = await hash(password, 10);

    // Update password
    await this.db.update('users', resetToken.user_id, {
      password: hashedPassword,
      updated_at: new Date().toISOString(),
    });

    // Delete reset token
    await this.db.delete('password_reset_tokens', resetToken.id);

    // Invalidate all sessions
    await this.db.execute(
      'DELETE FROM sessions WHERE user_id = ?',
      [resetToken.user_id]
    );

    return { success: true };
  }

  async verifyToken(token) {
    try {
      const decoded = verify(token, this.config.secret);

      // Get user
      const user = await this.db.findById('users', decoded.id);

      if (!user || user.status !== 'active') {
        throw new Error('User not found or inactive');
      }

      delete user.password;

      return user;
    } catch (error) {
      throw {
        status: 401,
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token',
      };
    }
  }

  async refreshToken(req, res) {
    const { refreshToken } = await req.json();

    if (!refreshToken) {
      throw {
        status: 400,
        code: 'MISSING_TOKEN',
        message: 'Refresh token is required',
      };
    }

    // Find session
    const session = await this.db.queryOne(
      'SELECT * FROM sessions WHERE token = ? AND expires_at > ?',
      [refreshToken, new Date().toISOString()]
    );

    if (!session) {
      throw {
        status: 401,
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired refresh token',
      };
    }

    // Get user
    const user = await this.db.findById('users', session.user_id);

    if (!user || user.status !== 'active') {
      throw {
        status: 401,
        code: 'USER_INACTIVE',
        message: 'User not found or inactive',
      };
    }

    // Generate new access token
    const accessToken = this.generateToken(user);

    delete user.password;

    return {
      user,
      accessToken,
    };
  }

  generateToken(user) {
    return sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      this.config.secret,
      {
        expiresIn: this.config.expiresIn,
      }
    );
  }

  async generateRefreshToken(user) {
    const token = randomBytes(64).toString('hex');
    const expiresAt = new Date();

    // Parse refresh token expiry (e.g., "30d" -> 30 days)
    const match = this.config.refreshExpiresIn.match(/^(\d+)([dhms])$/);
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2];

      switch (unit) {
        case 'd':
          expiresAt.setDate(expiresAt.getDate() + value);
          break;
        case 'h':
          expiresAt.setHours(expiresAt.getHours() + value);
          break;
        case 'm':
          expiresAt.setMinutes(expiresAt.getMinutes() + value);
          break;
        case 's':
          expiresAt.setSeconds(expiresAt.getSeconds() + value);
          break;
      }
    }

    await this.db.create('sessions', {
      user_id: user.id,
      token,
      expires_at: expiresAt.toISOString(),
    });

    return token;
  }

  async hashPassword(password) {
    return hash(password, 10);
  }

  async cleanupExpiredSessions() {
    await this.db.execute(
      'DELETE FROM sessions WHERE expires_at < ?',
      [new Date().toISOString()]
    );

    await this.db.execute(
      'DELETE FROM password_reset_tokens WHERE expires_at < ?',
      [new Date().toISOString()]
    );
  }
}
