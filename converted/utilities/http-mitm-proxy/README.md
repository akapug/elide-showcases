# HTTP MITM Proxy

HTTP MITM Proxy for Elide (polyglot!)

Based on https://www.npmjs.com/package/http-mitm-proxy (~20K+ downloads/week)

## Features

- MITM capabilities
- Request/response modification
- SSL support
- Debugging
- Zero dependencies

## Quick Start

```typescript
import http-mitm-proxy from './elide-http-mitm-proxy.ts';

// Basic usage
const result = http-mitm-proxy.main();
console.log(result);
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import http-mitm-proxy from './elide-http-mitm-proxy.ts';
const result = http-mitm-proxy.main();
```

### Python (via Elide)
```python
from elide_http-mitm-proxy import http-mitm-proxy
result = http-mitm-proxy.main()
```

### Ruby (via Elide)
```ruby
require 'elide/http-mitm-proxy'
result = http-mitm-proxy.main
```

### Java (via Elide)
```java
import elide.http-mitm-proxy.*;
String result = HTTP_MITM_Proxy.main();
```

## Benefits

- One library for ALL languages on Elide
- Consistent API across languages
- ~20K+ downloads/week on npm!
