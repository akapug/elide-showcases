# Add Event Listener

Cross-browser Event Listener Helper for Elide (polyglot!)

Based on https://www.npmjs.com/package/add-event-listener (~100K+ downloads/week)

## Features

- Cross-browser compatible
- Automatic cleanup
- Event delegation
- Once listeners
- Zero dependencies

## Quick Start

```typescript
import addEventListener from './elide-add-event-listener.ts';

const element = document.getElementById('button');

// Add listener with automatic cleanup
const remove = addEventListener(element, 'click', (event) => {
  console.log('Clicked!');
});

// Remove when done
remove();

// Once listeners
addEventListener(element, 'init', () => {
  console.log('Initialize once');
}, { once: true });
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import addEventListener from './elide-add-event-listener.ts';

class Component {
  private cleanup: Array<() => void> = [];

  mount() {
    this.cleanup.push(
      addEventListener(this.element, 'click', this.handleClick)
    );
  }

  unmount() {
    this.cleanup.forEach(fn => fn());
  }
}
```

### Python (via Elide)
```python
from elide_add_event_listener import add_event_listener

remove = add_event_listener(element, 'click', lambda e: print('Clicked'))
remove()
```

### Ruby (via Elide)
```ruby
require 'elide/add_event_listener'

remove = add_event_listener(element, 'click') { |e| puts 'Clicked' }
remove.call
```

### Java (via Elide)
```java
import elide.add_event_listener.*;

RemoveFunction remove = addEventListener(
  element, "click", e -> System.out.println("Clicked")
);
remove.call();
```

## Benefits

- One event listener API for ALL languages on Elide
- Automatic cleanup prevents memory leaks
- Consistent API across languages
- ~100K+ downloads/week on npm!
