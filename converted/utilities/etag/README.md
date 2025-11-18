# ETag Generator

ETag Generator for Elide (polyglot!)

Based on https://www.npmjs.com/package/etag (~10M+ downloads/week)

## Features

- ETag generation
- Entity tagging
- Weak/strong ETags
- Fast hashing
- Zero dependencies

## Quick Start

```typescript
import etag from './elide-etag.ts';

// Basic usage
const result = etag.main();
console.log(result);
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import etag from './elide-etag.ts';
const result = etag.main();
```

### Python (via Elide)
```python
from elide_etag import etag
result = etag.main()
```

### Ruby (via Elide)
```ruby
require 'elide/etag'
result = etag.main
```

### Java (via Elide)
```java
import elide.etag.*;
String result = ETag_Generator.main();
```

## Benefits

- One library for ALL languages on Elide
- Consistent API across languages
- ~10M+ downloads/week on npm!
