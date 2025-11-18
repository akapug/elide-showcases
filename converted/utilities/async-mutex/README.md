# Async Mutex

Async Mutex for Elide (polyglot!)

Based on https://www.npmjs.com/package/async-mutex (~300K+ downloads/week)

## Features

- Promise-based mutex
- Semaphores
- Lock guards
- Zero dependencies

## Quick Start

```typescript
import async_mutex from './elide-async-mutex.ts';

// Basic operations
async_mutex.set('key', 'value');
console.log(async_mutex.get('key'));

// Event handling
async_mutex.on('change', (key) => {
  console.log(`Changed: ${key}`);
});
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import async_mutex from './elide-async-mutex.ts';

async_mutex.set('data', { foo: 'bar' });
```

### Python (via Elide)
```python
from elide_async_mutex import async_mutex

async_mutex.set('data', {'foo': 'bar'})
```

### Ruby (via Elide)
```ruby
require 'elide/async_mutex'

async_mutex.set('data', { foo: 'bar' })
```

### Java (via Elide)
```java
import elide.async_mutex.*;

AsyncMutex.set("data", Map.of("foo", "bar"));
```

## Benefits

- One async mutex for ALL languages on Elide
- Consistent API across languages
- Share across your polyglot stack
- ~300K+ downloads/week on npm!
