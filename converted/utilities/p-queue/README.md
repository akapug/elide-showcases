# Promise Queue

Promise Queue for Elide (polyglot!)

Based on https://www.npmjs.com/package/p-queue (~500K+ downloads/week)

## Features

- Promise-based
- Priority queue
- Concurrency limits
- Zero dependencies

## Quick Start

```typescript
import p_queue from './elide-p-queue.ts';

// Basic operations
p_queue.set('key', 'value');
console.log(p_queue.get('key'));

// Event handling
p_queue.on('change', (key) => {
  console.log(`Changed: ${key}`);
});
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import p_queue from './elide-p-queue.ts';

p_queue.set('data', { foo: 'bar' });
```

### Python (via Elide)
```python
from elide_p_queue import p_queue

p_queue.set('data', {'foo': 'bar'})
```

### Ruby (via Elide)
```ruby
require 'elide/p_queue'

p_queue.set('data', { foo: 'bar' })
```

### Java (via Elide)
```java
import elide.p_queue.*;

PQueue.set("data", Map.of("foo", "bar"));
```

## Benefits

- One promise queue for ALL languages on Elide
- Consistent API across languages
- Share across your polyglot stack
- ~500K+ downloads/week on npm!
