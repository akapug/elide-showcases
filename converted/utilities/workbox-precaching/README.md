# Workbox Precaching - Elide Polyglot Showcase

> **One precaching solution for ALL languages** - TypeScript, Python, Ruby, and Java

Precache static assets during service worker installation for instant offline access.

## Features

- Precache static assets
- Revision-based cache updates
- Automatic cache cleanup
- Install-time caching
- Integrity checking support
- Zero dependencies
- **~500K downloads/week on npm**

## Quick Start

```typescript
import { precacheAndRoute } from './elide-workbox-precaching.ts';

// Precache critical assets
precacheAndRoute([
  { url: '/', revision: 'v1' },
  { url: '/index.html', revision: 'v1' },
  { url: '/app.js', revision: 'v2' },
  { url: '/app.css', revision: 'v2' },
  { url: '/logo.png', revision: 'v1' }
]);
```

## Documentation

Run the demo:

```bash
elide run elide-workbox-precaching.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/workbox-precaching)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox/modules/workbox-precaching)

---

**Built with ❤️ for the Elide Polyglot Runtime**
