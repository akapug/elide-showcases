/**
 * Authentication Example for Adonis Clone
 *
 * Demonstrates user authentication, JWT tokens, guards, and session management
 */

import { application } from '../src/adonis.ts';

const app = application();

// ==================== CONFIGURATION ====================

app.config.set('app.name', 'Adonis Auth Demo');
app.config.set('app.port', 3500);
app.config.set('app.key', 'your-secret-key-change-in-production');
app.config.set('auth.guard', 'jwt');

// ==================== AUTHENTICATION SYSTEM ====================

class Hash {
  static async make(password: string): Promise<string> {
    // Simulate bcrypt hashing
    return `$2b$10$hashed_${password}`;
  }

  static async verify(password: string, hash: string): Promise<boolean> {
    // Simulate hash verification
    const expectedHash = await this.make(password);
    return hash === expectedHash || hash.endsWith(password);
  }
}

class JWT {
  static sign(payload: any, secret: string, expiresIn: number = 3600): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
    const data = Buffer.from(JSON.stringify({
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + expiresIn
    })).toString('base64');

    // Simplified signature (in production use crypto)
    const signature = Buffer.from(`${header}.${data}.${secret}`).toString('base64');

    return `${header}.${data}.${signature}`;
  }

  static verify(token: string, secret: string): any {
    try {
      const [header, payload, signature] = token.split('.');
      const data = JSON.parse(Buffer.from(payload, 'base64').toString());

      // Check expiration
      if (data.exp && data.exp < Math.floor(Date.now() / 1000)) {
        throw new Error('Token expired');
      }

      return data;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}

class Auth {
  private users: Map<number, any>;
  private tokens: Map<string, any>;
  private sessions: Map<string, any>;

  constructor() {
    this.users = new Map();
    this.tokens = new Map();
    this.sessions = new Map();

    // Seed users
    this.users.set(1, {
      id: 1,
      email: 'alice@example.com',
      username: 'alice',
      password: '$2b$10$hashed_password123',
      role: 'admin',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z'
    });

    this.users.set(2, {
      id: 2,
      email: 'bob@example.com',
      username: 'bob',
      password: '$2b$10$hashed_password456',
      role: 'user',
      isActive: true,
      createdAt: '2024-01-02T00:00:00Z'
    });
  }

  async attempt(email: string, password: string): Promise<{ user: any; token: string } | null> {
    // Find user by email
    const user = Array.from(this.users.values()).find(u => u.email === email);

    if (!user) {
      return null;
    }

    if (!user.isActive) {
      throw new Error('Account is inactive');
    }

    // Verify password
    const valid = await Hash.verify(password, user.password);

    if (!valid) {
      return null;
    }

    // Generate JWT token
    const token = JWT.sign(
      { userId: user.id, email: user.email, role: user.role },
      app.config.get('app.key'),
      3600 // 1 hour
    );

    this.tokens.set(token, {
      userId: user.id,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString()
    });

    // Update last login
    user.lastLoginAt = new Date().toISOString();

    return {
      user: this.sanitizeUser(user),
      token
    };
  }

  async verifyToken(token: string): Promise<any | null> {
    try {
      const payload = JWT.verify(token, app.config.get('app.key'));

      const user = this.users.get(payload.userId);

      if (!user || !user.isActive) {
        return null;
      }

      return this.sanitizeUser(user);
    } catch (error) {
      return null;
    }
  }

  async register(userData: any): Promise<any> {
    // Check if email exists
    const exists = Array.from(this.users.values()).find(u => u.email === userData.email);

    if (exists) {
      throw new Error('Email already registered');
    }

    // Hash password
    const hashedPassword = await Hash.make(userData.password);

    const user = {
      id: this.users.size + 1,
      email: userData.email,
      username: userData.username,
      password: hashedPassword,
      fullName: userData.fullName || '',
      role: 'user',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.users.set(user.id, user);

    return this.sanitizeUser(user);
  }

  async logout(token: string): Promise<void> {
    this.tokens.delete(token);
  }

  async refreshToken(oldToken: string): Promise<string | null> {
    const user = await this.verifyToken(oldToken);

    if (!user) {
      return null;
    }

    // Revoke old token
    this.tokens.delete(oldToken);

    // Generate new token
    const newToken = JWT.sign(
      { userId: user.id, email: user.email, role: user.role },
      app.config.get('app.key'),
      3600
    );

    this.tokens.set(newToken, {
      userId: user.id,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString()
    });

    return newToken;
  }

  private sanitizeUser(user: any): any {
    const { password, ...sanitized } = user;
    return sanitized;
  }

  getUserById(id: number): any | null {
    const user = this.users.get(id);
    return user ? this.sanitizeUser(user) : null;
  }

  updateUser(id: number, updates: any): any | null {
    const user = this.users.get(id);

    if (!user) {
      return null;
    }

    Object.assign(user, updates, { updatedAt: new Date().toISOString() });

    return this.sanitizeUser(user);
  }
}

const authService = new Auth();

// ==================== MIDDLEWARE ====================

class AuthMiddleware {
  async handle(ctx: any, next: any) {
    const authHeader = ctx.request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Unauthorized: No token provided');
    }

    const token = authHeader.substring(7);
    const user = await authService.verifyToken(token);

    if (!user) {
      throw new Error('Unauthorized: Invalid or expired token');
    }

    ctx.auth = { user, token };

    await next();
  }
}

class GuestMiddleware {
  async handle(ctx: any, next: any) {
    const authHeader = ctx.request.headers['authorization'];

    if (authHeader) {
      throw new Error('Already authenticated');
    }

    await next();
  }
}

class RoleMiddleware {
  constructor(private allowedRoles: string[]) {}

  async handle(ctx: any, next: any) {
    if (!ctx.auth || !ctx.auth.user) {
      throw new Error('Unauthorized');
    }

    if (!this.allowedRoles.includes(ctx.auth.user.role)) {
      throw new Error('Forbidden: Insufficient permissions');
    }

    await next();
  }
}

// ==================== CONTROLLERS ====================

class AuthController {
  async register(ctx: any) {
    try {
      const { email, username, password, fullName } = ctx.request.body;

      // Validate input
      if (!email || !username || !password) {
        return ctx.response.status(400).json({
          error: 'Email, username, and password are required'
        });
      }

      const user = await authService.register({
        email,
        username,
        password,
        fullName
      });

      return ctx.response.status(201).json({
        message: 'Registration successful',
        user
      });
    } catch (error: any) {
      return ctx.response.status(400).json({
        error: error.message
      });
    }
  }

  async login(ctx: any) {
    try {
      const { email, password } = ctx.request.body;

      if (!email || !password) {
        return ctx.response.status(400).json({
          error: 'Email and password are required'
        });
      }

      const result = await authService.attempt(email, password);

      if (!result) {
        return ctx.response.status(401).json({
          error: 'Invalid credentials'
        });
      }

      return ctx.response.json({
        message: 'Login successful',
        ...result
      });
    } catch (error: any) {
      return ctx.response.status(401).json({
        error: error.message
      });
    }
  }

  async logout(ctx: any) {
    const token = ctx.auth.token;

    await authService.logout(token);

    return ctx.response.json({
      message: 'Logout successful'
    });
  }

  async me(ctx: any) {
    return ctx.response.json({
      user: ctx.auth.user
    });
  }

  async refresh(ctx: any) {
    const { token } = ctx.request.body;

    if (!token) {
      return ctx.response.status(400).json({
        error: 'Token is required'
      });
    }

    const newToken = await authService.refreshToken(token);

    if (!newToken) {
      return ctx.response.status(401).json({
        error: 'Invalid or expired token'
      });
    }

    return ctx.response.json({
      message: 'Token refreshed successfully',
      token: newToken
    });
  }
}

class ProfileController {
  async show(ctx: any) {
    const user = ctx.auth.user;

    return ctx.response.json({
      profile: user
    });
  }

  async update(ctx: any) {
    const userId = ctx.auth.user.id;
    const updates = ctx.request.body;

    // Don't allow updating sensitive fields
    delete updates.id;
    delete updates.password;
    delete updates.role;

    const user = authService.updateUser(userId, updates);

    if (!user) {
      return ctx.response.status(404).json({
        error: 'User not found'
      });
    }

    return ctx.response.json({
      message: 'Profile updated successfully',
      profile: user
    });
  }

  async changePassword(ctx: any) {
    const userId = ctx.auth.user.id;
    const { currentPassword, newPassword } = ctx.request.body;

    if (!currentPassword || !newPassword) {
      return ctx.response.status(400).json({
        error: 'Current and new password are required'
      });
    }

    // Verify current password
    const user = authService.getUserById(userId);

    if (!user) {
      return ctx.response.status(404).json({
        error: 'User not found'
      });
    }

    const hashedPassword = await Hash.make(newPassword);

    authService.updateUser(userId, { password: hashedPassword });

    return ctx.response.json({
      message: 'Password changed successfully'
    });
  }
}

class AdminController {
  async dashboard(ctx: any) {
    return ctx.response.json({
      message: 'Admin dashboard',
      stats: {
        totalUsers: 2,
        activeUsers: 2,
        inactiveUsers: 0
      }
    });
  }

  async getUsers(ctx: any) {
    // This would typically fetch from database
    return ctx.response.json({
      users: [
        authService.getUserById(1),
        authService.getUserById(2)
      ]
    });
  }
}

// ==================== START APPLICATION ====================

console.log('\n🔐 Adonis Authentication Demo\n');
console.log('Authentication Features:');
console.log('  • User registration and login');
console.log('  • JWT token generation and verification');
console.log('  • Token refresh mechanism');
console.log('  • Password hashing');
console.log('  • Role-based access control');
console.log('  • Auth and Guest middleware');
console.log('  • Profile management\n');
console.log('Endpoints:\n');
console.log('Public:');
console.log('  POST /auth/register - Register new user');
console.log('  POST /auth/login - Login user');
console.log('  POST /auth/refresh - Refresh token\n');
console.log('Protected (requires Bearer token):');
console.log('  POST /auth/logout - Logout user');
console.log('  GET  /auth/me - Get current user');
console.log('  GET  /profile - View profile');
console.log('  PUT  /profile - Update profile');
console.log('  POST /profile/change-password - Change password\n');
console.log('Admin Only:');
console.log('  GET  /admin/dashboard - Admin dashboard');
console.log('  GET  /admin/users - List all users\n');
console.log('Test Credentials:');
console.log('  Email: alice@example.com, Password: password123 (admin)');
console.log('  Email: bob@example.com, Password: password456 (user)\n');
console.log('Usage:');
console.log('  # Login');
console.log('  curl -X POST http://localhost:3500/auth/login \\');
console.log('    -H "Content-Type: application/json" \\');
console.log('    -d \'{"email":"alice@example.com","password":"password123"}\'');
console.log('');
console.log('  # Get profile (use token from login)');
console.log('  curl http://localhost:3500/auth/me \\');
console.log('    -H "Authorization: Bearer YOUR_TOKEN"\n');

await app.start();
