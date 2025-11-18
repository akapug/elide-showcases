# Async Waiting

Async Waiting for Elide (polyglot!)

Based on https://www.npmjs.com/package/wait-for-expect (~100K+ downloads/week)

## Features

- Wait for condition
- Polling
- Testing utility
- Zero dependencies

## Quick Start

```typescript
import wait_for_expect from './elide-wait-for-expect.ts';

// Basic operations
wait_for_expect.set('key', 'value');
console.log(wait_for_expect.get('key'));

// Event handling
wait_for_expect.on('change', (key) => {
  console.log(`Changed: ${key}`);
});
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import wait_for_expect from './elide-wait-for-expect.ts';

wait_for_expect.set('data', { foo: 'bar' });
```

### Python (via Elide)
```python
from elide_wait_for_expect import wait_for_expect

wait_for_expect.set('data', {'foo': 'bar'})
```

### Ruby (via Elide)
```ruby
require 'elide/wait_for_expect'

wait_for_expect.set('data', { foo: 'bar' })
```

### Java (via Elide)
```java
import elide.wait_for_expect.*;

WaitForExpect.set("data", Map.of("foo", "bar"));
```

## Benefits

- One async waiting for ALL languages on Elide
- Consistent API across languages
- Share across your polyglot stack
- ~100K+ downloads/week on npm!
