/**
 * Authentication Service
 * Handles user authentication and JWT token management
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { DatabaseConnection } from '../database/connection.js';
import { table } from '../database/query-builder.js';
import { Collection, CollectionManager } from '../collections/manager.js';

export interface AuthResponse {
  token: string;
  record: any;
}

export interface OAuth2Provider {
  name: string;
  clientId: string;
  clientSecret: string;
  authUrl: string;
  tokenUrl: string;
  userApiUrl: string;
}

export class AuthService {
  private db: DatabaseConnection;
  private collections: CollectionManager;
  private jwtSecret: string;
  private tokenDuration: number = 7 * 24 * 60 * 60; // 7 days in seconds

  constructor(db: DatabaseConnection, collections: CollectionManager, jwtSecret: string) {
    this.db = db;
    this.collections = collections;
    this.jwtSecret = jwtSecret;
  }

  /**
   * Register a new user with email and password
   */
  async register(
    collectionName: string,
    data: {
      email: string;
      password: string;
      passwordConfirm: string;
      username?: string;
      [key: string]: any;
    }
  ): Promise<AuthResponse> {
    const collection = this.collections.getCollection(collectionName);
    if (!collection || collection.type !== 'auth') {
      throw new Error(`Auth collection '${collectionName}' not found`);
    }

    // Validate passwords match
    if (data.password !== data.passwordConfirm) {
      throw new Error('Passwords do not match');
    }

    // Check min password length
    const minPasswordLength = collection.options?.minPasswordLength || 8;
    if (data.password.length < minPasswordLength) {
      throw new Error(`Password must be at least ${minPasswordLength} characters`);
    }

    // Check if email already exists
    const existing = table(collectionName, this.db).where('email', data.email).first();
    if (existing) {
      throw new Error('Email already exists');
    }

    // Check if username already exists (if provided)
    if (data.username) {
      const existingUsername = table(collectionName, this.db).where('username', data.username).first();
      if (existingUsername) {
        throw new Error('Username already exists');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Generate token key
    const tokenKey = nanoid(32);

    // Prepare record
    const now = new Date().toISOString();
    const record = {
      id: nanoid(15),
      created: now,
      updated: now,
      email: data.email,
      username: data.username || '',
      password: hashedPassword,
      tokenKey,
      verified: false,
      emailVisibility: false,
      ...Object.keys(data)
        .filter(k => !['password', 'passwordConfirm', 'email', 'username'].includes(k))
        .reduce((obj, key) => ({ ...obj, [key]: data[key] }), {}),
    };

    // Serialize and insert
    const serialized = this.collections.serializeRecord(collection, record);
    table(collectionName, this.db).insert(serialized);

    // Generate JWT token
    const token = this.generateToken(record.id, tokenKey, collectionName);

    // Return without password
    const { password, tokenKey: _, ...userRecord } = record;

    return {
      token,
      record: userRecord,
    };
  }

  /**
   * Login with email and password
   */
  async loginWithPassword(
    collectionName: string,
    identity: string,
    password: string
  ): Promise<AuthResponse> {
    const collection = this.collections.getCollection(collectionName);
    if (!collection || collection.type !== 'auth') {
      throw new Error(`Auth collection '${collectionName}' not found`);
    }

    // Find user by email or username
    let user = table(collectionName, this.db).where('email', identity).first();
    if (!user && collection.options?.allowUsernameAuth) {
      user = table(collectionName, this.db).where('username', identity).first();
    }

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new Error('Invalid credentials');
    }

    // Generate new token key
    const tokenKey = nanoid(32);
    table(collectionName, this.db)
      .where('id', user.id)
      .update({
        tokenKey,
        updated: new Date().toISOString(),
      });

    // Generate JWT token
    const token = this.generateToken(user.id, tokenKey, collectionName);

    // Deserialize and return
    const record = this.collections.deserializeRecord(collection, { ...user, tokenKey });
    delete record.password;
    delete record.tokenKey;

    return {
      token,
      record,
    };
  }

  /**
   * Refresh authentication token
   */
  async refresh(token: string, collectionName: string): Promise<AuthResponse> {
    const collection = this.collections.getCollection(collectionName);
    if (!collection || collection.type !== 'auth') {
      throw new Error(`Auth collection '${collectionName}' not found`);
    }

    // Verify token
    const decoded = this.verifyToken(token);
    if (decoded.collection !== collectionName) {
      throw new Error('Invalid token');
    }

    // Get user
    const user = table(collectionName, this.db).where('id', decoded.id).first();
    if (!user) {
      throw new Error('User not found');
    }

    // Verify token key
    if (user.tokenKey !== decoded.tokenKey) {
      throw new Error('Token has been invalidated');
    }

    // Generate new token key
    const newTokenKey = nanoid(32);
    table(collectionName, this.db)
      .where('id', user.id)
      .update({
        tokenKey: newTokenKey,
        updated: new Date().toISOString(),
      });

    // Generate new JWT token
    const newToken = this.generateToken(user.id, newTokenKey, collectionName);

    // Deserialize and return
    const record = this.collections.deserializeRecord(collection, { ...user, tokenKey: newTokenKey });
    delete record.password;
    delete record.tokenKey;

    return {
      token: newToken,
      record,
    };
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(collectionName: string, email: string): Promise<void> {
    const collection = this.collections.getCollection(collectionName);
    if (!collection || collection.type !== 'auth') {
      throw new Error(`Auth collection '${collectionName}' not found`);
    }

    // Find user
    const user = table(collectionName, this.db).where('email', email).first();
    if (!user) {
      // Don't reveal if email exists
      return;
    }

    // Generate reset token (in production, store this and send via email)
    const resetToken = nanoid(32);

    // Store reset token with expiry (implement in production)
    console.log(`Password reset token for ${email}: ${resetToken}`);
  }

  /**
   * Confirm password reset
   */
  async confirmPasswordReset(
    collectionName: string,
    token: string,
    password: string,
    passwordConfirm: string
  ): Promise<void> {
    const collection = this.collections.getCollection(collectionName);
    if (!collection || collection.type !== 'auth') {
      throw new Error(`Auth collection '${collectionName}' not found`);
    }

    // Validate passwords match
    if (password !== passwordConfirm) {
      throw new Error('Passwords do not match');
    }

    // Check min password length
    const minPasswordLength = collection.options?.minPasswordLength || 8;
    if (password.length < minPasswordLength) {
      throw new Error(`Password must be at least ${minPasswordLength} characters`);
    }

    // In production: verify token and get user ID
    // For now, throw error
    throw new Error('Password reset not fully implemented');
  }

  /**
   * Request email verification
   */
  async requestVerification(collectionName: string, email: string): Promise<void> {
    const collection = this.collections.getCollection(collectionName);
    if (!collection || collection.type !== 'auth') {
      throw new Error(`Auth collection '${collectionName}' not found`);
    }

    // Find user
    const user = table(collectionName, this.db).where('email', email).first();
    if (!user) {
      // Don't reveal if email exists
      return;
    }

    // Generate verification token (in production, store this and send via email)
    const verificationToken = nanoid(32);

    // Store verification token (implement in production)
    console.log(`Email verification token for ${email}: ${verificationToken}`);
  }

  /**
   * Confirm email verification
   */
  async confirmVerification(collectionName: string, token: string): Promise<void> {
    const collection = this.collections.getCollection(collectionName);
    if (!collection || collection.type !== 'auth') {
      throw new Error(`Auth collection '${collectionName}' not found`);
    }

    // In production: verify token, get user ID, and mark as verified
    // For now, throw error
    throw new Error('Email verification not fully implemented');
  }

  /**
   * List available OAuth2 providers
   */
  listOAuth2Providers(collectionName: string): OAuth2Provider[] {
    const collection = this.collections.getCollection(collectionName);
    if (!collection || collection.type !== 'auth') {
      throw new Error(`Auth collection '${collectionName}' not found`);
    }

    // Return configured OAuth2 providers
    // In production, this would come from settings
    return [
      {
        name: 'google',
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        userApiUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
      },
      {
        name: 'github',
        clientId: process.env.GITHUB_CLIENT_ID || '',
        clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
        authUrl: 'https://github.com/login/oauth/authorize',
        tokenUrl: 'https://github.com/login/oauth/access_token',
        userApiUrl: 'https://api.github.com/user',
      },
    ].filter(p => p.clientId && p.clientSecret);
  }

  /**
   * Authenticate with OAuth2
   */
  async authWithOAuth2(
    collectionName: string,
    provider: string,
    code: string,
    codeVerifier: string,
    redirectUrl: string
  ): Promise<AuthResponse> {
    const collection = this.collections.getCollection(collectionName);
    if (!collection || collection.type !== 'auth') {
      throw new Error(`Auth collection '${collectionName}' not found`);
    }

    // Get provider config
    const providers = this.listOAuth2Providers(collectionName);
    const providerConfig = providers.find(p => p.name === provider);
    if (!providerConfig) {
      throw new Error(`OAuth2 provider '${provider}' not configured`);
    }

    // Exchange code for access token (implement in production)
    // Get user info from provider
    // Create or update user in collection
    // Generate JWT token

    throw new Error('OAuth2 authentication not fully implemented');
  }

  /**
   * Admin login
   */
  async adminLogin(email: string, password: string): Promise<AuthResponse> {
    // Find admin
    const admin = table('_admins', this.db).where('email', email).first();
    if (!admin) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) {
      throw new Error('Invalid credentials');
    }

    // Generate new token key
    const tokenKey = nanoid(32);
    table('_admins', this.db)
      .where('id', admin.id)
      .update({
        tokenKey,
        updated: new Date().toISOString(),
      });

    // Generate JWT token
    const token = this.generateToken(admin.id, tokenKey, '_admins');

    return {
      token,
      record: {
        id: admin.id,
        email: admin.email,
        avatar: admin.avatar,
        created: admin.created,
        updated: admin.updated,
      },
    };
  }

  /**
   * Generate JWT token
   */
  private generateToken(id: string, tokenKey: string, collection: string): string {
    return jwt.sign(
      {
        id,
        tokenKey,
        collection,
        type: collection === '_admins' ? 'admin' : 'auth',
      },
      this.jwtSecret,
      {
        expiresIn: this.tokenDuration,
      }
    );
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Get user from token
   */
  async getUserFromToken(token: string): Promise<any> {
    const decoded = this.verifyToken(token);

    if (decoded.collection === '_admins') {
      const admin = table('_admins', this.db).where('id', decoded.id).first();
      if (!admin || admin.tokenKey !== decoded.tokenKey) {
        throw new Error('Invalid token');
      }
      return {
        id: admin.id,
        email: admin.email,
        avatar: admin.avatar,
        type: 'admin',
      };
    }

    const user = table(decoded.collection, this.db).where('id', decoded.id).first();
    if (!user || user.tokenKey !== decoded.tokenKey) {
      throw new Error('Invalid token');
    }

    const collection = this.collections.getCollection(decoded.collection);
    if (!collection) {
      throw new Error('Collection not found');
    }

    const record = this.collections.deserializeRecord(collection, user);
    delete record.password;
    delete record.tokenKey;

    return {
      ...record,
      type: 'auth',
      collection: decoded.collection,
    };
  }

  /**
   * Change password
   */
  async changePassword(
    collectionName: string,
    userId: string,
    oldPassword: string,
    newPassword: string,
    newPasswordConfirm: string
  ): Promise<void> {
    const collection = this.collections.getCollection(collectionName);
    if (!collection || collection.type !== 'auth') {
      throw new Error(`Auth collection '${collectionName}' not found`);
    }

    // Validate passwords match
    if (newPassword !== newPasswordConfirm) {
      throw new Error('Passwords do not match');
    }

    // Check min password length
    const minPasswordLength = collection.options?.minPasswordLength || 8;
    if (newPassword.length < minPasswordLength) {
      throw new Error(`Password must be at least ${minPasswordLength} characters`);
    }

    // Get user
    const user = table(collectionName, this.db).where('id', userId).first();
    if (!user) {
      throw new Error('User not found');
    }

    // Verify old password
    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid) {
      throw new Error('Invalid old password');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and invalidate all tokens
    const newTokenKey = nanoid(32);
    table(collectionName, this.db)
      .where('id', userId)
      .update({
        password: hashedPassword,
        tokenKey: newTokenKey,
        updated: new Date().toISOString(),
      });
  }
}
