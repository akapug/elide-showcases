/**
 * Authentication Example for Oak Clone
 *
 * Demonstrates JWT authentication, user sessions, and protected routes
 */

import { Application, Router, Context } from '../src/oak.ts';

const app = new Application();
const router = new Router();

// ==================== JWT UTILITY ====================

class JWT {
  static sign(payload: any, secret: string, expiresIn: number = 3600): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const data = btoa(JSON.stringify({
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + expiresIn
    }));

    const signature = btoa(`${header}.${data}.${secret}`);

    return `${header}.${data}.${signature}`;
  }

  static verify(token: string, secret: string): any {
    try {
      const [header, payload, signature] = token.split('.');
      const data = JSON.parse(atob(payload));

      if (data.exp && data.exp < Math.floor(Date.now() / 1000)) {
        throw new Error('Token expired');
      }

      return data;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}

// ==================== USER STORE ====================

interface User {
  id: number;
  email: string;
  username: string;
  password: string; // Hashed
  fullName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

const users: User[] = [
  {
    id: 1,
    email: 'admin@example.com',
    username: 'admin',
    password: 'hashed_admin123', // In production: use bcrypt
    fullName: 'Admin User',
    role: 'admin',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    email: 'user@example.com',
    username: 'testuser',
    password: 'hashed_user123',
    fullName: 'Test User',
    role: 'user',
    isActive: true,
    createdAt: '2024-01-02T00:00:00Z'
  }
];

let nextUserId = 3;

// Token blacklist for logout
const tokenBlacklist = new Set<string>();

// ==================== AUTHENTICATION MIDDLEWARE ====================

function authenticate() {
  return async (ctx: Context, next: () => Promise<void>) => {
    const authHeader = ctx.request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      ctx.response.status = 401;
      ctx.response.body = {
        error: 'Unauthorized',
        message: 'Authentication token required'
      };
      return;
    }

    const token = authHeader.substring(7);

    // Check if token is blacklisted
    if (tokenBlacklist.has(token)) {
      ctx.response.status = 401;
      ctx.response.body = {
        error: 'Unauthorized',
        message: 'Token has been revoked'
      };
      return;
    }

    try {
      const payload = JWT.verify(token, 'your-secret-key');

      const user = users.find(u => u.id === payload.userId);

      if (!user || !user.isActive) {
        ctx.response.status = 401;
        ctx.response.body = {
          error: 'Unauthorized',
          message: 'Invalid user or user is inactive'
        };
        return;
      }

      ctx.state.user = {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role
      };

      ctx.state.token = token;

      await next();
    } catch (error) {
      ctx.response.status = 401;
      ctx.response.body = {
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      };
    }
  };
}

function requireRole(role: string) {
  return async (ctx: Context, next: () => Promise<void>) => {
    if (!ctx.state.user) {
      ctx.response.status = 401;
      ctx.response.body = {
        error: 'Unauthorized',
        message: 'Authentication required'
      };
      return;
    }

    if (ctx.state.user.role !== role) {
      ctx.response.status = 403;
      ctx.response.body = {
        error: 'Forbidden',
        message: `Requires ${role} role`
      };
      return;
    }

    await next();
  };
}

// ==================== HELPER FUNCTIONS ====================

function hashPassword(password: string): string {
  // In production: use bcrypt
  return `hashed_${password}`;
}

function verifyPassword(password: string, hash: string): boolean {
  return hash === hashPassword(password);
}

function sanitizeUser(user: User): any {
  const { password, ...sanitized } = user;
  return sanitized;
}

// ==================== ROUTES ====================

router.get('/', (ctx) => {
  ctx.response.body = {
    message: 'Oak Authentication Demo',
    endpoints: {
      public: [
        'POST /auth/register - Register new user',
        'POST /auth/login - Login user'
      ],
      protected: [
        'GET  /auth/me - Get current user',
        'POST /auth/logout - Logout user',
        'POST /auth/refresh - Refresh token',
        'GET  /profile - View profile',
        'PUT  /profile - Update profile'
      ],
      admin: [
        'GET  /admin/users - List all users',
        'GET  /admin/dashboard - Admin dashboard'
      ]
    }
  };
});

// ==================== PUBLIC AUTH ROUTES ====================

router.post('/auth/register', async (ctx) => {
  const body = await ctx.request.body();
  const { email, username, password, fullName } = body.value;

  // Validate input
  if (!email || !username || !password) {
    ctx.response.status = 400;
    ctx.response.body = {
      error: 'Email, username, and password are required'
    };
    return;
  }

  // Check if user exists
  if (users.some(u => u.email === email)) {
    ctx.response.status = 409;
    ctx.response.body = {
      error: 'Email already registered'
    };
    return;
  }

  if (users.some(u => u.username === username)) {
    ctx.response.status = 409;
    ctx.response.body = {
      error: 'Username already taken'
    };
    return;
  }

  // Create user
  const user: User = {
    id: nextUserId++,
    email,
    username,
    password: hashPassword(password),
    fullName: fullName || '',
    role: 'user',
    isActive: true,
    createdAt: new Date().toISOString()
  };

  users.push(user);

  ctx.response.status = 201;
  ctx.response.body = {
    message: 'User registered successfully',
    user: sanitizeUser(user)
  };
});

router.post('/auth/login', async (ctx) => {
  const body = await ctx.request.body();
  const { email, password } = body.value;

  // Validate input
  if (!email || !password) {
    ctx.response.status = 400;
    ctx.response.body = {
      error: 'Email and password are required'
    };
    return;
  }

  // Find user
  const user = users.find(u => u.email === email);

  if (!user) {
    ctx.response.status = 401;
    ctx.response.body = {
      error: 'Invalid credentials'
    };
    return;
  }

  // Verify password
  if (!verifyPassword(password, user.password)) {
    ctx.response.status = 401;
    ctx.response.body = {
      error: 'Invalid credentials'
    };
    return;
  }

  // Check if active
  if (!user.isActive) {
    ctx.response.status = 403;
    ctx.response.body = {
      error: 'Account is inactive'
    };
    return;
  }

  // Update last login
  user.lastLoginAt = new Date().toISOString();

  // Generate token
  const token = JWT.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role
    },
    'your-secret-key',
    3600 // 1 hour
  );

  ctx.response.body = {
    message: 'Login successful',
    token,
    user: sanitizeUser(user)
  };
});

// ==================== PROTECTED AUTH ROUTES ====================

router.get('/auth/me', authenticate(), (ctx) => {
  const user = users.find(u => u.id === ctx.state.user.id);

  if (!user) {
    ctx.response.status = 404;
    ctx.response.body = {
      error: 'User not found'
    };
    return;
  }

  ctx.response.body = {
    user: sanitizeUser(user)
  };
});

router.post('/auth/logout', authenticate(), (ctx) => {
  const token = ctx.state.token;

  // Add token to blacklist
  tokenBlacklist.add(token);

  ctx.response.body = {
    message: 'Logout successful'
  };
});

router.post('/auth/refresh', authenticate(), (ctx) => {
  const oldToken = ctx.state.token;

  // Blacklist old token
  tokenBlacklist.add(oldToken);

  // Generate new token
  const newToken = JWT.sign(
    {
      userId: ctx.state.user.id,
      email: ctx.state.user.email,
      role: ctx.state.user.role
    },
    'your-secret-key',
    3600
  );

  ctx.response.body = {
    message: 'Token refreshed successfully',
    token: newToken
  };
});

// ==================== PROFILE ROUTES ====================

router.get('/profile', authenticate(), (ctx) => {
  const user = users.find(u => u.id === ctx.state.user.id);

  if (!user) {
    ctx.response.status = 404;
    ctx.response.body = {
      error: 'User not found'
    };
    return;
  }

  ctx.response.body = {
    profile: sanitizeUser(user)
  };
});

router.put('/profile', authenticate(), async (ctx) => {
  const body = await ctx.request.body();
  const updates = body.value;

  const user = users.find(u => u.id === ctx.state.user.id);

  if (!user) {
    ctx.response.status = 404;
    ctx.response.body = {
      error: 'User not found'
    };
    return;
  }

  // Don't allow updating sensitive fields
  delete updates.id;
  delete updates.password;
  delete updates.role;

  Object.assign(user, updates);

  ctx.response.body = {
    message: 'Profile updated successfully',
    profile: sanitizeUser(user)
  };
});

// ==================== ADMIN ROUTES ====================

router.get('/admin/users', authenticate(), requireRole('admin'), (ctx) => {
  ctx.response.body = {
    users: users.map(sanitizeUser)
  };
});

router.get('/admin/dashboard', authenticate(), requireRole('admin'), (ctx) => {
  ctx.response.body = {
    stats: {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.isActive).length,
      inactiveUsers: users.filter(u => !u.isActive).length,
      adminUsers: users.filter(u => u.role === 'admin').length
    }
  };
});

// Error handler
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    const error = err as Error;

    ctx.response.status = 500;
    ctx.response.body = {
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
});

// Apply routes
app.use(router.routes());
app.use(router.allowedMethods());

// ==================== START SERVER ====================

await app.listen({ port: 3800 });

console.log('\n🔐 Oak Authentication Demo listening on port 3800\n');
console.log('Authentication Features:');
console.log('  • User registration and login');
console.log('  • JWT token generation and verification');
console.log('  • Token refresh mechanism');
console.log('  • Token blacklist (logout)');
console.log('  • Role-based access control');
console.log('  • Protected routes\n');
console.log('Test Credentials:');
console.log('  Admin: admin@example.com / admin123');
console.log('  User:  user@example.com / user123\n');
console.log('Endpoints:');
console.log('  POST /auth/register - Register new user');
console.log('  POST /auth/login - Login user');
console.log('  GET  /auth/me - Get current user (protected)');
console.log('  POST /auth/logout - Logout (protected)');
console.log('  POST /auth/refresh - Refresh token (protected)');
console.log('  GET  /profile - View profile (protected)');
console.log('  PUT  /profile - Update profile (protected)');
console.log('  GET  /admin/users - List users (admin only)');
console.log('  GET  /admin/dashboard - Admin dashboard (admin only)\n');
console.log('Usage:\n');
console.log('  # Login');
console.log('  curl -X POST http://localhost:3800/auth/login \\');
console.log('    -H "Content-Type: application/json" \\');
console.log('    -d \'{"email":"user@example.com","password":"user123"}\'');
console.log('');
console.log('  # Get profile (use token from login)');
console.log('  curl http://localhost:3800/auth/me \\');
console.log('    -H "Authorization: Bearer YOUR_TOKEN"');
console.log('');
console.log('  # Access admin endpoint');
console.log('  curl http://localhost:3800/admin/users \\');
console.log('    -H "Authorization: Bearer ADMIN_TOKEN"\n');
