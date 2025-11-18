# Makefile Runner

Makefile Runner for Elide (polyglot!)

Based on https://www.npmjs.com/package/node-make (~5K+ downloads/week)

## Features

- Execute makefiles
- Variable support
- Pattern rules
- Zero dependencies

## Quick Start

```typescript
import node_make from './elide-node-make.ts';

// Basic operations
node_make.set('key', 'value');
console.log(node_make.get('key'));

// Event handling
node_make.on('change', (key) => {
  console.log(`Changed: ${key}`);
});
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import node_make from './elide-node-make.ts';

node_make.set('data', { foo: 'bar' });
```

### Python (via Elide)
```python
from elide_node_make import node_make

node_make.set('data', {'foo': 'bar'})
```

### Ruby (via Elide)
```ruby
require 'elide/node_make'

node_make.set('data', { foo: 'bar' })
```

### Java (via Elide)
```java
import elide.node_make.*;

NodeMake.set("data", Map.of("foo", "bar"));
```

## Benefits

- One makefile runner for ALL languages on Elide
- Consistent API across languages
- Share across your polyglot stack
- ~5K+ downloads/week on npm!
