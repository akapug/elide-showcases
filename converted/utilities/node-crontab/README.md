# Cron Wrapper

Cron Wrapper for Elide (polyglot!)

Based on https://www.npmjs.com/package/node-crontab (~10K+ downloads/week)

## Features

- Cron wrapper
- Task scheduling
- Cron editing
- Zero dependencies

## Quick Start

```typescript
import node_crontab from './elide-node-crontab.ts';

// Basic operations
node_crontab.set('key', 'value');
console.log(node_crontab.get('key'));

// Event handling
node_crontab.on('change', (key) => {
  console.log(`Changed: ${key}`);
});
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import node_crontab from './elide-node-crontab.ts';

node_crontab.set('data', { foo: 'bar' });
```

### Python (via Elide)
```python
from elide_node_crontab import node_crontab

node_crontab.set('data', {'foo': 'bar'})
```

### Ruby (via Elide)
```ruby
require 'elide/node_crontab'

node_crontab.set('data', { foo: 'bar' })
```

### Java (via Elide)
```java
import elide.node_crontab.*;

NodeCrontab.set("data", Map.of("foo", "bar"));
```

## Benefits

- One cron wrapper for ALL languages on Elide
- Consistent API across languages
- Share across your polyglot stack
- ~10K+ downloads/week on npm!
