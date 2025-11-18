# Mutual Exclusion

Mutual Exclusion for Elide (polyglot!)

Based on https://www.npmjs.com/package/mutex (~30K+ downloads/week)

## Features

- Mutex locks
- Critical sections
- Thread safety
- Zero dependencies

## Quick Start

```typescript
import mutex from './elide-mutex.ts';

// Basic operations
mutex.set('key', 'value');
console.log(mutex.get('key'));

// Event handling
mutex.on('change', (key) => {
  console.log(`Changed: ${key}`);
});
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import mutex from './elide-mutex.ts';

mutex.set('data', { foo: 'bar' });
```

### Python (via Elide)
```python
from elide_mutex import mutex

mutex.set('data', {'foo': 'bar'})
```

### Ruby (via Elide)
```ruby
require 'elide/mutex'

mutex.set('data', { foo: 'bar' })
```

### Java (via Elide)
```java
import elide.mutex.*;

Mutex.set("data", Map.of("foo", "bar"));
```

## Benefits

- One mutual exclusion for ALL languages on Elide
- Consistent API across languages
- Share across your polyglot stack
- ~30K+ downloads/week on npm!
