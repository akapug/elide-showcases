# Resource Locking

Resource Locking for Elide (polyglot!)

Based on https://www.npmjs.com/package/locking (~20K+ downloads/week)

## Features

- Lock acquisition
- Deadlock prevention
- Timeout support
- Zero dependencies

## Quick Start

```typescript
import locking from './elide-locking.ts';

// Basic operations
locking.set('key', 'value');
console.log(locking.get('key'));

// Event handling
locking.on('change', (key) => {
  console.log(`Changed: ${key}`);
});
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import locking from './elide-locking.ts';

locking.set('data', { foo: 'bar' });
```

### Python (via Elide)
```python
from elide_locking import locking

locking.set('data', {'foo': 'bar'})
```

### Ruby (via Elide)
```ruby
require 'elide/locking'

locking.set('data', { foo: 'bar' })
```

### Java (via Elide)
```java
import elide.locking.*;

Locking.set("data", Map.of("foo", "bar"));
```

## Benefits

- One resource locking for ALL languages on Elide
- Consistent API across languages
- Share across your polyglot stack
- ~20K+ downloads/week on npm!
