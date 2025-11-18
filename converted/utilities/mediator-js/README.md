# Mediator.js

Mediator Pattern Implementation for Elide (polyglot!)

Based on https://www.npmjs.com/package/mediator-js (~20K+ downloads/week)

## Features

- Mediator pattern
- Namespace support
- Priority channels
- Predicate filtering
- Zero dependencies

## Quick Start

```typescript
import mediator from './elide-mediator-js.ts';

// Subscribe
const id = mediator.subscribe('user:login', (username) => {
  console.log('User logged in:', username);
});

// Publish
mediator.publish('user:login', 'Alice');

// Unsubscribe
mediator.unsubscribe(id);

// Priority
mediator.subscribe('init', () => console.log('High priority'), {
  priority: 10
});

// Predicate filtering
mediator.subscribe('data', (value) => {
  console.log('Even:', value);
}, {
  predicate: (value) => value % 2 === 0
});
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import { Mediator } from './elide-mediator-js.ts';

const med = new Mediator();
med.subscribe('event', (data) => console.log(data));
med.publish('event', 'Hello');
```

### Python (via Elide)
```python
from elide_mediator_js import Mediator

med = Mediator()
med.subscribe('event', lambda data: print(data))
med.publish('event', 'Hello')
```

### Ruby (via Elide)
```ruby
require 'elide/mediator_js'

med = Mediator.new
med.subscribe('event') { |data| puts data }
med.publish('event', 'Hello')
```

### Java (via Elide)
```java
import elide.mediator_js.*;

Mediator med = new Mediator();
med.subscribe("event", data -> System.out.println(data));
med.publish("event", "Hello");
```

## Benefits

- One mediator for ALL languages on Elide
- Decouple complex systems
- Priority-based execution
- ~20K+ downloads/week on npm!
