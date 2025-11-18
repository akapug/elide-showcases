# Timeout Utils

Timeout Utils for Elide (polyglot!)

Based on https://www.npmjs.com/package/timeout-as-promise (~10K+ downloads/week)

## Features

- Promise timeout
- Delay functions
- Cancelable
- Zero dependencies

## Quick Start

```typescript
import timeout_as_promise from './elide-timeout-as-promise.ts';

// Basic operations
timeout_as_promise.set('key', 'value');
console.log(timeout_as_promise.get('key'));

// Event handling
timeout_as_promise.on('change', (key) => {
  console.log(`Changed: ${key}`);
});
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import timeout_as_promise from './elide-timeout-as-promise.ts';

timeout_as_promise.set('data', { foo: 'bar' });
```

### Python (via Elide)
```python
from elide_timeout_as_promise import timeout_as_promise

timeout_as_promise.set('data', {'foo': 'bar'})
```

### Ruby (via Elide)
```ruby
require 'elide/timeout_as_promise'

timeout_as_promise.set('data', { foo: 'bar' })
```

### Java (via Elide)
```java
import elide.timeout_as_promise.*;

TimeoutAsPromise.set("data", Map.of("foo", "bar"));
```

## Benefits

- One timeout utils for ALL languages on Elide
- Consistent API across languages
- Share across your polyglot stack
- ~10K+ downloads/week on npm!
