# Signals

Type-safe Event System for Elide (polyglot!)

Based on https://www.npmjs.com/package/signals (~30K+ downloads/week)

## Features

- Type-safe signals
- Strong typing
- Once listeners
- Priority handling
- Zero dependencies

## Quick Start

```typescript
import { Signal } from './elide-signals.ts';

// Create signal
const onUserLogin = new Signal<{ username: string }>();

// Add listener
onUserLogin.add((data) => {
  console.log('User logged in:', data.username);
});

// Dispatch
onUserLogin.dispatch({ username: 'Alice' });

// Once listeners
const onInit = new Signal<void>();
onInit.addOnce(() => console.log('Initialize once'));

// Priority
const onLoad = new Signal<void>();
onLoad.add(() => console.log('High priority'), 10);
onLoad.add(() => console.log('Low priority'), -10);
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import { Signal } from './elide-signals.ts';

class DataModel {
  onChanged = new Signal<{ key: string; value: any }>();

  set(key: string, value: any) {
    this.onChanged.dispatch({ key, value });
  }
}
```

### Python (via Elide)
```python
from elide_signals import Signal

on_login = Signal()
on_login.add(lambda data: print(f'User: {data["username"]}'))
on_login.dispatch({'username': 'Alice'})
```

### Ruby (via Elide)
```ruby
require 'elide/signals'

on_login = Signal.new
on_login.add { |data| puts "User: #{data[:username]}" }
on_login.dispatch({ username: 'Alice' })
```

### Java (via Elide)
```java
import elide.signals.*;

Signal<Map<String, String>> onLogin = new Signal<>();
onLogin.add(data -> System.out.println("User: " + data.get("username")));
onLogin.dispatch(Map.of("username", "Alice"));
```

## Benefits

- One signal system for ALL languages on Elide
- Type-safe event handling
- Priority-based execution
- ~30K+ downloads/week on npm!
