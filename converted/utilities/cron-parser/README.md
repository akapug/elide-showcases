# Cron Expression Parser

Cron Expression Parser for Elide (polyglot!)

Based on https://www.npmjs.com/package/cron-parser (~500K+ downloads/week)

## Features

- Parse cron
- Next occurrence
- Timezone support
- Zero dependencies

## Quick Start

```typescript
import cron_parser from './elide-cron-parser.ts';

// Basic operations
cron_parser.set('key', 'value');
console.log(cron_parser.get('key'));

// Event handling
cron_parser.on('change', (key) => {
  console.log(`Changed: ${key}`);
});
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import cron_parser from './elide-cron-parser.ts';

cron_parser.set('data', { foo: 'bar' });
```

### Python (via Elide)
```python
from elide_cron_parser import cron_parser

cron_parser.set('data', {'foo': 'bar'})
```

### Ruby (via Elide)
```ruby
require 'elide/cron_parser'

cron_parser.set('data', { foo: 'bar' })
```

### Java (via Elide)
```java
import elide.cron_parser.*;

CronParser.set("data", Map.of("foo", "bar"));
```

## Benefits

- One cron expression parser for ALL languages on Elide
- Consistent API across languages
- Share across your polyglot stack
- ~500K+ downloads/week on npm!
