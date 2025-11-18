# Crontab Management

Crontab Management for Elide (polyglot!)

Based on https://www.npmjs.com/package/crontab (~30K+ downloads/week)

## Features

- Manage crontab
- Schedule tasks
- Cron validation
- Zero dependencies

## Quick Start

```typescript
import crontab from './elide-crontab.ts';

// Basic operations
crontab.set('key', 'value');
console.log(crontab.get('key'));

// Event handling
crontab.on('change', (key) => {
  console.log(`Changed: ${key}`);
});
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import crontab from './elide-crontab.ts';

crontab.set('data', { foo: 'bar' });
```

### Python (via Elide)
```python
from elide_crontab import crontab

crontab.set('data', {'foo': 'bar'})
```

### Ruby (via Elide)
```ruby
require 'elide/crontab'

crontab.set('data', { foo: 'bar' })
```

### Java (via Elide)
```java
import elide.crontab.*;

Crontab.set("data", Map.of("foo", "bar"));
```

## Benefits

- One crontab management for ALL languages on Elide
- Consistent API across languages
- Share across your polyglot stack
- ~30K+ downloads/week on npm!
