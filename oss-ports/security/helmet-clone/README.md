# @elide/helmet

Production-ready security headers middleware for Elide applications. Protect your apps with comprehensive HTTP security headers.

## Features

- **Content Security Policy**: Prevent XSS and injection attacks
- **Strict Transport Security**: Force HTTPS connections
- **Frame Protection**: Prevent clickjacking
- **XSS Protection**: Browser-level XSS filtering
- **MIME Sniffing Protection**: Prevent content-type confusion
- **Referrer Policy**: Control referrer information
- **Permissions Policy**: Control browser features
- **Cross-Origin Policies**: CORP, COEP, COOP headers
- **Zero Dependencies**: Lightweight implementation
- **TypeScript First**: Full TypeScript support

## Installation

```bash
npm install @elide/helmet
```

## Quick Start

```typescript
import helmet from '@elide/helmet';
import express from 'express';

const app = express();

// Apply all security headers with defaults
app.use(helmet());

app.get('/', (req, res) => {
  res.send('Hello, secure world!');
});
```

## Security Headers Applied

### Default Configuration

When you use `helmet()` without options, it applies these headers:

- `Content-Security-Policy`: Strict CSP with self-only sources
- `Strict-Transport-Security`: Force HTTPS for 180 days
- `X-Frame-Options`: SAMEORIGIN to prevent clickjacking
- `X-Content-Type-Options`: nosniff to prevent MIME sniffing
- `X-XSS-Protection`: 1; mode=block for XSS protection
- `Referrer-Policy`: no-referrer for privacy
- `X-DNS-Prefetch-Control`: off to prevent DNS prefetching

## Individual Middlewares

### Content Security Policy

```typescript
import { contentSecurityPolicy } from '@elide/helmet';

app.use(contentSecurityPolicy({
  directives: {
    'default-src': ["'self'"],
    'script-src': ["'self'", 'https://trusted.cdn.com'],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'https:'],
    'connect-src': ["'self'", 'https://api.example.com'],
    'font-src': ["'self'", 'https:', 'data:'],
    'object-src': ["'none'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': true
  }
}));
```

### Strict Transport Security (HSTS)

```typescript
import { strictTransportSecurity } from '@elide/helmet';

app.use(strictTransportSecurity({
  maxAge: 31536000,        // 1 year in seconds
  includeSubDomains: true,
  preload: true
}));
```

### X-Frame-Options

```typescript
import { xFrameOptions, denyFraming } from '@elide/helmet';

// Deny all framing
app.use(denyFraming());

// Or configure
app.use(xFrameOptions({ action: 'SAMEORIGIN' }));
```

### Referrer Policy

```typescript
import { referrerPolicy } from '@elide/helmet';

app.use(referrerPolicy({
  policy: 'strict-origin-when-cross-origin'
}));
```

### Permissions Policy

```typescript
import { permissionsPolicy } from '@elide/helmet';

app.use(permissionsPolicy({
  directives: {
    camera: [],          // Deny camera
    microphone: [],      // Deny microphone
    geolocation: ['self'], // Allow geolocation from same origin
    payment: []          // Deny payment API
  }
}));
```

## Complete README truncated for brevity...

## Testing

```bash
npm test
```

## License

MIT
