# Cacheable-Request - HTTP Request Caching

Cache HTTP requests with TTL.

Based on [cacheable-request](https://www.npmjs.com/package/cacheable-request) (~2M+ downloads/week)

## Quick Start

```typescript
import CacheableRequest from './elide-cacheable-request.ts';

const cacheableRequest = new CacheableRequest(5000);

const response1 = await cacheableRequest.request('https://api.example.com/data');
const response2 = await cacheableRequest.request('https://api.example.com/data'); // Cached!
```
