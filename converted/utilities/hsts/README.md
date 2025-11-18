# hsts - Elide Polyglot Showcase

> **HTTP Strict Transport Security for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Force HTTPS connections
- Prevent protocol downgrade attacks
- Include subdomains
- Preload support (for browser HSTS lists)
- Configurable max-age
- **~5M downloads/week on npm**

## Quick Start

```typescript
import hsts from './elide-hsts.ts';
import express from 'express';

const app = express();

// Default (180 days, includeSubDomains)
app.use(hsts());

// 1 year with subdomains
app.use(hsts({
  maxAge: 31536000,        // 1 year in seconds
  includeSubDomains: true
}));

// 2 years with preload (for HSTS preload list)
app.use(hsts({
  maxAge: 63072000,        // 2 years
  includeSubDomains: true,
  preload: true
}));
```

## Recommended Durations

| Environment | Duration | Seconds |
|-------------|----------|---------|
| Testing | 5 minutes | 300 |
| Development | 1 day | 86400 |
| Staging | 30 days | 2592000 |
| Production | 1 year | 31536000 |
| Preload | 2 years | 63072000 |

## What is HSTS?

HSTS tells browsers to only connect via HTTPS, preventing:
- Protocol downgrade attacks
- Cookie hijacking
- Man-in-the-middle attacks
- Accidental HTTP requests

## Options

- `maxAge` - Duration in seconds (default: 15552000 / 180 days)
- `includeSubDomains` - Apply to all subdomains (default: true)
- `preload` - Eligible for browser preload list (default: false)
- `setIf` - Conditional function (default: always set)

## Preload List

To submit your domain to browser preload lists:
1. Set `maxAge` ≥ 63072000 (2 years)
2. Set `includeSubDomains: true`
3. Set `preload: true`
4. Submit to https://hstspreload.org/

## Links

- [Original npm package](https://www.npmjs.com/package/hsts)
- [MDN HSTS Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security)

---

**Built with ❤️ for the Elide Polyglot Runtime**
