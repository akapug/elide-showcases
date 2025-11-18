# Workbox Strategies - Elide Polyglot Showcase

> **One caching strategy library for ALL languages** - TypeScript, Python, Ruby, and Java

Common service worker caching strategies for optimal performance and offline support.

## Features

- Cache First (fast, static assets)
- Network First (fresh, dynamic content)
- Stale While Revalidate (balanced)
- Cache Only (offline-only)
- Network Only (real-time data)
- Zero dependencies
- **~500K downloads/week on npm**

## Quick Start

```typescript
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from './elide-workbox-strategies.ts';

// Images - Cache First
const imageStrategy = new CacheFirst({ cacheName: 'images' });

// API - Network First
const apiStrategy = new NetworkFirst({ cacheName: 'api' });

// CSS/JS - Stale While Revalidate
const staticStrategy = new StaleWhileRevalidate({ cacheName: 'static' });
```

## Documentation

Run the demo:

```bash
elide run elide-workbox-strategies.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/workbox-strategies)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox/modules/workbox-strategies)

---

**Built with ❤️ for the Elide Polyglot Runtime**
