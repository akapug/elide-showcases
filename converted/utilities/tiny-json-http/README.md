# Tiny JSON HTTP

Tiny JSON HTTP for Elide (polyglot!)

Based on https://www.npmjs.com/package/tiny-json-http (~50K+ downloads/week)

## Features

- Tiny footprint
- JSON-focused
- Promise-based
- Simple interface
- Zero dependencies

## Quick Start

```typescript
import tiny-json-http from './elide-tiny-json-http.ts';

// Basic usage
const result = tiny-json-http.main();
console.log(result);
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import tiny-json-http from './elide-tiny-json-http.ts';
const result = tiny-json-http.main();
```

### Python (via Elide)
```python
from elide_tiny-json-http import tiny-json-http
result = tiny-json-http.main()
```

### Ruby (via Elide)
```ruby
require 'elide/tiny-json-http'
result = tiny-json-http.main
```

### Java (via Elide)
```java
import elide.tiny-json-http.*;
String result = Tiny_JSON_HTTP.main();
```

## Benefits

- One library for ALL languages on Elide
- Consistent API across languages
- ~50K+ downloads/week on npm!
