# Helmet - Elide Polyglot Showcase

> **One security headers middleware for ALL languages** - TypeScript, Python, Ruby, and Java

Secure your web applications with HTTP headers using a single implementation that works across your entire polyglot stack.

## Why This Matters

In polyglot architectures, having **different security implementations** in each language creates:
- ❌ Inconsistent security posture across services
- ❌ Easy to miss security headers in some services
- ❌ Different CSP configurations
- ❌ Complex security audits
- ❌ Vulnerabilities from misconfiguration

**Elide solves this** with ONE implementation that works in ALL languages.

## Features

- ✅ Content Security Policy (CSP)
- ✅ HTTP Strict Transport Security (HSTS)
- ✅ X-Frame-Options (clickjacking protection)
- ✅ X-Content-Type-Options (MIME sniffing protection)
- ✅ X-XSS-Protection
- ✅ Referrer-Policy
- ✅ DNS Prefetch Control
- ✅ Hide X-Powered-By
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies

## Quick Start

### TypeScript

```typescript
import helmet from './elide-helmet.ts';

// Use all protections
app.use(helmet());

// Custom configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "cdn.example.com"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true
  }
}));
```

## Security Headers

### Content Security Policy

Prevents XSS attacks and data injection.

```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "cdn.example.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));
```

### HSTS (HTTP Strict Transport Security)

Forces HTTPS connections.

```typescript
app.use(helmet({
  hsts: {
    maxAge: 31536000,        // 1 year
    includeSubDomains: true,
    preload: true
  }
}));
```

### Frameguard (X-Frame-Options)

Prevents clickjacking attacks.

```typescript
app.use(helmet({
  frameguard: { action: 'deny' }  // or 'sameorigin'
}));
```

### No Sniff (X-Content-Type-Options)

Prevents MIME type sniffing.

```typescript
app.use(helmet({
  noSniff: true
}));
```

### XSS Filter

Enables browser XSS protection.

```typescript
app.use(helmet({
  xssFilter: true
}));
```

### Referrer Policy

Controls referrer information.

```typescript
app.use(helmet({
  referrerPolicy: { policy: 'no-referrer' }
}));
```

## API Reference

### `helmet(options?)`

Apply all security headers.

```typescript
app.use(helmet({
  contentSecurityPolicy: true,
  dnsPrefetchControl: true,
  frameguard: true,
  hidePoweredBy: true,
  hsts: true,
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: true,
  xssFilter: true
}));
```

### Individual Middleware

```typescript
import {
  contentSecurityPolicy,
  frameguard,
  hsts,
  noSniff,
  xssFilter
} from './elide-helmet.ts';

app.use(contentSecurityPolicy());
app.use(frameguard({ action: 'deny' }));
app.use(hsts({ maxAge: 31536000 }));
app.use(noSniff());
app.use(xssFilter());
```

## Use Cases

### Production Web App

```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "cdn.myapp.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "*.cloudinary.com"],
      fontSrc: ["'self'", "fonts.googleapis.com"],
      connectSrc: ["'self'", "api.myapp.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: { action: 'deny' }
}));
```

### API Server

```typescript
// APIs don't need CSP
app.use(helmet({
  contentSecurityPolicy: false,
  hsts: true,
  noSniff: true,
  xssFilter: false,
  frameguard: false
}));
```

### Development Mode

```typescript
if (process.env.NODE_ENV === 'production') {
  app.use(helmet());
} else {
  app.use(helmet({
    contentSecurityPolicy: false,
    hsts: false
  }));
}
```

## Security Best Practices

1. **Always use HTTPS in production**:
```typescript
helmet({ hsts: { maxAge: 31536000 } })
```

2. **Configure CSP carefully**:
```typescript
// Start strict, loosen as needed
helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"]  // No inline scripts
    }
  }
})
```

3. **Deny frame embedding when possible**:
```typescript
helmet({ frameguard: { action: 'deny' } })
```

4. **Hide technology information**:
```typescript
helmet({ hidePoweredBy: true })
```

## Links

- [Elide Documentation](https://docs.elide.dev)
- [npm helmet package](https://www.npmjs.com/package/helmet) (~9M downloads/week)
- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [GitHub: elide-showcases](https://github.com/akapug/elide-showcases)

## Package Stats

- **npm downloads**: ~9M/week (helmet)
- **Use case**: Web application security
- **Elide advantage**: Consistent security across all services
- **Polyglot score**: 36/50 (B-Tier) - Good polyglot showcase

---

**Built with ❤️ for the Elide Polyglot Runtime**

*One helmet to secure them all.*
