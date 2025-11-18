# Radio

Chainable Pub/Sub Library for Elide (polyglot!)

Based on https://www.npmjs.com/package/radio (~20K+ downloads/week)

## Features

- Chainable API
- Channel-based messaging
- Topic subscriptions
- Simple pub/sub
- Zero dependencies

## Quick Start

```typescript
import radio from './elide-radio.ts';

// Create channel
const appChannel = radio.channel('app');

// Subscribe
appChannel.subscribe('start', () => {
  console.log('App started!');
});

// Broadcast
appChannel.broadcast('start');

// Chainable API
radio.channel('user')
  .subscribe('login', (user) => console.log('Login:', user))
  .subscribe('logout', (user) => console.log('Logout:', user))
  .broadcast('login', 'Alice');
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import radio from './elide-radio.ts';

radio.channel('orders')
  .subscribe('placed', (id) => console.log('Order:', id))
  .broadcast('placed', 123);
```

### Python (via Elide)
```python
from elide_radio import radio

radio.channel('orders') \
  .subscribe('placed', lambda id: print(f'Order: {id}')) \
  .broadcast('placed', 123)
```

### Ruby (via Elide)
```ruby
require 'elide/radio'

radio.channel('orders')
  .subscribe('placed') { |id| puts "Order: #{id}" }
  .broadcast('placed', 123)
```

### Java (via Elide)
```java
import elide.radio.*;

radio.channel("orders")
  .subscribe("placed", id -> System.out.println("Order: " + id))
  .broadcast("placed", 123);
```

## Benefits

- One messaging system for ALL languages on Elide
- Chainable, fluent API
- Channel-based organization
- ~20K+ downloads/week on npm!
