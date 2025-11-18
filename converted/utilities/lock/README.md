# Lock Mechanism

Lock Mechanism for Elide (polyglot!)

Based on https://www.npmjs.com/package/lock (~30K+ downloads/week)

## Features

- Simple locks
- Try-lock
- Auto-release
- Zero dependencies

## Quick Start

```typescript
import lock from './elide-lock.ts';

// Basic operations
lock.set('key', 'value');
console.log(lock.get('key'));

// Event handling
lock.on('change', (key) => {
  console.log(`Changed: ${key}`);
});
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import lock from './elide-lock.ts';

lock.set('data', { foo: 'bar' });
```

### Python (via Elide)
```python
from elide_lock import lock

lock.set('data', {'foo': 'bar'})
```

### Ruby (via Elide)
```ruby
require 'elide/lock'

lock.set('data', { foo: 'bar' })
```

### Java (via Elide)
```java
import elide.lock.*;

Lock.set("data", Map.of("foo", "bar"));
```

## Benefits

- One lock mechanism for ALL languages on Elide
- Consistent API across languages
- Share across your polyglot stack
- ~30K+ downloads/week on npm!
