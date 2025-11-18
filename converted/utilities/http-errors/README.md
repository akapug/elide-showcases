# HTTP Errors

HTTP Errors for Elide (polyglot!)

Based on https://www.npmjs.com/package/http-errors (~15M+ downloads/week)

## Features

- Error creation
- Status codes
- Custom properties
- Standard errors
- Zero dependencies

## Quick Start

```typescript
import http-errors from './elide-http-errors.ts';

// Basic usage
const result = http-errors.main();
console.log(result);
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import http-errors from './elide-http-errors.ts';
const result = http-errors.main();
```

### Python (via Elide)
```python
from elide_http-errors import http-errors
result = http-errors.main()
```

### Ruby (via Elide)
```ruby
require 'elide/http-errors'
result = http-errors.main
```

### Java (via Elide)
```java
import elide.http-errors.*;
String result = HTTP_Errors.main();
```

## Benefits

- One library for ALL languages on Elide
- Consistent API across languages
- ~15M+ downloads/week on npm!
