# PubSub.js

JavaScript Publish/Subscribe Library for Elide (polyglot!)

Based on https://www.npmjs.com/package/pubsub-js (~200K+ downloads/week)

## Features

- Topic-based messaging
- Hierarchical topics
- Wildcard subscriptions
- Subscribe once
- Zero dependencies

## Quick Start

```typescript
import pubsub from './elide-pubsub-js.ts';

// Subscribe to a topic
const token = pubsub.subscribe('news', (topic, data) => {
  console.log('News:', data);
});

// Publish message
pubsub.publish('news', { headline: 'Breaking News!' });

// Unsubscribe
pubsub.unsubscribe(token);

// Wildcard subscriptions
pubsub.subscribe('user.*', (topic, data) => {
  console.log('User event:', topic);
});

pubsub.publish('user.login', { username: 'Alice' });
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import pubsub from './elide-pubsub-js.ts';

pubsub.subscribe('order.placed', (topic, data) => {
  console.log('Order:', data.orderId);
});

pubsub.publish('order.placed', { orderId: 123 });
```

### Python (via Elide)
```python
from elide_pubsub_js import pubsub

pubsub.subscribe('order.placed', lambda topic, data: print(f'Order: {data["orderId"]}'))
pubsub.publish('order.placed', {'orderId': 123})
```

### Ruby (via Elide)
```ruby
require 'elide/pubsub_js'

pubsub.subscribe('order.placed') { |topic, data| puts "Order: #{data[:orderId]}" }
pubsub.publish('order.placed', { orderId: 123 })
```

### Java (via Elide)
```java
import elide.pubsub_js.*;

pubsub.subscribe("order.placed", (topic, data) -> {
  System.out.println("Order: " + data.get("orderId"));
});
pubsub.publish("order.placed", Map.of("orderId", 123));
```

## Benefits

- One pub/sub library for ALL languages on Elide
- Consistent messaging patterns across languages
- Share message bus across your polyglot stack
- ~200K+ downloads/week on npm!
