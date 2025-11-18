# Sleep Function

Sleep Function for Elide (polyglot!)

Based on https://www.npmjs.com/package/sleep-promise (~50K+ downloads/week)

## Features

- Async sleep
- Promise-based
- Timeout
- Zero dependencies

## Quick Start

```typescript
import sleep_promise from './elide-sleep-promise.ts';

// Basic operations
sleep_promise.set('key', 'value');
console.log(sleep_promise.get('key'));

// Event handling
sleep_promise.on('change', (key) => {
  console.log(`Changed: ${key}`);
});
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import sleep_promise from './elide-sleep-promise.ts';

sleep_promise.set('data', { foo: 'bar' });
```

### Python (via Elide)
```python
from elide_sleep_promise import sleep_promise

sleep_promise.set('data', {'foo': 'bar'})
```

### Ruby (via Elide)
```ruby
require 'elide/sleep_promise'

sleep_promise.set('data', { foo: 'bar' })
```

### Java (via Elide)
```java
import elide.sleep_promise.*;

SleepPromise.set("data", Map.of("foo", "bar"));
```

## Benefits

- One sleep function for ALL languages on Elide
- Consistent API across languages
- Share across your polyglot stack
- ~50K+ downloads/week on npm!
