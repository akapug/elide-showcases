# Workbox Webpack Plugin - Elide Polyglot Showcase

> **One PWA webpack plugin for ALL languages** - TypeScript, Python, Ruby, and Java

Webpack plugin for generating service workers with Workbox precaching and runtime caching.

## Features

- Auto-generate complete service workers
- Precache webpack build artifacts
- Runtime caching configuration
- InjectManifest and GenerateSW modes
- Navigate fallback support
- Zero dependencies
- **~500K downloads/week on npm**

## Quick Start

```typescript
import { GenerateSW } from './elide-workbox-webpack-plugin.ts';

// webpack.config.js
export default {
  plugins: [
    new GenerateSW({
      swDest: './dist/sw.js',
      clientsClaim: true,
      skipWaiting: true,
      runtimeCaching: [
        {
          urlPattern: /\.(?:png|jpg|jpeg|svg)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'images',
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 30 * 24 * 60 * 60
            }
          }
        }
      ]
    })
  ]
};
```

## Documentation

Run the demo:

```bash
elide run elide-workbox-webpack-plugin.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/workbox-webpack-plugin)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox)

---

**Built with ❤️ for the Elide Polyglot Runtime**
