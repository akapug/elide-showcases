/**
 * @elide/passport - OAuth2 Example
 * Complete example of OAuth2 authentication with Google and GitHub
 */

import passport, { GoogleStrategy, GitHubStrategy, FacebookStrategy } from '@elide/passport';

// Mock user database
interface OAuthUser {
  id: string;
  email: string;
  displayName: string;
  provider: string;
  providerId: string;
  avatar?: string;
  accessToken?: string;
  refreshToken?: string;
}

const oauthUsers: OAuthUser[] = [];

// Find or create user helper
async function findOrCreateUser(profile: any, accessToken: string, refreshToken: string): Promise<OAuthUser> {
  // Check if user already exists
  let user = oauthUsers.find(u =>
    u.provider === profile.provider && u.providerId === profile.id
  );

  if (user) {
    // Update tokens
    user.accessToken = accessToken;
    user.refreshToken = refreshToken;
    return user;
  }

  // Create new user
  user = {
    id: String(oauthUsers.length + 1),
    email: profile.emails?.[0]?.value || '',
    displayName: profile.displayName || '',
    provider: profile.provider,
    providerId: profile.id,
    avatar: profile.photos?.[0]?.value,
    accessToken,
    refreshToken
  };

  oauthUsers.push(user);
  return user;
}

// Google OAuth2 Strategy
passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID || 'your-google-client-id',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret',
    callbackURL: '/auth/google/callback',
    scope: ['profile', 'email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const user = await findOrCreateUser(profile, accessToken, refreshToken);
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

// GitHub OAuth2 Strategy
passport.use(new GitHubStrategy(
  {
    clientID: process.env.GITHUB_CLIENT_ID || 'your-github-client-id',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || 'your-github-client-secret',
    callbackURL: '/auth/github/callback',
    scope: ['user:email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const user = await findOrCreateUser(profile, accessToken, refreshToken);
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

// Facebook OAuth2 Strategy
passport.use(new FacebookStrategy(
  {
    clientID: process.env.FACEBOOK_CLIENT_ID || 'your-facebook-client-id',
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET || 'your-facebook-client-secret',
    callbackURL: '/auth/facebook/callback',
    scope: ['email', 'public_profile'],
    profileFields: ['id', 'displayName', 'photos', 'email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const user = await findOrCreateUser(profile, accessToken, refreshToken);
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
  const user = oauthUsers.find(u => u.id === id);
  done(null, user || null);
});

// Example Express app setup
export function setupOAuthApp(app: any) {
  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Landing page
  app.get('/', (req: any, res: any) => {
    if (req.isAuthenticated()) {
      res.send(`
        <h1>Welcome, ${req.user.displayName}!</h1>
        <img src="${req.user.avatar}" width="100" />
        <p>Email: ${req.user.email}</p>
        <p>Provider: ${req.user.provider}</p>
        <a href="/logout">Logout</a>
      `);
    } else {
      res.send(`
        <h1>OAuth2 Authentication Demo</h1>
        <a href="/auth/google">Login with Google</a><br />
        <a href="/auth/github">Login with GitHub</a><br />
        <a href="/auth/facebook">Login with Facebook</a>
      `);
    }
  });

  // Google routes
  app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  app.get('/auth/google/callback',
    passport.authenticate('google', {
      successRedirect: '/dashboard',
      failureRedirect: '/login'
    })
  );

  // GitHub routes
  app.get('/auth/github',
    passport.authenticate('github', { scope: ['user:email'] })
  );

  app.get('/auth/github/callback',
    passport.authenticate('github', {
      successRedirect: '/dashboard',
      failureRedirect: '/login'
    })
  );

  // Facebook routes
  app.get('/auth/facebook',
    passport.authenticate('facebook', { scope: ['email'] })
  );

  app.get('/auth/facebook/callback',
    passport.authenticate('facebook', {
      successRedirect: '/dashboard',
      failureRedirect: '/login'
    })
  );

  // Dashboard
  app.get('/dashboard', (req: any, res: any) => {
    if (!req.isAuthenticated()) {
      return res.redirect('/');
    }

    res.send(`
      <h1>Dashboard</h1>
      <h2>Welcome, ${req.user.displayName}!</h2>
      <img src="${req.user.avatar}" width="150" />
      <h3>Profile Information:</h3>
      <ul>
        <li>ID: ${req.user.id}</li>
        <li>Email: ${req.user.email}</li>
        <li>Provider: ${req.user.provider}</li>
        <li>Provider ID: ${req.user.providerId}</li>
      </ul>
      <a href="/api/profile">View API Profile</a><br />
      <a href="/logout">Logout</a>
    `);
  });

  // API endpoint for profile
  app.get('/api/profile', (req: any, res: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    res.json({
      id: req.user.id,
      email: req.user.email,
      displayName: req.user.displayName,
      provider: req.user.provider,
      avatar: req.user.avatar
    });
  });

  // Logout
  app.get('/logout', (req: any, res: any) => {
    req.logout((err: any) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.redirect('/');
    });
  });

  // Account linking example
  app.get('/auth/link/:provider', (req: any, res: any) => {
    if (!req.isAuthenticated()) {
      return res.redirect('/');
    }

    const provider = req.params.provider;

    // Store current user ID in session for linking
    req.session.linkUserId = req.user.id;

    res.redirect(`/auth/${provider}`);
  });
}

// Example usage
if (require.main === module) {
  const express = require('express');
  const session = require('express-session');
  const app = express();

  // Session configuration
  app.use(session({
    secret: 'your-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  setupOAuthApp(app);

  app.listen(3000, () => {
    console.log('OAuth2 server running on http://localhost:3000');
    console.log('');
    console.log('Configure OAuth credentials:');
    console.log('  GOOGLE_CLIENT_ID=...');
    console.log('  GOOGLE_CLIENT_SECRET=...');
    console.log('  GITHUB_CLIENT_ID=...');
    console.log('  GITHUB_CLIENT_SECRET=...');
    console.log('  FACEBOOK_CLIENT_ID=...');
    console.log('  FACEBOOK_CLIENT_SECRET=...');
  });
}
