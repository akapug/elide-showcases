/**
 * JWT Token Manager
 *
 * Handles JWT token generation and verification
 */

import { Logger } from '../utils/logger';

/**
 * JWT configuration
 */
interface JWTConfig {
  secret: string;
  expiresIn: string;
  refreshExpiresIn: string;
  algorithm: string;
}

/**
 * JWT payload
 */
interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * JWT Manager
 */
export class JWTManager {
  private config: JWTConfig;
  private logger: Logger;

  constructor(config: JWTConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  /**
   * Generate access token
   */
  generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    const now = Math.floor(Date.now() / 1000);
    const expiry = this.parseExpiry(this.config.expiresIn);

    const fullPayload: JWTPayload = {
      ...payload,
      iat: now,
      exp: now + expiry
    };

    // In real implementation, would use jsonwebtoken library
    // return jwt.sign(fullPayload, this.config.secret, { algorithm: this.config.algorithm });

    // Mock token generation
    const token = this.base64Encode(JSON.stringify(fullPayload));
    return `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${token}.signature`;
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(userId: string): string {
    const now = Math.floor(Date.now() / 1000);
    const expiry = this.parseExpiry(this.config.refreshExpiresIn);

    const payload = {
      userId,
      type: 'refresh',
      iat: now,
      exp: now + expiry
    };

    // In real implementation, would use jsonwebtoken library
    // return jwt.sign(payload, this.config.secret, { algorithm: this.config.algorithm });

    // Mock token generation
    const token = this.base64Encode(JSON.stringify(payload));
    return `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${token}.signature`;
  }

  /**
   * Verify access token
   */
  verifyToken(token: string): JWTPayload {
    try {
      // In real implementation, would use jsonwebtoken library
      // return jwt.verify(token, this.config.secret) as JWTPayload;

      // Mock token verification
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }

      const payload = JSON.parse(this.base64Decode(parts[1]));

      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        throw new Error('Token expired');
      }

      return payload as JWTPayload;
    } catch (error) {
      this.logger.error('Token verification failed:', error);
      throw new Error('Invalid token');
    }
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string): string {
    try {
      // In real implementation, would use jsonwebtoken library
      // const payload = jwt.verify(token, this.config.secret);

      // Mock token verification
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }

      const payload = JSON.parse(this.base64Decode(parts[1]));

      // Check type
      if (payload.type !== 'refresh') {
        throw new Error('Not a refresh token');
      }

      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        throw new Error('Refresh token expired');
      }

      return payload.userId;
    } catch (error) {
      this.logger.error('Refresh token verification failed:', error);
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  decodeToken(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }

      return JSON.parse(this.base64Decode(parts[1]));
    } catch (error) {
      this.logger.error('Token decode failed:', error);
      throw new Error('Invalid token');
    }
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
   * Base64 encode (mock implementation)
   */
  private base64Encode(str: string): string {
    // In real implementation, would use Buffer.from(str).toString('base64')
    // For mock, we'll just return the string
    return btoa(str).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  }

  /**
   * Base64 decode (mock implementation)
   */
  private base64Decode(str: string): string {
    // In real implementation, would use Buffer.from(str, 'base64').toString()
    // For mock, we'll just return the string
    const normalized = str.replace(/-/g, '+').replace(/_/g, '/');
    return atob(normalized);
  }
}
