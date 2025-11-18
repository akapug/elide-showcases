# HTTP Proxy

HTTP Proxy for Elide (polyglot!)

Based on https://www.npmjs.com/package/http-proxy (~2M+ downloads/week)

## Features

- Proxy HTTP/HTTPS
- WebSocket support
- Flexible routing
- Custom logic
- Zero dependencies

## Quick Start

```typescript
import http-proxy from './elide-http-proxy.ts';

// Basic usage
const result = http-proxy.main();
console.log(result);
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import http-proxy from './elide-http-proxy.ts';
const result = http-proxy.main();
```

### Python (via Elide)
```python
from elide_http-proxy import http-proxy
result = http-proxy.main()
```

### Ruby (via Elide)
```ruby
require 'elide/http-proxy'
result = http-proxy.main
```

### Java (via Elide)
```java
import elide.http-proxy.*;
String result = HTTP_Proxy.main();
```

## Benefits

- One library for ALL languages on Elide
- Consistent API across languages
- ~2M+ downloads/week on npm!
