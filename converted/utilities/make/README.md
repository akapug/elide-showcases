# Make for Node

Make for Node for Elide (polyglot!)

Based on https://www.npmjs.com/package/make (~20K+ downloads/week)

## Features

- Makefile parsing
- Target execution
- Dependency tracking
- Zero dependencies

## Quick Start

```typescript
import make from './elide-make.ts';

// Basic operations
make.set('key', 'value');
console.log(make.get('key'));

// Event handling
make.on('change', (key) => {
  console.log(`Changed: ${key}`);
});
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import make from './elide-make.ts';

make.set('data', { foo: 'bar' });
```

### Python (via Elide)
```python
from elide_make import make

make.set('data', {'foo': 'bar'})
```

### Ruby (via Elide)
```ruby
require 'elide/make'

make.set('data', { foo: 'bar' })
```

### Java (via Elide)
```java
import elide.make.*;

Make.set("data", Map.of("foo", "bar"));
```

## Benefits

- One make for node for ALL languages on Elide
- Consistent API across languages
- Share across your polyglot stack
- ~20K+ downloads/week on npm!
