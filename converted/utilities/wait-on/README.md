# Resource Waiting

Resource Waiting for Elide (polyglot!)

Based on https://www.npmjs.com/package/wait-on (~300K+ downloads/week)

## Features

- Wait for resources
- HTTP/TCP/File
- Timeout support
- Zero dependencies

## Quick Start

```typescript
import wait_on from './elide-wait-on.ts';

// Basic operations
wait_on.set('key', 'value');
console.log(wait_on.get('key'));

// Event handling
wait_on.on('change', (key) => {
  console.log(`Changed: ${key}`);
});
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import wait_on from './elide-wait-on.ts';

wait_on.set('data', { foo: 'bar' });
```

### Python (via Elide)
```python
from elide_wait_on import wait_on

wait_on.set('data', {'foo': 'bar'})
```

### Ruby (via Elide)
```ruby
require 'elide/wait_on'

wait_on.set('data', { foo: 'bar' })
```

### Java (via Elide)
```java
import elide.wait_on.*;

WaitOn.set("data", Map.of("foo", "bar"));
```

## Benefits

- One resource waiting for ALL languages on Elide
- Consistent API across languages
- Share across your polyglot stack
- ~300K+ downloads/week on npm!
