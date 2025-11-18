# Read-Write Lock

Read-Write Lock for Elide (polyglot!)

Based on https://www.npmjs.com/package/rwlock (~10K+ downloads/week)

## Features

- Reader-writer lock
- Shared/exclusive modes
- Fair scheduling
- Zero dependencies

## Quick Start

```typescript
import rwlock from './elide-rwlock.ts';

// Basic operations
rwlock.set('key', 'value');
console.log(rwlock.get('key'));

// Event handling
rwlock.on('change', (key) => {
  console.log(`Changed: ${key}`);
});
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import rwlock from './elide-rwlock.ts';

rwlock.set('data', { foo: 'bar' });
```

### Python (via Elide)
```python
from elide_rwlock import rwlock

rwlock.set('data', {'foo': 'bar'})
```

### Ruby (via Elide)
```ruby
require 'elide/rwlock'

rwlock.set('data', { foo: 'bar' })
```

### Java (via Elide)
```java
import elide.rwlock.*;

Rwlock.set("data", Map.of("foo", "bar"));
```

## Benefits

- One read-write lock for ALL languages on Elide
- Consistent API across languages
- Share across your polyglot stack
- ~10K+ downloads/week on npm!
