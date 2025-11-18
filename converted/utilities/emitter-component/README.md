# Emitter Component

Event Emitter Component for Elide (polyglot!)

Based on https://www.npmjs.com/package/emitter-component (~50K+ downloads/week)

## Features

- Simple event API (on, off, emit)
- Once listeners
- Listener removal
- Event handling
- Zero dependencies

## Quick Start

```typescript
import { Emitter } from './elide-emitter-component.ts';

const emitter = new Emitter();

// Listen to events
emitter.on('data', (msg) => {
  console.log('Received:', msg);
});

// Emit events
emitter.emit('data', 'Hello World');

// Once listeners
emitter.once('init', () => {
  console.log('Initialize once');
});

// Remove listeners
emitter.off('data');
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import { Emitter } from './elide-emitter-component.ts';

class DataStore extends Emitter {
  set(key: string, value: any) {
    this.emit('change', key, value);
  }
}
```

### Python (via Elide)
```python
from elide_emitter_component import Emitter

emitter = Emitter()
emitter.on('event', lambda msg: print(msg))
emitter.emit('event', 'Hello')
```

### Ruby (via Elide)
```ruby
require 'elide/emitter_component'

emitter = Emitter.new
emitter.on('event') { |msg| puts msg }
emitter.emit('event', 'Hello')
```

### Java (via Elide)
```java
import elide.emitter_component.*;

Emitter emitter = new Emitter();
emitter.on("event", msg -> System.out.println(msg));
emitter.emit("event", "Hello");
```

## Benefits

- One event emitter for ALL languages on Elide
- Consistent event API across languages
- Share event patterns across your polyglot stack
- ~50K+ downloads/week on npm!
