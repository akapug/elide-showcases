/**
 * AuthManager - Authentication and authorization for ElideDB
 * Handles user management and token-based auth
 */

import * as crypto from 'crypto';
import { AuthToken, Timestamp } from '../types';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Timestamp;
}

export interface AuthResult {
  valid: boolean;
  userId?: string;
  error?: string;
}

export class AuthManager {
  private users: Map<string, User> = new Map();
  private tokens: Map<string, AuthToken> = new Map();
  private tokenExpiry: number = 7 * 24 * 60 * 60 * 1000; // 7 days

  /**
   * Register a new user
   */
  async register(email: string, password: string): Promise<User> {
    // Check if user already exists
    for (const user of this.users.values()) {
      if (user.email === email) {
        throw new Error('User already exists');
      }
    }

    // Hash password
    const passwordHash = this.hashPassword(password);

    // Create user
    const user: User = {
      id: this.generateId(),
      email,
      passwordHash,
      createdAt: Date.now()
    };

    this.users.set(user.id, user);

    console.log(`User registered: ${email}`);

    return user;
  }

  /**
   * Login and get authentication token
   */
  async login(email: string, password: string): Promise<AuthToken> {
    // Find user by email
    let user: User | undefined;
    for (const u of this.users.values()) {
      if (u.email === email) {
        user = u;
        break;
      }
    }

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const passwordHash = this.hashPassword(password);
    if (passwordHash !== user.passwordHash) {
      throw new Error('Invalid credentials');
    }

    // Generate token
    const token = this.generateToken();
    const authToken: AuthToken = {
      userId: user.id,
      token,
      expiresAt: Date.now() + this.tokenExpiry
    };

    this.tokens.set(token, authToken);

    console.log(`User logged in: ${email}`);

    return authToken;
  }

  /**
   * Verify authentication token
   */
  async verify(token: string): Promise<AuthResult> {
    const authToken = this.tokens.get(token);

    if (!authToken) {
      return {
        valid: false,
        error: 'Invalid token'
      };
    }

    // Check expiry
    if (authToken.expiresAt < Date.now()) {
      this.tokens.delete(token);
      return {
        valid: false,
        error: 'Token expired'
      };
    }

    return {
      valid: true,
      userId: authToken.userId
    };
  }

  /**
   * Logout (invalidate token)
   */
  async logout(token: string): Promise<void> {
    this.tokens.delete(token);
  }

  /**
   * Get user by ID
   */
  async getUser(userId: string): Promise<User | null> {
    return this.users.get(userId) || null;
  }

  /**
   * Update user password
   */
  async updatePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify old password
    const oldHash = this.hashPassword(oldPassword);
    if (oldHash !== user.passwordHash) {
      throw new Error('Invalid old password');
    }

    // Update password
    user.passwordHash = this.hashPassword(newPassword);

    console.log(`Password updated for user ${userId}`);
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<void> {
    this.users.delete(userId);

    // Invalidate all user's tokens
    for (const [token, authToken] of this.tokens) {
      if (authToken.userId === userId) {
        this.tokens.delete(token);
      }
    }

    console.log(`User deleted: ${userId}`);
  }

  /**
   * Hash password using SHA-256
   * In production, use bcrypt or argon2
   */
  private hashPassword(password: string): string {
    return crypto
      .createHash('sha256')
      .update(password)
      .digest('hex');
  }

  /**
   * Generate random token
   */
  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate random ID
   */
  private generateId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Clean up expired tokens
   */
  cleanupExpiredTokens(): void {
    const now = Date.now();
    for (const [token, authToken] of this.tokens) {
      if (authToken.expiresAt < now) {
        this.tokens.delete(token);
      }
    }
  }

  /**
   * Get active token count
   */
  getActiveTokenCount(): number {
    return this.tokens.size;
  }

  /**
   * Get user count
   */
  getUserCount(): number {
    return this.users.size;
  }
}

/**
 * Permission-based authorization
 */
export interface Permission {
  userId: string;
  resource: string;
  actions: string[];
}

export class PermissionManager {
  private permissions: Map<string, Permission[]> = new Map();

  /**
   * Grant permission to a user
   */
  grant(userId: string, resource: string, actions: string[]): void {
    const key = `${userId}:${resource}`;
    const existing = this.permissions.get(key) || [];

    const permission: Permission = {
      userId,
      resource,
      actions: Array.from(new Set([...existing.flatMap(p => p.actions), ...actions]))
    };

    this.permissions.set(key, [permission]);
  }

  /**
   * Revoke permission from a user
   */
  revoke(userId: string, resource: string, actions?: string[]): void {
    const key = `${userId}:${resource}`;

    if (!actions) {
      // Revoke all permissions for this resource
      this.permissions.delete(key);
      return;
    }

    const existing = this.permissions.get(key);
    if (!existing) return;

    const updated = existing.map(p => ({
      ...p,
      actions: p.actions.filter(a => !actions.includes(a))
    })).filter(p => p.actions.length > 0);

    if (updated.length === 0) {
      this.permissions.delete(key);
    } else {
      this.permissions.set(key, updated);
    }
  }

  /**
   * Check if user has permission
   */
  can(userId: string, resource: string, action: string): boolean {
    const key = `${userId}:${resource}`;
    const permissions = this.permissions.get(key);

    if (!permissions) return false;

    return permissions.some(p => p.actions.includes(action) || p.actions.includes('*'));
  }

  /**
   * Get all permissions for a user
   */
  getUserPermissions(userId: string): Permission[] {
    const userPermissions: Permission[] = [];

    for (const [key, permissions] of this.permissions) {
      if (key.startsWith(`${userId}:`)) {
        userPermissions.push(...permissions);
      }
    }

    return userPermissions;
  }

  /**
   * Clear all permissions for a user
   */
  clearUserPermissions(userId: string): void {
    const keysToDelete: string[] = [];

    for (const key of this.permissions.keys()) {
      if (key.startsWith(`${userId}:`)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.permissions.delete(key);
    }
  }
}

/**
 * Row-level security
 */
export interface RowPolicy {
  table: string;
  operation: 'read' | 'write' | 'delete';
  condition: (row: any, userId: string) => boolean;
}

export class RowLevelSecurity {
  private policies: Map<string, RowPolicy[]> = new Map();

  /**
   * Add a row-level security policy
   */
  addPolicy(policy: RowPolicy): void {
    const key = `${policy.table}:${policy.operation}`;
    const existing = this.policies.get(key) || [];
    existing.push(policy);
    this.policies.set(key, existing);
  }

  /**
   * Check if user can perform operation on row
   */
  can(table: string, operation: string, row: any, userId: string): boolean {
    const key = `${table}:${operation}`;
    const policies = this.policies.get(key);

    if (!policies || policies.length === 0) {
      // No policies = allowed by default
      return true;
    }

    // Must satisfy at least one policy
    return policies.some(policy => policy.condition(row, userId));
  }

  /**
   * Filter rows based on policies
   */
  filter(table: string, operation: string, rows: any[], userId: string): any[] {
    return rows.filter(row => this.can(table, operation, row, userId));
  }

  /**
   * Remove all policies for a table
   */
  clearPolicies(table: string): void {
    const keysToDelete: string[] = [];

    for (const key of this.policies.keys()) {
      if (key.startsWith(`${table}:`)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.policies.delete(key);
    }
  }
}

/**
 * API key authentication
 */
export interface ApiKey {
  key: string;
  userId: string;
  name: string;
  createdAt: Timestamp;
  expiresAt?: Timestamp;
  lastUsedAt?: Timestamp;
}

export class ApiKeyManager {
  private apiKeys: Map<string, ApiKey> = new Map();

  /**
   * Create a new API key
   */
  create(userId: string, name: string, expiresAt?: Timestamp): ApiKey {
    const apiKey: ApiKey = {
      key: this.generateApiKey(),
      userId,
      name,
      createdAt: Date.now(),
      expiresAt
    };

    this.apiKeys.set(apiKey.key, apiKey);

    return apiKey;
  }

  /**
   * Verify API key
   */
  verify(key: string): AuthResult {
    const apiKey = this.apiKeys.get(key);

    if (!apiKey) {
      return { valid: false, error: 'Invalid API key' };
    }

    // Check expiry
    if (apiKey.expiresAt && apiKey.expiresAt < Date.now()) {
      return { valid: false, error: 'API key expired' };
    }

    // Update last used
    apiKey.lastUsedAt = Date.now();

    return { valid: true, userId: apiKey.userId };
  }

  /**
   * Revoke API key
   */
  revoke(key: string): void {
    this.apiKeys.delete(key);
  }

  /**
   * Get API keys for user
   */
  getUserApiKeys(userId: string): ApiKey[] {
    const keys: ApiKey[] = [];

    for (const apiKey of this.apiKeys.values()) {
      if (apiKey.userId === userId) {
        keys.push(apiKey);
      }
    }

    return keys;
  }

  /**
   * Generate random API key
   */
  private generateApiKey(): string {
    return 'eldb_' + crypto.randomBytes(32).toString('hex');
  }
}
