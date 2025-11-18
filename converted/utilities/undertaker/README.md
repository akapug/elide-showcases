# Task Registry

Task Registry for Elide (polyglot!)

Based on https://www.npmjs.com/package/undertaker (~300K+ downloads/week)

## Features

- Task registration
- Task composition
- Metadata storage
- Zero dependencies

## Quick Start

```typescript
import undertaker from './elide-undertaker.ts';

// Basic operations
undertaker.set('key', 'value');
console.log(undertaker.get('key'));

// Event handling
undertaker.on('change', (key) => {
  console.log(`Changed: ${key}`);
});
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import undertaker from './elide-undertaker.ts';

undertaker.set('data', { foo: 'bar' });
```

### Python (via Elide)
```python
from elide_undertaker import undertaker

undertaker.set('data', {'foo': 'bar'})
```

### Ruby (via Elide)
```ruby
require 'elide/undertaker'

undertaker.set('data', { foo: 'bar' })
```

### Java (via Elide)
```java
import elide.undertaker.*;

Undertaker.set("data", Map.of("foo", "bar"));
```

## Benefits

- One task registry for ALL languages on Elide
- Consistent API across languages
- Share across your polyglot stack
- ~300K+ downloads/week on npm!
