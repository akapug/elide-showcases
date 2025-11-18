# Node HTTP Proxy

Node HTTP Proxy for Elide (polyglot!)

Based on https://www.npmjs.com/package/node-http-proxy (~100K+ downloads/week)

## Features

- Proxy capabilities
- Event-driven
- Streaming
- Flexible config
- Zero dependencies

## Quick Start

```typescript
import node-http-proxy from './elide-node-http-proxy.ts';

// Basic usage
const result = node-http-proxy.main();
console.log(result);
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import node-http-proxy from './elide-node-http-proxy.ts';
const result = node-http-proxy.main();
```

### Python (via Elide)
```python
from elide_node-http-proxy import node-http-proxy
result = node-http-proxy.main()
```

### Ruby (via Elide)
```ruby
require 'elide/node-http-proxy'
result = node-http-proxy.main
```

### Java (via Elide)
```java
import elide.node-http-proxy.*;
String result = Node_HTTP_Proxy.main();
```

## Benefits

- One library for ALL languages on Elide
- Consistent API across languages
- ~100K+ downloads/week on npm!
