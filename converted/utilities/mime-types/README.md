# MIME Types

MIME Types for Elide (polyglot!)

Based on https://www.npmjs.com/package/mime-types (~30M+ downloads/week)

## Features

- Type lookup
- Extension mapping
- Charset detection
- Comprehensive DB
- Zero dependencies

## Quick Start

```typescript
import mime-types from './elide-mime-types.ts';

// Basic usage
const result = mime-types.main();
console.log(result);
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import mime-types from './elide-mime-types.ts';
const result = mime-types.main();
```

### Python (via Elide)
```python
from elide_mime-types import mime-types
result = mime-types.main()
```

### Ruby (via Elide)
```ruby
require 'elide/mime-types'
result = mime-types.main
```

### Java (via Elide)
```java
import elide.mime-types.*;
String result = MIME_Types.main();
```

## Benefits

- One library for ALL languages on Elide
- Consistent API across languages
- ~30M+ downloads/week on npm!
