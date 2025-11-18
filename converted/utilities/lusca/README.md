# lusca - Elide Polyglot Showcase

> **Application security middleware for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- CSRF protection
- CSP (Content Security Policy)
- HSTS (HTTP Strict Transport Security)
- X-Frame-Options (clickjacking protection)
- X-XSS-Protection
- X-Content-Type-Options (nosniff)
- Referrer-Policy
- **~1M downloads/week on npm**

## Quick Start

```typescript
import lusca from './elide-lusca.ts';
import express from 'express';

const app = express();

// All-in-one security
app.use(lusca({
  csrf: true,
  xframe: 'DENY',
  hsts: { maxAge: 31536000, includeSubDomains: true },
  xssProtection: true,
  nosniff: true,
  referrerPolicy: 'same-origin'
}));

// Custom CSP
app.use(lusca({
  csp: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'"],
    'style-src': ["'self'", 'https://fonts.googleapis.com']
  }
}));
```

## Security Headers

- **CSRF**: Cross-Site Request Forgery protection
- **CSP**: Control which resources can load
- **HSTS**: Force HTTPS connections
- **X-Frame-Options**: Prevent clickjacking
- **X-XSS-Protection**: Enable browser XSS filter
- **X-Content-Type-Options**: Prevent MIME sniffing
- **Referrer-Policy**: Control referrer information

## Links

- [Original npm package](https://www.npmjs.com/package/lusca)

---

**Built with ❤️ for the Elide Polyglot Runtime**
