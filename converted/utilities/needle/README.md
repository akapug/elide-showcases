# Needle - Lightweight HTTP Client

Lightweight HTTP Client for Elide (polyglot!)

Based on https://www.npmjs.com/package/needle (~1M+ downloads/week)

## Features

- Simple and lightweight HTTP client
- Streaming support
- Cookie handling
- Multipart form data
- Auto-decompression (gzip, deflate)
- Zero dependencies

## Quick Start

```typescript
import { get, post } from './elide-needle.ts';

// GET request
const response = await get('https://api.example.com/data');
console.log(response.body);

// POST request
const created = await post('https://api.example.com/posts', {
  title: 'New Post',
  body: 'Content here'
});
console.log(created.statusCode);
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import { get } from './elide-needle.ts';

const response = await get('https://api.example.com/users');
console.log(response.body);
```

### Python (via Elide)
```python
from elide_needle import get

response = get('https://api.example.com/users')
print(response.body)
```

### Ruby (via Elide)
```ruby
require 'elide/needle'

response = Needle.get('https://api.example.com/users')
puts response.body
```

### Java (via Elide)
```java
import elide.needle.*;

NeedleResponse response = Needle.get("https://api.example.com/users");
System.out.println(response.body);
```

## Benefits

- One HTTP client for ALL languages on Elide
- Consistent API across languages
- Share HTTP logic across your polyglot stack
- ~1M+ downloads/week on npm!
