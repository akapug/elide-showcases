# Find-Cache-Dir - Find Cache Directory

Find or create cache directory for your app.

Based on [find-cache-dir](https://www.npmjs.com/package/find-cache-dir) (~5M+ downloads/week)

## Quick Start

```typescript
import findCacheDir from './elide-find-cache-dir.ts';

const cacheDir = findCacheDir({ name: 'my-app' });
console.log(cacheDir); // /home/user/.cache/my-app
```
