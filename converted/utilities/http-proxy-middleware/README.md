# HTTP Proxy Middleware

HTTP Proxy Middleware for Elide (polyglot!)

Based on https://www.npmjs.com/package/http-proxy-middleware (~3M+ downloads/week)

## Features

- Express integration
- Path rewriting
- WebSocket proxying
- Easy configuration
- Zero dependencies

## Quick Start

```typescript
import http-proxy-middleware from './elide-http-proxy-middleware.ts';

// Basic usage
const result = http-proxy-middleware.main();
console.log(result);
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import http-proxy-middleware from './elide-http-proxy-middleware.ts';
const result = http-proxy-middleware.main();
```

### Python (via Elide)
```python
from elide_http-proxy-middleware import http-proxy-middleware
result = http-proxy-middleware.main()
```

### Ruby (via Elide)
```ruby
require 'elide/http-proxy-middleware'
result = http-proxy-middleware.main
```

### Java (via Elide)
```java
import elide.http-proxy-middleware.*;
String result = HTTP_Proxy_Middleware.main();
```

## Benefits

- One library for ALL languages on Elide
- Consistent API across languages
- ~3M+ downloads/week on npm!
