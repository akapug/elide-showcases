# Virtual File Format

Virtual File Format for Elide (polyglot!)

Based on https://www.npmjs.com/package/vinyl (~800K+ downloads/week)

## Features

- File abstraction
- Metadata support
- Stream compatibility
- Zero dependencies

## Quick Start

```typescript
import vinyl from './elide-vinyl.ts';

// Basic operations
vinyl.set('key', 'value');
console.log(vinyl.get('key'));

// Event handling
vinyl.on('change', (key) => {
  console.log(`Changed: ${key}`);
});
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import vinyl from './elide-vinyl.ts';

vinyl.set('data', { foo: 'bar' });
```

### Python (via Elide)
```python
from elide_vinyl import vinyl

vinyl.set('data', {'foo': 'bar'})
```

### Ruby (via Elide)
```ruby
require 'elide/vinyl'

vinyl.set('data', { foo: 'bar' })
```

### Java (via Elide)
```java
import elide.vinyl.*;

Vinyl.set("data", Map.of("foo", "bar"));
```

## Benefits

- One virtual file format for ALL languages on Elide
- Consistent API across languages
- Share across your polyglot stack
- ~800K+ downloads/week on npm!
