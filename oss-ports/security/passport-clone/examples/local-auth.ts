/**
 * @elide/passport - Local Authentication Example
 * Demonstrates username/password authentication with sessions
 */

import passport, { LocalStrategy } from '@elide/passport';

// Mock user database
const users = [
  {
    id: '1',
    username: 'admin',
    password: '$2b$10$YourHashedPasswordHere', // bcrypt hash
    email: 'admin@example.com',
    roles: ['admin']
  },
  {
    id: '2',
    username: 'user',
    password: '$2b$10$YourHashedPasswordHere',
    email: 'user@example.com',
    roles: ['user']
  }
];

// Configure Local Strategy
passport.use(new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: false
  },
  async (username, password, done) => {
    try {
      // Find user
      const user = users.find(u => u.username === username || u.email === username);

      if (!user) {
        return done(null, false, { message: 'User not found' });
      }

      // Verify password (in real app, use bcrypt.compare)
      const isValid = await verifyPassword(password, user.password);

      if (!isValid) {
        return done(null, false, { message: 'Invalid password' });
      }

      // Success
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser((id: string, done) => {
  const user = users.find(u => u.id === id);
  done(null, user || null);
});

// Mock password verification
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // In real app: return bcrypt.compare(password, hash);
  return password === 'password123';
}

// Example Express app setup
export function setupPassportApp(app: any) {
  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Login route
  app.post('/login',
    passport.authenticate('local', {
      successRedirect: '/dashboard',
      failureRedirect: '/login',
      failureFlash: true
    })
  );

  // Login with custom callback
  app.post('/api/login', (req: any, res: any, next: any) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!user) {
        return res.status(401).json({ error: info?.message || 'Authentication failed' });
      }

      req.login(user, (err: any) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        return res.json({
          success: true,
          user: {
            id: user.id,
            username: user.username,
            email: user.email
          }
        });
      });
    })(req, res, next);
  });

  // Logout route
  app.post('/logout', (req: any, res: any) => {
    req.logout((err: any) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true });
    });
  });

  // Protected route
  app.get('/dashboard', (req: any, res: any) => {
    if (!req.isAuthenticated()) {
      return res.redirect('/login');
    }

    res.json({
      message: 'Welcome to dashboard',
      user: req.user
    });
  });

  // Get current user
  app.get('/api/me', (req: any, res: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    res.json({
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        roles: req.user.roles
      }
    });
  });
}
