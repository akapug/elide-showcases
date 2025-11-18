# MiniSignals

Minimal Signal Library for Elide (polyglot!)

Based on https://www.npmjs.com/package/minisignals (~50K+ downloads/week)

## Features

- Minimal API surface
- Fast execution
- Lightweight
- Once listeners
- Zero dependencies

## Quick Start

```typescript
import { MiniSignal } from './elide-minisignals.ts';

// Create signal
const onUpdate = new MiniSignal();

// Add handler
onUpdate.add((data) => {
  console.log('Updated:', data);
});

// Dispatch
onUpdate.dispatch({ value: 42 });

// Once handlers
onUpdate.once(() => {
  console.log('Fires once');
});

// Detach
const binding = onUpdate.add(() => console.log('Handler'));
binding.detach();

// Detach all
onUpdate.detachAll();
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import { MiniSignal } from './elide-minisignals.ts';

class Player {
  onMove = new MiniSignal();

  move(x: number, y: number) {
    this.onMove.dispatch(x, y);
  }
}
```

### Python (via Elide)
```python
from elide_minisignals import MiniSignal

on_update = MiniSignal()
on_update.add(lambda data: print(f'Updated: {data}'))
on_update.dispatch({'value': 42})
```

### Ruby (via Elide)
```ruby
require 'elide/minisignals'

on_update = MiniSignal.new
on_update.add { |data| puts "Updated: #{data}" }
on_update.dispatch({ value: 42 })
```

### Java (via Elide)
```java
import elide.minisignals.*;

MiniSignal onUpdate = new MiniSignal();
onUpdate.add(data -> System.out.println("Updated: " + data));
onUpdate.dispatch(Map.of("value", 42));
```

## Benefits

- One signal library for ALL languages on Elide
- Minimal API, maximum performance
- Perfect for games and real-time apps
- ~50K+ downloads/week on npm!
