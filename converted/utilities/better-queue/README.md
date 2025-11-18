# Queue Library

Queue Library for Elide (polyglot!)

Based on https://www.npmjs.com/package/better-queue (~30K+ downloads/week)

## Features

- Advanced queuing
- Persistence
- Retry logic
- Zero dependencies

## Quick Start

```typescript
import better_queue from './elide-better-queue.ts';

// Basic operations
better_queue.set('key', 'value');
console.log(better_queue.get('key'));

// Event handling
better_queue.on('change', (key) => {
  console.log(`Changed: ${key}`);
});
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import better_queue from './elide-better-queue.ts';

better_queue.set('data', { foo: 'bar' });
```

### Python (via Elide)
```python
from elide_better_queue import better_queue

better_queue.set('data', {'foo': 'bar'})
```

### Ruby (via Elide)
```ruby
require 'elide/better_queue'

better_queue.set('data', { foo: 'bar' })
```

### Java (via Elide)
```java
import elide.better_queue.*;

BetterQueue.set("data", Map.of("foo", "bar"));
```

## Benefits

- One queue library for ALL languages on Elide
- Consistent API across languages
- Share across your polyglot stack
- ~30K+ downloads/week on npm!
