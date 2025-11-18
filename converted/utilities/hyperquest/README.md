# Hyperquest - Streaming HTTP

Hyperquest - Streaming HTTP for Elide (polyglot!)

Based on https://www.npmjs.com/package/hyperquest (~100K+ downloads/week)

## Features

- Streaming first
- Pipe-friendly
- Lightweight
- Simple API
- Zero dependencies

## Quick Start

```typescript
import hyperquest from './elide-hyperquest.ts';

// Basic usage
const result = hyperquest.main();
console.log(result);
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import hyperquest from './elide-hyperquest.ts';
const result = hyperquest.main();
```

### Python (via Elide)
```python
from elide_hyperquest import hyperquest
result = hyperquest.main()
```

### Ruby (via Elide)
```ruby
require 'elide/hyperquest'
result = hyperquest.main
```

### Java (via Elide)
```java
import elide.hyperquest.*;
String result = Hyperquest___Streaming_HTTP.main();
```

## Benefits

- One library for ALL languages on Elide
- Consistent API across languages
- ~100K+ downloads/week on npm!
