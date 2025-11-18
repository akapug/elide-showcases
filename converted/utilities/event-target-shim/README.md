# Event Target Shim

EventTarget Polyfill for Elide (polyglot!)

Based on https://www.npmjs.com/package/event-target-shim (~500K+ downloads/week)

## Features

- Standard EventTarget API
- addEventListener/removeEventListener
- dispatchEvent
- Event prevention
- Zero dependencies

## Quick Start

```typescript
import { EventTarget, createEvent } from './elide-event-target-shim.ts';

const target = new EventTarget();

// Add listener
target.addEventListener('click', (event) => {
  console.log('Clicked!', event.type);
});

// Dispatch event
target.dispatchEvent(createEvent('click'));

// Once listeners
target.addEventListener('init', () => {
  console.log('Initialize once');
}, { once: true });

// Remove listeners
target.removeEventListener('click', handler);
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import { EventTarget, createEvent } from './elide-event-target-shim.ts';

class CustomTarget extends EventTarget {
  notify(msg: string) {
    const event = createEvent('notify');
    (event as any).message = msg;
    this.dispatchEvent(event);
  }
}
```

### Python (via Elide)
```python
from elide_event_target_shim import EventTarget, create_event

target = EventTarget()
target.add_event_listener('click', lambda e: print('Clicked'))
target.dispatch_event(create_event('click'))
```

### Ruby (via Elide)
```ruby
require 'elide/event_target_shim'

target = EventTarget.new
target.add_event_listener('click') { |e| puts 'Clicked' }
target.dispatch_event(create_event('click'))
```

### Java (via Elide)
```java
import elide.event_target_shim.*;

EventTarget target = new EventTarget();
target.addEventListener("click", e -> System.out.println("Clicked"));
target.dispatchEvent(createEvent("click"));
```

## Benefits

- One EventTarget for ALL languages on Elide
- Standard DOM-like API across languages
- Share event patterns across your polyglot stack
- ~500K+ downloads/week on npm!
