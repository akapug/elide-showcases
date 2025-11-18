# Workbox Routing - Elide Polyglot Showcase

> **One SW routing solution for ALL languages** - TypeScript, Python, Ruby, and Java

Route service worker requests to different caching strategies based on URL patterns.

## Features

- URL pattern matching (string, RegExp, function)
- Navigation routing for SPAs
- Default and catch handlers
- Cross-origin routing
- Zero dependencies
- **~500K downloads/week on npm**

## Quick Start

```typescript
import { registerRoute, registerNavigationRoute } from './elide-workbox-routing.ts';

// Route images
registerRoute(
  /\.(?:png|jpg|jpeg|svg)$/,
  async ({ request }) => {
    const cache = await caches.match(request);
    return cache || fetch(request);
  }
);

// SPA navigation fallback
registerNavigationRoute('/index.html', {
  denylist: [/^\/api\//]
});
```

## Documentation

Run the demo:

```bash
elide run elide-workbox-routing.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/workbox-routing)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox/modules/workbox-routing)

---

**Built with ❤️ for the Elide Polyglot Runtime**
