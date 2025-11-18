# Job Queue

Job Queue for Elide (polyglot!)

Based on https://www.npmjs.com/package/queue (~50K+ downloads/week)

## Features

- FIFO queue
- Concurrency control
- Event emitter
- Zero dependencies

## Quick Start

```typescript
import queue from './elide-queue.ts';

// Basic operations
queue.set('key', 'value');
console.log(queue.get('key'));

// Event handling
queue.on('change', (key) => {
  console.log(`Changed: ${key}`);
});
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import queue from './elide-queue.ts';

queue.set('data', { foo: 'bar' });
```

### Python (via Elide)
```python
from elide_queue import queue

queue.set('data', {'foo': 'bar'})
```

### Ruby (via Elide)
```ruby
require 'elide/queue'

queue.set('data', { foo: 'bar' })
```

### Java (via Elide)
```java
import elide.queue.*;

Queue.set("data", Map.of("foo", "bar"));
```

## Benefits

- One job queue for ALL languages on Elide
- Consistent API across languages
- Share across your polyglot stack
- ~50K+ downloads/week on npm!
