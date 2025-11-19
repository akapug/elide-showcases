/**
 * Authentication & Authorization Manager
 *
 * Handles user authentication and access control:
 * - User registration and login
 * - JWT token management
 * - Role-based access control (RBAC)
 * - Rate limiting per user
 * - Session management
 * - Password hashing simulation
 * - API key authentication
 */

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'author' | 'viewer';
  passwordHash: string;
  apiKey?: string;
  createdAt: Date;
  lastLogin?: Date;
  status: 'active' | 'suspended' | 'deleted';
  metadata: Record<string, any>;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  createdAt: Date;
  expiresAt: Date;
  lastActivity: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface RateLimit {
  identifier: string;
  requests: number[];
  limit: number;
  windowMs: number;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

export interface Permission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'admin';
}

export class AuthManager {
  private users: Map<string, User> = new Map();
  private sessions: Map<string, Session> = new Map();
  private rateLimits: Map<string, RateLimit> = new Map();
  private apiKeys: Map<string, string> = new Map(); // apiKey -> userId

  private readonly secret = 'cms-secret-key-change-in-production';
  private readonly tokenExpiry = 24 * 60 * 60 * 1000; // 24 hours
  private readonly sessionExpiry = 7 * 24 * 60 * 60 * 1000; // 7 days

  // Role permissions matrix
  private rolePermissions: Map<string, Set<string>> = new Map([
    [
      'admin',
      new Set([
        'content:create',
        'content:read',
        'content:update',
        'content:delete',
        'content:admin',
        'media:create',
        'media:read',
        'media:update',
        'media:delete',
        'media:admin',
        'user:create',
        'user:read',
        'user:update',
        'user:delete',
        'system:admin'
      ])
    ],
    [
      'editor',
      new Set([
        'content:create',
        'content:read',
        'content:update',
        'content:delete',
        'media:create',
        'media:read',
        'media:update',
        'media:delete'
      ])
    ],
    [
      'author',
      new Set([
        'content:create',
        'content:read',
        'content:update',
        'media:create',
        'media:read',
        'media:update'
      ])
    ],
    ['viewer', new Set(['content:read', 'media:read'])]
  ]);

  constructor() {
    this.initializeDefaultUsers();
    this.startCleanupJobs();
    console.log('🔐 Auth Manager initialized');
  }

  /**
   * Initialize default users
   */
  private initializeDefaultUsers(): void {
    // Create default admin user
    this.createUser(
      'admin@cms.local',
      'admin123',
      'System Admin',
      'admin'
    );

    // Create sample editor
    this.createUser(
      'editor@cms.local',
      'editor123',
      'Content Editor',
      'editor'
    );
  }

  /**
   * Register new user
   */
  register(email: string, password: string, name: string, role: User['role'] = 'author'): AuthResult {
    // Validate email
    if (!this.validateEmail(email)) {
      return { success: false, error: 'Invalid email format' };
    }

    // Check if user exists
    if (this.getUserByEmail(email)) {
      return { success: false, error: 'Email already registered' };
    }

    // Validate password strength
    if (!this.validatePassword(password)) {
      return {
        success: false,
        error: 'Password must be at least 8 characters'
      };
    }

    const user = this.createUser(email, password, name, role);
    const token = this.generateToken(user);

    return {
      success: true,
      user: this.sanitizeUser(user),
      token
    };
  }

  /**
   * Login user
   */
  login(email: string, password: string): AuthResult {
    const user = this.getUserByEmail(email);

    if (!user) {
      return { success: false, error: 'Invalid credentials' };
    }

    if (user.status !== 'active') {
      return { success: false, error: 'Account is not active' };
    }

    // Verify password
    if (!this.verifyPassword(password, user.passwordHash)) {
      return { success: false, error: 'Invalid credentials' };
    }

    // Update last login
    user.lastLogin = new Date();

    // Generate token
    const token = this.generateToken(user);

    // Create session
    this.createSession(user.id, token);

    return {
      success: true,
      user: this.sanitizeUser(user),
      token
    };
  }

  /**
   * Validate JWT token
   */
  async validateToken(token: string): Promise<User | null> {
    try {
      const payload = this.decodeToken(token);

      if (!payload) {
        return null;
      }

      // Check expiration
      if (payload.exp * 1000 < Date.now()) {
        return null;
      }

      // Get user
      const user = this.users.get(payload.userId);

      if (!user || user.status !== 'active') {
        return null;
      }

      // Update session activity
      const session = this.getSessionByToken(token);
      if (session) {
        session.lastActivity = new Date();
      }

      return user;
    } catch (error) {
      console.error('Token validation error:', error);
      return null;
    }
  }

  /**
   * Validate API key
   */
  validateApiKey(apiKey: string): User | null {
    const userId = this.apiKeys.get(apiKey);
    if (!userId) return null;

    const user = this.users.get(userId);
    if (!user || user.status !== 'active') return null;

    return user;
  }

  /**
   * Generate API key for user
   */
  generateApiKey(userId: string): string {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found');

    const apiKey = this.generateRandomKey();
    user.apiKey = apiKey;
    this.apiKeys.set(apiKey, userId);

    return apiKey;
  }

  /**
   * Revoke API key
   */
  revokeApiKey(userId: string): boolean {
    const user = this.users.get(userId);
    if (!user || !user.apiKey) return false;

    this.apiKeys.delete(user.apiKey);
    user.apiKey = undefined;

    return true;
  }

  /**
   * Check if user has permission
   */
  hasPermission(user: User, resource: string, action: string): boolean {
    const permissions = this.rolePermissions.get(user.role);
    if (!permissions) return false;

    const permissionKey = `${resource}:${action}`;
    return permissions.has(permissionKey);
  }

  /**
   * Check rate limit
   */
  checkRateLimit(
    identifier: string,
    maxRequests = 1000,
    windowMs = 60000
  ): { allowed: boolean; remaining: number; resetAt: number; limit: number } {
    const now = Date.now();
    let rateLimit = this.rateLimits.get(identifier);

    if (!rateLimit) {
      rateLimit = {
        identifier,
        requests: [],
        limit: maxRequests,
        windowMs
      };
      this.rateLimits.set(identifier, rateLimit);
    }

    // Remove expired requests
    rateLimit.requests = rateLimit.requests.filter(
      timestamp => now - timestamp < windowMs
    );

    const remaining = maxRequests - rateLimit.requests.length;
    const allowed = remaining > 0;

    if (allowed) {
      rateLimit.requests.push(now);
    }

    const resetAt = rateLimit.requests.length > 0 ? rateLimit.requests[0] + windowMs : now + windowMs;

    return {
      allowed,
      remaining: Math.max(0, remaining - 1),
      resetAt,
      limit: maxRequests
    };
  }

  /**
   * Logout user (invalidate session)
   */
  logout(token: string): boolean {
    const session = this.getSessionByToken(token);
    if (!session) return false;

    this.sessions.delete(session.id);
    return true;
  }

  /**
   * Logout all user sessions
   */
  logoutAll(userId: string): number {
    const userSessions = Array.from(this.sessions.values()).filter(
      s => s.userId === userId
    );

    for (const session of userSessions) {
      this.sessions.delete(session.id);
    }

    return userSessions.length;
  }

  /**
   * Get user sessions
   */
  getUserSessions(userId: string): Session[] {
    return Array.from(this.sessions.values())
      .filter(s => s.userId === userId)
      .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
  }

  /**
   * Update user profile
   */
  updateUser(userId: string, updates: Partial<User>): User | null {
    const user = this.users.get(userId);
    if (!user) return null;

    // Prevent updating sensitive fields
    delete updates.id;
    delete updates.passwordHash;

    Object.assign(user, updates);
    return this.sanitizeUser(user);
  }

  /**
   * Change password
   */
  changePassword(userId: string, oldPassword: string, newPassword: string): AuthResult {
    const user = this.users.get(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Verify old password
    if (!this.verifyPassword(oldPassword, user.passwordHash)) {
      return { success: false, error: 'Invalid current password' };
    }

    // Validate new password
    if (!this.validatePassword(newPassword)) {
      return {
        success: false,
        error: 'New password must be at least 8 characters'
      };
    }

    // Update password
    user.passwordHash = this.hashPassword(newPassword);

    // Invalidate all sessions
    this.logoutAll(userId);

    return { success: true };
  }

  /**
   * Delete user
   */
  deleteUser(userId: string): boolean {
    const user = this.users.get(userId);
    if (!user) return false;

    // Soft delete
    user.status = 'deleted';

    // Invalidate sessions
    this.logoutAll(userId);

    // Revoke API key
    if (user.apiKey) {
      this.revokeApiKey(userId);
    }

    return true;
  }

  /**
   * List users
   */
  listUsers(filter?: {
    role?: User['role'];
    status?: User['status'];
    page?: number;
    limit?: number;
  }): { users: User[]; total: number } {
    let users = Array.from(this.users.values());

    if (filter?.role) {
      users = users.filter(u => u.role === filter.role);
    }

    if (filter?.status) {
      users = users.filter(u => u.status === filter.status);
    }

    const total = users.length;
    const page = filter?.page || 1;
    const limit = Math.min(filter?.limit || 20, 100);
    const start = (page - 1) * limit;

    users = users
      .slice(start, start + limit)
      .map(u => this.sanitizeUser(u));

    return { users, total };
  }

  /**
   * Create user (internal)
   */
  private createUser(
    email: string,
    password: string,
    name: string,
    role: User['role']
  ): User {
    const id = this.generateId();

    const user: User = {
      id,
      email,
      name,
      role,
      passwordHash: this.hashPassword(password),
      createdAt: new Date(),
      status: 'active',
      metadata: {}
    };

    this.users.set(id, user);
    return user;
  }

  /**
   * Generate JWT token
   */
  private generateToken(user: User): string {
    const now = Math.floor(Date.now() / 1000);
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      iat: now,
      exp: now + this.tokenExpiry / 1000
    };

    // Simple JWT encoding (in production, use proper library with signing)
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = btoa(JSON.stringify(payload));
    const signature = btoa(`${header}.${body}.${this.secret}`);

    return `${header}.${body}.${signature}`;
  }

  /**
   * Decode JWT token
   */
  private decodeToken(token: string): JWTPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const payload = JSON.parse(atob(parts[1]));
      return payload as JWTPayload;
    } catch {
      return null;
    }
  }

  /**
   * Create session
   */
  private createSession(userId: string, token: string): Session {
    const id = this.generateId();
    const now = new Date();

    const session: Session = {
      id,
      userId,
      token,
      createdAt: now,
      expiresAt: new Date(now.getTime() + this.sessionExpiry),
      lastActivity: now
    };

    this.sessions.set(id, session);
    return session;
  }

  /**
   * Get session by token
   */
  private getSessionByToken(token: string): Session | null {
    for (const session of this.sessions.values()) {
      if (session.token === token) {
        return session;
      }
    }
    return null;
  }

  /**
   * Get user by email
   */
  private getUserByEmail(email: string): User | null {
    for (const user of this.users.values()) {
      if (user.email.toLowerCase() === email.toLowerCase()) {
        return user;
      }
    }
    return null;
  }

  /**
   * Hash password (simplified - use bcrypt in production)
   */
  private hashPassword(password: string): string {
    // Simple hash for demo (use bcrypt/argon2 in production)
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return `hash_${Math.abs(hash).toString(36)}`;
  }

  /**
   * Verify password
   */
  private verifyPassword(password: string, hash: string): boolean {
    return this.hashPassword(password) === hash;
  }

  /**
   * Validate email format
   */
  private validateEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  /**
   * Validate password strength
   */
  private validatePassword(password: string): boolean {
    return password.length >= 8;
  }

  /**
   * Sanitize user (remove sensitive data)
   */
  private sanitizeUser(user: User): User {
    const { passwordHash, ...sanitized } = user;
    return sanitized as User;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate random API key
   */
  private generateRandomKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = '';
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `cms_${key}`;
  }

  /**
   * Start cleanup jobs
   */
  private startCleanupJobs(): void {
    // Cleanup expired sessions every hour
    setInterval(() => {
      this.cleanupSessions();
    }, 3600000);

    // Cleanup rate limits every 5 minutes
    setInterval(() => {
      this.cleanupRateLimits();
    }, 300000);
  }

  /**
   * Cleanup expired sessions
   */
  private cleanupSessions(): void {
    const now = new Date();
    const toDelete: string[] = [];

    for (const [id, session] of this.sessions) {
      if (session.expiresAt < now) {
        toDelete.push(id);
      }
    }

    for (const id of toDelete) {
      this.sessions.delete(id);
    }

    if (toDelete.length > 0) {
      console.log(`🧹 Auth: Cleaned up ${toDelete.length} expired sessions`);
    }
  }

  /**
   * Cleanup old rate limit data
   */
  private cleanupRateLimits(): void {
    const now = Date.now();

    for (const [identifier, rateLimit] of this.rateLimits) {
      rateLimit.requests = rateLimit.requests.filter(
        timestamp => now - timestamp < rateLimit.windowMs
      );

      // Remove if no recent requests
      if (rateLimit.requests.length === 0) {
        this.rateLimits.delete(identifier);
      }
    }
  }

  /**
   * Get authentication statistics
   */
  getStats(): any {
    return {
      totalUsers: this.users.size,
      activeUsers: Array.from(this.users.values()).filter(u => u.status === 'active').length,
      activeSessions: this.sessions.size,
      usersByRole: this.getUsersByRole(),
      recentLogins: this.getRecentLogins(10)
    };
  }

  /**
   * Get users by role
   */
  private getUsersByRole(): Record<string, number> {
    const byRole: Record<string, number> = {};

    for (const user of this.users.values()) {
      byRole[user.role] = (byRole[user.role] || 0) + 1;
    }

    return byRole;
  }

  /**
   * Get recent logins
   */
  private getRecentLogins(limit = 10): Array<{ email: string; lastLogin: Date }> {
    return Array.from(this.users.values())
      .filter(u => u.lastLogin)
      .sort((a, b) => (b.lastLogin?.getTime() || 0) - (a.lastLogin?.getTime() || 0))
      .slice(0, limit)
      .map(u => ({
        email: u.email,
        lastLogin: u.lastLogin!
      }));
  }
}
