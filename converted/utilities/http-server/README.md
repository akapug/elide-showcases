# HTTP Server

HTTP Server for Elide (polyglot!)

Based on https://www.npmjs.com/package/http-server (~500K+ downloads/week)

## Features

- Static file serving
- CLI interface
- Zero config
- Directory browsing
- Zero dependencies

## Quick Start

```typescript
import http-server from './elide-http-server.ts';

// Basic usage
const result = http-server.main();
console.log(result);
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import http-server from './elide-http-server.ts';
const result = http-server.main();
```

### Python (via Elide)
```python
from elide_http-server import http-server
result = http-server.main()
```

### Ruby (via Elide)
```ruby
require 'elide/http-server'
result = http-server.main
```

### Java (via Elide)
```java
import elide.http-server.*;
String result = HTTP_Server.main();
```

## Benefits

- One library for ALL languages on Elide
- Consistent API across languages
- ~500K+ downloads/week on npm!
