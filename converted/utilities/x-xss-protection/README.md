# x-xss-protection - Elide Polyglot Showcase

> **Browser XSS filter for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Enable browser XSS filter
- Block mode for detected attacks
- Report URI support
- Legacy browser protection
- **~1M downloads/week on npm**

## Quick Start

```typescript
import xXssProtection from './elide-x-xss-protection.ts';
import express from 'express';

const app = express();

// Block mode (recommended)
app.use(xXssProtection({ mode: 'block' }));

// With reporting
app.use(xXssProtection({
  mode: 'block',
  reportUri: '/xss-report'
}));

// Enabled without block
app.use(xXssProtection({ mode: null }));
```

## Header Values

- `0` - Disable XSS filter
- `1` - Enable XSS filter (sanitize suspicious content)
- `1; mode=block` - Enable and block page if XSS detected
- `1; report=<uri>` - Enable and report violations

## Modern Usage Note

**Important:** X-XSS-Protection is deprecated in modern browsers (Chrome, Firefox, Edge).

- Modern browsers removed support
- Can introduce vulnerabilities
- Use Content-Security-Policy instead
- Keep for legacy IE support only

## Recommended Approach

```typescript
// Modern: Use CSP
app.use(contentSecurityPolicy({
  directives: {
    'default-src': ["'self'"],
    'script-src': ["'self'"]
  }
}));

// Legacy: Add X-XSS-Protection for old browsers
app.use(xXssProtection({ mode: 'block' }));
```

## Links

- [Original npm package](https://www.npmjs.com/package/x-xss-protection)
- [MDN X-XSS-Protection](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-XSS-Protection)

---

**Built with ❤️ for the Elide Polyglot Runtime**
