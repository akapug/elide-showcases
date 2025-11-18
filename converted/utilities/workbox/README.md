# Workbox - Elide Polyglot Showcase

> **One PWA service worker library for ALL languages** - TypeScript, Python, Ruby, and Java

Production-ready service worker library for building Progressive Web Apps with offline support.

## Features

- Precaching static assets
- Runtime caching strategies (Cache First, Network First, Stale-While-Revalidate)
- Route-based caching
- Background sync support
- Zero dependencies
- **~500K downloads/week on npm**

## Quick Start

```typescript
import { Workbox, cacheFirst, networkFirst } from './elide-workbox.ts';

const wb = new Workbox();

// Precache critical assets
wb.precache([
  '/',
  '/index.html',
  '/app.css',
  '/app.js'
]);

// Cache images (cache-first)
wb.registerRoute(
  /\.(?:png|jpg|jpeg|svg)$/,
  cacheFirst({ cacheName: 'images', maxAge: 86400 })
);

// Cache API responses (network-first)
wb.registerRoute(
  /\/api\//,
  networkFirst({ cacheName: 'api', maxAge: 300 })
);

// In service worker
self.addEventListener('install', (e) => {
  e.waitUntil(wb.install());
});

self.addEventListener('fetch', (e) => {
  e.respondWith(wb.handleFetch(e));
});
```

## Documentation

Run the demo:

```bash
elide run elide-workbox.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/workbox)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox)

---

**Built with ❤️ for the Elide Polyglot Runtime**
