# urllib - HTTP Client

urllib - HTTP Client for Elide (polyglot!)

Based on https://www.npmjs.com/package/urllib (~200K+ downloads/week)

## Features

- Comprehensive features
- Streaming support
- Keep-alive
- Timeout handling
- Zero dependencies

## Quick Start

```typescript
import urllib from './elide-urllib.ts';

// Basic usage
const result = urllib.main();
console.log(result);
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import urllib from './elide-urllib.ts';
const result = urllib.main();
```

### Python (via Elide)
```python
from elide_urllib import urllib
result = urllib.main()
```

### Ruby (via Elide)
```ruby
require 'elide/urllib'
result = urllib.main
```

### Java (via Elide)
```java
import elide.urllib.*;
String result = urllib___HTTP_Client.main();
```

## Benefits

- One library for ALL languages on Elide
- Consistent API across languages
- ~200K+ downloads/week on npm!
