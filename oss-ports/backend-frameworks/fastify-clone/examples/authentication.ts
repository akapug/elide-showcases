/**
 * Authentication Example
 *
 * Demonstrates JWT-based authentication patterns
 */

import fastify from '../src/fastify.ts';

const app = fastify({ logger: true });

// ==================== SIMULATED DATABASE ====================

interface User {
  id: number;
  username: string;
  email: string;
  password: string; // In production, store hashed passwords!
  role: 'user' | 'admin';
  createdAt: string;
}

const users: User[] = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    password: 'admin123', // In production: use bcrypt!
    role: 'admin',
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    username: 'user',
    email: 'user@example.com',
    password: 'user123',
    role: 'user',
    createdAt: new Date().toISOString()
  }
];

const sessions = new Map<string, { userId: number; expiresAt: number }>();

// ==================== DECORATORS ====================

app.decorateRequest('user', null);
app.decorateRequest('token', null);

// ==================== AUTH UTILITIES ====================

function generateToken(userId: number): string {
  return `token-${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function validateToken(token: string): { valid: boolean; userId?: number } {
  const session = sessions.get(token);

  if (!session) {
    return { valid: false };
  }

  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return { valid: false };
  }

  return { valid: true, userId: session.userId };
}

function hashPassword(password: string): string {
  // In production, use bcrypt or argon2!
  return `hashed-${password}`;
}

function verifyPassword(password: string, hashedPassword: string): boolean {
  // In production, use bcrypt.compare()!
  return `hashed-${password}` === hashedPassword;
}

// ==================== AUTHENTICATION MIDDLEWARE ====================

const authenticate = async (request: any, reply: any) => {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply.code(401).send({
      error: 'Unauthorized',
      message: 'Authentication token required'
    });
    return;
  }

  const token = authHeader.substring(7);
  const validation = validateToken(token);

  if (!validation.valid) {
    reply.code(401).send({
      error: 'Unauthorized',
      message: 'Invalid or expired token'
    });
    return;
  }

  const user = users.find(u => u.id === validation.userId);

  if (!user) {
    reply.code(401).send({
      error: 'Unauthorized',
      message: 'User not found'
    });
    return;
  }

  request.user = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role
  };
  request.token = token;
};

const requireAdmin = async (request: any, reply: any) => {
  if (!request.user) {
    reply.code(401).send({
      error: 'Unauthorized',
      message: 'Authentication required'
    });
    return;
  }

  if (request.user.role !== 'admin') {
    reply.code(403).send({
      error: 'Forbidden',
      message: 'Admin privileges required'
    });
    return;
  }
};

// ==================== PUBLIC ROUTES ====================

app.get('/', async (request, reply) => {
  return {
    message: 'Authentication API',
    endpoints: {
      public: [
        'POST /register',
        'POST /login',
        'GET /health'
      ],
      protected: [
        'GET /profile',
        'PUT /profile',
        'POST /logout'
      ],
      admin: [
        'GET /admin/users',
        'DELETE /admin/users/:id'
      ]
    }
  };
});

app.get('/health', async (request, reply) => {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString()
  };
});

// ==================== AUTH ROUTES ====================

// Register new user
app.post('/register', {
  schema: {
    body: {
      type: 'object',
      required: ['username', 'email', 'password'],
      properties: {
        username: { type: 'string', minLength: 3 },
        email: { type: 'string' },
        password: { type: 'string', minLength: 6 }
      }
    }
  }
}, async (request, reply) => {
  const { username, email, password } = request.body;

  // Check if user exists
  if (users.find(u => u.username === username)) {
    reply.code(409);
    return {
      error: 'Conflict',
      message: 'Username already taken'
    };
  }

  if (users.find(u => u.email === email)) {
    reply.code(409);
    return {
      error: 'Conflict',
      message: 'Email already registered'
    };
  }

  // Create new user
  const newUser: User = {
    id: users.length + 1,
    username,
    email,
    password: hashPassword(password),
    role: 'user',
    createdAt: new Date().toISOString()
  };

  users.push(newUser);

  // Generate token
  const token = generateToken(newUser.id);
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  sessions.set(token, { userId: newUser.id, expiresAt });

  reply.code(201);
  return {
    success: true,
    token,
    user: {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role
    },
    expiresAt: new Date(expiresAt).toISOString()
  };
});

// Login
app.post('/login', {
  schema: {
    body: {
      type: 'object',
      required: ['username', 'password'],
      properties: {
        username: { type: 'string' },
        password: { type: 'string' }
      }
    }
  }
}, async (request, reply) => {
  const { username, password } = request.body;

  // Find user
  const user = users.find(u => u.username === username);

  if (!user) {
    reply.code(401);
    return {
      error: 'Unauthorized',
      message: 'Invalid username or password'
    };
  }

  // Verify password
  if (!verifyPassword(password, user.password)) {
    reply.code(401);
    return {
      error: 'Unauthorized',
      message: 'Invalid username or password'
    };
  }

  // Generate token
  const token = generateToken(user.id);
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  sessions.set(token, { userId: user.id, expiresAt });

  return {
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    },
    expiresAt: new Date(expiresAt).toISOString()
  };
});

// ==================== PROTECTED ROUTES ====================

// Get current user profile
app.get('/profile', {
  preHandler: [authenticate]
}, async (request, reply) => {
  return {
    user: request.user
  };
});

// Update profile
app.put('/profile', {
  preHandler: [authenticate],
  schema: {
    body: {
      type: 'object',
      properties: {
        email: { type: 'string' },
        password: { type: 'string', minLength: 6 }
      }
    }
  }
}, async (request, reply) => {
  const { email, password } = request.body;
  const user = users.find(u => u.id === request.user.id);

  if (!user) {
    reply.code(404);
    return { error: 'User not found' };
  }

  if (email) {
    // Check if email is taken by another user
    const existingUser = users.find(u => u.email === email && u.id !== user.id);
    if (existingUser) {
      reply.code(409);
      return {
        error: 'Conflict',
        message: 'Email already in use'
      };
    }
    user.email = email;
  }

  if (password) {
    user.password = hashPassword(password);
  }

  return {
    success: true,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    }
  };
});

// Logout
app.post('/logout', {
  preHandler: [authenticate]
}, async (request, reply) => {
  sessions.delete(request.token);

  return {
    success: true,
    message: 'Logged out successfully'
  };
});

// Refresh token
app.post('/refresh', {
  preHandler: [authenticate]
}, async (request, reply) => {
  // Delete old token
  sessions.delete(request.token);

  // Generate new token
  const token = generateToken(request.user.id);
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
  sessions.set(token, { userId: request.user.id, expiresAt });

  return {
    success: true,
    token,
    expiresAt: new Date(expiresAt).toISOString()
  };
});

// ==================== ADMIN ROUTES ====================

// List all users (admin only)
app.get('/admin/users', {
  preHandler: [authenticate, requireAdmin]
}, async (request, reply) => {
  return {
    users: users.map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt
    })),
    total: users.length
  };
});

// Delete user (admin only)
app.delete('/admin/users/:id', {
  preHandler: [authenticate, requireAdmin]
}, async (request, reply) => {
  const { id } = request.params;
  const userId = parseInt(id);

  const index = users.findIndex(u => u.id === userId);

  if (index === -1) {
    reply.code(404);
    return {
      error: 'Not Found',
      message: 'User not found'
    };
  }

  // Don't allow deleting yourself
  if (userId === request.user.id) {
    reply.code(400);
    return {
      error: 'Bad Request',
      message: 'Cannot delete your own account'
    };
  }

  const deletedUser = users.splice(index, 1)[0];

  // Delete all sessions for this user
  for (const [token, session] of sessions.entries()) {
    if (session.userId === userId) {
      sessions.delete(token);
    }
  }

  return {
    success: true,
    message: `User ${deletedUser.username} deleted`,
    deletedUser: {
      id: deletedUser.id,
      username: deletedUser.username
    }
  };
});

// Promote user to admin (admin only)
app.post('/admin/users/:id/promote', {
  preHandler: [authenticate, requireAdmin]
}, async (request, reply) => {
  const { id } = request.params;
  const userId = parseInt(id);

  const user = users.find(u => u.id === userId);

  if (!user) {
    reply.code(404);
    return {
      error: 'Not Found',
      message: 'User not found'
    };
  }

  if (user.role === 'admin') {
    reply.code(400);
    return {
      error: 'Bad Request',
      message: 'User is already an admin'
    };
  }

  user.role = 'admin';

  return {
    success: true,
    message: `User ${user.username} promoted to admin`,
    user: {
      id: user.id,
      username: user.username,
      role: user.role
    }
  };
});

// Start server
app.listen({ port: 3005 }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  console.log(`\n🚀 Server ready at ${address}`);
  console.log(`\nAuthentication examples:`);
  console.log(`  POST ${address}/register`);
  console.log(`       Body: { "username": "newuser", "email": "new@example.com", "password": "password123" }`);
  console.log(`  POST ${address}/login`);
  console.log(`       Body: { "username": "admin", "password": "admin123" }`);
  console.log(`  GET  ${address}/profile (requires auth)`);
  console.log(`  PUT  ${address}/profile (requires auth)`);
  console.log(`  POST ${address}/logout (requires auth)`);
  console.log(`  GET  ${address}/admin/users (requires admin)`);
  console.log(`  DELETE ${address}/admin/users/:id (requires admin)`);
  console.log(`\nDefault users:`);
  console.log(`  admin/admin123 (admin role)`);
  console.log(`  user/user123 (user role)\n`);
});
