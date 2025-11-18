# Build Tool

Build Tool for Elide (polyglot!)

Based on https://www.npmjs.com/package/jake (~50K+ downloads/week)

## Features

- Makefile-like syntax
- Task dependencies
- File tasks
- Zero dependencies

## Quick Start

```typescript
import jake from './elide-jake.ts';

// Basic operations
jake.set('key', 'value');
console.log(jake.get('key'));

// Event handling
jake.on('change', (key) => {
  console.log(`Changed: ${key}`);
});
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import jake from './elide-jake.ts';

jake.set('data', { foo: 'bar' });
```

### Python (via Elide)
```python
from elide_jake import jake

jake.set('data', {'foo': 'bar'})
```

### Ruby (via Elide)
```ruby
require 'elide/jake'

jake.set('data', { foo: 'bar' })
```

### Java (via Elide)
```java
import elide.jake.*;

Jake.set("data", Map.of("foo", "bar"));
```

## Benefits

- One build tool for ALL languages on Elide
- Consistent API across languages
- Share across your polyglot stack
- ~50K+ downloads/week on npm!
