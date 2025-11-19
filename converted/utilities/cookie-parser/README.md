# Cookie Parser - Elide Polyglot Showcase

> **One cookie parsing middleware for ALL languages** - TypeScript, Python, Ruby, and Java

Parse Cookie headers and populate req.cookies with a single implementation that works across your entire polyglot stack.

## Why This Matters

In polyglot architectures, having **different cookie parsers** in each language creates:
- ❌ Inconsistent cookie handling across services
- ❌ Session management bugs
- ❌ Different signed cookie implementations
- ❌ Security vulnerabilities
- ❌ Complex debugging

**Elide solves this** with ONE implementation that works in ALL languages.

## Features

- ✅ Parse Cookie headers
- ✅ Populate req.cookies automatically
- ✅ Signed cookies support
- ✅ Secret rotation (multiple secrets)
- ✅ Custom decode function
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies
- ✅ Express.js compatible API

## Quick Start

### TypeScript

```typescript
import cookieParser from './elide-cookie-parser.ts';

// Basic usage
app.use(cookieParser());

// With secret for signed cookies
app.use(cookieParser('my-secret-key'));

// With multiple secrets (key rotation)
app.use(cookieParser(['new-secret', 'old-secret']));

// Access cookies in routes
app.get('/', (req, res) => {
  console.log('Cookies:', req.cookies);
  console.log('Signed cookies:', req.signedCookies);
});
```

### Python

```python
from elide import require
cookie_parser = require('./elide-cookie-parser.ts')

# Basic usage
app.use(cookie_parser.cookieParser())

# With secret
app.use(cookie_parser.cookieParser('my-secret-key'))
```

### Ruby

```ruby
cookie_parser = Elide.require('./elide-cookie-parser.ts')

# Basic usage
app.use(cookie_parser.cookieParser())

# With secret
app.use(cookie_parser.cookieParser('my-secret-key'))
```

### Java

```java
Value cookieParser = context.eval("js", "require('./elide-cookie-parser.ts')");

// Create parser middleware
Value parser = cookieParser.getMember("cookieParser")
    .execute("my-secret-key");
```

## API Reference

### `cookieParser(secret?, options?)`

Create a cookie parser middleware.

```typescript
// No secret (unsigned cookies)
app.use(cookieParser());

// With secret
app.use(cookieParser('secret-key'));

// Multiple secrets (tries each in order)
app.use(cookieParser(['new-key', 'old-key']));

// With custom decode
app.use(cookieParser('secret', {
  decode: (val) => customDecode(val)
}));
```

### `setCookie(res, name, value, options?)`

Set a cookie in the response.

```typescript
import { setCookie } from './elide-cookie-parser.ts';

setCookie(res, 'userId', 'user123', {
  path: '/',
  httpOnly: true,
  secure: true,
  maxAge: 3600
});
```

### `clearCookie(res, name, options?)`

Clear a cookie.

```typescript
import { clearCookie } from './elide-cookie-parser.ts';

clearCookie(res, 'session', { path: '/' });
```

## Use Cases

### Session Management

```typescript
import cookieParser from './elide-cookie-parser.ts';

app.use(cookieParser('session-secret'));

app.post('/login', (req, res) => {
  // Verify credentials...
  setCookie(res, 'sessionId', sessionId, {
    httpOnly: true,
    secure: true,
    maxAge: 3600
  });
});

app.get('/profile', (req, res) => {
  const sessionId = req.signedCookies.sessionId;
  // Use sessionId...
});

app.post('/logout', (req, res) => {
  clearCookie(res, 'sessionId');
});
```

### User Preferences

```typescript
app.use(cookieParser());

app.get('/preferences', (req, res) => {
  const theme = req.cookies.theme || 'light';
  const language = req.cookies.language || 'en';
  res.json({ theme, language });
});
```

### Authentication

```typescript
app.use(cookieParser('auth-secret'));

app.get('/api/data', (req, res) => {
  const token = req.signedCookies.authToken;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // Verify token and return data
});
```

### Secret Rotation

```typescript
// Rotate secrets without breaking existing sessions
const currentSecret = 'new-secret-2024';
const previousSecret = 'old-secret-2023';

app.use(cookieParser([currentSecret, previousSecret]));

// Old cookies still work, new cookies use current secret
```

## Security Best Practices

1. **Use signed cookies for sensitive data**:
```typescript
app.use(cookieParser('strong-random-secret'));
```

2. **Enable httpOnly and secure flags**:
```typescript
setCookie(res, 'session', value, {
  httpOnly: true,  // Prevent XSS
  secure: true,    // HTTPS only
  sameSite: 'Strict'  // CSRF protection
});
```

3. **Rotate secrets regularly**:
```typescript
app.use(cookieParser([newSecret, oldSecret]));
```

4. **Use strong secrets**:
```typescript
// ❌ Bad
cookieParser('secret')

// ✅ Good
cookieParser(crypto.randomBytes(32).toString('hex'))
```

## Links

- [Elide Documentation](https://docs.elide.dev)
- [npm cookie-parser package](https://www.npmjs.com/package/cookie-parser) (~24M downloads/week)
- [Express.js Cookie Parser](https://expressjs.com/en/resources/middleware/cookie-parser.html)
- [GitHub: elide-showcases](https://github.com/akapug/elide-showcases)

## Package Stats

- **npm downloads**: ~24M/week (cookie-parser)
- **Use case**: Web applications, session management, authentication
- **Elide advantage**: One cookie parser for all services
- **Polyglot score**: 40/50 (A-Tier) - Excellent polyglot showcase

---

**Built with ❤️ for the Elide Polyglot Runtime**

*One cookie parser to parse them all.*
