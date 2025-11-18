# Route-Cache - Express Route Caching

HTTP response caching middleware for Express.

Based on [route-cache](https://www.npmjs.com/package/route-cache) (~50K+ downloads/week)

## Quick Start

```typescript
import RouteCache from './elide-route-cache.ts';

const cache = new RouteCache(5000); // 5s TTL
// app.use(cache.middleware());
```
