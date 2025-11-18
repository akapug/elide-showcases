# Async Caching

Async Caching for Elide (polyglot!)

Based on https://www.npmjs.com/package/async-cache (~100K+ downloads/week)

## Features

- Cache with async load
- TTL support
- LRU eviction
- Zero dependencies

## Quick Start

```typescript
import async_cache from './elide-async-cache.ts';

// Basic operations
async_cache.set('key', 'value');
console.log(async_cache.get('key'));

// Event handling
async_cache.on('change', (key) => {
  console.log(`Changed: ${key}`);
});
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import async_cache from './elide-async-cache.ts';

async_cache.set('data', { foo: 'bar' });
```

### Python (via Elide)
```python
from elide_async_cache import async_cache

async_cache.set('data', {'foo': 'bar'})
```

### Ruby (via Elide)
```ruby
require 'elide/async_cache'

async_cache.set('data', { foo: 'bar' })
```

### Java (via Elide)
```java
import elide.async_cache.*;

AsyncCache.set("data", Map.of("foo", "bar"));
```

## Benefits

- One async caching for ALL languages on Elide
- Consistent API across languages
- Share across your polyglot stack
- ~100K+ downloads/week on npm!
