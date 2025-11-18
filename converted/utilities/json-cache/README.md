# JSON-Cache - JSON-based Caching

JSON serialization and caching.

Based on [json-cache](https://www.npmjs.com/package/json-cache) (~20K+ downloads/week)

## Quick Start

```typescript
import JSONCache from './elide-json-cache.ts';

const cache = new JSONCache();
cache.set('key1', { data: 'value1' });
console.log(cache.toJSON());
```
