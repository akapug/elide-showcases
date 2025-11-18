# Delegate

Event Delegation Library for Elide (polyglot!)

Based on https://www.npmjs.com/package/delegate (~200K+ downloads/week)

## Features

- Event delegation
- CSS selector matching
- Automatic cleanup
- Multiple event types
- Zero dependencies

## Quick Start

```typescript
import delegate from './elide-delegate.ts';

const container = document.getElementById('list');

// Delegate click events
const binding = delegate(container, '.item', 'click', (event) => {
  console.log('Item clicked!');
});

// Cleanup when done
binding.destroy();

// Multiple event types
import { delegateAll } from './elide-delegate.ts';

delegateAll(container, 'input', ['focus', 'blur'], (event) => {
  console.log('Input event:', event.type);
});
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import delegate from './elide-delegate.ts';

class TodoList {
  private bindings: Binding[] = [];

  mount() {
    this.bindings.push(
      delegate(this.element, '.todo-item', 'click', this.handleClick)
    );
  }

  unmount() {
    this.bindings.forEach(b => b.destroy());
  }
}
```

### Python (via Elide)
```python
from elide_delegate import delegate

binding = delegate(container, '.item', 'click', lambda e: print('Clicked'))
binding.destroy()
```

### Ruby (via Elide)
```ruby
require 'elide/delegate'

binding = delegate(container, '.item', 'click') { |e| puts 'Clicked' }
binding.destroy
```

### Java (via Elide)
```java
import elide.delegate.*;

Binding binding = delegate(
  container, ".item", "click", e -> System.out.println("Clicked")
);
binding.destroy();
```

## Benefits

- One delegation library for ALL languages on Elide
- Memory efficient event handling
- Handle dynamic content easily
- ~200K+ downloads/week on npm!
