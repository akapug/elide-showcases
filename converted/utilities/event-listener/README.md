# Event Listener

Simple Event Listener Utilities for Elide (polyglot!)

Based on https://www.npmjs.com/package/event-listener (~50K+ downloads/week)

## Features

- Simple event API
- Automatic cleanup
- Multiple listeners
- Event management
- Zero dependencies

## Quick Start

```typescript
import { listen, listenOnce, EventManager } from './elide-event-listener.ts';

const element = document.getElementById('button');

// Add listener with cleanup
const remove = listen(element, 'click', (event) => {
  console.log('Clicked!');
});

// Remove when done
remove();

// Listen once
listenOnce(element, 'init', () => {
  console.log('Initialize once');
});

// Event manager
const manager = new EventManager();
manager.add(element, 'click', () => console.log('Click'));
manager.removeAll();
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import { EventManager } from './elide-event-listener.ts';

class Component {
  private manager = new EventManager();

  mount() {
    this.manager.add(this.element, 'click', this.handleClick);
  }

  unmount() {
    this.manager.removeAll();
  }
}
```

### Python (via Elide)
```python
from elide_event_listener import listen

remove = listen(element, 'click', lambda e: print('Clicked'))
remove()
```

### Ruby (via Elide)
```ruby
require 'elide/event_listener'

remove = listen(element, 'click') { |e| puts 'Clicked' }
remove.call
```

### Java (via Elide)
```java
import elide.event_listener.*;

Runnable remove = listen(element, "click", e -> System.out.println("Clicked"));
remove.run();
```

## Benefits

- One event API for ALL languages on Elide
- Automatic cleanup prevents memory leaks
- Consistent patterns everywhere
- ~50K+ downloads/week on npm!
