# Next-PWA - Elide Polyglot Showcase

> **One PWA plugin for ALL languages** - TypeScript, Python, Ruby, and Java

Zero-config PWA plugin for Next.js with workbox integration.

## Features

- Zero-config PWA
- Workbox integration
- Offline support
- Pre-caching
- Runtime caching
- Zero dependencies
- **~200K downloads/week on npm**

## Quick Start

```typescript
import { withPWA } from './elide-next-pwa.ts';

// next.config.js
module.exports = withPWA({
  dest: 'public'
})({
  // Next.js config
});
```

## Documentation

Run the demo:

```bash
elide run elide-next-pwa.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/next-pwa)

---

**Built with ❤️ for the Elide Polyglot Runtime**
