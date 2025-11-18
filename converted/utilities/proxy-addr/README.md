# Proxy Address

Proxy Address for Elide (polyglot!)

Based on https://www.npmjs.com/package/proxy-addr (~10M+ downloads/week)

## Features

- IP detection
- Proxy trust
- X-Forwarded support
- Security
- Zero dependencies

## Quick Start

```typescript
import proxy-addr from './elide-proxy-addr.ts';

// Basic usage
const result = proxy-addr.main();
console.log(result);
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import proxy-addr from './elide-proxy-addr.ts';
const result = proxy-addr.main();
```

### Python (via Elide)
```python
from elide_proxy-addr import proxy-addr
result = proxy-addr.main()
```

### Ruby (via Elide)
```ruby
require 'elide/proxy-addr'
result = proxy-addr.main
```

### Java (via Elide)
```java
import elide.proxy-addr.*;
String result = Proxy_Address.main();
```

## Benefits

- One library for ALL languages on Elide
- Consistent API across languages
- ~10M+ downloads/week on npm!
