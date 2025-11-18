# Serve Handler

Serve Handler for Elide (polyglot!)

Based on https://www.npmjs.com/package/serve-handler (~100K+ downloads/week)

## Features

- Request handling
- Clean URLs
- Redirects
- Directory listing
- Zero dependencies

## Quick Start

```typescript
import serve-handler from './elide-serve-handler.ts';

// Basic usage
const result = serve-handler.main();
console.log(result);
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import serve-handler from './elide-serve-handler.ts';
const result = serve-handler.main();
```

### Python (via Elide)
```python
from elide_serve-handler import serve-handler
result = serve-handler.main()
```

### Ruby (via Elide)
```ruby
require 'elide/serve-handler'
result = serve-handler.main
```

### Java (via Elide)
```java
import elide.serve-handler.*;
String result = Serve_Handler.main();
```

## Benefits

- One library for ALL languages on Elide
- Consistent API across languages
- ~100K+ downloads/week on npm!
