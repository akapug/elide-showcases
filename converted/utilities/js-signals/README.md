# JS-Signals

Custom Event/Messaging System for Elide (polyglot!)

Based on https://www.npmjs.com/package/js-signals (~50K+ downloads/week)

## Features

- Type-safe signals
- Memorize last dispatch
- Enable/disable signals
- Priority listeners
- Zero dependencies

## Quick Start

```typescript
import { Signal } from './elide-js-signals.ts';

// Create signal
const onUserLogin = new Signal<[string]>();

// Add listener
onUserLogin.add((username) => {
  console.log('User logged in:', username);
});

// Dispatch
onUserLogin.dispatch('Alice');

// Priority
onUserLogin.add(() => console.log('High priority'), null, 10);

// Memorize (late subscribers get last value)
const onConfig = new Signal<[object]>();
onConfig.memorize = true;
onConfig.dispatch({ theme: 'dark' });

// Context binding
onSignal.add(this.handler, this);
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import { Signal } from './elide-js-signals.ts';

class DataModel {
  onChanged = new Signal<[any]>();

  set(value: any) {
    this.onChanged.dispatch(value);
  }
}
```

### Python (via Elide)
```python
from elide_js_signals import Signal

on_login = Signal()
on_login.add(lambda user: print(f'User: {user}'))
on_login.dispatch('Alice')
```

### Ruby (via Elide)
```ruby
require 'elide/js_signals'

on_login = Signal.new
on_login.add { |user| puts "User: #{user}" }
on_login.dispatch('Alice')
```

### Java (via Elide)
```java
import elide.js_signals.*;

Signal<String> onLogin = new Signal<>();
onLogin.add(user -> System.out.println("User: " + user));
onLogin.dispatch("Alice");
```

## Benefits

- One signal system for ALL languages on Elide
- Advanced features (memorize, priority)
- Type-safe event handling
- ~50K+ downloads/week on npm!
