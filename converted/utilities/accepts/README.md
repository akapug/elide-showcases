# Accepts

Accepts for Elide (polyglot!)

Based on https://www.npmjs.com/package/accepts (~10M+ downloads/week)

## Features

- Accept negotiation
- Quality values
- Type matching
- Encoding selection
- Zero dependencies

## Quick Start

```typescript
import accepts from './elide-accepts.ts';

// Basic usage
const result = accepts.main();
console.log(result);
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import accepts from './elide-accepts.ts';
const result = accepts.main();
```

### Python (via Elide)
```python
from elide_accepts import accepts
result = accepts.main()
```

### Ruby (via Elide)
```ruby
require 'elide/accepts'
result = accepts.main
```

### Java (via Elide)
```java
import elide.accepts.*;
String result = Accepts.main();
```

## Benefits

- One library for ALL languages on Elide
- Consistent API across languages
- ~10M+ downloads/week on npm!
