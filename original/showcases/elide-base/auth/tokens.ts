/**
 * ElideBase - Token Management
 *
 * Handles JWT tokens, session management, and API key authentication.
 */

import { SQLiteDatabase } from '../database/sqlite';
import * as crypto from 'crypto';

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface TokenPayload {
  userId: string;
  email: string;
  sessionId: string;
}

export class TokenManager {
  private db: SQLiteDatabase;
  private secret: string;
  private sessionDuration: number; // in seconds

  constructor(db: SQLiteDatabase, secret?: string, sessionDuration: number = 86400) {
    this.db = db;
    this.secret = secret || crypto.randomBytes(32).toString('hex');
    this.sessionDuration = sessionDuration; // default 24 hours
  }

  /**
   * Create a new session for user
   */
  async createSession(userId: string): Promise<Session> {
    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + this.sessionDuration * 1000);

    const sql = `
      INSERT INTO sessions (user_id, token, expires_at)
      VALUES (?, ?, ?)
    `;

    const result = this.db.execute(sql, [
      userId,
      token,
      expiresAt.toISOString()
    ]);

    const session = this.db.queryOne(
      'SELECT * FROM sessions WHERE id = ?',
      [result.lastInsertRowid]
    );

    console.log(`Session created for user: ${userId}`);

    return this.mapSession(session);
  }

  /**
   * Validate session token
   */
  async validateSession(token: string): Promise<Session | null> {
    const session = this.db.queryOne(
      'SELECT * FROM sessions WHERE token = ?',
      [token]
    );

    if (!session) {
      return null;
    }

    const expiresAt = new Date(session.expires_at);
    if (expiresAt < new Date()) {
      // Session expired, delete it
      this.db.execute('DELETE FROM sessions WHERE id = ?', [session.id]);
      return null;
    }

    return this.mapSession(session);
  }

  /**
   * Refresh session (extend expiration)
   */
  async refreshSession(sessionId: string): Promise<Session> {
    const expiresAt = new Date(Date.now() + this.sessionDuration * 1000);

    this.db.execute(
      'UPDATE sessions SET expires_at = ? WHERE id = ?',
      [expiresAt.toISOString(), sessionId]
    );

    const session = this.db.queryOne(
      'SELECT * FROM sessions WHERE id = ?',
      [sessionId]
    );

    console.log(`Session refreshed: ${sessionId}`);

    return this.mapSession(session);
  }

  /**
   * Delete a session (logout)
   */
  async deleteSession(sessionId: string): Promise<void> {
    this.db.execute('DELETE FROM sessions WHERE id = ?', [sessionId]);
    console.log(`Session deleted: ${sessionId}`);
  }

  /**
   * Delete all sessions for a user
   */
  async deleteUserSessions(userId: string): Promise<void> {
    this.db.execute('DELETE FROM sessions WHERE user_id = ?', [userId]);
    console.log(`All sessions deleted for user: ${userId}`);
  }

  /**
   * Get all sessions for a user
   */
  getUserSessions(userId: string): Session[] {
    const sessions = this.db.query(
      'SELECT * FROM sessions WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    ).rows;

    return sessions.map(s => this.mapSession(s));
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(): number {
    const result = this.db.execute(
      'DELETE FROM sessions WHERE expires_at < ?',
      [new Date().toISOString()]
    );

    const deleted = result.changes || 0;
    if (deleted > 0) {
      console.log(`Cleaned up ${deleted} expired sessions`);
    }

    return deleted;
  }

  /**
   * Generate a secure random token
   */
  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Map database record to Session object
   */
  private mapSession(record: any): Session {
    return {
      id: record.id,
      userId: record.user_id,
      token: record.token,
      expiresAt: new Date(record.expires_at),
      createdAt: new Date(record.created_at)
    };
  }

  /**
   * Get session statistics
   */
  getStats(): any {
    const stats = this.db.queryOne(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN expires_at > ? THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN expires_at <= ? THEN 1 ELSE 0 END) as expired
      FROM sessions
    `, [new Date().toISOString(), new Date().toISOString()]);

    return {
      total: stats?.total || 0,
      active: stats?.active || 0,
      expired: stats?.expired || 0
    };
  }
}

/**
 * Simple JWT-like token implementation
 */
export class JWTManager {
  private secret: string;

  constructor(secret: string) {
    this.secret = secret;
  }

  /**
   * Sign a payload and create a token
   */
  sign(payload: any, expiresIn: number = 86400): string {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);
    const claims = {
      ...payload,
      iat: now,
      exp: now + expiresIn
    };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(claims));
    const signature = this.createSignature(`${encodedHeader}.${encodedPayload}`);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Verify and decode a token
   */
  verify(token: string): any {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const [encodedHeader, encodedPayload, signature] = parts;

    // Verify signature
    const expectedSignature = this.createSignature(`${encodedHeader}.${encodedPayload}`);
    if (signature !== expectedSignature) {
      throw new Error('Invalid token signature');
    }

    // Decode payload
    const payload = JSON.parse(this.base64UrlDecode(encodedPayload));

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      throw new Error('Token expired');
    }

    return payload;
  }

  /**
   * Decode token without verification (use carefully!)
   */
  decode(token: string): any {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    return JSON.parse(this.base64UrlDecode(parts[1]));
  }

  /**
   * Create HMAC signature
   */
  private createSignature(data: string): string {
    const hmac = crypto.createHmac('sha256', this.secret);
    hmac.update(data);
    return this.base64UrlEncode(hmac.digest('base64'));
  }

  /**
   * Base64 URL encode
   */
  private base64UrlEncode(str: string): string {
    return Buffer.from(str)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Base64 URL decode
   */
  private base64UrlDecode(str: string): string {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    return Buffer.from(base64, 'base64').toString('utf-8');
  }
}

/**
 * API Key Manager for external API access
 */
export class APIKeyManager {
  private db: SQLiteDatabase;

  constructor(db: SQLiteDatabase) {
    this.db = db;
    this.initialize();
  }

  /**
   * Initialize API keys table
   */
  private initialize(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        user_id TEXT NOT NULL,
        key TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        scopes TEXT,
        last_used_at DATETIME,
        expires_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(key);
      CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
    `);
  }

  /**
   * Create a new API key
   */
  createKey(userId: string, name: string, scopes?: string[], expiresIn?: number): any {
    const key = `eb_${crypto.randomBytes(32).toString('hex')}`;
    const expiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 1000).toISOString()
      : null;

    const sql = `
      INSERT INTO api_keys (user_id, key, name, scopes, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `;

    const result = this.db.execute(sql, [
      userId,
      key,
      name,
      scopes ? JSON.stringify(scopes) : null,
      expiresAt
    ]);

    const apiKey = this.db.queryOne(
      'SELECT * FROM api_keys WHERE id = ?',
      [result.lastInsertRowid]
    );

    console.log(`API key created: ${name} for user ${userId}`);

    return {
      id: apiKey.id,
      key: apiKey.key,
      name: apiKey.name,
      scopes: apiKey.scopes ? JSON.parse(apiKey.scopes) : null,
      createdAt: new Date(apiKey.created_at)
    };
  }

  /**
   * Validate API key
   */
  validateKey(key: string): any {
    const apiKey = this.db.queryOne(
      'SELECT * FROM api_keys WHERE key = ?',
      [key]
    );

    if (!apiKey) {
      return null;
    }

    // Check expiration
    if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
      return null;
    }

    // Update last used
    this.db.execute(
      'UPDATE api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE id = ?',
      [apiKey.id]
    );

    return {
      id: apiKey.id,
      userId: apiKey.user_id,
      name: apiKey.name,
      scopes: apiKey.scopes ? JSON.parse(apiKey.scopes) : null
    };
  }

  /**
   * Revoke API key
   */
  revokeKey(keyId: string): void {
    this.db.execute('DELETE FROM api_keys WHERE id = ?', [keyId]);
    console.log(`API key revoked: ${keyId}`);
  }

  /**
   * List API keys for user
   */
  listKeys(userId: string): any[] {
    const keys = this.db.query(
      'SELECT id, name, scopes, last_used_at, expires_at, created_at FROM api_keys WHERE user_id = ?',
      [userId]
    ).rows;

    return keys.map(k => ({
      id: k.id,
      name: k.name,
      scopes: k.scopes ? JSON.parse(k.scopes) : null,
      lastUsedAt: k.last_used_at ? new Date(k.last_used_at) : null,
      expiresAt: k.expires_at ? new Date(k.expires_at) : null,
      createdAt: new Date(k.created_at)
    }));
  }
}
