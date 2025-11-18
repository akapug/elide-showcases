# Undici - HTTP/1.1 Client

HTTP/1.1 Client for Elide (polyglot!)

Based on https://www.npmjs.com/package/undici (~5M+ downloads/week)

## Features

- HTTP/1.1 client
- Connection pooling
- Pipelining support
- Streaming requests/responses
- Keep-alive connections
- Zero dependencies

## Quick Start

```typescript
import { get, post, put, del } from './elide-undici.ts';

// GET request
const response = await get('https://api.example.com/data');
console.log(response.json());

// POST request
const created = await post('https://api.example.com/posts', {
  title: 'New Post',
  body: 'Content here'
});
console.log(created.statusCode);

// Custom headers
const result = await get('https://api.example.com/data', {
  headers: {
    'Authorization': 'Bearer token123',
    'Accept': 'application/json'
  }
});
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import { get, post } from './elide-undici.ts';

const response = await get('https://api.example.com/users');
console.log(response.json());
```

### Python (via Elide)
```python
from elide_undici import get, post

response = get('https://api.example.com/users')
print(response.json())
```

### Ruby (via Elide)
```ruby
require 'elide/undici'

response = Undici.get('https://api.example.com/users')
puts response.json
```

### Java (via Elide)
```java
import elide.undici.*;

Response response = Undici.get("https://api.example.com/users");
System.out.println(response.json());
```

## Benefits

- One HTTP client for ALL languages on Elide
- Consistent API across languages
- Share HTTP logic across your polyglot stack
- ~5M+ downloads/week on npm!
