/**
 * JWT Authentication
 * Handles JWT token generation and validation
 */

import { createHmac, randomBytes } from 'crypto';

export class JWTService {
  constructor(secret, options = {}) {
    this.secret = secret;
    this.expiresIn = options.expiresIn || '30d';
    this.algorithm = options.algorithm || 'HS256';
  }

  /**
   * Generate JWT token
   */
  sign(payload, options = {}) {
    const header = {
      alg: this.algorithm,
      typ: 'JWT',
    };

    const now = Math.floor(Date.now() / 1000);
    const expiresIn = this.parseExpiration(options.expiresIn || this.expiresIn);

    const claims = {
      ...payload,
      iat: now,
      exp: now + expiresIn,
    };

    if (options.issuer) claims.iss = options.issuer;
    if (options.audience) claims.aud = options.audience;
    if (options.subject) claims.sub = options.subject;

    const headerBase64 = this.base64UrlEncode(JSON.stringify(header));
    const payloadBase64 = this.base64UrlEncode(JSON.stringify(claims));

    const signature = this.createSignature(`${headerBase64}.${payloadBase64}`);

    return `${headerBase64}.${payloadBase64}.${signature}`;
  }

  /**
   * Verify JWT token
   */
  verify(token, options = {}) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }

      const [headerBase64, payloadBase64, signature] = parts;

      // Verify signature
      const expectedSignature = this.createSignature(`${headerBase64}.${payloadBase64}`);
      if (signature !== expectedSignature) {
        throw new Error('Invalid signature');
      }

      // Decode payload
      const payload = JSON.parse(this.base64UrlDecode(payloadBase64));

      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        throw new Error('Token expired');
      }

      // Check not before
      if (payload.nbf && payload.nbf > now) {
        throw new Error('Token not yet valid');
      }

      // Check issuer
      if (options.issuer && payload.iss !== options.issuer) {
        throw new Error('Invalid issuer');
      }

      // Check audience
      if (options.audience && payload.aud !== options.audience) {
        throw new Error('Invalid audience');
      }

      return payload;
    } catch (error) {
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }

  /**
   * Decode token without verification
   */
  decode(token) {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    try {
      return JSON.parse(this.base64UrlDecode(parts[1]));
    } catch {
      return null;
    }
  }

  /**
   * Create HMAC signature
   */
  createSignature(data) {
    const hmac = createHmac('sha256', this.secret);
    hmac.update(data);
    return this.base64UrlEncode(hmac.digest());
  }

  /**
   * Base64 URL encoding
   */
  base64UrlEncode(data) {
    const base64 = Buffer.from(typeof data === 'string' ? data : data).toString('base64');
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  /**
   * Base64 URL decoding
   */
  base64UrlDecode(data) {
    const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(base64, 'base64').toString('utf-8');
  }

  /**
   * Parse expiration string to seconds
   */
  parseExpiration(exp) {
    if (typeof exp === 'number') return exp;

    const matches = exp.match(/^(\d+)([smhd])$/);
    if (!matches) {
      throw new Error('Invalid expiration format');
    }

    const [, value, unit] = matches;
    const num = parseInt(value, 10);

    switch (unit) {
      case 's': return num;
      case 'm': return num * 60;
      case 'h': return num * 3600;
      case 'd': return num * 86400;
      default: return 1800; // 30 minutes default
    }
  }
}

/**
 * Password Hashing
 */
export class PasswordService {
  constructor(options = {}) {
    this.iterations = options.iterations || 10000;
    this.keyLength = options.keyLength || 64;
    this.digest = options.digest || 'sha512';
  }

  /**
   * Hash password
   */
  async hash(password) {
    const salt = randomBytes(16).toString('hex');
    const hash = await this.hashWithSalt(password, salt);
    return `${salt}:${hash}`;
  }

  /**
   * Verify password
   */
  async verify(password, hashedPassword) {
    const [salt, hash] = hashedPassword.split(':');
    const newHash = await this.hashWithSalt(password, salt);
    return hash === newHash;
  }

  /**
   * Hash with specific salt
   */
  async hashWithSalt(password, salt) {
    return new Promise((resolve, reject) => {
      const crypto = require('crypto');
      crypto.pbkdf2(password, salt, this.iterations, this.keyLength, this.digest, (err, derivedKey) => {
        if (err) reject(err);
        else resolve(derivedKey.toString('hex'));
      });
    });
  }
}

/**
 * API Token Service
 */
export class APITokenService {
  constructor(salt) {
    this.salt = salt;
  }

  /**
   * Generate API token
   */
  generate() {
    const token = randomBytes(32).toString('hex');
    const hash = this.hash(token);
    return { token, hash };
  }

  /**
   * Hash API token
   */
  hash(token) {
    const hmac = createHmac('sha256', this.salt);
    hmac.update(token);
    return hmac.digest('hex');
  }

  /**
   * Verify API token
   */
  verify(token, hash) {
    const computedHash = this.hash(token);
    return computedHash === hash;
  }
}
