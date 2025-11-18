# HTTP Methods

HTTP Methods for Elide (polyglot!)

Based on https://www.npmjs.com/package/methods (~10M+ downloads/week)

## Features

- Method enumeration
- Standards list
- Validation
- Type safety
- Zero dependencies

## Quick Start

```typescript
import methods from './elide-methods.ts';

// Basic usage
const result = methods.main();
console.log(result);
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import methods from './elide-methods.ts';
const result = methods.main();
```

### Python (via Elide)
```python
from elide_methods import methods
result = methods.main()
```

### Ruby (via Elide)
```ruby
require 'elide/methods'
result = methods.main
```

### Java (via Elide)
```java
import elide.methods.*;
String result = HTTP_Methods.main();
```

## Benefits

- One library for ALL languages on Elide
- Consistent API across languages
- ~10M+ downloads/week on npm!
