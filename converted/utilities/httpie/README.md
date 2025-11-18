# HTTPie CLI-like Client

HTTPie CLI-like Client for Elide (polyglot!)

Based on https://www.npmjs.com/package/httpie (~20K+ downloads/week)

## Features

- CLI-style API
- Human-friendly
- JSON support
- Headers management
- Zero dependencies

## Quick Start

```typescript
import httpie from './elide-httpie.ts';

// Basic usage
const result = httpie.main();
console.log(result);
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import httpie from './elide-httpie.ts';
const result = httpie.main();
```

### Python (via Elide)
```python
from elide_httpie import httpie
result = httpie.main()
```

### Ruby (via Elide)
```ruby
require 'elide/httpie'
result = httpie.main
```

### Java (via Elide)
```java
import elide.httpie.*;
String result = HTTPie_CLI_like_Client.main();
```

## Benefits

- One library for ALL languages on Elide
- Consistent API across languages
- ~20K+ downloads/week on npm!
