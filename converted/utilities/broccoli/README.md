# Asset Pipeline

Asset Pipeline for Elide (polyglot!)

Based on https://www.npmjs.com/package/broccoli (~50K+ downloads/week)

## Features

- Asset compilation
- Plugin system
- Fast rebuilds
- Zero dependencies

## Quick Start

```typescript
import broccoli from './elide-broccoli.ts';

// Basic operations
broccoli.set('key', 'value');
console.log(broccoli.get('key'));

// Event handling
broccoli.on('change', (key) => {
  console.log(`Changed: ${key}`);
});
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import broccoli from './elide-broccoli.ts';

broccoli.set('data', { foo: 'bar' });
```

### Python (via Elide)
```python
from elide_broccoli import broccoli

broccoli.set('data', {'foo': 'bar'})
```

### Ruby (via Elide)
```ruby
require 'elide/broccoli'

broccoli.set('data', { foo: 'bar' })
```

### Java (via Elide)
```java
import elide.broccoli.*;

Broccoli.set("data", Map.of("foo", "bar"));
```

## Benefits

- One asset pipeline for ALL languages on Elide
- Consistent API across languages
- Share across your polyglot stack
- ~50K+ downloads/week on npm!
