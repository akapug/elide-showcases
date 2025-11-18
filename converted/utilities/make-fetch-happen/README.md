# Make Fetch Happen

Make Fetch Happen for Elide (polyglot!)

Based on https://www.npmjs.com/package/make-fetch-happen (~5M+ downloads/week)

## Features

- Caching layer
- Retry logic
- Integrity checking
- Proxy support
- Zero dependencies

## Quick Start

```typescript
import make-fetch-happen from './elide-make-fetch-happen.ts';

// Basic usage
const result = make-fetch-happen.main();
console.log(result);
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import make-fetch-happen from './elide-make-fetch-happen.ts';
const result = make-fetch-happen.main();
```

### Python (via Elide)
```python
from elide_make-fetch-happen import make-fetch-happen
result = make-fetch-happen.main()
```

### Ruby (via Elide)
```ruby
require 'elide/make-fetch-happen'
result = make-fetch-happen.main
```

### Java (via Elide)
```java
import elide.make-fetch-happen.*;
String result = Make_Fetch_Happen.main();
```

## Benefits

- One library for ALL languages on Elide
- Consistent API across languages
- ~5M+ downloads/week on npm!
