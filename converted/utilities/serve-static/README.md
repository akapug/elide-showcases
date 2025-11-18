# Serve Static

Serve Static for Elide (polyglot!)

Based on https://www.npmjs.com/package/serve-static (~5M+ downloads/week)

## Features

- Express middleware
- Efficient serving
- ETag support
- Range requests
- Zero dependencies

## Quick Start

```typescript
import serve-static from './elide-serve-static.ts';

// Basic usage
const result = serve-static.main();
console.log(result);
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import serve-static from './elide-serve-static.ts';
const result = serve-static.main();
```

### Python (via Elide)
```python
from elide_serve-static import serve-static
result = serve-static.main()
```

### Ruby (via Elide)
```ruby
require 'elide/serve-static'
result = serve-static.main
```

### Java (via Elide)
```java
import elide.serve-static.*;
String result = Serve_Static.main();
```

## Benefits

- One library for ALL languages on Elide
- Consistent API across languages
- ~5M+ downloads/week on npm!
