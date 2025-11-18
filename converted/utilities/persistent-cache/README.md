# Persistent-Cache - File-based Cache

Persistent file-based caching with TTL support.

Based on [persistent-cache](https://www.npmjs.com/package/persistent-cache) (~20K+ downloads/week)

## Quick Start

```typescript
import PersistentCache from './elide-persistent-cache.ts';

const cache = new PersistentCache();
cache.put('user:1', { name: 'Alice' }, 5000); // 5s TTL
console.log(cache.get('user:1'));
```
