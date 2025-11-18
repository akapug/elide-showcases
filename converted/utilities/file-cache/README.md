# File-Cache - Simple File Cache

Simple file-based caching.

Based on [file-cache](https://www.npmjs.com/package/file-cache) (~50K+ downloads/week)

## Quick Start

```typescript
import FileCache from './elide-file-cache.ts';

const cache = new FileCache();
cache.set('data', { foo: 'bar' }, 10000);
console.log(cache.get('data'));
```
