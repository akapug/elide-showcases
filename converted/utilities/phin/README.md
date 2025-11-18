# Phin - Ultra-lightweight HTTP Client

Phin - Ultra-lightweight HTTP Client for Elide (polyglot!)

Based on https://www.npmjs.com/package/phin (~50K+ downloads/week)

## Features

- Lightweight
- Promise-based
- Simple API
- Fast performance
- Zero dependencies

## Quick Start

```typescript
import phin from './elide-phin.ts';

// Basic usage
const result = phin.main();
console.log(result);
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import phin from './elide-phin.ts';
const result = phin.main();
```

### Python (via Elide)
```python
from elide_phin import phin
result = phin.main()
```

### Ruby (via Elide)
```ruby
require 'elide/phin'
result = phin.main
```

### Java (via Elide)
```java
import elide.phin.*;
String result = Phin___Ultra_lightweight_HTTP_Client.main();
```

## Benefits

- One library for ALL languages on Elide
- Consistent API across languages
- ~50K+ downloads/week on npm!
