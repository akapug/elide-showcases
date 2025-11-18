# Recurring Schedules

Recurring Schedules for Elide (polyglot!)

Based on https://www.npmjs.com/package/later (~50K+ downloads/week)

## Features

- Complex schedules
- Natural language
- Recurrence rules
- Zero dependencies

## Quick Start

```typescript
import later from './elide-later.ts';

// Basic operations
later.set('key', 'value');
console.log(later.get('key'));

// Event handling
later.on('change', (key) => {
  console.log(`Changed: ${key}`);
});
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import later from './elide-later.ts';

later.set('data', { foo: 'bar' });
```

### Python (via Elide)
```python
from elide_later import later

later.set('data', {'foo': 'bar'})
```

### Ruby (via Elide)
```ruby
require 'elide/later'

later.set('data', { foo: 'bar' })
```

### Java (via Elide)
```java
import elide.later.*;

Later.set("data", Map.of("foo", "bar"));
```

## Benefits

- One recurring schedules for ALL languages on Elide
- Consistent API across languages
- Share across your polyglot stack
- ~50K+ downloads/week on npm!
