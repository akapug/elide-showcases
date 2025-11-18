# content-security-policy - Elide Polyglot Showcase

> **CSP header builder for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Build Content-Security-Policy headers
- Prevent XSS and data injection attacks
- Report-only mode for testing
- Nonce and hash support
- Multiple directive support
- **~1M downloads/week on npm**

## Quick Start

```typescript
import contentSecurityPolicy, { getCSP } from './elide-content-security-policy.ts';
import express from 'express';

const app = express();

// Middleware
app.use(contentSecurityPolicy({
  directives: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'"],
    'style-src': ["'self'", 'https://fonts.googleapis.com'],
    'img-src': ["'self'", 'data:', 'https:'],
    'font-src': ["'self'", 'https://fonts.gstatic.com']
  }
}));

// Get CSP string
const csp = getCSP({
  'default-src': ["'self'"],
  'script-src': ["'self'"],
  'object-src': ["'none'"]
});
```

## Common Directives

- `default-src` - Default policy for all resources
- `script-src` - JavaScript sources
- `style-src` - CSS sources
- `img-src` - Image sources
- `font-src` - Font sources
- `connect-src` - AJAX, WebSocket sources
- `object-src` - `<object>`, `<embed>` sources
- `frame-src` - `<iframe>` sources
- `base-uri` - `<base>` tag
- `form-action` - Form submission targets

## Special Keywords

- `'none'` - Block all sources
- `'self'` - Same origin only
- `'unsafe-inline'` - Allow inline scripts/styles
- `'unsafe-eval'` - Allow eval()
- `'strict-dynamic'` - Trust scripts loaded by trusted scripts

## Links

- [Original npm package](https://www.npmjs.com/package/content-security-policy)
- [MDN CSP Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

---

**Built with ❤️ for the Elide Polyglot Runtime**
