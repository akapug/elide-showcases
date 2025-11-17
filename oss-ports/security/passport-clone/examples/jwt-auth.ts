/**
 * @elide/passport - JWT Authentication Example
 * Complete example of JWT-based authentication
 */

import passport, { JWTStrategy, ExtractJwt } from '@elide/passport';

// Mock user database
interface User {
  id: string;
  email: string;
  username: string;
  roles: string[];
  permissions: string[];
}

const users: User[] = [
  {
    id: '1',
    email: 'admin@example.com',
    username: 'admin',
    roles: ['admin', 'user'],
    permissions: ['read', 'write', 'delete']
  },
  {
    id: '2',
    email: 'user@example.com',
    username: 'user',
    roles: ['user'],
    permissions: ['read', 'write']
  }
];

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

// Configure JWT Strategy for Access Tokens
passport.use('jwt-access', new JWTStrategy(
  {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: JWT_SECRET,
    issuer: 'my-app',
    audience: 'my-api',
    algorithms: ['HS256']
  },
  async (payload, done) => {
    try {
      // Find user by ID from payload
      const user = users.find(u => u.id === payload.sub);

      if (!user) {
        return done(null, false, { message: 'User not found' });
      }

      // Check if token type is correct
      if (payload.type !== 'access') {
        return done(null, false, { message: 'Invalid token type' });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

// Configure JWT Strategy for Refresh Tokens
passport.use('jwt-refresh', new JWTStrategy(
  {
    jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
    secretOrKey: JWT_SECRET,
    issuer: 'my-app',
    audience: 'my-api',
    algorithms: ['HS256']
  },
  async (payload, done) => {
    try {
      const user = users.find(u => u.id === payload.sub);

      if (!user) {
        return done(null, false, { message: 'User not found' });
      }

      if (payload.type !== 'refresh') {
        return done(null, false, { message: 'Invalid token type' });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

// Helper function to generate access token
export function generateAccessToken(user: User): string {
  const jwt = require('jsonwebtoken');

  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      username: user.username,
      roles: user.roles,
      permissions: user.permissions,
      type: 'access'
    },
    JWT_SECRET,
    {
      expiresIn: ACCESS_TOKEN_EXPIRY,
      issuer: 'my-app',
      audience: 'my-api',
      algorithm: 'HS256'
    }
  );
}

// Helper function to generate refresh token
export function generateRefreshToken(user: User): string {
  const jwt = require('jsonwebtoken');

  return jwt.sign(
    {
      sub: user.id,
      type: 'refresh'
    },
    JWT_SECRET,
    {
      expiresIn: REFRESH_TOKEN_EXPIRY,
      issuer: 'my-app',
      audience: 'my-api',
      algorithm: 'HS256'
    }
  );
}

// Example Express app setup
export function setupJWTApp(app: any) {
  // Initialize Passport
  app.use(passport.initialize());

  // Login endpoint (issues JWT tokens)
  app.post('/api/login', async (req: any, res: any) => {
    const { email, password } = req.body;

    // Validate credentials (simplified)
    const user = users.find(u => u.email === email);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // In real app: verify password with bcrypt
    // const isValid = await bcrypt.compare(password, user.password);

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    return res.json({
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
      tokenType: 'Bearer'
    });
  });

  // Refresh token endpoint
  app.post('/api/refresh', passport.authenticate('jwt-refresh', { session: false }), (req: any, res: any) => {
    const user = req.user;

    // Generate new access token
    const accessToken = generateAccessToken(user);

    return res.json({
      accessToken,
      expiresIn: 900,
      tokenType: 'Bearer'
    });
  });

  // Protected route
  app.get('/api/profile', passport.authenticate('jwt-access', { session: false }), (req: any, res: any) => {
    return res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        username: req.user.username,
        roles: req.user.roles,
        permissions: req.user.permissions
      }
    });
  });

  // Admin-only route
  app.get('/api/admin/users', passport.authenticate('jwt-access', { session: false }), (req: any, res: any) => {
    // Check if user has admin role
    if (!req.user.roles.includes('admin')) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    return res.json({
      users: users.map(u => ({
        id: u.id,
        email: u.email,
        username: u.username,
        roles: u.roles
      }))
    });
  });

  // Permission-based route
  app.delete('/api/resource/:id', passport.authenticate('jwt-access', { session: false }), (req: any, res: any) => {
    // Check if user has delete permission
    if (!req.user.permissions.includes('delete')) {
      return res.status(403).json({ error: 'Forbidden: Delete permission required' });
    }

    return res.json({
      message: `Resource ${req.params.id} deleted`,
      deletedBy: req.user.username
    });
  });

  // Logout (client-side should discard token)
  app.post('/api/logout', (req: any, res: any) => {
    // For JWT, logout is typically handled client-side by removing the token
    // Server-side, you might maintain a blacklist of invalidated tokens
    return res.json({ message: 'Logged out successfully' });
  });

  // Token introspection endpoint
  app.post('/api/token/introspect', passport.authenticate('jwt-access', { session: false }), (req: any, res: any) => {
    const jwt = require('jsonwebtoken');
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(400).json({ error: 'No token provided' });
    }

    try {
      const decoded = jwt.decode(token, { complete: true });

      return res.json({
        active: true,
        sub: req.user.id,
        email: req.user.email,
        username: req.user.username,
        roles: req.user.roles,
        permissions: req.user.permissions,
        iat: decoded.payload.iat,
        exp: decoded.payload.exp,
        iss: decoded.payload.iss,
        aud: decoded.payload.aud
      });
    } catch (error) {
      return res.status(401).json({ active: false });
    }
  });
}

// Example usage
if (require.main === module) {
  const express = require('express');
  const app = express();

  app.use(express.json());
  setupJWTApp(app);

  app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
    console.log('');
    console.log('Try:');
    console.log('  POST http://localhost:3000/api/login');
    console.log('  { "email": "admin@example.com", "password": "password" }');
    console.log('');
    console.log('  GET http://localhost:3000/api/profile');
    console.log('  Authorization: Bearer <token>');
  });
}
