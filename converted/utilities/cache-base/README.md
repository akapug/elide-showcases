# Cache-Base - Base Cache Implementation

Simple cache with get/set/has/del operations.

Based on [cache-base](https://www.npmjs.com/package/cache-base) (~100K+ downloads/week)

## Quick Start

```typescript
import CacheBase from './elide-cache-base.ts';

const cache = new CacheBase();
cache.set('key1', 'value1');
console.log(cache.get('key1')); // 'value1'
cache.del('key1');
```
