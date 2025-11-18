# Bent - Functional HTTP Client

Functional HTTP Client for Elide (polyglot!)

Based on https://www.npmjs.com/package/bent (~100K+ downloads/week)

## Features

- Functional programming style
- Promise-based
- Automatic JSON parsing
- Response type validation
- Status code handling
- Zero dependencies

## Quick Start

```typescript
import bent from './elide-bent.ts';

// Create request function
const getJSON = bent('json');
const data = await getJSON('https://api.example.com/data');

// With base URL
const api = bent('https://api.example.com', 'json');
const users = await api('/users');

// With expected status
const post = bent('POST', 'json', 201);
const created = await post('/posts', { title: 'New Post' });
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import bent from './elide-bent.ts';

const get = bent('json');
const data = await get('https://api.example.com/users');
```

### Python (via Elide)
```python
from elide_bent import bent

get = bent('json')
data = get('https://api.example.com/users')
```

### Ruby (via Elide)
```ruby
require 'elide/bent'

get = Bent.bent('json')
data = get.call('https://api.example.com/users')
```

### Java (via Elide)
```java
import elide.bent.*;

Function get = Bent.bent("json");
Object data = get.apply("https://api.example.com/users");
```

## Benefits

- Functional programming style for HTTP
- Works across all languages on Elide
- Consistent API everywhere
- ~100K+ downloads/week on npm!
