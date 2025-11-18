# HTTP-Cache-Semantics - HTTP Caching Rules

RFC 7234 HTTP caching implementation.

Based on [http-cache-semantics](https://www.npmjs.com/package/http-cache-semantics) (~2M+ downloads/week)

## Quick Start

```typescript
import { CachePolicy } from './elide-http-cache-semantics.ts';

const policy = new CachePolicy(
  { headers: {} },
  { headers: { 'cache-control': 'max-age=3600' }, status: 200 }
);

console.log(policy.storable()); // true
console.log(policy.maxAge()); // 3600000ms
```
