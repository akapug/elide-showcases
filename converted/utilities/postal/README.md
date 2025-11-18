# Postal.js

JavaScript Message Bus for Elide (polyglot!)

Based on https://www.npmjs.com/package/postal (~50K+ downloads/week)

## Features

- Channel-based messaging
- Topic wildcards
- Message filtering
- Cross-channel subscriptions
- Zero dependencies

## Quick Start

```typescript
import postal from './elide-postal.ts';

// Create channel
const userChannel = postal.channel('user');

// Subscribe
userChannel.subscribe('login', (data) => {
  console.log('User logged in:', data.username);
});

// Publish
userChannel.publish('login', { username: 'Alice' });

// Wildcards
userChannel.subscribe('action.*', (data, envelope) => {
  console.log('User action:', envelope.topic);
});
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import postal from './elide-postal.ts';

const orders = postal.channel('orders');
orders.subscribe('placed', (data) => {
  console.log('Order:', data.id);
});
orders.publish('placed', { id: 123 });
```

### Python (via Elide)
```python
from elide_postal import postal

orders = postal.channel('orders')
orders.subscribe('placed', lambda data, env: print(f'Order: {data["id"]}'))
orders.publish('placed', {'id': 123})
```

### Ruby (via Elide)
```ruby
require 'elide/postal'

orders = postal.channel('orders')
orders.subscribe('placed') { |data, env| puts "Order: #{data[:id]}" }
orders.publish('placed', { id: 123 })
```

### Java (via Elide)
```java
import elide.postal.*;

Channel orders = postal.channel("orders");
orders.subscribe("placed", (data, env) -> {
  System.out.println("Order: " + data.get("id"));
});
orders.publish("placed", Map.of("id", 123));
```

## Benefits

- One message bus for ALL languages on Elide
- Channel-based organization
- Wildcard topic matching
- ~50K+ downloads/week on npm!
