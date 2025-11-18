# Semaphore

Semaphore for Elide (polyglot!)

Based on https://www.npmjs.com/package/semaphore (~20K+ downloads/week)

## Features

- Counting semaphore
- Resource limiting
- Async wait
- Zero dependencies

## Quick Start

```typescript
import semaphore from './elide-semaphore.ts';

// Basic operations
semaphore.set('key', 'value');
console.log(semaphore.get('key'));

// Event handling
semaphore.on('change', (key) => {
  console.log(`Changed: ${key}`);
});
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import semaphore from './elide-semaphore.ts';

semaphore.set('data', { foo: 'bar' });
```

### Python (via Elide)
```python
from elide_semaphore import semaphore

semaphore.set('data', {'foo': 'bar'})
```

### Ruby (via Elide)
```ruby
require 'elide/semaphore'

semaphore.set('data', { foo: 'bar' })
```

### Java (via Elide)
```java
import elide.semaphore.*;

Semaphore.set("data", Map.of("foo", "bar"));
```

## Benefits

- One semaphore for ALL languages on Elide
- Consistent API across languages
- Share across your polyglot stack
- ~20K+ downloads/week on npm!
