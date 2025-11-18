# Forwarded Header

Forwarded Header for Elide (polyglot!)

Based on https://www.npmjs.com/package/forwarded (~5M+ downloads/week)

## Features

- Header parsing
- Proxy info
- RFC 7239 compliant
- IPv6 support
- Zero dependencies

## Quick Start

```typescript
import forwarded from './elide-forwarded.ts';

// Basic usage
const result = forwarded.main();
console.log(result);
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import forwarded from './elide-forwarded.ts';
const result = forwarded.main();
```

### Python (via Elide)
```python
from elide_forwarded import forwarded
result = forwarded.main()
```

### Ruby (via Elide)
```ruby
require 'elide/forwarded'
result = forwarded.main
```

### Java (via Elide)
```java
import elide.forwarded.*;
String result = Forwarded_Header.main();
```

## Benefits

- One library for ALL languages on Elide
- Consistent API across languages
- ~5M+ downloads/week on npm!
