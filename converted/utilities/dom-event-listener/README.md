# DOM Event Listener

Enhanced DOM Event Management for Elide (polyglot!)

Based on https://www.npmjs.com/package/dom-event-listener (~20K+ downloads/week)

## Features

- DOM-specific helpers
- Cross-browser support
- Event delegation
- Automatic cleanup
- Zero dependencies

## Quick Start

```typescript
import { on, once, delegate, DOMEventManager } from './elide-dom-event-listener.ts';

const button = document.getElementById('button');

// Add listener
const remove = on(button, 'click', (event) => {
  console.log('Clicked!');
});

// Remove
remove();

// Once
once(button, 'load', () => {
  console.log('Loaded once');
});

// Delegation
delegate(document, '.item', 'click', (event) => {
  console.log('Item clicked');
});

// Manager
const manager = new DOMEventManager();
manager.on(button, 'click', () => console.log('Click'));
manager.removeAll();
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import { DOMEventManager } from './elide-dom-event-listener.ts';

class Component {
  private manager = new DOMEventManager();

  mount() {
    this.manager
      .on(this.element, 'click', this.handleClick)
      .on(this.element, 'hover', this.handleHover);
  }

  unmount() {
    this.manager.removeAll();
  }
}
```

### Python (via Elide)
```python
from elide_dom_event_listener import on

remove = on(button, 'click', lambda e: print('Clicked'))
remove()
```

### Ruby (via Elide)
```ruby
require 'elide/dom_event_listener'

remove = on(button, 'click') { |e| puts 'Clicked' }
remove.call
```

### Java (via Elide)
```java
import elide.dom_event_listener.*;

Runnable remove = on(button, "click", e -> System.out.println("Clicked"));
remove.run();
```

## Benefits

- One DOM event API for ALL languages on Elide
- Cross-browser compatible
- Automatic cleanup prevents leaks
- ~20K+ downloads/week on npm!
