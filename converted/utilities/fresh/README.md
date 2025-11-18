# Fresh - HTTP Freshness

Fresh - HTTP Freshness for Elide (polyglot!)

Based on https://www.npmjs.com/package/fresh (~10M+ downloads/week)

## Features

- Freshness checking
- Cache validation
- ETag comparison
- Last-Modified support
- Zero dependencies

## Quick Start

```typescript
import fresh from './elide-fresh.ts';

// Basic usage
const result = fresh.main();
console.log(result);
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import fresh from './elide-fresh.ts';
const result = fresh.main();
```

### Python (via Elide)
```python
from elide_fresh import fresh
result = fresh.main()
```

### Ruby (via Elide)
```ruby
require 'elide/fresh'
result = fresh.main
```

### Java (via Elide)
```java
import elide.fresh.*;
String result = Fresh___HTTP_Freshness.main();
```

## Benefits

- One library for ALL languages on Elide
- Consistent API across languages
- ~10M+ downloads/week on npm!
