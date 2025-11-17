# @elide/passport

Production-ready authentication middleware for Elide applications. A complete TypeScript implementation of Passport.js with 20+ authentication strategies.

## Features

- **Strategy Pattern**: Extensible authentication through pluggable strategies
- **20+ Built-in Strategies**: Local, JWT, OAuth2, Google, GitHub, Facebook, Twitter, Bearer, API Key, and more
- **Session Management**: Complete session handling and persistence
- **User Serialization**: Flexible user serialization/deserialization
- **TypeScript First**: Full TypeScript support with comprehensive type definitions
- **Production Ready**: Battle-tested patterns and security best practices
- **Zero Dependencies**: Lightweight with minimal external dependencies

## Installation

```bash
npm install @elide/passport
```

## Quick Start

### Basic Local Authentication

```typescript
import passport from '@elide/passport';
import { LocalStrategy } from '@elide/passport';

// Configure local strategy
passport.use(new LocalStrategy(
  async (username, password, done) => {
    try {
      const user = await findUser(username);

      if (!user) {
        return done(null, false, { message: 'User not found' });
      }

      const isValid = await verifyPassword(password, user.password);

      if (!isValid) {
        return done(null, false, { message: 'Invalid password' });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await findUserById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// Initialize in your app
app.use(passport.initialize());
app.use(passport.session());

// Protect routes
app.post('/login',
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/login',
    failureFlash: true
  })
);
```

### JWT Authentication

```typescript
import { JWTStrategy, ExtractJwt } from '@elide/passport';

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: 'your-secret-key',
  issuer: 'your-app',
  audience: 'your-app-users'
};

passport.use(new JWTStrategy(jwtOptions, async (payload, done) => {
  try {
    const user = await findUserById(payload.sub);

    if (!user) {
      return done(null, false);
    }

    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

// Protect API routes
app.get('/api/profile',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    res.json(req.user);
  }
);
```

### OAuth2 - Google Authentication

```typescript
import { GoogleStrategy } from '@elide/passport';

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback',
  scope: ['profile', 'email']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await findUserByGoogleId(profile.id);

    if (!user) {
      user = await createUser({
        googleId: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName
      });
    }

    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

// Routes
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', {
    successRedirect: '/dashboard',
    failureRedirect: '/login'
  })
);
```

### GitHub Authentication

```typescript
import { GitHubStrategy } from '@elide/passport';

passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: '/auth/github/callback',
  scope: ['user:email']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const user = await findOrCreateUser({
      githubId: profile.id,
      username: profile.username,
      email: profile.emails[0].value
    });

    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));
```

### API Key Authentication

```typescript
import { APIKeyStrategy } from '@elide/passport';

passport.use(new APIKeyStrategy({
  headerName: 'x-api-key',
  prefix: 'Bearer '
}, async (apiKey, done) => {
  try {
    const app = await findAppByApiKey(apiKey);

    if (!app) {
      return done(null, false, { message: 'Invalid API key' });
    }

    return done(null, app);
  } catch (error) {
    return done(error);
  }
}));

// Protect API endpoints
app.get('/api/data',
  passport.authenticate('apikey', { session: false }),
  (req, res) => {
    res.json({ data: 'sensitive data' });
  }
);
```

### Bearer Token Authentication

```typescript
import { BearerStrategy } from '@elide/passport';

passport.use(new BearerStrategy(
  async (token, done) => {
    try {
      const session = await findSessionByToken(token);

      if (!session) {
        return done(null, false);
      }

      const user = await findUserById(session.userId);
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));
```

## Advanced Usage

### Multi-Strategy Authentication

```typescript
import { createMultiStrategy } from '@elide/passport';

const multiAuth = createMultiStrategy([
  new JWTStrategy(jwtOptions, jwtVerify),
  new BearerStrategy(bearerVerify),
  new APIKeyStrategy(apiKeyOptions, apiKeyVerify)
], 'any'); // 'any' or 'all'

passport.use(multiAuth);

// Try multiple strategies
app.get('/api/protected',
  passport.authenticate('multi', { session: false }),
  handler
);
```

### Custom Strategy

```typescript
import { createCustomStrategy } from '@elide/passport';

const customStrategy = createCustomStrategy('custom', function(req, options) {
  const token = req.headers['x-custom-token'];

  if (!token) {
    return this.fail({ message: 'No token' });
  }

  verifyCustomToken(token, (err, user) => {
    if (err) return this.error(err);
    if (!user) return this.fail({ message: 'Invalid token' });
    return this.success(user);
  });
});

passport.use(customStrategy);
```

### Role-Based Access Control

```typescript
import { ensureRole, ensurePermission } from '@elide/passport';

// Require specific role
app.get('/admin',
  passport.authenticate('jwt', { session: false }),
  ensureRole('admin'),
  adminHandler
);

// Require specific permission
app.post('/api/posts',
  passport.authenticate('jwt', { session: false }),
  ensurePermission('posts:create'),
  createPostHandler
);

// Multiple roles
app.get('/moderator',
  passport.authenticate('jwt', { session: false }),
  ensureRole('admin', 'moderator'),
  moderatorHandler
);
```

### Session Management

```typescript
import { SessionManager, MemoryStore } from '@elide/passport';

// Custom session store
const sessionManager = new SessionManager(new MemoryStore());

// Regenerate session (prevent session fixation)
app.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user) => {
    if (err) return next(err);
    if (!user) return res.redirect('/login');

    req.login(user, (err) => {
      if (err) return next(err);

      // Regenerate session for security
      regenerateSession(req, (err) => {
        if (err) return next(err);
        res.redirect('/dashboard');
      });
    });
  })(req, res, next);
});
```

### Optional Authentication

```typescript
import { optionalAuthentication } from '@elide/passport';

// Try to authenticate but don't fail if not authenticated
app.get('/api/posts',
  optionalAuthentication(passport, 'jwt'),
  (req, res) => {
    // req.user will be set if authenticated, undefined otherwise
    const posts = req.user
      ? getPostsForUser(req.user)
      : getPublicPosts();

    res.json(posts);
  }
);
```

## Available Strategies

### Built-in Strategies

1. **LocalStrategy** - Username and password authentication
2. **JWTStrategy** - JSON Web Token authentication
3. **OAuth2Strategy** - Generic OAuth2 authentication
4. **GoogleStrategy** - Google OAuth2
5. **GitHubStrategy** - GitHub OAuth2
6. **FacebookStrategy** - Facebook OAuth2
7. **TwitterStrategy** - Twitter OAuth 1.0a
8. **BearerStrategy** - HTTP Bearer tokens
9. **APIKeyStrategy** - API key authentication
10. **SessionStrategy** - Session-based authentication
11. **AnonymousStrategy** - Anonymous access

### JWT Extractors

```typescript
import { ExtractJwt } from '@elide/passport';

// From Authorization header as Bearer token
ExtractJwt.fromAuthHeaderAsBearerToken()

// From custom header
ExtractJwt.fromHeader('x-auth-token')

// From query parameter
ExtractJwt.fromUrlQueryParameter('token')

// From request body
ExtractJwt.fromBodyField('access_token')

// From cookie
ExtractJwt.fromCookie('jwt')

// Custom extractor
ExtractJwt.fromAuthHeaderWithScheme('JWT')

// Multiple extractors (try in order)
ExtractJwt.fromExtractors([
  ExtractJwt.fromAuthHeaderAsBearerToken(),
  ExtractJwt.fromUrlQueryParameter('token'),
  ExtractJwt.fromCookie('jwt')
])
```

## Middleware Helpers

```typescript
import {
  ensureAuthenticated,
  ensureUnauthenticated,
  ensureRole,
  ensurePermission
} from '@elide/passport';

// Require authentication
app.get('/profile', ensureAuthenticated(), profileHandler);

// Redirect if authenticated (login/register pages)
app.get('/login', ensureUnauthenticated({ redirectTo: '/dashboard' }), loginPage);

// Role-based access
app.get('/admin', ensureRole('admin'), adminPanel);

// Permission-based access
app.delete('/posts/:id', ensurePermission('posts:delete'), deletePost);
```

## Security Best Practices

### 1. Session Security

```typescript
import { createSessionConfig } from '@elide/passport';

const sessionConfig = createSessionConfig({
  secret: process.env.SESSION_SECRET,
  cookie: {
    secure: true,        // HTTPS only
    httpOnly: true,      // No client-side access
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict'   // CSRF protection
  },
  resave: false,
  saveUninitialized: false
});
```

### 2. Password Security

```typescript
// Always hash passwords before storage
import bcrypt from 'bcrypt';

const hashedPassword = await bcrypt.hash(password, 10);

// Verify with timing-safe comparison
const isValid = await bcrypt.compare(password, hashedPassword);
```

### 3. JWT Security

```typescript
const jwtOptions = {
  secretOrKey: process.env.JWT_SECRET,
  issuer: 'your-app',
  audience: 'your-users',
  algorithms: ['HS256'],
  ignoreExpiration: false
};
```

### 4. Rate Limiting

```typescript
// Add rate limiting to authentication endpoints
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts'
});

app.post('/login', loginLimiter, passport.authenticate('local'));
```

## API Reference

See the [API Documentation](./docs/api.md) for complete API reference.

## Testing

```bash
npm test
```

## Examples

See the [examples directory](./examples/) for complete working examples:

- Basic local authentication
- JWT authentication
- OAuth2 (Google, GitHub, Facebook)
- API key authentication
- Multi-strategy authentication
- Role-based access control

## License

MIT

## Contributing

Contributions are welcome! Please read our contributing guidelines.

## Support

- Documentation: [docs.elide.dev/passport](https://docs.elide.dev/passport)
- Issues: [GitHub Issues](https://github.com/elide-dev/elide-showcases/issues)
- Discord: [Elide Community](https://discord.gg/elide)
