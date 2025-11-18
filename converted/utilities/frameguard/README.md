# frameguard - Elide Polyglot Showcase

> **Clickjacking protection for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Clickjacking protection via X-Frame-Options header
- DENY, SAMEORIGIN, ALLOW-FROM modes
- Express middleware support
- Simple and focused
- **~1M downloads/week on npm**

## Quick Start

```typescript
import frameguard from './elide-frameguard.ts';
import express from 'express';

const app = express();

// DENY - No framing allowed
app.use(frameguard({ action: 'DENY' }));

// SAMEORIGIN - Same-origin framing only (default)
app.use(frameguard({ action: 'SAMEORIGIN' }));

// ALLOW-FROM - Specific domain
app.use(frameguard({
  action: 'ALLOW-FROM',
  domain: 'https://trusted.com'
}));
```

## Modes

### DENY
Prevents all iframe embedding. Use for:
- Banking applications
- Admin panels
- Sensitive forms

### SAMEORIGIN (Default)
Allows same-origin iframe embedding. Use for:
- Internal applications
- Dashboard widgets
- Multi-page apps

### ALLOW-FROM
Allows specific domain framing. Use for:
- Partner integrations
- Embedded widgets
- Third-party hosting

## What is Clickjacking?

Clickjacking tricks users into clicking something different than what they perceive, by loading your page in an invisible iframe.

X-Frame-Options prevents this by controlling who can embed your page.

## Links

- [Original npm package](https://www.npmjs.com/package/frameguard)
- [MDN X-Frame-Options](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options)

---

**Built with ❤️ for the Elide Polyglot Runtime**
