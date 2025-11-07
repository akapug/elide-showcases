/**
 * ElideBase - User Authentication
 *
 * Handles user registration, login, password management, and verification.
 */

import { SQLiteDatabase } from '../database/sqlite';
import * as crypto from 'crypto';

export interface User {
  id: string;
  email: string;
  username?: string;
  verified: boolean;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCreateData {
  email: string;
  password: string;
  username?: string;
}

export interface UserUpdateData {
  username?: string;
  avatar?: string;
  password?: string;
  oldPassword?: string;
}

export class UserManager {
  private db: SQLiteDatabase;
  private saltRounds: number = 10;

  constructor(db: SQLiteDatabase) {
    this.db = db;
  }

  /**
   * Hash password using PBKDF2
   */
  private hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  /**
   * Verify password against hash
   */
  private verifyPassword(password: string, hashedPassword: string): boolean {
    const [salt, hash] = hashedPassword.split(':');
    const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return hash === verifyHash;
  }

  /**
   * Register a new user
   */
  async register(data: UserCreateData): Promise<User> {
    // Validate email format
    if (!this.isValidEmail(data.email)) {
      throw new Error('Invalid email format');
    }

    // Validate password strength
    if (!this.isValidPassword(data.password)) {
      throw new Error('Password must be at least 8 characters long');
    }

    // Check if email already exists
    const existing = this.db.queryOne(
      'SELECT id FROM users WHERE email = ?',
      [data.email]
    );

    if (existing) {
      throw new Error('Email already registered');
    }

    // Check if username already exists
    if (data.username) {
      const existingUsername = this.db.queryOne(
        'SELECT id FROM users WHERE username = ?',
        [data.username]
      );

      if (existingUsername) {
        throw new Error('Username already taken');
      }
    }

    // Hash password
    const passwordHash = this.hashPassword(data.password);

    // Insert user
    const sql = `
      INSERT INTO users (email, username, password_hash, verified)
      VALUES (?, ?, ?, 0)
    `;

    const result = this.db.execute(sql, [
      data.email,
      data.username || null,
      passwordHash
    ]);

    // Fetch created user
    const user = this.db.queryOne(
      'SELECT * FROM users WHERE id = ?',
      [result.lastInsertRowid]
    );

    console.log(`User registered: ${data.email}`);

    return this.mapUser(user);
  }

  /**
   * Authenticate user with email and password
   */
  async login(email: string, password: string): Promise<User> {
    const user = this.db.queryOne(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!this.verifyPassword(password, user.password_hash)) {
      throw new Error('Invalid email or password');
    }

    console.log(`User logged in: ${email}`);

    return this.mapUser(user);
  }

  /**
   * Get user by ID
   */
  getById(userId: string): User | null {
    const user = this.db.queryOne(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    return user ? this.mapUser(user) : null;
  }

  /**
   * Get user by email
   */
  getByEmail(email: string): User | null {
    const user = this.db.queryOne(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    return user ? this.mapUser(user) : null;
  }

  /**
   * Get user by username
   */
  getByUsername(username: string): User | null {
    const user = this.db.queryOne(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    return user ? this.mapUser(user) : null;
  }

  /**
   * Update user profile
   */
  async update(userId: string, data: UserUpdateData): Promise<User> {
    const user = this.getById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const updates: string[] = [];
    const params: any[] = [];

    // Update username
    if (data.username !== undefined) {
      // Check if username is already taken
      const existing = this.db.queryOne(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [data.username, userId]
      );

      if (existing) {
        throw new Error('Username already taken');
      }

      updates.push('username = ?');
      params.push(data.username);
    }

    // Update avatar
    if (data.avatar !== undefined) {
      updates.push('avatar = ?');
      params.push(data.avatar);
    }

    // Update password
    if (data.password) {
      if (!data.oldPassword) {
        throw new Error('Old password required');
      }

      const currentUser = this.db.queryOne(
        'SELECT password_hash FROM users WHERE id = ?',
        [userId]
      );

      if (!this.verifyPassword(data.oldPassword, currentUser.password_hash)) {
        throw new Error('Old password is incorrect');
      }

      if (!this.isValidPassword(data.password)) {
        throw new Error('New password must be at least 8 characters long');
      }

      updates.push('password_hash = ?');
      params.push(this.hashPassword(data.password));
    }

    if (updates.length === 0) {
      return user;
    }

    // Update user
    updates.push('updated_at = CURRENT_TIMESTAMP');
    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    params.push(userId);

    this.db.execute(sql, params);

    // Fetch updated user
    const updated = this.db.queryOne(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    console.log(`User updated: ${userId}`);

    return this.mapUser(updated);
  }

  /**
   * Verify user email
   */
  async verify(userId: string): Promise<void> {
    this.db.execute(
      'UPDATE users SET verified = 1 WHERE id = ?',
      [userId]
    );

    console.log(`User verified: ${userId}`);
  }

  /**
   * Delete user
   */
  async delete(userId: string): Promise<void> {
    this.db.execute('DELETE FROM users WHERE id = ?', [userId]);
    console.log(`User deleted: ${userId}`);
  }

  /**
   * List users with pagination
   */
  list(page: number = 1, perPage: number = 30): { items: User[]; total: number } {
    const offset = (page - 1) * perPage;

    const users = this.db.query(
      'SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [perPage, offset]
    ).rows;

    const countResult = this.db.queryOne('SELECT COUNT(*) as total FROM users');

    return {
      items: users.map(u => this.mapUser(u)),
      total: countResult?.total || 0
    };
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  /**
   * Validate password strength
   */
  private isValidPassword(password: string): boolean {
    return password.length >= 8;
  }

  /**
   * Map database record to User object
   */
  private mapUser(record: any): User {
    return {
      id: record.id,
      email: record.email,
      username: record.username,
      verified: Boolean(record.verified),
      avatar: record.avatar,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at)
    };
  }

  /**
   * Get user statistics
   */
  getStats(): any {
    const stats = this.db.queryOne(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN verified = 1 THEN 1 ELSE 0 END) as verified,
        SUM(CASE WHEN verified = 0 THEN 1 ELSE 0 END) as unverified
      FROM users
    `);

    return {
      total: stats?.total || 0,
      verified: stats?.verified || 0,
      unverified: stats?.unverified || 0
    };
  }
}
