# Delay Utility

Delay Utility for Elide (polyglot!)

Based on https://www.npmjs.com/package/delay (~200K+ downloads/week)

## Features

- Promise delay
- Cancelable
- Value passing
- Zero dependencies

## Quick Start

```typescript
import delay from './elide-delay.ts';

// Basic operations
delay.set('key', 'value');
console.log(delay.get('key'));

// Event handling
delay.on('change', (key) => {
  console.log(`Changed: ${key}`);
});
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import delay from './elide-delay.ts';

delay.set('data', { foo: 'bar' });
```

### Python (via Elide)
```python
from elide_delay import delay

delay.set('data', {'foo': 'bar'})
```

### Ruby (via Elide)
```ruby
require 'elide/delay'

delay.set('data', { foo: 'bar' })
```

### Java (via Elide)
```java
import elide.delay.*;

Delay.set("data", Map.of("foo", "bar"));
```

## Benefits

- One delay utility for ALL languages on Elide
- Consistent API across languages
- Share across your polyglot stack
- ~200K+ downloads/week on npm!
